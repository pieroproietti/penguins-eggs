package setup

import (
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"coa/pkg/sysinstall/krill"
	"coa/pkg/utils"
	"gopkg.in/yaml.v3"
)

func TestSourceUsersSequence(t *testing.T) {
	original, err := os.ReadFile("../../assets/calamares_base/settings.conf")
	if err != nil {
		t.Fatal(err)
	}
	for _, mode := range []string{"standard", "clone", "crypted"} {
		t.Run(mode, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "settings.conf")
			if err := os.WriteFile(path, original, 0600); err != nil {
				t.Fatal(err)
			}
			if err := configureSourceUsers(path, Sibling{Mode: mode}); err != nil {
				t.Fatal(err)
			}
			data, err := os.ReadFile(path)
			if err != nil {
				t.Fatal(err)
			}
			var settings krill.Settings
			if err := yaml.Unmarshal(data, &settings); err != nil {
				t.Fatal(err)
			}
			for _, module := range []string{"users", "removeuser", "displaymanager"} {
				if slices.Contains(settings.Exec(), module) != (mode == "standard") {
					t.Fatalf("%s: unexpected %s in %v", mode, module, settings.Exec())
				}
			}
			if slices.Contains(settings.Show(), "users") != (mode == "standard") {
				t.Fatal("incorrect user page")
			}
			for _, module := range []string{"partition", "mount", "unpackfs", "machineid", "fstab", "shellprocess@krill-chroot-runner", "umount"} {
				if !slices.Contains(settings.Exec(), module) {
					t.Fatalf("lost installation module %s", module)
				}
			}
			if mode == "standard" && string(data) != string(original) {
				t.Fatal("standard sequence changed")
			}
		})
	}
}

func TestReadSourceSiblingSquashfs(t *testing.T) {
	for _, tool := range []string{"mksquashfs", "unsquashfs"} {
		if _, err := exec.LookPath(tool); err != nil {
			t.Skipf("%s unavailable", tool)
		}
	}
	quote := func(s string) string { return "'" + strings.ReplaceAll(s, "'", "'\"'\"'") + "'" }
	for _, mode := range []string{"standard", "clone", "crypted", "invalid", "missing"} {
		t.Run(mode, func(t *testing.T) {
			dir := t.TempDir()
			root := filepath.Join(dir, "root")
			marker := filepath.Join(root, siblingPath)
			if err := os.MkdirAll(filepath.Dir(marker), 0700); err != nil {
				t.Fatal(err)
			}
			if mode != "missing" {
				if err := os.WriteFile(marker, []byte("mode: "+mode+"\n"), 0600); err != nil {
					t.Fatal(err)
				}
			}
			source := filepath.Join(dir, "image ' with spaces.squashfs")
			if err := utils.ExecQuiet("mksquashfs " + quote(root) + " " + quote(source) + " -noappend -processors 1 -quiet"); err != nil {
				t.Fatal(err)
			}
			sibling, err := readSourceSibling(source)
			if mode == "invalid" || mode == "missing" {
				if err == nil {
					t.Fatal("unsafe fallback for invalid source marker")
				}
			} else if err != nil || sibling.Mode != mode {
				t.Fatalf("got %+v, %v", sibling, err)
			}
		})
	}
	if _, err := readSourceSibling(filepath.Join(t.TempDir(), "absent.squashfs")); err == nil {
		t.Fatal("missing source accepted")
	}
}
