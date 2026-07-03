package tailor

import (
	"coa/pkg/utils"
	"os"
	"regexp"
	"strings"
)

// setupRepositories applica la sezione "repositories" della forma annidata:
// abilita i componenti richiesti (main, contrib, non-free...), esegue i
// comandi letterali di sources_list_d (aggiunta repo di terze parti) e
// lancia update/upgrade se richiesti.
func setupRepositories(repos *Repositories, suitName string) {
	if repos == nil {
		return
	}

	if len(repos.SourcesList) > 0 {
		if err := enableAptComponents(repos.SourcesList); err != nil {
			logToFile(WarnPrefix(suitName) + "sources.list: " + err.Error())
		}
	}

	if len(repos.SourcesListD) > 0 {
		logToFile(WarnPrefix(suitName) + "running third-party repository setup commands...")
		for _, command := range repos.SourcesListD {
			if err := utils.Exec(command); err != nil {
				logToFile(WarnPrefix(suitName) + "repository command failed: " + command + ": " + err.Error())
			}
		}
	}

	if repos.Update {
		logToFile(WarnPrefix(suitName) + "apt-get update...")
		utils.Exec("apt-get update")
	}

	if repos.Upgrade {
		logToFile(WarnPrefix(suitName) + "apt-get upgrade...")
		utils.Exec("DEBIAN_FRONTEND=noninteractive apt-get upgrade -y")
	}
}

// WarnPrefix genera un prefisso omogeneo per i log di questo pacchetto.
func WarnPrefix(suitName string) string {
	return "[" + suitName + "] "
}

// enableAptComponents assicura che i componenti richiesti (contrib, non-free,
// non-free-firmware...) siano abilitati sulle righe "deb" del sources.list
// classico. Formato deb822 (/etc/apt/sources.list.d/*.sources) non e'
// gestito qui: viene lasciato intatto e segnalato nel log.
func enableAptComponents(components []string) error {
	const path = "/etc/apt/sources.list"

	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	debLineRe := regexp.MustCompile(`^(deb|deb-src)\s+(\S+)\s+(\S+)\s+(.*)$`)

	lines := strings.Split(string(data), "\n")
	changed := false
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		m := debLineRe.FindStringSubmatch(trimmed)
		if m == nil {
			continue
		}
		existing := strings.Fields(m[4])
		existingSet := make(map[string]struct{}, len(existing))
		for _, c := range existing {
			existingSet[c] = struct{}{}
		}

		added := false
		for _, want := range components {
			if _, ok := existingSet[want]; !ok {
				existing = append(existing, want)
				existingSet[want] = struct{}{}
				added = true
			}
		}

		if added {
			lines[i] = strings.Join([]string{m[1], m[2], m[3], strings.Join(existing, " ")}, " ")
			changed = true
		}
	}

	if !changed {
		return nil
	}

	return os.WriteFile(path, []byte(strings.Join(lines, "\n")), 0644)
}
