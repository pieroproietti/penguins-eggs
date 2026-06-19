package tailor

import (
	"coa/pkg/utils"
	"fmt"
	"os"
	"path/filepath"
)

func List() error {
	root, err := getWardrobeRoot()
	if err != nil {
		return err
	}

	costumesDir := filepath.Join(root, "costumes")
	entries, err := os.ReadDir(costumesDir)
	if err != nil {
		return fmt.Errorf("unable to read costumes: %v", err)
	}

	utils.LogNormal(utils.ColorCyan + "Available costumes in oa-wardrobe:" + utils.ColorReset)
	for _, entry := range entries {
		if entry.IsDir() {
			yamlPath := findYaml(filepath.Join(costumesDir, entry.Name()))
			if yamlPath != "" {
				if suit, err := loadSuit(yamlPath); err == nil {
					utils.LogNormal("- %-12s: %s", utils.ColorYellow+entry.Name()+utils.ColorReset, suit.Description)
				}
			}
		}
	}
	return nil
}
