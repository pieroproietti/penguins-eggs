/*
 * penguins-eggs - Copyright (C) 2017-2026 Piero Proietti
 * Author: Piero Proietti <piero.proietti@gmail.com>
 * https://penguins-eggs.net
 *
 * This file is part of penguins-eggs.
 * Released under the GNU GPL v3 license.
 */

package worker

import (
	"encoding/json"
	"fmt"
	"os"
)

func RunScript(payload []byte) error {
	var config ShellConfig

	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("error parsing JSON for script module: %w", err)
	}

	src := config.Params.Src
	if src == "" {
		return fmt.Errorf("script module: missing 'src' parameter")
	}

	scriptContent, err := os.ReadFile(src)
	if err != nil {
		return fmt.Errorf("unable to read source script '%s': %w", src, err)
	}

	fmt.Printf("📄 [worker script] Loaded file '%s' from disk...\n", src)

	return executeUnifiedShell(config, scriptContent)
}
