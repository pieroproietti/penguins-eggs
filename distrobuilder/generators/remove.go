package generators

import (
	"os"
	"path/filepath"

	"github.com/lxc/distrobuilder/v3/image"
	"github.com/lxc/distrobuilder/v3/shared"
)

type remove struct {
	common
}

// RunLXC removes a path.
func (g *remove) RunLXC(img *image.LXCImage, target shared.DefinitionTargetLXC) error {
	return g.Run()
}

// RunIncus removes a path.
func (g *remove) RunIncus(img *image.IncusImage, target shared.DefinitionTargetIncus) error {
	return g.Run()
}

// Run removes a path.
func (g *remove) Run() error {
	return os.RemoveAll(filepath.Join(g.sourceDir, g.defFile.Path))
}
