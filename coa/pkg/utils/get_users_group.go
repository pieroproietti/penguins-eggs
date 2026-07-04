package utils

import (
	"bufio"
	"os"
	"os/user"
	"strconv"
	"strings"
)

// essentialDesktopGroups son los grupos que, si faltan, provocan que
// NetworkManager/blueman/CUPS/el gestor de escáner pidan autenticación
// polkit en cada sesión live en lugar de operar directo para el usuario
// activo local. Se agregan siempre, sin importar de dónde vengan los
// demás grupos mirroreados.
var essentialDesktopGroups = []string{
	"netdev", "bluetooth", "plugdev", "lpadmin", "scanner", "cdrom", "dialout",
}

// GetUserGroups recupera i gruppi dell'utente che ha invocato sudo.
//
// Se SUDO_USER non e' impostata (ad esempio perche' si e' entrati in una
// shell di root con 'su' invece di usare 'sudo' dall'utente normale),
// il vecchio comportamento restituiva una lista generica fissa che NON
// includeva gruppi come "netdev" o "bluetooth" — con il risultato che
// l'utente live della ISO generata perdeva l'accesso senza password a
// NetworkManager/Bluetooth, e strumenti come blueman-applet chiedevano
// la password di root ad ogni avvio del live. Per evitarlo, in assenza
// di SUDO_USER cerchiamo il primo utente umano reale in /etc/passwd
// (UID tra 1000 e 59999, shell valida) e mirroriamo i suoi gruppi.
func GetUserGroups() []string {
	sudoUser := os.Getenv("SUDO_USER")

	u, err := resolveSourceUser(sudoUser)
	if err != nil || u == nil {
		return dedupeGroups(essentialDesktopGroups, []string{"wheel", "audio", "video", "storage", "network"})
	}

	gids, err := u.GroupIds()
	if err != nil {
		return dedupeGroups(essentialDesktopGroups, []string{"wheel", "audio", "video"})
	}

	var groups []string
	for _, gid := range gids {
		g, err := user.LookupGroupId(gid)
		if err == nil {
			// Escludiamo il gruppo primario (spesso uguale allo username)
			// per evitare conflitti durante la creazione dell'utente live
			if g.Name != u.Username && g.Name != "users" {
				groups = append(groups, g.Name)
			}
		}
	}

	// Assicuriamoci che 'wheel' e i gruppi essenziali per la sessione
	// desktop (rete, bluetooth, stampa, scanner...) siano sempre presenti.
	groups = append(groups, "wheel")
	return dedupeGroups(groups, essentialDesktopGroups)
}

// resolveSourceUser trova l'utente da cui mirrorare i gruppi: SUDO_USER
// se presente, altrimenti il primo utente umano reale trovato in
// /etc/passwd (UID 1000-59999 con shell di login valida).
func resolveSourceUser(sudoUser string) (*user.User, error) {
	if sudoUser != "" {
		return user.Lookup(sudoUser)
	}

	f, err := os.Open("/etc/passwd")
	if err != nil {
		return nil, err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fields := strings.Split(scanner.Text(), ":")
		if len(fields) < 7 {
			continue
		}
		uid, err := strconv.Atoi(fields[2])
		if err != nil || uid < 1000 || uid >= 60000 {
			continue
		}
		shell := fields[6]
		if strings.HasSuffix(shell, "nologin") || strings.HasSuffix(shell, "/false") {
			continue
		}
		return user.Lookup(fields[0])
	}
	return nil, nil
}

// dedupeGroups fonde piu' liste di gruppi rimuovendo i duplicati,
// mantenendo l'ordine di prima apparizione.
func dedupeGroups(lists ...[]string) []string {
	seen := make(map[string]struct{})
	var out []string
	for _, list := range lists {
		for _, g := range list {
			if _, ok := seen[g]; ok {
				continue
			}
			seen[g] = struct{}{}
			out = append(out, g)
		}
	}
	return out
}
