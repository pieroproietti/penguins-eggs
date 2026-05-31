package repo

import (
	"coa/pkg/distro"
	"fmt"
)

// HandleRepos gestisce l'aggiunta o la rimozione dei repository penguins-eggs
func HandleRepos(action string) error {
	// Chiamiamo la variabile 'd' per non sovrascrivere il nome del package 'distro'
	d := distro.NewDistro()
	var err error

	switch action {
	case "add":
		switch d.FamilyID {
		case "debian", "ubuntu":
			err = addDebian()
		case "alpine":
			err = addAlpine()
		case "archlinux", "arch":
			err = addArch(d.DistroID == "manjaro")
		case "fedora", "rhel", "almalinux":
			err = addFedoraEl(d.DistroID != "Fedora" && d.DistroID != "fedora")
		case "opensuse", "suse":
			err = addSuse()
		default:
			err = fmt.Errorf("famiglia distro non supportata per l'aggiunta della repo: %s", d.FamilyID)
		}

	case "remove", "rm":
		switch d.FamilyID {
		case "debian", "ubuntu":
			err = removeDebian()
		case "alpine":
			err = removeAlpine()
		case "archlinux", "arch":
			err = removeArch(d.DistroID == "manjaro")
		case "fedora", "rhel", "almalinux":
			err = removeRpm(false) // isSuse = false
		case "opensuse", "suse":
			err = removeRpm(true) // isSuse = true
		default:
			err = fmt.Errorf("famiglia distro non supportata per la rimozione della repo: %s", d.FamilyID)
		}

	default:
		err = fmt.Errorf("azione sconosciuta: %s. Usa 'add' o 'remove'", action)
	}

	return err
}
