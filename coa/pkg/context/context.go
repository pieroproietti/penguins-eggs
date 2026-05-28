func Detect() RuntimeContext {
	ctx := RuntimeContext{}

	// 1. Calcolo dinamico della radice del progetto
	cwd, _ := os.Getwd()
	ctx.ProjRoot = cwd
	if filepath.Base(cwd) == "coa" {
		ctx.ProjRoot = filepath.Dir(cwd)
	}
	ctx.OaDir = filepath.Join(ctx.ProjRoot, "oa")
	ctx.CoaDir = filepath.Join(ctx.ProjRoot, "coa")

	// 2. Rilevamento prioritario: Se il Makefile ci ha passato OA_BUILD_DIR,
	// usiamo quello senza discutere. È la direttiva "sovrana".
	ctx.BaseBuildDir = os.Getenv("OA_BUILD_DIR")

	// Se la variabile non è impostata, allora sì, facciamo il rilevamento intelligente
	if ctx.BaseBuildDir == "" {
		// Logica legacy per quando lanci 'coa' a mano
		ctx.BaseBuildDir = "/tmp/oa-build-dir"
	}

	// 3. Rilevamento indicatori (logica invariata)
	isCI := os.Getenv("GITHUB_ACTIONS") == "true" || os.Getenv("CI") == "true"
	isVirtual := detectVirtualization() // Sposta la logica in una helper privata per pulizia

	// 4. Assegnazione regole d'ingaggio
	switch {
	case isCI:
		ctx.EnvType = EnvCI
	case isVirtual:
		ctx.EnvType = EnvVM
	default:
		ctx.EnvType = EnvHost
	}

	return ctx
}
