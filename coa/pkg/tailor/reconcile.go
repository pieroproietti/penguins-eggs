package tailor

import (
	"bufio"
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// neverPurge is a small, hardcoded safety net of packages that must never
// be removed by manifest reconciliation, no matter what the manifest says
// (or fails to say). This is defense-in-depth against a malformed or
// incomplete manifest file bricking the machine -- it does not fight the
// vendor's intent, since all of these are expected to be in any correct
// manifest anyway.
var neverPurgeBase = []string{
	// package management
	"dpkg",
	"apt",
	"apt-utils",
	"apt-transport-https",
	"ca-certificates",
	// base system
	"base-files",
	"base-passwd",
	"init",
	"sysvinit",
	"sysvinit-core",
	"systemd",
	"systemd-sysv",
	"libc6",
	"coreutils",
	"bash",
	"dash",
	"util-linux",
	"e2fsprogs",
	"mount",
	// remastering tools: the wardrobe must never uninstall itself
	"penguins-eggs",
	"coa",
	// boot
	"grub-pc",
	"grub-common",
	"grub2-common",
	"grub-efi-amd64",
	"linux-base",
	"initramfs-tools",
	// networking / remote access
	"openssh-server",
	"openssh-client",
	"network-manager",
	"network-manager-gnome",
}

// currentKernelPackage returns the package that owns the currently
// running kernel (e.g. "linux-image-6.1.0-10-amd64"), so it can be
// protected from removal even if the manifest doesn't happen to list
// this exact kernel version (e.g. because of a point-release bump).
// Returns "" if it can't be determined -- callers should not treat that
// as an error, just as "nothing extra to protect".
func currentKernelPackage() string {
	out, err := exec.Command("uname", "-r").Output()
	if err != nil {
		return ""
	}
	release := strings.TrimSpace(string(out))
	if release == "" {
		return ""
	}
	pkg := "linux-image-" + release
	if !isPackageInstalled(pkg) {
		return ""
	}
	return pkg
}

// loadPackageManifest reads the target package set from path. It accepts
// multiple formats, auto-detected line by line:
// - plain: one package name per line ("thunderbird")
// - YAML-style: "    - thunderbird" or "- thunderbird"
// - dpkg -l / dpkg-query -W style: "ii thunderbird 1:128.0-1 amd64 ..."
// Blank lines and lines starting with '#' are ignored.
func loadPackageManifest(path string) ([]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	seen := make(map[string]struct{})
	var result []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		var pkg string

		// YAML-style: "    - package" or "- package"
		if strings.HasPrefix(line, "- ") {
			pkg = strings.TrimPrefix(line, "- ")
		} else {
			fields := strings.Fields(line)
			if len(fields) >= 2 && len(fields[0]) <= 3 && isDpkgStatusCode(fields[0]) {
				// dpkg -l style: "ii package-name version arch description..."
				pkg = fields[1]
			} else {
				pkg = fields[0]
			}
		}

		pkg = normalizePkgName(pkg)
		if pkg == "" {
			continue
		}
		if _, ok := seen[pkg]; ok {
			continue
		}
		seen[pkg] = struct{}{}
		result = append(result, pkg)
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func isDpkgStatusCode(s string) bool {
	switch s {
	case "ii", "rc", "un", "iF", "iU", "hi", "pn":
		return true
	}
	return false
}

// currentlyInstalledPackages reads the dpkg status database DIRECTLY from
// /var/lib/dpkg/status instead of shelling out to dpkg-query. Shelling out
// via utils.ExecCapture proved fragile on the test VM: an empty capture
// made the cleanup run with an empty keep-list, which purged hundreds of
// packages (lightdm, rsync, even penguins-eggs itself). Parsing the status
// file needs no subprocess and cannot silently come back empty.
func currentlyInstalledPackages() (map[string]struct{}, error) {
	f, err := os.Open("/var/lib/dpkg/status")
	if err != nil {
		return nil, err
	}
	defer f.Close()

	installed := make(map[string]struct{})
	var curPkg string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		switch {
		case strings.HasPrefix(line, "Package: "):
			curPkg = normalizePkgName(strings.TrimPrefix(line, "Package: "))
		case strings.HasPrefix(line, "Status: "):
			if strings.TrimPrefix(line, "Status: ") == "install ok installed" && curPkg != "" {
				installed[curPkg] = struct{}{}
			}
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return installed, nil
}

// purgeExplicit purges exactly the given packages in a SINGLE apt
// transaction (so apt can resolve removal cascades consistently), then
// sweeps orphaned dependencies. Packages that are not installed, or that
// belong to the safety net (neverPurgeBase / running kernel), are
// silently skipped.
func purgeExplicit(toRemove []string) {
	installedSet, err := currentlyInstalledPackages()
	if err != nil {
		utils.LogNormal("WARNING: could not read installed packages; skipping explicit purge.")
		return
	}

	protect := make(map[string]struct{})
	for _, p := range neverPurgeBase {
		protect[normalizePkgName(p)] = struct{}{}
	}
	if k := currentKernelPackage(); k != "" {
		protect[normalizePkgName(k)] = struct{}{}
	}

	seen := make(map[string]struct{})
	var list []string
	for _, p := range toRemove {
		p = normalizePkgName(p)
		if p == "" {
			continue
		}
		if _, ok := seen[p]; ok {
			continue
		}
		seen[p] = struct{}{}
		if _, ok := protect[p]; ok {
			continue
		}
		if _, ok := installedSet[p]; !ok {
			continue
		}
		list = append(list, p)
	}

	if len(list) == 0 {
		utils.LogNormal("Explicit purge: nothing to remove.")
		return
	}

	utils.LogNormal("Explicit purge: removing %d packages declared absent from the vendor manifest...", len(list))
	cmd := fmt.Sprintf("DEBIAN_FRONTEND=noninteractive apt-get purge -o Dpkg::Use-Pty=0 -o Dpkg::Options::='--force-confold' -y %s", strings.Join(list, " "))
	if err := utils.Exec(cmd); err != nil {
		utils.LogNormal("WARNING: bulk explicit purge reported an error; healing and retrying once...")
		utils.Exec("dpkg --configure -a")
		utils.Exec("DEBIAN_FRONTEND=noninteractive apt-get install -f -y")
		utils.Exec(cmd)
	}

	utils.LogNormal("Sweeping orphaned dependencies of removed packages...")
	utils.Exec("DEBIAN_FRONTEND=noninteractive apt-get autoremove -o Dpkg::Use-Pty=0 --purge -y")
}

// getInstallReason returns a human-readable string explaining why apt kept
// pkg installed even though it is not in the declarative manifest. Uses
// aptitude if available (gives the full dependency chain, e.g.
// "pkgA Recommends pkg"), falls back to apt-cache rdepends otherwise.
func getInstallReason(pkg string) string {
	// aptitude gives the cleanest answer ("A Recommends B")
	if _, err := exec.LookPath("aptitude"); err == nil {
		out, err := utils.ExecCapture(fmt.Sprintf("aptitude why -v %s 2>/dev/null", pkg))
		if err == nil {
			lines := strings.Split(strings.TrimSpace(out), "\n")
			if len(lines) > 0 && lines[0] != "" {
				// take only the first line, which is the dependency chain
				first := strings.TrimSpace(lines[0])
				if len(first) > 120 {
					first = first[:117] + "..."
				}
				return first
			}
		}
	}
	// Fallback: apt-cache rdepends --installed lists the reverse deps
	out, err := utils.ExecCapture(fmt.Sprintf("apt-cache rdepends --installed %s 2>/dev/null", pkg))
	if err != nil {
		return "unknown"
	}
	var deps []string
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || line == pkg || strings.HasPrefix(line, "Reverse Depends:") {
			continue
		}
		deps = append(deps, strings.TrimPrefix(line, "|"))
		if len(deps) >= 3 {
			break
		}
	}
	if len(deps) == 0 {
		return "orphan (autoremove missed it)"
	}
	return "kept by: " + strings.Join(deps, ", ")
}

func findManifestPath(costumeDir, manifest string) string {
	if manifest == "" {
		return ""
	}
	path := filepath.Join(costumeDir, manifest)
	if _, err := os.Stat(path); err != nil {
		return ""
	}
	return path
}
