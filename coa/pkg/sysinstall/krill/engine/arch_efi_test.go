package engine

import (
	"bytes"
	"os"
	"reflect"
	"strings"
	"testing"
	"text/template"

	"coa/pkg/parser"
)

func archEFIFixture(t *testing.T) (root, script string) {
	t.Helper()
	return archFamilyEFIFixture(t, "arch")
}

// Execute the Arch-family dispatcher and GRUB template in a temporary tree.
// GRUB and uname are stubbed; filesystem writes and fallback copies execute
// normally. Other bootloader branches fail without running system commands.
func archFamilyEFIFixture(t *testing.T, distroID string) (root, script string) {
	t.Helper()
	root = t.TempDir()
	tmpl := template.New("arch-family")
	tmpl.Funcs(template.FuncMap{"include": func(name string, data any) (string, error) {
		var output bytes.Buffer
		err := tmpl.ExecuteTemplate(&output, name, data)
		return output.String(), err
	}})
	_, err := tmpl.ParseFiles("../../../../brain.d/modules/arch-family/install/grub.bash.tmpl",
		"../../../../brain.d/modules/arch-family/install/index.bash.tmpl")
	if err != nil {
		t.Fatal(err)
	}
	_, err = tmpl.Parse(`{{ define "install_distro_limine" }}exit 91{{ end }}
{{ define "install_distro_systemd_boot" }}exit 92{{ end }}`)
	if err != nil {
		t.Fatal(err)
	}
	var rendered bytes.Buffer
	if err := tmpl.ExecuteTemplate(&rendered, "install_distro_bootloader", parser.TemplateContext{DistroID: distroID}); err != nil {
		t.Fatal(err)
	}
	script = strings.NewReplacer("/boot", root+"/boot", "/etc", root+"/etc",
		"/sys/firmware/efi", root+"/firmware", "/proc/mounts", root+"/mounts").Replace(rendered.String())
	for _, dir := range []string{"boot/efi", "firmware", "bin"} {
		if err := os.MkdirAll(root+"/"+dir, 0755); err != nil {
			t.Fatal(err)
		}
	}
	writeEFITestFile(t, root+"/mounts", "/dev/test1 "+root+"/boot/efi vfat rw 0 0\n", 0644)
	writeEFITestFile(t, root+"/etc/fstab", "UUID=root-uuid / ext4 defaults 0 1\n", 0644)
	writeEFITestFile(t, root+"/etc/default/grub", "GRUB_DISTRIBUTOR=Arch\n", 0644)
	writeEFITestFile(t, root+"/boot/vmlinuz-linux", "kernel", 0644)
	writeEFITestFile(t, root+"/bin/uname", "#!/bin/sh\necho x86_64\n", 0755)
	writeEFITestFile(t, root+"/bin/grub-mkconfig", "#!/bin/sh\nprintf '%s\\n' \"$*\" > "+shellQuote(root+"/mkconfig-args")+"\n", 0755)
	writeEFITestFile(t, root+"/bin/grub-install", `#!/bin/sh
set -e
printf '%s\n' "$*" > `+shellQuote(root+"/grub-args")+`
for arg in "$@"; do
    case "$arg" in
        --bootloader-id=*) id=${arg#*=} ;;
        --efi-directory=*) esp=${arg#*=} ;;
        --removable|--force-extra-removable|--no-nvram) exit 90 ;;
    esac
done
mkdir -p "$esp/EFI/$id"
printf '%s' "$id" > "$esp/EFI/$id/grubx64.efi"
`, 0755)
	// The Arch template uses Bash syntax, matching its installation runner.
	return root, "exec /bin/bash -c " + shellQuote("set -e\n"+script)
}

func TestArchFamilyEFITemplateModes(t *testing.T) {
	for _, distroID := range []string{"arch", "manjaro", "biglinux", "bigcommunity", "custom-manjaro"} {
		for _, mode := range []string{"coexist", "erase", "replace"} {
			for _, fallback := range []bool{false, true} {
				t.Run(distroID+"/"+mode+"/fallback="+map[bool]string{false: "absent", true: "present"}[fallback], func(t *testing.T) {
					root, script := archFamilyEFIFixture(t, distroID)
					esp := root + "/boot/efi"
					writeEFITestFile(t, esp+"/EFI/colibri-1/grubx64.efi", "sibling", 0644)
					if fallback {
						writeEFITestFile(t, esp+"/EFI/BOOT/BOOTX64.EFI", "existing fallback", 0644)
						writeEFITestFile(t, esp+"/EFI/"+distroID+"/grubx64.efi", "existing distribution", 0644)
					}
					before := efiTree(t, esp)
					if out, err := runEFIScript(root, mode, "arch2", script); err != nil {
						t.Fatalf("%v: %s", err, out)
					}
					id := distroID
					if mode == "coexist" {
						id = "arch2"
					}
					args, err := os.ReadFile(root + "/grub-args")
					want := "--target=x86_64-efi --efi-directory=" + esp + " --bootloader-id=" + id + " --recheck\n"
					if err != nil || string(args) != want {
						t.Fatalf("grub-install args = %q, want %q: %v", args, want, err)
					}
					after := efiTree(t, esp)
					if after[esp+"/EFI/"+id+"/grubx64.efi"] != id {
						t.Fatal("GRUB binary not installed in the selected namespace")
					}
					if mode == "coexist" {
						delete(after, esp+"/EFI/arch2")
						delete(after, esp+"/EFI/arch2/grubx64.efi")
						if !reflect.DeepEqual(before, after) {
							t.Fatalf("Coexist changed sibling namespaces or EFI/BOOT: before=%v after=%v", before, after)
						}
					} else if after[esp+"/EFI/BOOT/BOOTX64.EFI"] != distroID || after[esp+"/EFI/colibri-1/grubx64.efi"] != "sibling" {
						t.Fatal("normal Arch fallback or sibling preservation changed")
					}
					args, err = os.ReadFile(root + "/mkconfig-args")
					if err != nil || string(args) != "-o "+root+"/boot/grub/grub.cfg\n" {
						t.Fatalf("native Arch GRUB configuration changed: %q, %v", args, err)
					}
				})
			}
		}
	}
}

func TestArchCoexistRequiresEFIIdentity(t *testing.T) {
	root, script := archEFIFixture(t)
	if out, err := runEFIScript(root, "coexist", "", script); err == nil {
		t.Fatalf("empty Coexist identity accepted: %s", out)
	}
	if _, err := os.Stat(root + "/grub-args"); !os.IsNotExist(err) {
		t.Fatal("GRUB ran without a Coexist identity")
	}
}

func TestManjaroCoexistUsesGRUBDespiteOtherBootloaderConfigs(t *testing.T) {
	for _, config := range []string{"/boot/limine.conf", "/etc/limine-entry-tool.conf", "/boot/loader/loader.conf"} {
		for _, mode := range []string{"coexist", "erase", "replace"} {
			t.Run(config+"/"+mode, func(t *testing.T) {
				root, script := archFamilyEFIFixture(t, "manjaro")
				writeEFITestFile(t, root+config, "existing configuration", 0644)
				out, err := runEFIScript(root, mode, "manjaro-2", script)
				if mode == "coexist" {
					if err != nil {
						t.Fatalf("Coexist did not select GRUB: %v: %s", err, out)
					}
					if _, err := os.Stat(root + "/boot/efi/EFI/manjaro-2/grubx64.efi"); err != nil {
						t.Fatal(err)
					}
				} else {
					// The alternate template stubs exit nonzero. Normal installs
					// must still honor the existing bootloader configuration.
					if err == nil {
						t.Fatal("normal installation no longer selects the existing bootloader")
					}
					if _, err := os.Stat(root + "/grub-args"); !os.IsNotExist(err) {
						t.Fatal("normal installation unexpectedly invoked GRUB")
					}
				}
			})
		}
	}
}

func TestManjaroCoexistCannotFallBackToBIOS(t *testing.T) {
	for _, missing := range []string{"firmware", "mount"} {
		t.Run(missing, func(t *testing.T) {
			root, script := archFamilyEFIFixture(t, "manjaro")
			if missing == "firmware" {
				if err := os.Remove(root + "/firmware"); err != nil {
					t.Fatal(err)
				}
			} else {
				writeEFITestFile(t, root+"/mounts", "", 0644)
			}
			if out, err := runEFIScript(root, "coexist", "manjaro-2", script); err == nil {
				t.Fatalf("missing %s accepted: %s", missing, out)
			}
			if _, err := os.Stat(root + "/grub-args"); !os.IsNotExist(err) {
				t.Fatal("GRUB invoked without UEFI and mounted ESP")
			}
		})
	}
}

func TestArchCoexistStopsOnGRUBFailure(t *testing.T) {
	for _, mode := range []string{"coexist", "erase", "replace"} {
		t.Run(mode, func(t *testing.T) {
			root, script := archEFIFixture(t)
			stub, err := os.ReadFile(root + "/bin/grub-install")
			if err != nil {
				t.Fatal(err)
			}
			// Simulate failed NVRAM registration after writing the EFI binary.
			writeEFITestFile(t, root+"/bin/grub-install", string(stub)+"exit 1\n", 0755)
			out, err := runEFIScript(root, mode, "arch2", script)
			if (err != nil) != (mode == "coexist") {
				t.Fatalf("unexpected GRUB failure handling: %v: %s", err, out)
			}
			if mode == "coexist" {
				for _, path := range []string{"/mkconfig-args", "/boot/efi/EFI/BOOT"} {
					if _, err := os.Stat(root + path); !os.IsNotExist(err) {
						t.Fatalf("continued after GRUB failure: %s", path)
					}
				}
			}
		})
	}
}
