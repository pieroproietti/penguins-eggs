package wardrobe

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

// WardrobeContents holds lists of costumes, accessories, and servers.
type WardrobeContents struct {
	Costumes    []string `json:"costumes"`
	Accessories []string `json:"accessories"`
	Servers     []string `json:"servers"`
}

// wardrobePath returns the path to ~/.wardrobe.
func wardrobePath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("getting home dir: %w", err)
	}
	return filepath.Join(home, ".wardrobe"), nil
}

// Exists checks if the wardrobe directory exists.
func Exists() bool {
	path, err := wardrobePath()
	if err != nil {
		return false
	}
	_, err = os.Stat(path)
	return err == nil
}

// List returns the contents of the wardrobe (costumes, accessories, servers).
func List() (*WardrobeContents, error) {
	base, err := wardrobePath()
	if err != nil {
		return nil, err
	}

	contents := &WardrobeContents{
		Costumes:    listDir(filepath.Join(base, "costumes")),
		Accessories: listDir(filepath.Join(base, "accessories")),
		Servers:     listDir(filepath.Join(base, "servers")),
	}
	return contents, nil
}

// ShowContent reads the YAML content of a specific costume/accessory/server
// for a given distro.
func ShowContent(category, name, distro string) (string, error) {
	base, err := wardrobePath()
	if err != nil {
		return "", err
	}

	filePath := filepath.Join(base, category, name, distro+".yml")
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("reading %s: %w", filePath, err)
	}
	return string(data), nil
}

func listDir(path string) []string {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil
	}

	var names []string
	for _, e := range entries {
		if e.IsDir() {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)
	return names
}
