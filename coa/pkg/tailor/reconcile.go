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

// normalizePkgName strips the ":arch" multi-arch qualifier some package
// listings include (e.g. "zlib1g:amd64" -> "zlib1g"), so comparisons
// against dpkg-query's plain ${Package} output line up correctly.
func normalizePkgName(name string) string {
	name = strings.TrimSpace(name)
	if i := strings.Index(name, ":"); i != -1 {
		name = name[:i]
	}
	return name
}

// loadPackageManifest reads the target package set from path. It accepts
// two formats, auto-detected line by line:
//   - plain: one package name per line ("thunderbird")
//   - dpkg -l / dpkg-query -W style: "ii  thunderbird  1:128.0-1  amd64  ..."
//     (only lines starting with a two-letter dpkg status code followed by
//     whitespace are treated this way; the package name is the 2nd field)
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
			// dpkg -l style: "ii  package-name  version  arch  description..."
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
	out, err := utils.ExecCapture("dpkg-query -W -f='${Package} ${Status}\\n'")
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

// reconcilePackages makes the installed package set match target exactly:
// anything in target that's missing gets installed, anything installed
// that's not in target (and not in the never-purge safety net) gets
// purged. Returns a human-readable summary of what happened for the
// caller to include in the final wear report.
func reconcilePackages(target []string) (installedNow []string, purgedNow []string, failedInstall []string, failedPurge []string) {
	installedSet, err := currentlyInstalledPackages()
	if err != nil {
		logToFile(fmt.Sprintf("⚠️  Could not reconcile packages against manifest: failed to query dpkg: %v", err))
		return nil, nil, nil, nil
	}

	targetSet := make(map[string]struct{}, len(target))
	for _, p := range target {
		targetSet[normalizePkgName(p)] = struct{}{}
	}

	protect := make(map[string]struct{})
	for _, p := range neverPurgeBase {
		protect[p] = struct{}{}
	}
	if kernel := currentKernelPackage(); kernel != "" {
		protect[kernel] = struct{}{}
	}

	var toInstall []string
	for p := range targetSet {
		if _, ok := installedSet[p]; !ok {
			toInstall = append(toInstall, p)
		}
	}

	var toPurge []string
	for p := range installedSet {
		if _, ok := targetSet[p]; ok {
			continue
		}
		if _, ok := protect[p]; ok {
			continue
		}
		toPurge = append(toPurge, p)
	}

	if len(toInstall) > 0 {
		logToFile(fmt.Sprintf("Manifest reconciliation: %d package(s) missing, installing...", len(toInstall)))
		failedInstall = installWithRetries(toInstall, 3)
		for _, p := range toInstall {
			if !containsStr(failedInstall, p) {
				installedNow = append(installedNow, p)
			}
		}
	}

	if len(toPurge) > 0 {
		logToFile(fmt.Sprintf("Manifest reconciliation: %d package(s) present but not in the manifest, purging...", len(toPurge)))
		purgedNow, failedPurge = purgeBatched(toPurge)
	}

	return installedNow, purgedNow, failedInstall, failedPurge
}

func containsStr(list []string, s string) bool {
	for _, v := range list {
		if v == s {
			return true
		}
	}
	return false
}

// purgeBatched purges packages in small batches (same rationale as
// installBatchWithFallback: keep each dpkg transaction's trigger
// processing small, and survive a crash mid-way with partial progress
// intact). Verifies each failure against dpkg before giving up on it,
// for the same reason installBatchWithFallback does.
func purgeBatched(packages []string) (purged []string, failed []string) {
	for start := 0; start < len(packages); start += batchSize {
		end := start + batchSize
		if end > len(packages) {
			end = len(packages)
		}
		batch := packages[start:end]

		pkgString := strings.Join(batch, " ")
		cmd := fmt.Sprintf("DEBIAN_FRONTEND=readline apt-get purge -o Dpkg::Options::='--force-confold' -o Dpkg::Use-Pty=0 -y %s", pkgString)
		logToFile(fmt.Sprintf("Purging batch of %d package(s) not in the manifest: %v", len(batch), batch))

		if err := utils.Exec(cmd); err == nil {
			purged = append(purged, batch...)
			continue
		}

		logToFile("⚠️  Batch purge failed. Retrying package by package to isolate failures...")
		for _, pkg := range batch {
			singleCmd := fmt.Sprintf("DEBIAN_FRONTEND=readline apt-get purge -o Dpkg::Options::='--force-confold' -o Dpkg::Use-Pty=0 -y %s", pkg)
			err := utils.Exec(singleCmd)
			if err == nil || !isPackageInstalled(pkg) {
				purged = append(purged, pkg)
			} else {
				logToFile(fmt.Sprintf("⚠️  Could not purge: %s", pkg))
				failed = append(failed, pkg)
			}
		}
	}

	// Clean up now-orphaned dependencies of everything we just purged.
	// Safe to run generically here since it only touches packages apt
	// itself marked as automatically installed with no remaining
	// reverse-dependencies -- it will never touch anything in `target`.
	if len(purged) > 0 {
		utils.Exec("DEBIAN_FRONTEND=readline apt-get autoremove -o Dpkg::Use-Pty=0 -y")
	}

	return purged, failed
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
