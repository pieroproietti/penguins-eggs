package engine

import (
	"os"
	"strings"
)

// GenerateExcludeList crea il file .list dinamico per mksquashfs.
// La 'G' maiuscola permette a remaster.go di chiamarla liberamente.
func GenerateExcludeList(mode string, isGitHubAction bool) string {
	outPath := "/tmp/coa/excludes.list"
	var excludes []string

	// ==========================================================
	// 1. Filesystem Virtuali e Temporanei
	// Usiamo il "Doppio Colpo": /* per i file visibili e /.??* per quelli nascosti!
	// ==========================================================
	// ==========================================================
	// 1. Filesystem Virtuali e Temporanei
	// ==========================================================
	excludes = append(excludes,
		"dev/*",
		"proc/*",
		"sys/*",
		"run/*",
		"tmp/*",
		"var/tmp/*",
		"var/tmp/.??*",
		"lost+found",
		"home/eggs/.overlay/*",
		"home/eggs/.overlay/.??*", // Questo prende i file nascosti ma ignora "." e ".."
		"home/eggs/isodir/*",
		"home/eggs/*.iso",
	)

	// ==========================================================
	// 2. Esclusioni Standard di Sistema
	// ==========================================================
	excludes = append(excludes,
		"boot/efi/EFI",
		"boot/loader/entries/",
		"etc/fstab",
		"etc/mtab",
		"swapfile",
		"var/lib/docker/",
		"var/lib/containers/",
		"etc/udev/rules.d/70-persistent-cd.rules",
		"etc/udev/rules.d/70-persistent-net.rules",
		"etc/NetworkManager/system-connections/*",
		"etc/ssh/ssh_host_*",
		"var/lib/NetworkManager/secret_key",

		// Rete di Sicurezza Cache: l'asterisco classico è sufficiente
		"var/cache/apt/archives/*",
		"var/cache/apt/*.bin", // Il killer da 100 MB di apt
		"var/cache/pacman/pkg/*",
		"var/cache/dnf/*",
	)

	// ==========================================================
	// 3. Hack per Debian: cryptdisks
	// Grazie a mksquashfs -wildcards, possiamo evitare di fare
	// scansioni del disco in Go. Basta questa stringa magica!
	// ==========================================================
	excludes = append(excludes, "etc/rc*.d/*cryptdisks*")

	// ==========================================================
	// 4. Cura Dimagrante Specifica per GitHub Actions
	// Si attiva solo se l'ambiente è un runner GitHub
	// ==========================================================
	if isGitHubAction {

		excludes = append(excludes,
			"opt/hostedtoolcache/*",
			"home/runner/work/*",
			"usr/local/lib/android/*",
			"usr/share/dotnet/*",
			"usr/lib/jvm/*",                // Java: altri 500MB-1GB che se ne vanno
			"usr/local/share/powershell/*", // Ciao ciao PowerShell
			"usr/share/swift/*",            // Swift toolchain
			"var/lib/gems/*",               // Residui di Ruby
			"usr/*",                        // il colpo di genio finare
			"var/*",                        // il colpo di genio finare
			"opt/*",                        // il colpo di genio finare
		)
	}

	// ==========================================================
	// 5. Sicurezza Root / Home (In base al mode)
	// ==========================================================
	if mode != "clone" && mode != "crypted" {
		// Puliamo completamente root e cancelliamo cronologia e chiavi utente
		excludes = append(excludes,
			"root/*",
			"root/.??*", // <-- FIX QUI!
		)
	} else {
		// Anche in modalità clone, è saggio NON portarsi dietro la cronologia di bash
		// e i file del cestino dell'utente, a meno che non sia strettamente necessario
		excludes = append(excludes,
			"root/.bash_history",
			"root/.zsh_history",
			"home/*/.bash_history",
			"home/*/.local/share/Trash/*",
			"home/*/.cache/*", // Le cache dei browser pesano moltissimo!
		)
	}

	// ==========================================================
	// 5. Liste Utente (Custom)
	// ==========================================================
	// Allineato al nuovo dialetto oa-tools
	userList := "/etc/oa-tools.d/exclusion.list"
	if _, err := os.Stat(userList); os.IsNotExist(err) {
		userList = "conf/exclusion.list" // Path di sviluppo
	}

	if data, err := os.ReadFile(userList); err == nil {
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" && !strings.HasPrefix(line, "#") {
				// Rimuoviamo lo slash iniziale per rendere il path relativo
				line = strings.TrimPrefix(line, "/")
				excludes = append(excludes, line)
			}
		}
	}

	// Creiamo la directory temporanea e scriviamo il file list
	os.MkdirAll("/tmp/coa", 0755)

	// Uniamo tutto con a capo
	fileContent := strings.Join(excludes, "\n") + "\n"
	os.WriteFile(outPath, []byte(fileContent), 0644)

	return outPath
}
