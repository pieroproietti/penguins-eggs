package engine

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDisplayManagerConfigs(t *testing.T) {
	tempDir := t.TempDir()

	// 1. LXDM
	lxdmFile := filepath.Join(tempDir, "lxdm.conf")
	os.WriteFile(lxdmFile, []byte("[base]\n# autologin=dvr\n"), 0644)
	configureLxdmFile(lxdmFile, "testuser")
	data, _ := os.ReadFile(lxdmFile)
	if !strings.Contains(string(data), "autologin=testuser") {
		t.Errorf("LXDM config failed, got:\n%s", string(data))
	}

	// 2. SLiM
	slimFile := filepath.Join(tempDir, "slim.conf")
	os.WriteFile(slimFile, []byte("# default_user simone\n# auto_login no\n"), 0644)
	configureSlimFile(slimFile, "testuser")
	data, _ = os.ReadFile(slimFile)
	if !strings.Contains(string(data), "default_user testuser") || !strings.Contains(string(data), "auto_login yes") {
		t.Errorf("SLiM config failed, got:\n%s", string(data))
	}

	// 3. greetd
	greetdFile := filepath.Join(tempDir, "config.toml")
	os.WriteFile(greetdFile, []byte("[initial_session]\ncommand = \"startx\"\nuser = \"greeter\"\n"), 0644)
	configureGreetdFile(greetdFile, "testuser")
	data, _ = os.ReadFile(greetdFile)
	if !strings.Contains(string(data), "user = \"testuser\"") {
		t.Errorf("greetd config failed, got:\n%s", string(data))
	}
}
