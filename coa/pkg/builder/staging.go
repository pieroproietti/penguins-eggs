package builder

import (
	sysctx "coa/pkg/context"
	"os"
	"path/filepath"
)

func staging(ctx sysctx.RuntimeContext) string {
	projRoot := ctx.ProjRoot
	stageDir := ctx.StageDir
	buildDir := ctx.BaseBuildDir

	// Clean up everything from before
	os.RemoveAll(stageDir)

	// Create the clean hierarchy (usr, etc, etc.)
	// Only files that belong in the package go here
	os.MkdirAll(filepath.Join(stageDir, "usr/bin"), 0755)
	os.MkdirAll(filepath.Join(stageDir, "etc/oa-tools.d"), 0755)

	// stage := filepath.Join(buildDir, dist)
	// os.RemoveAll(stage)

	// Define the standard directories every package must have
	dirs := []string{
		"usr/bin",
		"etc/oa-tools.d/brain.d",
		"etc/oa-tools.d/scripts",
		"usr/share/man/man1",
		"usr/share/bash-completion/completions",
		"usr/share/zsh/site-functions",
		"usr/share/fish/vendor_completions.d",
	}
	for _, d := range dirs {
		os.MkdirAll(filepath.Join(stageDir, d), 0755)
	}

	// 1. Binaries (from the build directory)
	copyFile(filepath.Join(buildDir, "oa"), filepath.Join(stageDir, "usr/bin/oa"))
	copyFile(filepath.Join(buildDir, "coa"), filepath.Join(stageDir, "usr/bin/coa"))
	os.Symlink("coa", filepath.Join(stageDir, "usr/bin/eggs"))

	// 2. Configuration (from ProjRoot)
	copyFile(filepath.Join(projRoot, "coa/pkg/assets/configs/custom.yaml"), filepath.Join(stageDir, "etc/oa-tools.d/custom.yaml"))
	copyFile(filepath.Join(projRoot, "coa/pkg/assets/configs/custom.exclude.list"), filepath.Join(stageDir, "etc/oa-tools.d/custom.exclude.list"))

	copyDir(filepath.Join(projRoot, "coa/pkg/assets/configs/scripts"), filepath.Join(stageDir, "etc/oa-tools.d/scripts"))

	// Recursive copy of brain.d
	copyDir(filepath.Join(projRoot, "coa/brain.d"), filepath.Join(stageDir, "etc/oa-tools.d/brain.d"))

	// 3. Documentation (man pages)
	manFiles, _ := filepath.Glob(filepath.Join(buildDir, "docs/man/*.1"))
	for _, f := range manFiles {
		dest := filepath.Join(stageDir, "usr/share/man/man1", filepath.Base(f))
		copyFile(f, dest)
		// Could also gzip on the fly here if needed
	}

	// 4. Completions
	src := filepath.Join(buildDir, "docs/completion/coa.bash")
	dest := filepath.Join(stageDir, "usr/share/bash-completion/completions/coa.bash")
	copyFile(src, dest)

	src = filepath.Join(buildDir, "docs/completion/coa.fish")
	dest = filepath.Join(stageDir, "usr/share/fish/vendor_completions.d/coa.fish")
	copyFile(src, dest)

	src = filepath.Join(buildDir, "docs/completion/coa.zsh")
	dest = filepath.Join(stageDir, "usr/share/zsh/vendor-completions/_coa")
	copyFile(src, dest)

	// 5. Eggs completions
	src = filepath.Join(buildDir, "docs/completion/eggs.bash")
	dest = filepath.Join(stageDir, "usr/share/bash-completion/completions/eggs.bash")
	copyFile(src, dest)

	src = filepath.Join(buildDir, "docs/completion/eggs.fish")
	dest = filepath.Join(stageDir, "usr/share/fish/vendor_completions.d/eggs.fish")
	copyFile(src, dest)

	src = filepath.Join(buildDir, "docs/completion/eggs.zsh")
	dest = filepath.Join(stageDir, "usr/share/zsh/vendor-completions/_eggs")
	copyFile(src, dest)

	return stageDir
}
