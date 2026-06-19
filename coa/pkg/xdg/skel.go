package xdg

import (
	"os"
	"os/exec"
	"path/filepath"

	"coa/pkg/utils"
)

func hasExecutable(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

func rsyncIfExist(source, dest string) {
	if _, err := os.Stat(source); err == nil {
		utils.LogNormal("  -> Copying: %s", source)

		flags := "-avx"
		utils.ExecQuiet("rsync " + flags + " " + source + " " + dest)
	}
}

func rmIfExist(path string, recursive bool) {
	if _, err := os.Stat(path); err == nil {
		utils.LogNormal("  -> Removing: %s", path)

		if recursive {
			utils.ExecQuiet("rm -rf " + path)
		} else {
			utils.ExecQuiet("rm -f " + path)
		}
	}
}

func HandleSkel(targetUser string) {
	var user string

	if targetUser != "" {
		user = targetUser
	} else {
		user = os.Getenv("SUDO_USER")
		if user == "" {
			utils.Fatal("Unable to determine the source user. Run with sudo or pass the user with --user.")
		}
	}

	userHome := filepath.Join("/home", user)
	if _, err := os.Stat(userHome); os.IsNotExist(err) {
		utils.Fatal("The user's home directory does not exist: %s", userHome)
	}

	utils.LogNormal("Starting /etc/skel regeneration from user: %s", user)
	utils.ExecQuiet("rm -rf /etc/skel")
	utils.ExecQuiet("mkdir -p /etc/skel")

	baseFiles := []string{".bash_logout", ".bashrc", ".profile"}
	for _, file := range baseFiles {
		rsyncIfExist(filepath.Join(userHome, file), "/etc/skel/")
	}

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

	rsyncIfExist(filepath.Join(userHome, ".mozilla"), "/etc/skel/")
	rsyncIfExist(filepath.Join(userHome, ".kodi"), "/etc/skel/")
	rsyncIfExist(filepath.Join(userHome, "waydroid-package-manager"), "/etc/skel/")

	utils.LogNormal("Setting root permissions and security...")
	utils.ExecQuiet("chown root:root /etc/skel -R")
	utils.ExecQuiet("chmod a+rwx,g-w,o-w /etc/skel/ -R")

	for _, file := range baseFiles {
		skelFile := filepath.Join("/etc/skel", file)
		if _, err := os.Stat(skelFile); err == nil {
			utils.ExecQuiet("chmod a+rwx,g-w-x,o-wx " + skelFile)
		}
	}

	utils.LogNormal("Sanitizing user files (bookmarks, history, dirs)...")
	rmIfExist("/etc/skel/.config/user-dirs.dirs", false)
	rmIfExist("/etc/skel/.config/user-dirs.locale", false)
	rmIfExist("/etc/skel/.config/gtk-3.0/bookmarks", true)
	rmIfExist("/etc/skel/.local/share/recently-used.xbel", false)
	rmIfExist("/etc/skel/.config/xfce4/desktop", true)

	utils.LogSuccess("XDG configuration in /etc/skel completed successfully!")
}
