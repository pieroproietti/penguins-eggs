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

// Execute the Arch GRUB template in a temporary tree. GRUB and uname are
// stubbed; filesystem writes and the fallback copy execute normally.
func archEFIFixture(t *testing.T) (root, script string) {
	t.Helper()
	root = t.TempDir()
	tmpl, err := template.ParseFiles("../../../../brain.d/modules/arch-family/install/grub.bash.tmpl")
	if err != nil {
		t.Fatal(err)
	}
	var rendered bytes.Buffer
	if err := tmpl.ExecuteTemplate(&rendered, "install_distro_grub", parser.TemplateContext{DistroID: "arch"}); err != nil {
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

func TestArchEFITemplateModes(t *testing.T) {
	for _, mode := range []string{"coexist", "erase", "replace"} {
		for _, fallback := range []bool{false, true} {
			t.Run(mode+"/fallback="+map[bool]string{false: "absent", true: "present"}[fallback], func(t *testing.T) {
				root, script := archEFIFixture(t)
				esp := root + "/boot/efi"
				writeEFITestFile(t, esp+"/EFI/colibri-1/grubx64.efi", "sibling", 0644)
				if fallback {
					writeEFITestFile(t, esp+"/EFI/BOOT/BOOTX64.EFI", "existing fallback", 0644)
					writeEFITestFile(t, esp+"/EFI/arch/grubx64.efi", "existing Arch", 0644)
				}
				before := efiTree(t, esp)
				if out, err := runEFIScript(root, mode, "arch2", script); err != nil {
					t.Fatalf("%v: %s", err, out)
				}
				id := "arch"
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
				} else if after[esp+"/EFI/BOOT/BOOTX64.EFI"] != "arch" || after[esp+"/EFI/colibri-1/grubx64.efi"] != "sibling" {
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

func TestArchCoexistRequiresEFIIdentity(t *testing.T) {
	root, script := archEFIFixture(t)
	if out, err := runEFIScript(root, "coexist", "", script); err == nil {
		t.Fatalf("empty Coexist identity accepted: %s", out)
	}
	if _, err := os.Stat(root + "/grub-args"); !os.IsNotExist(err) {
		t.Fatal("GRUB ran without a Coexist identity")
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
