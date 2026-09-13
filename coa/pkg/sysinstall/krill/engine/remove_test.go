package engine

import (
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func TestParseEFIBootEntries(t *testing.T) {
	efibootmgrOutput := `BootCurrent: 0001
Timeout: 0 seconds
BootOrder: 0001,0002,0003,0004
Boot0001* debian	HD(1,GPT,e8b835a2-1111-2222-3333-123456789abc,0x800,0x100000)/File(\EFI\debian\grubx64.efi)
Boot0002* arch	HD(1,GPT,e8b835a2-1111-2222-3333-123456789abc,0x800,0x100000)/File(\EFI\arch\grubx64.efi)
Boot0003* Arch Linux	HD(1,GPT,e8b835a2-1111-2222-3333-123456789abc,0x800,0x100000)/File(\EFI\arch\grubx64.efi)
Boot0004* Windows Boot Manager	HD(1,GPT,e8b835a2-1111-2222-3333-123456789abc,0x800,0x100000)/File(\EFI\Microsoft\Boot\bootmgfw.efi)
Boot0005* arch backup	HD(1,GPT,other,0x800,0x100000)/File(\EFI\arch-backup\grubx64.efi)
Boot0006* arch rescue
Boot0007* arch	HD(1,GPT,aaaaaaaa-1111-2222-3333-123456789abc,0x800,0x100000)/File(\EFI\arch\grubx64.efi)
Boot0008* arch
`
	got := ParseEFIBootEntries(efibootmgrOutput, "arch", "e8b835a2-1111-2222-3333-123456789abc")
	want := []string{"0002", "0003"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("ParseEFIBootEntries() = %v, want %v", got, want)
	}

	gotDebian := ParseEFIBootEntries(efibootmgrOutput, "debian", "e8b835a2-1111-2222-3333-123456789abc")
	wantDebian := []string{"0001"}
	if !reflect.DeepEqual(gotDebian, wantDebian) {
		t.Fatalf("ParseEFIBootEntries() for debian = %v, want %v", gotDebian, wantDebian)
	}

	gotNone := ParseEFIBootEntries(efibootmgrOutput, "fedora", "e8b835a2-1111-2222-3333-123456789abc")
	if len(gotNone) != 0 {
		t.Fatalf("ParseEFIBootEntries() for fedora = %v, want empty", gotNone)
	}
	for _, uuid := range []string{"", "invalid", "e8b835a2"} {
		if got := ParseEFIBootEntries(efibootmgrOutput, "arch", uuid); len(got) != 0 {
			t.Fatalf("invalid PARTUUID %q selected entries: %v", uuid, got)
		}
	}
	if got := ParseEFIBootEntries(efibootmgrOutput, "ARCH", "E8B835A2-1111-2222-3333-123456789ABC"); !reflect.DeepEqual(got, want) {
		t.Fatalf("case-insensitive match = %v, want %v", got, want)
	}
}

func TestCleanCoexistNVRAMScopesDeletionToESP(t *testing.T) {
	for _, uuid := range []string{"e8b835a2-1111-2222-3333-123456789abc", "invalid"} {
		t.Run(uuid, func(t *testing.T) {
			dir := t.TempDir()
			log := filepath.Join(dir, "commands")
			t.Setenv("KRILL_TEST_COMMANDS", log)
			t.Setenv("KRILL_TEST_PARTUUID", uuid)
			t.Setenv("PATH", dir+":"+os.Getenv("PATH"))
			for name, script := range map[string]string{
				"lsblk": `#!/bin/sh
test "$*" = '-dnro PARTUUID /dev/test1' || exit 1
printf '%s\n' "$KRILL_TEST_PARTUUID"
`,
				"efibootmgr": `#!/bin/sh
if test "$*" = '--verbose'; then
    printf '%s\n' 'Boot0001* arch	HD(1,GPT,e8b835a2-1111-2222-3333-123456789abc,0x800,0x100000)/File(\EFI\arch\grubx64.efi)' 'Boot0002* arch	HD(1,GPT,aaaaaaaa-1111-2222-3333-123456789abc,0x800,0x100000)/File(\EFI\arch\grubx64.efi)' 'Boot0003* arch'
else
    printf '%s\n' "$*" >> "$KRILL_TEST_COMMANDS"
fi
`,
			} {
				if err := os.WriteFile(filepath.Join(dir, name), []byte(script), 0755); err != nil {
					t.Fatal(err)
				}
			}
			err := CleanCoexistNVRAM("/dev/test1", "arch")
			data, readErr := os.ReadFile(log)
			if uuid == "invalid" {
				if err == nil || !os.IsNotExist(readErr) {
					t.Fatalf("invalid ESP identity: err=%v, log error=%v", err, readErr)
				}
			} else if err != nil || readErr != nil || strings.TrimSpace(string(data)) != "-b 0001 -B" {
				t.Fatalf("cleanup err=%v, log error=%v, deleted=%q", err, readErr, data)
			}
		})
	}
}

func TestSlotLabelForPartition(t *testing.T) {
	cases := []struct {
		device string
		want   string
	}{
		{"/dev/sda2", "root1"},
		{"/dev/sda3", "root2"},
		{"/dev/sda10", "root9"},
		{"/dev/nvme0n1p2", "root1"},
		{"/dev/nvme0n1p5", "root4"},
		{"/dev/sda1", "root"},
		{"/dev/sda", "root"},
	}
	for _, tc := range cases {
		if got := SlotLabelForPartition(tc.device); got != tc.want {
			t.Errorf("SlotLabelForPartition(%q) = %q, want %q", tc.device, got, tc.want)
		}
	}
}

func TestIsGenericRootLabel(t *testing.T) {
	if !IsGenericRootLabel("root") || !IsGenericRootLabel("root1") || !IsGenericRootLabel("root42") {
		t.Error("expected generic root labels to match")
	}
	if IsGenericRootLabel("arch") || IsGenericRootLabel("debian") || IsGenericRootLabel("SHARED_HOMES") {
		t.Error("did not expect distro or system labels to match generic root")
	}
}

func TestCleanCoexistESPMount(t *testing.T) {
	esp := t.TempDir()
	efi := filepath.Join(esp, "EFI")
	os.MkdirAll(filepath.Join(efi, "arch"), 0755)
	os.WriteFile(filepath.Join(efi, "arch", "grubx64.efi"), []byte("stub"), 0644)
	os.MkdirAll(filepath.Join(efi, "BOOT"), 0755)
	os.WriteFile(filepath.Join(efi, "BOOT", "BOOTX64.EFI"), []byte("bootstub"), 0644)
	os.MkdirAll(filepath.Join(efi, "debian"), 0755)
	os.WriteFile(filepath.Join(efi, "debian", "grubx64.efi"), []byte("debstub"), 0644)

	// Try removing reserved ID (should error)
	if err := CleanCoexistESPMount(esp, "boot"); err == nil {
		t.Error("expected error removing reserved ID boot")
	}

	// Remove arch
	if err := CleanCoexistESPMount(esp, "arch"); err != nil {
		t.Fatalf("CleanCoexistESPMount failed: %v", err)
	}

	// Verify arch is gone, BOOT and debian remain
	if _, err := os.Stat(filepath.Join(efi, "arch")); !os.IsNotExist(err) {
		t.Error("arch was not removed")
	}
	if _, err := os.Stat(filepath.Join(efi, "BOOT", "BOOTX64.EFI")); err != nil {
		t.Error("BOOT was modified or deleted")
	}
	if _, err := os.Stat(filepath.Join(efi, "debian", "grubx64.efi")); err != nil {
		t.Error("debian sibling was modified or deleted")
	}
}

func TestCleanCoexistHomeMount(t *testing.T) {
	home := t.TempDir()
	os.MkdirAll(filepath.Join(home, "arch", "user"), 0755)
	os.WriteFile(filepath.Join(home, "arch", "user", "file.txt"), []byte("data"), 0644)
	os.MkdirAll(filepath.Join(home, "common"), 0755)
	os.WriteFile(filepath.Join(home, "common", "shared.txt"), []byte("shared"), 0644)
	os.MkdirAll(filepath.Join(home, "debian", "user"), 0755)

	// Try removing reserved namespace common (should error)
	if err := CleanCoexistHomeMount(home, "common"); err == nil {
		t.Error("expected error removing common")
	}

	// Remove arch
	if err := CleanCoexistHomeMount(home, "arch"); err != nil {
		t.Fatalf("CleanCoexistHomeMount failed: %v", err)
	}

	// Verify arch is gone, common and debian remain
	if _, err := os.Stat(filepath.Join(home, "arch")); !os.IsNotExist(err) {
		t.Error("arch home was not removed")
	}
	if _, err := os.Stat(filepath.Join(home, "common", "shared.txt")); err != nil {
		t.Error("common namespace was modified or deleted")
	}
	if _, err := os.Stat(filepath.Join(home, "debian")); err != nil {
		t.Error("debian sibling home was modified or deleted")
	}
}
