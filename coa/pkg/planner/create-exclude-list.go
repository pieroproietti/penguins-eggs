package planner

import (
	"bufio"
	"coa/pkg/pathDefaults"
	"os"
	"strings"
)

// detectSwapFiles legge /etc/fstab e restituisce i path dei file di swap
// (non device /dev/*) da escludere dallo squashfs.
func detectSwapFiles() []string {
	f, err := os.Open("/etc/fstab")
	if err != nil {
		return nil
	}
	defer f.Close()

	var swaps []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 3 {
			continue
		}
		// Solo file di swap (non device block), path assoluto che inizia con /
		if fields[2] == "swap" && strings.HasPrefix(fields[0], "/") && !strings.HasPrefix(fields[0], "/dev/") {
			swaps = append(swaps, strings.TrimPrefix(fields[0], "/"))
		}
	}
	return swaps
}

// GenerateExcludeList crea il file .list dinamico per mksquashfs.
// La 'G' maiuscola permette a remaster.go di chiamarla liberamente.
func GenerateExcludeList(mode string, isGitHubAction bool) string {
	outPath := pathDefaults.ExcludeList
	var excludes []string

	// ==========================================================
	// 1. Filesystem Virtuali e Temporanei
	// ==========================================================
	excludes = append(excludes,
		"dev/*",
		"mnt", 
		"media",
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
		// In mode clone/crypted /home è bind-montata in liveroot: senza questa
		// esclusione mksquashfs si rivede ricorsivamente sotto home/eggs/liveroot.
		"home/eggs/liveroot",
	)

	// ==========================================================
	// 2. Esclusioni Standard di Sistema
	// ==========================================================
	excludes = append(excludes,
		"boot/efi/EFI",
		"boot/loader/entries/",
		"boot/grub/!(themes|unicode.pf2)",
		"etc/fstab",
		"etc/mtab",
		"swapfile",
		"etc/udev/rules.d/70-persistent-cd.rules",
		"etc/udev/rules.d/70-persistent-net.rules",
		"etc/NetworkManager/system-connections/*",
		"etc/ssh/ssh_host_*",
		"var/lib/NetworkManager/secret_key",

		// Identità macchina: devono essere rigenerati al primo boot
		"etc/machine-id",
		"var/lib/dbus/machine-id",

		// Rete: rigenerato dal DHCP/systemd-resolved al boot
		"etc/resolv.conf",

		// Hardware-specific: impedisce conflitti tra macchine diverse
		"etc/adjtime",
		"etc/crypttab",
		"etc/X11/xorg.conf",
		"etc/X11/xorg.conf.d/20-nvidia.conf",
		"etc/X11/xorg.conf.d/20-intel.conf",
		"etc/X11/xorg.conf.d/20-radeon.conf",
		"etc/X11/xorg.conf.d/20-amd.conf",

		// APT cache e stato vecchio
		"var/cache/apt/archives/*",
		"var/cache/apt/*.bin",
		"var/cache/apt/apt-file/*",
		"var/cache/apt-xapian-index/index.*",
		"var/cache/apt-show-versions/*",
		"var/cache/debconf/*-old",
		"var/lib/apt/lists/*",
		"var/lib/apt/periodic/*",
		"var/lib/dpkg/*-old",

		// Pacman (Arch) e DNF (Fedora)
		"var/cache/pacman/pkg/*",
		"var/lib/pacman/sync/*",
		"var/cache/dnf/*",

		// Log: teniamo solo le directory di servizi persistenti
		"var/log/!(apache2|clamav|libvirt|journal|samba)",
		"var/log/clamav/*",
		"var/log/journal/*",
		"var/log/samba/*",

		// Vari stato runtime
		"var/lib/sudo/*",
		"var/lib/dhcp/*",
		"var/lib/urandom/*",
		"var/lib/udisks/*",
		"var/mail/*",
		"var/spool/mail/*",
		"var/spool/anacron/*",

		// Display manager cache
		"var/cache/lightdm",
		"var/lib/lightdm/.cache",
		"var/lib/lightdm/.Xauthority",
	)

	// ==========================================================
	// 2.1. Swap files rilevati da /etc/fstab
	// ==========================================================
	excludes = append(excludes, detectSwapFiles()...)

	// ==========================================================
	// 3. Hack per Debian: cryptdisks
	// Grazie a mksquashfs -wildcards, possiamo evitare di fare
	// scansioni del disco in Go. Basta questa stringa magica!
	// ==========================================================
	excludes = append(excludes, "etc/rc*.d/*cryptdisks*")

	// ==========================================================
	// 4. Cura Dimagrante Specifica per GitHub Actions (Smoketest)
	// Stripping usr, var, and opt bypasses host bloatware to
	// achieve a lightning-fast structural smoketest.
	// Verifies the full toolchain (mksquashfs, xorriso, oa_umount)
	// ==========================================================
	if isGitHubAction {
		excludes = append(excludes,
			"usr",
			"var",
			"opt",
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
		// In modalità clone, puliamo cronologia, cache e file temporanei
		// ma preserviamo configurazioni e dati utente
		excludes = append(excludes,
			"root/.bash_history",
			"root/.zsh_history",
			"root/.cache",
			"root/.local/share/recently-used.xbel",
			"root/.local/share/Trash/*",
			"root/.xsession-errors*",

			"home/*/.bash_history",
			"home/*/.lesshst",
			"home/*/.local/share/Trash/*",
			"home/*/.local/share/recently-used.xbel",
			"home/*/.local/share/mc/history",
			"home/*/.cache/*",
			"home/*/.thumbnails/*",
			"home/*/.dbus",
			"home/*/.gvfs",
			"home/*/.Trash*",
			"home/*/.xsession-errors*",
			"home/*/.adobe",
			"home/*/.macromedia",
			"home/*/.recently-used",
			"home/*/.recently-used.xbel",
			"home/*/.sudo_as_admin_successful",
		)
	}

	// ==========================================================
	// 6. Liste Utente (/etc/oa-tools.d/custom.exclude.list)
	// ==========================================================
	// Allineato al nuovo dialetto oa-tools
	userList := "/etc/oa-tools.d/custom.exclude.list"

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

	os.MkdirAll(pathDefaults.StagingDir, 0755)

	// Uniamo tutto con a capo
	fileContent := strings.Join(excludes, "\n") + "\n"
	os.WriteFile(outPath, []byte(fileContent), 0644)

	return outPath
}
