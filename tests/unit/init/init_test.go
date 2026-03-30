package init_test

import (
	"os"
	"testing"

	ilfinit "github.com/ilf/core/init"
)

func TestLayoutForBackend_ABRoot(t *testing.T) {
	parts, err := ilfinit.LayoutForBackend("abroot", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	labels := partLabels(parts)
	for _, want := range []string{"ilf-efi", "vos-boot", "vos-a", "vos-b", "vos-var"} {
		if !contains(labels, want) {
			t.Errorf("abroot layout missing partition %q; got %v", want, labels)
		}
	}
}

func TestLayoutForBackend_Ashos(t *testing.T) {
	parts, err := ilfinit.LayoutForBackend("ashos", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	labels := partLabels(parts)
	for _, want := range []string{"ilf-efi", "ilf-boot", "ilf-root"} {
		if !contains(labels, want) {
			t.Errorf("ashos layout missing partition %q; got %v", want, labels)
		}
	}
	// ilf-root must be BTRFS
	for _, p := range parts {
		if p.Label == "ilf-root" && p.FSType != "btrfs" {
			t.Errorf("ashos ilf-root fstype: got %q, want btrfs", p.FSType)
		}
	}
}

func TestLayoutForBackend_NixOS(t *testing.T) {
	parts, err := ilfinit.LayoutForBackend("nixos", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	labels := partLabels(parts)
	for _, want := range []string{"ilf-efi", "nixos-boot", "nixos-root"} {
		if !contains(labels, want) {
			t.Errorf("nixos layout missing partition %q; got %v", want, labels)
		}
	}
	// nixos-root must be ext4
	for _, p := range parts {
		if p.Label == "nixos-root" && p.FSType != "ext4" {
			t.Errorf("nixos nixos-root fstype: got %q, want ext4", p.FSType)
		}
	}
}

func TestLayoutForBackend_BIOSBoot(t *testing.T) {
	// Without EFI, first partition should be a BIOS boot partition.
	parts, err := ilfinit.LayoutForBackend("ashos", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(parts) == 0 {
		t.Fatal("expected at least one partition")
	}
	if parts[0].FSType != "biosboot" {
		t.Errorf("first partition without EFI: got fstype %q, want biosboot", parts[0].FSType)
	}
}

func TestLayoutForBackend_AllBTRFSBackends(t *testing.T) {
	for _, backend := range []string{"ashos", "frzr", "akshara", "btrfs-dwarfs"} {
		parts, err := ilfinit.LayoutForBackend(backend, true)
		if err != nil {
			t.Errorf("%s: unexpected error: %v", backend, err)
			continue
		}
		hasBTRFS := false
		for _, p := range parts {
			if p.FSType == "btrfs" {
				hasBTRFS = true
				break
			}
		}
		if !hasBTRFS {
			t.Errorf("%s: expected at least one btrfs partition", backend)
		}
	}
}

func TestLayoutForBackend_Unknown(t *testing.T) {
	_, err := ilfinit.LayoutForBackend("does-not-exist", true)
	if err == nil {
		t.Fatal("expected error for unknown backend, got nil")
	}
}

func TestPartDevNVMe(t *testing.T) {
	got := ilfinit.PartDev("/dev/nvme0n1", 1)
	want := "/dev/nvme0n1p1"
	if got != want {
		t.Errorf("PartDev nvme: got %q, want %q", got, want)
	}
}

func TestPartDevSATA(t *testing.T) {
	got := ilfinit.PartDev("/dev/sda", 2)
	want := "/dev/sda2"
	if got != want {
		t.Errorf("PartDev sata: got %q, want %q", got, want)
	}
}

func TestResolvePassphrase_File(t *testing.T) {
	dir := t.TempDir()
	f := dir + "/passphrase"
	if err := os.WriteFile(f, []byte("s3cr3t\n"), 0o400); err != nil {
		t.Fatalf("write: %v", err)
	}
	got, err := ilfinit.ResolvePassphrase(f)
	if err != nil {
		t.Fatalf("ResolvePassphrase: %v", err)
	}
	if got != "s3cr3t" {
		t.Errorf("got %q, want %q", got, "s3cr3t")
	}
}

func TestResolvePassphrase_FileStripsNewline(t *testing.T) {
	dir := t.TempDir()
	f := dir + "/passphrase"
	if err := os.WriteFile(f, []byte("hunter2\r\n"), 0o400); err != nil {
		t.Fatalf("write: %v", err)
	}
	got, err := ilfinit.ResolvePassphrase(f)
	if err != nil {
		t.Fatalf("ResolvePassphrase: %v", err)
	}
	if got != "hunter2" {
		t.Errorf("got %q, want %q", got, "hunter2")
	}
}

func TestResolvePassphrase_EnvVar(t *testing.T) {
	t.Setenv(ilfinit.LUKSPassphraseEnvVar, "envpassword")
	got, err := ilfinit.ResolvePassphrase("")
	if err != nil {
		t.Fatalf("ResolvePassphrase: %v", err)
	}
	if got != "envpassword" {
		t.Errorf("got %q, want %q", got, "envpassword")
	}
}

func TestResolvePassphrase_FileBeatsEnv(t *testing.T) {
	t.Setenv(ilfinit.LUKSPassphraseEnvVar, "envpassword")
	dir := t.TempDir()
	f := dir + "/passphrase"
	if err := os.WriteFile(f, []byte("filepassword"), 0o400); err != nil {
		t.Fatalf("write: %v", err)
	}
	got, err := ilfinit.ResolvePassphrase(f)
	if err != nil {
		t.Fatalf("ResolvePassphrase: %v", err)
	}
	if got != "filepassword" {
		t.Errorf("file should beat env: got %q, want %q", got, "filepassword")
	}
}

func TestResolvePassphrase_EmptyFallback(t *testing.T) {
	// No file, no env var — should return empty string (interactive prompt).
	t.Setenv(ilfinit.LUKSPassphraseEnvVar, "")
	got, err := ilfinit.ResolvePassphrase("")
	if err != nil {
		t.Fatalf("ResolvePassphrase: %v", err)
	}
	if got != "" {
		t.Errorf("expected empty passphrase for interactive fallback, got %q", got)
	}
}

func TestResolvePassphrase_MissingFile(t *testing.T) {
	_, err := ilfinit.ResolvePassphrase("/nonexistent/path/passphrase")
	if err == nil {
		t.Fatal("expected error for missing passphrase file, got nil")
	}
}

func TestRootPartition_BTRFS(t *testing.T) {
	parts, err := ilfinit.LayoutForBackend("ashos", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	got := ilfinit.RootPartition("/dev/sda", parts)
	if got != "/dev/sda3" {
		t.Errorf("RootPartition ashos/sda: got %q, want /dev/sda3", got)
	}
}

func TestRootPartition_NVMe(t *testing.T) {
	parts, err := ilfinit.LayoutForBackend("nixos", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	got := ilfinit.RootPartition("/dev/nvme0n1", parts)
	if got != "/dev/nvme0n1p3" {
		t.Errorf("RootPartition nixos/nvme: got %q, want /dev/nvme0n1p3", got)
	}
}

func TestRootPartition_ABRoot(t *testing.T) {
	// ABRoot has no single "/" mount — vos-a is the active root.
	parts, err := ilfinit.LayoutForBackend("abroot", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	got := ilfinit.RootPartition("/dev/sda", parts)
	// vos-a is partition 3 and has Mount "/"
	if got != "/dev/sda3" {
		t.Errorf("RootPartition abroot/sda: got %q, want /dev/sda3", got)
	}
}

func TestLUKSStatus_NotOpen(t *testing.T) {
	// /dev/mapper/ilf-root should not exist in a test environment.
	if ilfinit.LUKSStatus() {
		t.Skip("LUKS mapper device unexpectedly present; skipping")
	}
}

// helpers

func partLabels(parts []ilfinit.Partition) []string {
	out := make([]string, len(parts))
	for i, p := range parts {
		out[i] = p.Label
	}
	return out
}

func contains(ss []string, s string) bool {
	for _, v := range ss {
		if v == s {
			return true
		}
	}
	return false
}
