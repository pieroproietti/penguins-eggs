package init_test

import (
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
