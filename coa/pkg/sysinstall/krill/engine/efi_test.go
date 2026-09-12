package engine

import (
	"bytes"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"text/template"

	"coa/pkg/parser"
	"coa/pkg/utils"
)

func TestEFIBootloaderID(t *testing.T) {
	for _, id := range []string{"", "BOOT", "boot", "Boot", ".", "..", "a/b", `a\b`, "../colibri", "a b", "a\n", "a'", "$(id)", "-id", "Colibri", "colibri_1", "colibri-", "é", "devuan", "kubuntu", strings.Repeat("a", 17)} {
		if err := ValidateEFIBootloaderID(id); err == nil {
			t.Errorf("accepted unsafe or unstable ID %q", id)
		}
	}
	for _, id := range []string{"colibri-1", "arch-2", "arch-colibri-4", "common", "debian", "0", strings.Repeat("a", 16)} {
		if err := ValidateEFIBootloaderID(id); err != nil {
			t.Errorf("rejected %q: %v", id, err)
		}
	}
}

func TestEFIPreflightAllowsSelectedNamespaceRegardlessOfOldRoot(t *testing.T) {
	for _, oldLabel := range []string{"colibri-1", "root2", ""} {
		for _, existing := range []string{"colibri-1", "COLIBRI-1"} {
			t.Run(oldLabel+"/"+existing, func(t *testing.T) {
				esp := t.TempDir()
				writeEFITestFile(t, filepath.Join(esp, "eFi", existing, "grubx64.efi"), "first install", 0644)
				before := efiTree(t, esp)
				p, checks := coexistPlan(), safeChecks()
				probe := checks.filesystem
				checks.filesystem = func(device string) (filesystemInfo, error) {
					if device == p.TargetPartition {
						t.Fatalf("inspected old root metadata (label %q)", oldLabel)
					}
					return probe(device)
				}
				checks.inspectEFI = func(device, id string) error {
					if device != p.EspPartition || id != p.EFIBootloaderID {
						t.Fatal("wrong EFI preflight inputs")
					}
					return efiDestinationState(esp, id)
				}
				c, commands := testContext(t, p)
				c.checks = &checks
				if err := runPartition(c); err != nil {
					t.Fatalf("existing namespace rejected: %v", err)
				}
				if !strings.Contains(strings.Join(*commands, "\n"), "mkfs.ext4 -F -L colibri-1 /dev/test5") {
					t.Fatal("selected root was not formatted with the Installation ID")
				}
				if !reflect.DeepEqual(before, efiTree(t, esp)) {
					t.Fatal("preflight changed ESP")
				}
			})
		}
	}
}

func TestEFIValidationScope(t *testing.T) {
	for _, mode := range []string{"erase", "replace", "coexist"} {
		p, checks := coexistPlan(), safeChecks()
		p.Mode, p.EFIBootloaderID = mode, ""
		err := validatePlan(p, checks)
		if (err != nil) != (mode == "coexist") {
			t.Fatalf("mode %s: %v", mode, err)
		}
	}
	p, checks := coexistPlan(), safeChecks()
	checks.debianEFI = func() bool { return false }
	checks.inspectEFI = func(string, string) error { t.Fatal("inspected other family"); return nil }
	if err := validatePlan(p, checks); err != nil {
		t.Fatal(err)
	}
}

func writeEFITestFile(t *testing.T, path, content string, mode os.FileMode) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), mode); err != nil {
		t.Fatal(err)
	}
}

func efiTree(t *testing.T, root string) map[string]string {
	t.Helper()
	tree := map[string]string{}
	err := filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() {
			tree[path] = "directory"
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		tree[path] = string(data)
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	return tree
}

// Run the real rendered template with paths redirected into a temporary tree.
// Only grub-install, update-grub, uname and debconf are stubs; ESP copies and
// configuration writes execute normally so unintended writes are observable.
func debianEFIFixture(t *testing.T) (root, script string) {
	t.Helper()
	root = t.TempDir()
	tmpl, err := template.ParseFiles("../../../../brain.d/modules/debian/install.bash.tmpl")
	if err != nil {
		t.Fatal(err)
	}
	var rendered bytes.Buffer
	if err := tmpl.ExecuteTemplate(&rendered, "install_distro_bootloader", parser.TemplateContext{DistroID: "debian"}); err != nil {
		t.Fatal(err)
	}
	script = "set -e\n" + strings.NewReplacer("/boot/efi", root+"/esp", "/etc/default", root+"/defaults", "/sys/firmware/efi", root+"/firmware").Replace(rendered.String())
	for _, dir := range []string{"esp", "firmware", "bin"} {
		if err := os.MkdirAll(filepath.Join(root, dir), 0755); err != nil {
			t.Fatal(err)
		}
	}
	writeEFITestFile(t, root+"/defaults/grub", "GRUB_DISTRIBUTOR=Debian\nGRUB_TIMEOUT=5\n", 0644)
	writeEFITestFile(t, root+"/bin/uname", "#!/bin/sh\necho x86_64\n", 0755)
	writeEFITestFile(t, root+"/bin/debconf-set-selections", "#!/bin/sh\ncat > "+shellQuote(root+"/debconf")+"\n", 0755)
	writeEFITestFile(t, root+"/bin/update-grub", "#!/bin/sh\necho updated >> "+shellQuote(root+"/updated")+"\n", 0755)
	writeEFITestFile(t, root+"/bin/grub-install", `#!/bin/sh
set -e
printf '%s\n' "$*" >> `+shellQuote(root+"/grub-args")+`
id=
for arg in "$@"; do
    case "$arg" in
        --bootloader-id=*) id=${arg#*=} ;;
        --removable|--force-extra-removable|--no-nvram) exit 90 ;;
    esac
done
if [ -z "$id" ]; then
    . `+shellQuote(root+"/defaults/grub")+`
    for config in `+shellQuote(root)+`/defaults/grub.d/*.cfg; do
        [ ! -e "$config" ] || . "$config"
    done
    id=$(printf '%s' "$GRUB_DISTRIBUTOR" | tr 'A-Z' 'a-z' | cut -d' ' -f1)
fi
mkdir -p `+shellQuote(root)+`/esp/EFI/"$id"
printf '%s' "$id" > `+shellQuote(root)+`/esp/EFI/"$id"/grubx64.efi
`, 0755)
	return root, script
}

func runEFIScript(root, mode, id, script string) (string, error) {
	return utils.ExecCaptureCombined("env PATH=" + shellQuote(root+"/bin:"+os.Getenv("PATH")) +
		" KRILL_INSTALL_MODE=" + shellQuote(mode) + " KRILL_EFI_BOOTLOADER_ID=" + shellQuote(id) +
		" /bin/sh -c " + shellQuote(script))
}

func TestDebianEFITemplateModes(t *testing.T) {
	for _, mode := range []string{"coexist", "replace", "erase"} {
		for _, fallback := range []bool{false, true} {
			t.Run(mode+"/fallback="+map[bool]string{false: "absent", true: "present"}[fallback], func(t *testing.T) {
				root, script := debianEFIFixture(t)
				writeEFITestFile(t, root+"/esp/EFI/colibri-1/grubx64.efi", "first installation", 0644)
				if fallback {
					writeEFITestFile(t, root+"/esp/EFI/BOOT/BOOTX64.EFI", "existing fallback", 0644)
				}
				before := efiTree(t, root+"/esp")
				if out, err := runEFIScript(root, mode, "colibri-2", script); err != nil {
					t.Fatalf("%v: %s", err, out)
				}
				args, err := os.ReadFile(root + "/grub-args")
				if err != nil {
					t.Fatal(err)
				}
				id := "debian"
				if mode == "coexist" {
					id = "colibri-2"
				}
				want := "--target=x86_64-efi --efi-directory=" + root + "/esp --bootloader-id=" + id + " --recheck\n"
				if string(args) != want {
					t.Fatalf("grub-install args = %q, want %q", args, want)
				}
				after := efiTree(t, root+"/esp")
				if mode == "coexist" {
					delete(after, root+"/esp/EFI/colibri-2")
					delete(after, root+"/esp/EFI/colibri-2/grubx64.efi")
					if !reflect.DeepEqual(before, after) {
						t.Fatalf("sibling/fallback ESP contents changed: before=%v after=%v", before, after)
					}
					config, err := os.ReadFile(root + "/defaults/grub.d/zz-coexist-efi.cfg")
					if err != nil || string(config) != "GRUB_DISTRIBUTOR='colibri-2'\n" {
						t.Fatalf("persistent config: %q, %v", config, err)
					}
					debconf, err := os.ReadFile(root + "/debconf")
					if err != nil || string(debconf) != "grub2-common grub2/force_efi_extra_removable boolean false\n" {
						t.Fatalf("fallback package setting: %q, %v", debconf, err)
					}
					// No Krill environment or script is involved in maintenance.
					if out, err := runEFIScript(root, "", "", "grub-install; update-grub"); err != nil {
						t.Fatalf("maintenance: %v: %s", err, out)
					}
					if _, err := os.Stat(root + "/esp/EFI/debian"); !os.IsNotExist(err) {
						t.Fatalf("maintenance reverted to debian: %v", err)
					}
				} else {
					if after[root+"/esp/EFI/BOOT/BOOTX64.EFI"] != "debian" {
						t.Fatal("normal fallback behavior changed")
					}
					if _, err := os.Stat(root + "/debconf"); !os.IsNotExist(err) {
						t.Fatal("normal install changed debconf")
					}
				}
			})
		}
	}
}

func TestDebianEFITemplateRejectsUnsafeID(t *testing.T) {
	for _, id := range []string{"", "BOOT", ".", "..", "a/b", "a'", "$(id)", "devuan", "kubuntu", "colibri_1", "colibri-", "-colibri", "Colibri-1", "é", strings.Repeat("a", 17)} {
		t.Run(id, func(t *testing.T) {
			root, script := debianEFIFixture(t)
			writeEFITestFile(t, root+"/esp/EFI/colibri-1/grubx64.efi", "first", 0644)
			writeEFITestFile(t, root+"/esp/EFI/COLIBRI-2/grubx64.efi", "second", 0644)
			before := efiTree(t, root)
			if out, err := runEFIScript(root, "coexist", id, script); err == nil {
				t.Fatalf("accepted %q: %s", id, out)
			}
			if !reflect.DeepEqual(before, efiTree(t, root)) {
				t.Fatal("rejection changed files or executed bootloader commands")
			}
		})
	}
}

func TestDebianEFITemplateReplacesOnlyMatchingDirectory(t *testing.T) {
	for _, existing := range []string{"colibri-1", "COLIBRI-1"} {
		t.Run(existing, func(t *testing.T) {
			root, script := debianEFIFixture(t)
			for _, sibling := range []string{"colibri-2", "arch-1", "fedora-1", "BOOT"} {
				writeEFITestFile(t, root+"/esp/EFI/"+sibling+"/keep.efi", sibling, 0644)
			}
			before := efiTree(t, root+"/esp")
			writeEFITestFile(t, root+"/esp/EFI/"+existing+"/grubx64.efi", "old slot", 0644)
			writeEFITestFile(t, root+"/esp/EFI/"+existing+"/obsolete.efi", "remove", 0644)
			if out, err := runEFIScript(root, "coexist", "colibri-1", script); err != nil {
				t.Fatalf("replacement failed: %v: %s", err, out)
			}
			if got, err := os.ReadFile(root + "/esp/EFI/colibri-1/grubx64.efi"); err != nil || string(got) != "colibri-1" {
				t.Fatalf("matching EFI directory was not replaced: %q, %v", got, err)
			}
			after := efiTree(t, root+"/esp")
			delete(after, root+"/esp/EFI/colibri-1")
			delete(after, root+"/esp/EFI/colibri-1/grubx64.efi")
			if !reflect.DeepEqual(before, after) {
				t.Fatalf("old files survived or siblings/EFI/BOOT changed: before=%v after=%v", before, after)
			}
		})
	}
}

func TestEFIPlanReachesShellprocess(t *testing.T) {
	for _, mode := range []string{"coexist", "replace", "erase"} {
		p := &Plan{Mode: mode, EFIBootloaderID: "colibri-2", HomeNamespace: "separate-home", ConfigRoot: t.TempDir()}
		writeEFITestFile(t, filepath.Join(p.ConfigRoot, "modules", "shellprocess_runner.conf"),
			"dontChroot: true\nscript: |\n  printf '%s/%s' \"$KRILL_INSTALL_MODE\" \"$KRILL_EFI_BOOTLOADER_ID\"\n", 0644)
		called := false
		c := &ctx{plan: p, execute: func(_ string, name string, args ...string) error {
			called = true
			if name != "/bin/sh" || len(args) != 2 || args[0] != "-c" {
				t.Fatalf("unexpected runner: %s %q", name, args)
			}
			out, err := utils.ExecCapture("/bin/sh -c " + shellQuote(args[1]))
			if err != nil || out != mode+"/colibri-2" {
				t.Fatalf("runtime choices lost: %q, %v", out, err)
			}
			return nil
		}}
		if err := c.runShellprocess("runner"); err != nil || !called {
			t.Fatalf("shellprocess: %v, called %v", err, called)
		}
	}
}

func TestDebianEFIStopsOnGRUBOrConfigurationFailure(t *testing.T) {
	for _, failure := range []string{"grub", "debconf", "override"} {
		t.Run(failure, func(t *testing.T) {
			root, script := debianEFIFixture(t)
			switch failure {
			case "grub":
				// A written binary is insufficient: NVRAM registration may have failed.
				writeEFITestFile(t, root+"/bin/grub-install", "#!/bin/sh\nmkdir -p "+shellQuote(root+"/esp/EFI/colibri-2")+"\ntouch "+shellQuote(root+"/esp/EFI/colibri-2/grubx64.efi")+"\nexit 1\n", 0755)
			case "debconf":
				writeEFITestFile(t, root+"/bin/debconf-set-selections", "#!/bin/sh\nexit 1\n", 0755)
			case "override":
				writeEFITestFile(t, root+"/defaults/grub.d/zzz-local.cfg", "GRUB_DISTRIBUTOR=debian\n", 0644)
			}
			if out, err := runEFIScript(root, "coexist", "colibri-2", script); err == nil {
				t.Fatalf("ignored %s failure: %s", failure, out)
			}
			if _, err := os.Stat(root + "/updated"); !os.IsNotExist(err) {
				t.Fatal("continued to update-grub after failure")
			}
			if failure != "grub" {
				if _, err := os.Stat(root + "/grub-args"); !os.IsNotExist(err) {
					t.Fatal("installed GRUB after persistence failure")
				}
			}
		})
	}
}

func TestEFIStructuralSafety(t *testing.T) {
	for _, unsafe := range []string{"file", "symlink", "dangling symlink", "EFI symlink", "EFI file", "duplicate"} {
		t.Run(unsafe, func(t *testing.T) {
			root, script := debianEFIFixture(t)
			outside := t.TempDir()
			writeEFITestFile(t, outside+"/keep", "untouched", 0644)
			if err := os.Mkdir(root+"/esp/EFI", 0755); err != nil {
				t.Fatal(err)
			}
			destination := root + "/esp/EFI/colibri-1"
			var err error
			switch unsafe {
			case "file":
				err = os.WriteFile(destination, []byte("keep"), 0644)
			case "symlink":
				err = os.Symlink(outside, destination)
			case "dangling symlink":
				err = os.Symlink(outside+"/missing", destination)
			case "EFI symlink", "EFI file":
				if err := os.Remove(root + "/esp/EFI"); err != nil {
					t.Fatal(err)
				}
				if unsafe == "EFI symlink" {
					err = os.Symlink(outside, root+"/esp/EFI")
				} else {
					err = os.WriteFile(root+"/esp/EFI", []byte("keep"), 0644)
				}
			case "duplicate":
				writeEFITestFile(t, destination+"/keep", "first", 0644)
				writeEFITestFile(t, root+"/esp/EFI/COLIBRI-1/keep", "second", 0644)
			}
			if err != nil {
				t.Fatal(err)
			}
			if err := efiDestinationState(root+"/esp", "colibri-1"); err == nil {
				t.Fatal("preflight accepted unsafe EFI structure")
			}
			if out, err := runEFIScript(root, "coexist", "colibri-1", script); err == nil {
				t.Fatalf("template accepted unsafe EFI structure: %s", out)
			}
			if _, err := os.Stat(root + "/grub-args"); !os.IsNotExist(err) {
				t.Fatal("GRUB ran with unsafe EFI structure")
			}
			if got, err := os.ReadFile(outside + "/keep"); err != nil || string(got) != "untouched" {
				t.Fatalf("symlink target changed: %q, %v", got, err)
			}
		})
	}
}
