package worker

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

type ShellConfig struct {
	Chroot     bool   `json:"chroot"`
	LiveRoot   string `json:"live_root,omitempty"`
	ChrootPath string `json:"chroot_path,omitempty"`
	Params     struct {
		Command string   `json:"command,omitempty"`
		Src     string   `json:"src,omitempty"`
		Args    []string `json:"args,omitempty"`
	} `json:"params"`
}

func RunShell(payload []byte) error {
	var config ShellConfig
	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("error parsing JSON for shell module: %w", err)
	}

	if config.Params.Command == "" {
		return fmt.Errorf("no command specified in 'command' parameter")
	}

	scriptContent := []byte("set -e\n\n" + config.Params.Command)

	return executeUnifiedShell(config, scriptContent)
}

func executeUnifiedShell(config ShellConfig, scriptContent []byte) error {
	var tmpFilePath string
	var execPath string

	if config.Chroot {
		chrootPath := config.ChrootPath
		if chrootPath == "" {
			chrootPath = config.LiveRoot
		}
		if chrootPath == "" {
			if envRoot := os.Getenv("TARGET_ROOT"); envRoot != "" {
				chrootPath = envRoot
			} else if envRoot := os.Getenv("ROOT"); envRoot != "" {
				chrootPath = envRoot
			}
		}
		if chrootPath == "" {
			return fmt.Errorf("chroot requested but chroot path (chroot_path, live_root, TARGET_ROOT or ROOT) is missing")
		}

		chrootWorkDir := filepath.Join(chrootPath, "root", ".penguins-eggs")
		os.MkdirAll(chrootWorkDir, 0700)

		tmpFile, err := os.CreateTemp(chrootWorkDir, "oa-exec-*.sh")
		if err != nil {
			return fmt.Errorf("unable to create script in %s: %w", chrootWorkDir, err)
		}
		tmpFilePath = tmpFile.Name()
		tmpFile.Write(scriptContent)
		tmpFile.Close()

		execPath = "/root/.penguins-eggs/" + filepath.Base(tmpFilePath)

	} else {
		hostWorkDir := "/root/.penguins-eggs"
		os.MkdirAll(hostWorkDir, 0700)

		tmpFile, err := os.CreateTemp(hostWorkDir, "oa-exec-*.sh")
		if err != nil {
			return fmt.Errorf("unable to create script in %s: %w", hostWorkDir, err)
		}
		tmpFilePath = tmpFile.Name()
		tmpFile.Write(scriptContent)
		tmpFile.Close()

		execPath = tmpFilePath
	}

	os.Chmod(tmpFilePath, 0755)
	defer os.Remove(tmpFilePath)

	var cmd *exec.Cmd

	if config.Chroot {
		chrootPath := config.ChrootPath
		if chrootPath == "" {
			chrootPath = config.LiveRoot
		}
		if chrootPath == "" {
			if envRoot := os.Getenv("TARGET_ROOT"); envRoot != "" {
				chrootPath = envRoot
			} else if envRoot := os.Getenv("ROOT"); envRoot != "" {
				chrootPath = envRoot
			}
		}
		shellPath := "/bin/sh"
		if _, err := os.Stat(filepath.Join(chrootPath, "bin", "bash")); err == nil {
			shellPath = "/bin/bash"
		}

		fmt.Printf("📦 [worker core] Running in chroot %s (via %s)...\n", chrootPath, shellPath)
		args := []string{chrootPath, shellPath, execPath}
		if len(config.Params.Args) > 0 {
			args = append(args, config.Params.Args...)
		}
		cmd = exec.Command("chroot", args...)
	} else {
		fmt.Println("💻 [worker core] Running locally...")
		args := []string{execPath}
		if len(config.Params.Args) > 0 {
			args = append(args, config.Params.Args...)
		}
		cmd = exec.Command("bash", args...)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("execution failed: %w", err)
	}

	return nil
}
