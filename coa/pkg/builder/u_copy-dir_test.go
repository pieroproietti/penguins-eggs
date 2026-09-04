package builder

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCopyDirNormalizesPackagePermissions(t *testing.T) {
	src := filepath.Join(t.TempDir(), "src")
	dst := filepath.Join(t.TempDir(), "dst")

	if err := os.MkdirAll(filepath.Join(src, "bin"), 0775); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(src, "config.yaml"), []byte("key: value\n"), 0664); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(src, "bin", "runner"), []byte("#!/bin/sh\n"), 0775); err != nil {
		t.Fatal(err)
	}

	if err := copyDir(src, dst); err != nil {
		t.Fatal(err)
	}

	assertMode(t, dst, 0755)
	assertMode(t, filepath.Join(dst, "bin"), 0755)
	assertMode(t, filepath.Join(dst, "config.yaml"), 0644)
	assertMode(t, filepath.Join(dst, "bin", "runner"), 0755)
}

func assertMode(t *testing.T, path string, want os.FileMode) {
	t.Helper()
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if got := info.Mode().Perm(); got != want {
		t.Fatalf("%s mode = %04o, want %04o", path, got, want)
	}
}
