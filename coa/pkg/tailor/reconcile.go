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
	"dpkg",
	"apt",
	"apt-utils",
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
// two formats, auto-detected line by line:
// - plain: one package name per line ("thunderbird")
// - dpkg -l / dpkg-query -W style: "ii thunderbird 1:128.0-1 amd64 ..."
// (only lines starting with a two-letter dpkg status code followed by
// whitespace are treated this way; the package name is the 2nd field)
//
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
		fields := strings.Fields(line)
		var pkg string
		if len(fields) >= 2 && len(fields[0]) <= 3 && isDpkgStatusCode(fields[0]) {
			// dpkg -l style: "ii package-name version arch description..."
			pkg = fields[1]
		} else {
			pkg = fields[0]
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

// currentlyInstalledPackages returns the set of packages dpkg currently
// considers fully installed on the system.
func currentlyInstalledPackages() (map[string]struct{}, error) {
	out, err := utils.ExecCapture("dpkg-query -W -f='${Package} ${Status}\n'")
	if err != nil {
		return nil, err
	}
	installed := make(map[string]struct{})
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if !strings.Contains(line, "install ok installed") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) == 0 {
			continue
		}
		installed[normalizePkgName(fields[0])] = struct{}{}
	}
	return installed, nil
}

// DeclarativeCleanup makes the installed package set match target exactly
// using native Debian machinery: it marks every currently-installed package
// as 'auto' (a dependency) and then marks the target set (plus kernel and
// base packages) as 'manual', finishing with 'apt-get autoremove --purge'.
//
// Why not the old chunked-purge approach? Splitting purges into batches of
// 20 is fundamentally incompatible with apt's dependency resolution: if
// batch 1 tries to purge libgtk-3-0 while xfce4-session (which depends on
// it) sits in batch 2, apt aborts the entire batch to protect the system
// and the cleanup silently fails. By letting apt resolve the full
// dependency tree at once via autoremove, we get correct, atomic, and
// idempotent cleanup with no cross-batch interference.
func DeclarativeCleanup(target []string) {
	utils.LogNormal("--- Aplicando limpieza declarativa de paquetes ---")

	// 1. Protect the running kernel
	if kernel := currentKernelPackage(); kernel != "" {
		utils.Exec(fmt.Sprintf("apt-mark manual %s", kernel))
	}

	// 2. Protect base-system packages
	for _, pkg := range neverPurgeBase {
		utils.Exec(fmt.Sprintf("apt-mark manual %s", pkg))
	}

	// 3. Mark every currently-installed package as 'auto' (dependency).
	// After this, nothing is "manually installed" except kernel+base, so
	// apt would consider everything else removable. We then re-mark the
	// target set as manual in step 4 so autoremove preserves what the
	// vendor actually wants.
	utils.LogNormal("Marcando sistema actual como dependencias automáticas...")
	utils.Exec("dpkg-query -W -f='${Package}\n' | xargs apt-mark auto >/dev/null 2>&1")

	// 4. Build the filtered target: only packages that are actually
	// installed right now, deduplicated and normalized.
	installedSet, err := currentlyInstalledPackages()
	if err != nil {
		utils.LogNormal("⚠️  No se pudo obtener la lista de paquetes instalados.")
		return
	}

	var cleanTarget []string
	seen := make(map[string]struct{})
	for _, p := range target {
		pkg := normalizePkgName(p)
		if pkg == "" {
			continue
		}
		if _, ok := seen[pkg]; !ok {
			seen[pkg] = struct{}{}
			if _, isInstalled := installedSet[pkg]; isInstalled {
				cleanTarget = append(cleanTarget, pkg)
			}
		}
	}
	// Ensure kernel and base are also marked manual if installed
	for _, pkg := range neverPurgeBase {
		if _, isInstalled := installedSet[pkg]; isInstalled {
			if _, already := seen[pkg]; !already {
				cleanTarget = append(cleanTarget, pkg)
			}
		}
	}
	if kernel := currentKernelPackage(); kernel != "" {
		if _, already := seen[kernel]; !already {
			cleanTarget = append(cleanTarget, kernel)
		}
	}

	if len(cleanTarget) > 0 {
		pkgString := strings.Join(cleanTarget, " ")
		utils.LogNormal("Marcando paquetes del wardrobe como manuales: %d paquetes", len(cleanTarget))
		utils.Exec(fmt.Sprintf("apt-mark manual %s", pkgString))
	}

	// 5. autoremove does all the heavy lifting: it walks the dependency
	// graph from every 'manual' package downward and purges anything
	// marked 'auto' that is not a dependency of any manual package.
	// This is the canonical Debian way to strip a system down to a
	// declared package set.
	utils.LogNormal("Ejecutando autoremove para purgar lo no declarado...")
	utils.Exec("DEBIAN_FRONTEND=noninteractive apt-get autoremove --purge -y")
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