package setup

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"coa/pkg/parser"
)

type EllPayload struct {
	Module string `json:"module"`
	Chroot bool   `json:"chroot"`
	Params struct {
		Command string `json:"command"`
	} `json:"params"`
}

func getStepCommand(step parser.Step) string {
	if step.RunCommand != "" {
		return step.RunCommand
	}
	if step.Params != nil {
		if cmd, ok := step.Params["command"].(string); ok {
			return cmd
		}
	}
	return ""
}

func generateChrootRunner(profile *parser.Profile) error {
	var sb strings.Builder

	currentExe, err := os.Executable()
	if err != nil {
		currentExe = "coa"
	}

	sb.WriteString("#!/bin/bash\n")
	sb.WriteString("set -e\n\n")
	sb.WriteString("# Target root detection\n")
	sb.WriteString("TARGET_ROOT=${ROOT}\n")
	sb.WriteString("if [ -z \"$TARGET_ROOT\" ]; then\n")
	sb.WriteString("    TARGET_ROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e \"s#/proc##g\")\n")
	sb.WriteString("fi\n")
	sb.WriteString("if [ -z \"$TARGET_ROOT\" ]; then\n")
	sb.WriteString("    TARGET_ROOT=$(ls -d /tmp/calamares-root-* 2>/dev/null | head -n 1)\n")
	sb.WriteString("fi\n")
	sb.WriteString("if [ -z \"$TARGET_ROOT\" ]; then\n")
	sb.WriteString("    TARGET_ROOT=\"/tmp/calamares-root-krill\"\n")
	sb.WriteString("fi\n\n")
	sb.WriteString("export TARGET_ROOT\n")
	sb.WriteString("export ROOT=\"$TARGET_ROOT\"\n\n")
	sb.WriteString("echo \"Chroot runner: installing to $TARGET_ROOT\"\n\n")
	sb.WriteString("FAILED=0\n\n")

	for _, step := range profile.Install {
		cmd := getStepCommand(step)
		if cmd == "" {
			continue
		}

		sb.WriteString(fmt.Sprintf("# --- Step: %s ---\n", step.Name))
		if step.Description != "" {
			sb.WriteString(fmt.Sprintf("echo \"Running step: %s...\"\n", step.Description))
		} else {
			sb.WriteString(fmt.Sprintf("echo \"Running step: %s...\"\n", step.Name))
		}

		payload := EllPayload{
			Module: "shell",
			Chroot: step.Chroot,
		}
		payload.Params.Command = cmd

		jsonBytes, err := json.MarshalIndent(payload, "", "  ")
		if err != nil {
			return fmt.Errorf("error marshaling step %s: %w", step.Name, err)
		}

		sb.WriteString(fmt.Sprintf("if ! %s ell <<'EOF_STEP'\n", currentExe))
		sb.Write(jsonBytes)
		sb.WriteString("\nEOF_STEP\n")
		sb.WriteString("then\n")
		sb.WriteString(fmt.Sprintf("    echo \"[WARNING] Step '%s' failed, continuing with remaining steps...\"\n", step.Name))
		sb.WriteString("    FAILED=1\n")
		sb.WriteString("fi\n\n")
	}

	sb.WriteString("exit $FAILED\n")

	outPath := filepath.Join(InstallerDRoot, "oa-chroot-runner.sh")
	return os.WriteFile(outPath, []byte(sb.String()), 0755)
}
