package tailor

import (
	"bufio"
	"coa/pkg/utils"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

// wearReport holds the full, per-package outcome of a wardrobe wear run.
type wearReport struct {
	CostumeName   string
	Installed     []string
	Purged        []string
	FailedInstall []string
	FailedPurge   []string
}

// writeWearReport writes the detailed, per-package outcome of a wardrobe
// wear run to a timestamped text file under /var/log/coa/, and returns
// its path. The detail lives in the file, not on screen: a costume like
// quirinux2 touches hundreds of packages, and dumping every single name
// to the terminal buries the one or two things a user actually needs to
// act on.
func writeWearReport(r wearReport) (string, error) {
	if err := os.MkdirAll("/var/log/coa", 0755); err != nil {
		return "", err
	}
	path := fmt.Sprintf("/var/log/coa/wardrobe-report-%s.txt", time.Now().Format("20060102-150405"))

	f, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	w := bufio.NewWriter(f)
	fmt.Fprintf(w, "coa wardrobe wear report -- %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Fprintf(w, "Costume: %s\n\n", r.CostumeName)

	section := func(title string, items []string) {
		fmt.Fprintf(w, "=== %s (%d) ===\n", title, len(items))
		for _, p := range items {
			fmt.Fprintln(w, p)
		}
		fmt.Fprintln(w)
	}

	section("Installed", r.Installed)
	section("Removed (not in manifest)", r.Purged)
	section("Could NOT be installed", r.FailedInstall)
	section("Could NOT be removed", r.FailedPurge)

	if err := w.Flush(); err != nil {
		return "", err
	}
	return path, nil
}

// diffStr returns the elements of all that are not present in exclude.
func diffStr(all, exclude []string) []string {
	if len(exclude) == 0 {
		return append([]string(nil), all...)
	}
	excludeSet := make(map[string]struct{}, len(exclude))
	for _, e := range exclude {
		excludeSet[e] = struct{}{}
	}
	var result []string
	for _, s := range all {
		if _, skip := excludeSet[s]; !skip {
			result = append(result, s)
		}
	}
	return result
}

// kernelCleanupMessages is the post-reboot kernel/header cleanup
// reminder, translated. Shown after every wardrobe wear run because
// costumes like quirinux2 routinely pull in a newer kernel, and old
// kernel/header packages left behind just waste disk space once the
// remaster is built with coa.
var kernelCleanupMessages = map[string]string{
	"en": "After rebooting, it's a good idea to remove any old kernel and header package versions before creating the remaster with coa.",
	"es": "Después de reiniciar, es recomendable eliminar las versiones anteriores del kernel y de los headers antes de crear el remaster con coa.",
	"gl": "Despois de reiniciar, é recomendábel eliminar as versións anteriores do kernel e das cabeceiras (headers) antes de crear o remaster con coa.",
	"it": "Dopo il riavvio, è consigliabile rimuovere le vecchie versioni del kernel e degli header prima di creare il remaster con coa.",
	"fr": "Après le redémarrage, il est conseillé de supprimer les anciennes versions du noyau et des en-têtes avant de créer le remaster avec coa.",
	"de": "Nach dem Neustart sollten alte Kernel- und Header-Paketversionen entfernt werden, bevor das Remaster mit coa erstellt wird.",
	"ru": "После перезагрузки рекомендуется удалить старые версии ядра и заголовков перед созданием ремастера с помощью coa.",
	"hu": "Újraindítás után érdemes eltávolítani a régi kernel- és fejléccsomag-verziókat, mielőtt a coa-val remastert készítenél.",
	"pt": "Depois de reiniciar, é recomendável remover as versões antigas do kernel e dos headers antes de criar o remaster com o coa.",
}

// detectSystemLanguage returns the ISO 639-1 language code of the
// system's configured locale (LC_ALL, then LANG -- the standard glibc
// precedence order), or "" if neither is set / recognizable. Since coa
// runs as root, this reflects root's environment; if wear was invoked
// via `sudo`, that's normally inherited from the invoking user's shell.
func detectSystemLanguage() string {
	for _, envVar := range []string{"LC_ALL", "LANG"} {
		val := os.Getenv(envVar)
		val = strings.TrimSpace(val)
		if val == "" {
			continue
		}
		lower := strings.ToLower(val)
		if lower == "c" || lower == "c.utf-8" || lower == "posix" {
			continue
		}
		code := val
		if i := strings.IndexAny(code, "_."); i != -1 {
			code = code[:i]
		}
		code = strings.ToLower(code)
		if code != "" {
			return code
		}
	}
	return ""
}

// printKernelCleanupReminder shows the post-reboot kernel/header cleanup
// reminder in the system's configured language if it's one of the eight
// specifically translated ones, or in English otherwise -- exactly one
// language, matching how the machine is actually configured, not every
// language that merely happens to be generated on it.
func printKernelCleanupReminder() {
	lang := detectSystemLanguage()
	if msg, ok := kernelCleanupMessages[lang]; ok {
		utils.LogNormal("%s", msg)
		return
	}
	utils.LogNormal("%s", kernelCleanupMessages["en"])
}

// clearScreen wipes the terminal so the brief final summary isn't lost
// in hundreds of lines of apt/dpkg scrollback from installing/removing
// packages.
func clearScreen() {
	cmd := exec.Command("clear")
	cmd.Stdout = os.Stdout
	cmd.Run()
}
