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

// kernelCleanupOrder is a fixed display order for the specifically
// translated languages, so the message doesn't print in a different,
// confusing order on every run (map iteration order isn't stable).
var kernelCleanupOrder = []string{"es", "gl", "it", "fr", "de", "ru", "hu", "pt"}

// detectActiveLanguages returns the set of ISO 639-1 language codes
// currently generated/available on the system (via `locale -a`), so the
// final reminder can be shown in every language actually in use on this
// machine, not just whatever LANG the current shell happens to have.
func detectActiveLanguages() map[string]bool {
	langs := make(map[string]bool)
	out, err := exec.Command("locale", "-a").Output()
	if err != nil {
		return langs
	}
	scanner := bufio.NewScanner(strings.NewReader(string(out)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		lower := strings.ToLower(line)
		if lower == "" || lower == "c" || lower == "c.utf-8" || lower == "posix" {
			continue
		}
		code := line
		if i := strings.IndexAny(code, "_."); i != -1 {
			code = code[:i]
		}
		code = strings.ToLower(code)
		if code != "" {
			langs[code] = true
		}
	}
	return langs
}

// printKernelCleanupReminder shows the post-reboot kernel/header cleanup
// reminder in every specifically-translated language actually in use on
// this system (es/gl/it/fr/de/ru/hu/pt), plus English -- English is
// always shown, both as the message's base language and as the
// catch-all for every other locale in use that isn't one of the eight
// above.
func printKernelCleanupReminder() {
	active := detectActiveLanguages()

	utils.LogNormal("%s", kernelCleanupMessages["en"])
	for _, code := range kernelCleanupOrder {
		if active[code] {
			utils.LogNormal("%s", kernelCleanupMessages[code])
		}
	}
}

// clearScreen wipes the terminal so the brief final summary isn't lost
// in hundreds of lines of apt/dpkg scrollback from installing/removing
// packages.
func clearScreen() {
	cmd := exec.Command("clear")
	cmd.Stdout = os.Stdout
	cmd.Run()
}
