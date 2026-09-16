package engine

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"text/template"

	"coa/pkg/parser"
)

func fedoraEFIFixture(t *testing.T, distroID string) (root, script string) {
	t.Helper()
	root = t.TempDir()
	tmpl, err := template.ParseFiles("../../../../brain.d/modules/fedora/install.bash.tmpl")
	if err != nil {
		t.Fatal(err)
	}
	var rendered bytes.Buffer
	if err := tmpl.ExecuteTemplate(&rendered, "install_distro_bootloader", parser.TemplateContext{DistroID: distroID}); err != nil {
		t.Fatal(err)
	}
	script = "set -e\n" + strings.NewReplacer(
		"/.autorelabel", root+"/.autorelabel",
		"/boot/efi", root+"/esp",
		"/boot/grub2", root+"/boot/grub2",
		"/etc/default", root+"/defaults",
		"/sys/firmware/efi", root+"/firmware",
		"/usr/local/bin", root+"/bin",
		"/etc/systemd/system", root+"/systemd",
	).Replace(rendered.String())

	for _, dir := range []string{"esp", "firmware", "bin", "defaults", "boot/grub2", "systemd"} {
		if err := os.MkdirAll(filepath.Join(root, dir), 0755); err != nil {
			t.Fatal(err)
		}
	}
	writeEFITestFile(t, root+"/defaults/grub", "GRUB_DISTRIBUTOR=Fedora\nGRUB_TIMEOUT=5\n", 0644)
	writeEFITestFile(t, root+"/bin/uname", "#!/bin/sh\necho x86_64\n", 0755)
	writeEFITestFile(t, root+"/bin/systemctl", "#!/bin/sh\nexit 0\n", 0755)
	writeEFITestFile(t, root+"/bin/wall", "#!/bin/sh\nexit 0\n", 0755)
	writeEFITestFile(t, root+"/bin/grub2-mkconfig", "#!/bin/sh\nprintf '%s\\n' \"$*\" >> "+shellQuote(root+"/mkconfig-args")+"\n", 0755)
	writeEFITestFile(t, root+"/bin/grub2-install", `#!/bin/sh
set -e
printf '%s\n' "$*" >> `+shellQuote(root+"/grub-args")+`
id=
esp=
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

	return root, "exec /bin/bash -c " + shellQuote("set -e\n"+script)
}

func TestFedoraEFITemplateModes(t *testing.T) {
	distroID := "fedora"
	for _, mode := range []string{"coexist", "erase", "replace"} {
		for _, fallback := range []bool{false, true} {
			t.Run(mode+"/fallback="+map[bool]string{false: "absent", true: "present"}[fallback], func(t *testing.T) {
				root, script := fedoraEFIFixture(t, distroID)
				esp := root + "/esp"
				writeEFITestFile(t, esp+"/EFI/colibri-1/grubx64.efi", "sibling", 0644)
				if fallback {
					writeEFITestFile(t, esp+"/EFI/BOOT/BOOTX64.EFI", "existing fallback", 0644)
				}
				if out, err := runEFIScript(root, mode, "fedora2", script); err != nil {
					t.Fatalf("%v: %s", err, out)
				}
				id := distroID
				if mode == "coexist" {
					id = "fedora2"
				}
				args, err := os.ReadFile(root + "/grub-args")
				if err != nil {
					t.Fatal(err)
				}
				want := "--target=x86_64-efi --efi-directory=" + esp + " --bootloader-id=" + id + " --recheck"
				if mode != "coexist" {
					want += " --force"
				}
				want += "\n"
				if string(args) != want {
					t.Fatalf("grub2-install args = %q, want %q", string(args), want)
				}
				after := efiTree(t, esp)
				if mode == "coexist" {
					if fallback && after[esp+"/EFI/BOOT/BOOTX64.EFI"] != "existing fallback" {
						t.Fatal("Coexist modified pre-existing EFI/BOOT")
					}
					if !fallback && after[esp+"/EFI/BOOT/BOOTX64.EFI"] != "" {
						t.Fatal("Coexist created EFI/BOOT fallback")
					}
					if after[esp+"/EFI/colibri-1/grubx64.efi"] != "sibling" {
						t.Fatal("Coexist corrupted sibling installation")
					}
					if after[esp+"/EFI/fedora2/grubx64.efi"] != "fedora2" {
						t.Fatal("Coexist did not write expected isolated binary")
					}
				} else {
					if after[esp+"/EFI/BOOT/BOOTX64.EFI"] != "fedora" {
						t.Fatal("Standard install did not set EFI fallback")
					}
				}

				// Check cleanup script
				cleanupScript, err := os.ReadFile(root + "/bin/krill-selinux-cleanup.sh")
				if err != nil {
					t.Fatal(err)
				}
				if !strings.Contains(string(cleanupScript), `EFI_ID="`+id+`"`) {
					t.Fatalf("Cleanup script does not contain expected EFI_ID %q: %s", id, string(cleanupScript))
				}
			})
		}
	}
}
