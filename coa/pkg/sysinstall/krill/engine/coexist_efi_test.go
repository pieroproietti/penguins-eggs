package engine

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestFindEFIBinary(t *testing.T) {
	t.Run("shim priority", func(t *testing.T) {
		dir := t.TempDir()
		if err := os.WriteFile(filepath.Join(dir, "grubx64.efi"), []byte("grub"), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dir, "shimx64.efi"), []byte("shim"), 0755); err != nil {
			t.Fatal(err)
		}
		if got := findEFIBinary(dir); got != "shimx64.efi" {
			t.Fatalf("findEFIBinary() = %q, want shimx64.efi", got)
		}
	})

	t.Run("grub fallback", func(t *testing.T) {
		dir := t.TempDir()
		if err := os.WriteFile(filepath.Join(dir, "grubx64.efi"), []byte("grub"), 0755); err != nil {
			t.Fatal(err)
		}
		if got := findEFIBinary(dir); got != "grubx64.efi" {
			t.Fatalf("findEFIBinary() = %q, want grubx64.efi", got)
		}
	})

	t.Run("arbitrary efi fallback", func(t *testing.T) {
		dir := t.TempDir()
		if err := os.WriteFile(filepath.Join(dir, "custom.efi"), []byte("custom"), 0755); err != nil {
			t.Fatal(err)
		}
		if got := findEFIBinary(dir); got != "custom.efi" {
			t.Fatalf("findEFIBinary() = %q, want custom.efi", got)
		}
	})

	t.Run("empty directory", func(t *testing.T) {
		dir := t.TempDir()
		if got := findEFIBinary(dir); got != "" {
			t.Fatalf("findEFIBinary() = %q, want empty", got)
		}
	})
}

func TestRegisterCoexistNVRAMMock(t *testing.T) {
	tempDir := t.TempDir()
	log := filepath.Join(tempDir, "commands")

	// Set up fake bin directory with mock lsblk and efibootmgr
	binDir := filepath.Join(tempDir, "bin")
	if err := os.MkdirAll(binDir, 0755); err != nil {
		t.Fatal(err)
	}

	t.Setenv("KRILL_TEST_COMMANDS", log)
	t.Setenv("PATH", binDir+":"+os.Getenv("PATH"))

	lsblkScript := `#!/bin/sh
if echo "$*" | grep -q "PKNAME,PARTN,PARTUUID"; then
    printf '%s\n' "sdb 1 e8b835a2-1111-2222-3333-123456789abc"
    exit 0
fi
exit 1
`
	efibootmgrScript := `#!/bin/sh
if test "$*" = '--verbose'; then
    printf '%s\n' 'BootCurrent: 0001'
    printf '%s\n' 'BootOrder: 0001,0002'
    printf '%s\n' 'Boot0001* debian	HD(1,GPT,e8b835a2-1111-2222-3333-123456789abc,0x800,0x100000)/File(\EFI\debian\shimx64.efi)'
    printf '%s\n' 'Boot0002* coe-1	HD(1,GPT,e8b835a2-1111-2222-3333-123456789abc,0x800,0x100000)/File(\EFI\coe-1\shimx64.efi)'
    exit 0
fi
printf '%s\n' "$*" >> "$KRILL_TEST_COMMANDS"
exit 0
`
	if err := os.WriteFile(filepath.Join(binDir, "lsblk"), []byte(lsblkScript), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(binDir, "efibootmgr"), []byte(efibootmgrScript), 0755); err != nil {
		t.Fatal(err)
	}

	// Set up fake ESP structure with coe-1, coe-2, coe-3
	espMount := filepath.Join(tempDir, "esp")
	for _, id := range []string{"BOOT", "coe-1", "coe-2", "coe-3"} {
		dir := filepath.Join(espMount, "EFI", id)
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatal(err)
		}
		if id != "BOOT" {
			if err := os.WriteFile(filepath.Join(dir, "shimx64.efi"), []byte("shim"), 0755); err != nil {
				t.Fatal(err)
			}
		}
	}

	// espDevice can be any fake path because lsblk is mocked
	espDevice := "/dev/sdb1"

	err := RegisterCoexistNVRAM(espMount, espDevice, "coe-3")
	if err != nil {
		t.Fatalf("RegisterCoexistNVRAM failed: %v", err)
	}

	data, err := os.ReadFile(log)
	if err != nil {
		t.Fatalf("failed to read commands log: %v", err)
	}
	cmdOutput := string(data)

	// coe-1 is already in NVRAM (Boot0002), so it should NOT be re-added
	// coe-2 is missing from NVRAM, so it MUST be added
	// coe-3 is primaryID, so it MUST be added
	if !strings.Contains(cmdOutput, "-L coe-2") {
		t.Fatalf("expected coe-2 to be registered, commands log:\n%s", cmdOutput)
	}
	if !strings.Contains(cmdOutput, "-L coe-3") {
		t.Fatalf("expected coe-3 to be registered, commands log:\n%s", cmdOutput)
	}
	if strings.Contains(cmdOutput, "-L BOOT") {
		t.Fatalf("BOOT directory should not be registered as a Coexist entry, commands log:\n%s", cmdOutput)
	}
}
