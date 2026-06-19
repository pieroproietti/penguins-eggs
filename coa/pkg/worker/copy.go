package worker

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func RunCopy(payload []byte) error {
	var config struct {
		Chroot   bool   `json:"chroot"`
		LiveRoot string `json:"live_root,omitempty"`
		Params   struct {
			Src           string      `json:"src"`
			Dest          string      `json:"dest"`
			IgnoreMissing bool        `json:"ignore_missing"`
			Permissions   os.FileMode `json:"permissions"`
		} `json:"params"`
	}

	if err := json.Unmarshal(payload, &config); err != nil {
		return fmt.Errorf("error parsing JSON for copy module: %w", err)
	}

	src := config.Params.Src
	if src == "" {
		return fmt.Errorf("copy module: missing 'src' parameter")
	}
	if config.Params.Dest == "" {
		return fmt.Errorf("copy module: missing 'dest' parameter")
	}

	var dest string
	if config.Chroot {
		if config.LiveRoot == "" {
			return fmt.Errorf("chroot requested but live_root is missing")
		}
		dest = filepath.Join(config.LiveRoot)
	} else {
		dest = config.Params.Dest
	}

	sourceFile, err := os.Open(src)
	if err != nil {
		if config.Params.IgnoreMissing && os.IsNotExist(err) {
			fmt.Printf("📦 [worker] Copy skipped (source missing): %s\n", src)
			return nil
		}
		return fmt.Errorf("error opening source %s: %v", src, err)
	}
	defer sourceFile.Close()

	destDir := filepath.Dir(dest)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return fmt.Errorf("unable to create destination directories %s: %v", destDir, err)
	}

	info, err := sourceFile.Stat()
	if err != nil {
		return fmt.Errorf("unable to read attributes of %s: %v", src, err)
	}

	perms := info.Mode()
	if config.Params.Permissions != 0 {
		perms = config.Params.Permissions
	}

	destFile, err := os.OpenFile(dest, os.O_RDWR|os.O_CREATE|os.O_TRUNC, perms)
	if err != nil {
		return fmt.Errorf("error creating destination file %s: %v", dest, err)
	}
	defer destFile.Close()

	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return fmt.Errorf("error copying data: %v", err)
	}

	fmt.Printf("📦 [worker] Copy completed: %s -> %s\n", src, dest)
	return nil
}
