package builder

import (
	sysctx "coa/pkg/context"
	"os"
	"path/filepath"
)

func prepare(ctx sysctx.RuntimeContext, dist string) string {
	stage := "/tmp/oa-stage-dir"

	// Pulisci tutto quello che c'era prima
	os.RemoveAll(stage)

	// Crea la gerarchia pulita (usr, etc, ecc.)
	// Qui andranno solo i file che devono finire nel pacchetto
	os.MkdirAll(filepath.Join(stage, "usr/bin"), 0755)
	os.MkdirAll(filepath.Join(stage, "etc/oa-tools.d"), 0755)

	// stage := filepath.Join(ctx.BaseBuildDir, dist)
	// os.RemoveAll(stage)

	// Definiamo le cartelle standard che ogni pacchetto deve avere
	dirs := []string{
		"usr/bin",
		"etc/oa-tools.d/brain.d",
		"usr/share/man/man1",
		"usr/share/bash-completion/completions",
		"usr/share/zsh/site-functions",
		"usr/share/fish/vendor_completions.d",
	}
	for _, d := range dirs {
		os.MkdirAll(filepath.Join(stage, d), 0755)
	}

	// 1. Binari (dalla Fucina)
	copyFile(filepath.Join(ctx.BaseBuildDir, "oa"), filepath.Join(stage, "usr/bin/oa"))
	copyFile(filepath.Join(ctx.BaseBuildDir, "coa"), filepath.Join(stage, "usr/bin/coa"))
	os.Symlink("coa", filepath.Join(stage, "usr/bin/eggs"))

	// 2. Configurazione (dalla ProjRoot)
	copyFile(filepath.Join(ctx.ProjRoot, "etc/oa-tools.d/custom.yaml"), filepath.Join(stage, "etc/oa-tools.d/custom.yaml"))
	// Copia ricorsiva del brain.d
	copyDir(filepath.Join(ctx.ProjRoot, "coa/brain.d"), filepath.Join(stage, "etc/oa-tools.d/brain.d"))

	// 3. Documentazione (Man pages)
	manFiles, _ := filepath.Glob(filepath.Join(ctx.ProjRoot, "docs/man/*.1"))
	for _, f := range manFiles {
		dest := filepath.Join(stage, "usr/share/man/man1", filepath.Base(f))
		copyFile(f, dest)
		// Qui potresti anche gzippare al volo se vuoi
	}

	// 4. Completions
	src := filepath.Join(ctx.ProjRoot, "docs/completion/coa.bash")
	dest := filepath.Join(stage, "usr/share/bash-completion/completions/coa")
	copyFile(src, dest)

	src = filepath.Join(ctx.ProjRoot, "docs/completion/coa.fish")
	dest = filepath.Join(stage, "usr/share/fish/vendor_completions.d/coa.fish")
	copyFile(src, dest)

	src = filepath.Join(ctx.ProjRoot, "docs/completion/coa.zsh")
	dest = filepath.Join(stage, "usr/share/zsh/vendor-completions/_coa")
	copyFile(src, dest)

	return stage
}
