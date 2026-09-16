package setup

import (
	"strings"
	"testing"
)

func TestFindSquashfsPathFallback(t *testing.T) {
	path := FindSquashfsPath()
	// On a test runner without live mount and without /home/eggs squashfs,
	// it should return the English error path constant.
	if !strings.HasSuffix(path, "filesystem.squashfs") && !strings.HasSuffix(path, "livefs.sfs") && !strings.HasSuffix(path, "rootfs.sfs") && !strings.HasSuffix(path, "airootfs.sfs") && !strings.HasSuffix(path, "squashfs.img") {
		t.Fatalf("unexpected path: %s", path)
	}
}

func TestBuildInstallerMissingSquashfsError(t *testing.T) {
	// If FindSquashfsPath returns ErrorSquashfsNotFound, BuildInstaller must fail with the informative message
	if FindSquashfsPath() == ErrorSquashfsNotFound {
		err := BuildInstaller("1.0.0")
		if err == nil {
			t.Fatal("expected BuildInstaller to fail when squashfs is missing")
		}
		if !strings.Contains(err.Error(), ErrorSquashfsNotFound) {
			t.Fatalf("error message %q should contain %q", err.Error(), ErrorSquashfsNotFound)
		}
		if !strings.Contains(err.Error(), "eggs remaster") {
			t.Fatalf("error message %q should advise running 'eggs remaster'", err.Error())
		}
	}
}
