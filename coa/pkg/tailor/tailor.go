package tailor

import (
	"coa/pkg/utils"
	"path/filepath"
)

func Show(costumeName string) error {
	root, err := getWardrobeRoot()
	if err != nil {
		return err
	}

	costumeDir := filepath.Join(root, "costumes", costumeName)
	yamlPath := findYaml(costumeDir)
	suit, err := loadSuit(yamlPath)
	if err != nil {
		return err
	}

	utils.LogNormal(utils.ColorCyan+"Costume: %s"+utils.ColorReset, suit.Name)
	utils.LogNormal("Descrizione: %s", suit.Description)
	utils.LogNormal("Pacchetti: %v", suit.Packages)
	return nil
}
