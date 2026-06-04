package xdg

import (
	"os"
	"os/exec"
	"path/filepath"

	// Ricordati di adattare il path di importazione al tuo modulo
	"coa/pkg/utils"
)

// hasExecutable controlla se un binario è presente nel PATH (universale)
func hasExecutable(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

// rsyncIfExist esegue rsync se la directory/file sorgente esiste.
func rsyncIfExist(source, dest string) {
	if _, err := os.Stat(source); err == nil {
		// Dichiariamo l'azione prima di farla
		utils.LogNormal("  -> Copia in corso: " + source)

		flags := "-avx"
		utils.ExecQuiet("rsync " + flags + " " + source + " " + dest)
	}
}

// rmIfExist rimuove file o directory in sicurezza
func rmIfExist(path string, recursive bool) {
	if _, err := os.Stat(path); err == nil {
		utils.LogNormal("  -> Rimozione: " + path)

		if recursive {
			utils.ExecQuiet("rm -rf " + path)
		} else {
			utils.ExecQuiet("rm -f " + path)
		}
	}
}

// HandleSkel rigenera /etc/skel copiando le configurazioni visive del Desktop Environment
func HandleSkel(targetUser string) {
	var user string

	// 1. Identificazione utente
	if targetUser != "" {
		user = targetUser
	} else {
		user = os.Getenv("SUDO_USER")
		if user == "" {
			utils.Fatal("Impossibile determinare l'utente sorgente. Esegui con sudo o passa l'utente con --user.")
		}
	}

	userHome := filepath.Join("/home", user)
	if _, err := os.Stat(userHome); os.IsNotExist(err) {
		utils.Fatal("La home directory dell'utente non esiste: " + userHome)
	}

	utils.LogNormal("Inizio rigenerazione di /etc/skel dall'utente: " + user)

	// 2. Tabula Rasa
	utils.ExecQuiet("rm -rf /etc/skel")
	utils.ExecQuiet("mkdir -p /etc/skel")

	// 3. Copia dei file base della shell
	baseFiles := []string{".bash_logout", ".bashrc", ".profile"}
	for _, file := range baseFiles {
		rsyncIfExist(filepath.Join(userHome, file), "/etc/skel/")
	}

	// 4. Selettore Desktop Environment (Agnostico, tramite PATH)
	if hasExecutable("gnome-session") || hasExecutable("cinnamon-session") || hasExecutable("mate-session") {
		// GNOME / CINNAMON / MATE
		rsyncIfExist(filepath.Join(userHome, ".config"), "/etc/skel/")
		rsyncIfExist(filepath.Join(userHome, ".gtkrc-2.0"), "/etc/skel/")

	} else if hasExecutable("startplasma-x11") || hasExecutable("startplasma-wayland") {
		// KDE PLASMA
		rsyncIfExist(filepath.Join(userHome, ".config"), "/etc/skel/")
		rsyncIfExist(filepath.Join(userHome, ".kde"), "/etc/skel/")

	} else if hasExecutable("lxqt-session") {
		// LXQT
		utils.ExecQuiet("mkdir -p /etc/skel/.config")
		rsyncIfExist(filepath.Join(userHome, ".config/lxqt"), "/etc/skel/.config/")
		rsyncIfExist(filepath.Join(userHome, ".gtkrc-2.0"), "/etc/skel/")

	} else if hasExecutable("startlxde") || hasExecutable("lxsession") {
		// LXDE
		rsyncIfExist(filepath.Join(userHome, ".config"), "/etc/skel/")
		rsyncIfExist(filepath.Join(userHome, ".gtkrc-2.0"), "/etc/skel/")

	} else if hasExecutable("xfce4-session") {
		// XFCE4
		utils.ExecQuiet("mkdir -p /etc/skel/.config")
		rsyncIfExist(filepath.Join(userHome, ".config/xfce4"), "/etc/skel/.config/")
		utils.ExecQuiet("mkdir -p /etc/skel/.local/share")
		rsyncIfExist(filepath.Join(userHome, ".local/share/recently-used.xbel"), "/etc/skel/.local/share/")
	}

	// 5. Applicazioni e configurazioni extra
	rsyncIfExist(filepath.Join(userHome, ".mozilla"), "/etc/skel/")
	rsyncIfExist(filepath.Join(userHome, ".kodi"), "/etc/skel/")
	rsyncIfExist(filepath.Join(userHome, "waydroid-package-manager"), "/etc/skel/")

	// 6. Permessi e Sicurezza
	utils.LogNormal("Impostazione dei permessi di root e sicurezza...")
	utils.ExecQuiet("chown root:root /etc/skel -R")
	utils.ExecQuiet("chmod a+rwx,g-w,o-w /etc/skel/ -R")

	for _, file := range baseFiles {
		skelFile := filepath.Join("/etc/skel", file)
		if _, err := os.Stat(skelFile); err == nil {
			utils.ExecQuiet("chmod a+rwx,g-w-x,o-wx " + skelFile)
		}
	}

	// 7. Sanificazione finale
	utils.LogNormal("Sanificazione dei file utente (segnalibri, history, dirs)...")
	rmIfExist("/etc/skel/.config/user-dirs.dirs", false)
	rmIfExist("/etc/skel/.config/user-dirs.locale", false)
	rmIfExist("/etc/skel/.config/gtk-3.0/bookmarks", true)
	rmIfExist("/etc/skel/.local/share/recently-used.xbel", false)
	rmIfExist("/etc/skel/.config/xfce4/desktop", true)

	utils.LogSuccess("Configurazione XDG in /etc/skel completata con successo!")
}
