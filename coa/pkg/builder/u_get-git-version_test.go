package builder

import (
	"os"
	"os/exec"
	"regexp"
	"testing"
)

// digitLeading matches the version-field rule dpkg and abuild both enforce:
// the version must start with a digit.
var digitLeading = regexp.MustCompile(`^[0-9]`)

func runGit(t *testing.T, dir string, args ...string) {
	t.Helper()
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("git %v: %v\n%s", args, err, out)
	}
}

func TestGetGitVersion_NoTags(t *testing.T) {
	dir := t.TempDir()
	runGit(t, dir, "init")
	runGit(t, dir, "config", "user.email", "test@example.com")
	runGit(t, dir, "config", "user.name", "test")
	if err := os.WriteFile(dir+"/f.txt", []byte("x"), 0644); err != nil {
		t.Fatal(err)
	}
	runGit(t, dir, "add", "f.txt")
	runGit(t, dir, "commit", "-m", "init")

	wd, _ := os.Getwd()
	defer os.Chdir(wd)
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}

	baseVer, relNum := getGitVersion()

	if !digitLeading.MatchString(baseVer) {
		t.Errorf("baseVer %q does not start with a digit (dpkg/abuild will reject it)", baseVer)
	}
	if !digitLeading.MatchString(relNum) {
		t.Errorf("relNum %q does not start with a digit", relNum)
	}
	if baseVer != "0.0.0" {
		t.Errorf("baseVer = %q, want 0.0.0", baseVer)
	}
	if relNum != "1" {
		t.Errorf("relNum = %q, want 1 (single commit in fixture repo)", relNum)
	}
}

func TestGetGitVersion_WithTag(t *testing.T) {
	dir := t.TempDir()
	runGit(t, dir, "init")
	runGit(t, dir, "config", "user.email", "test@example.com")
	runGit(t, dir, "config", "user.name", "test")
	if err := os.WriteFile(dir+"/f.txt", []byte("x"), 0644); err != nil {
		t.Fatal(err)
	}
	runGit(t, dir, "add", "f.txt")
	runGit(t, dir, "commit", "-m", "init")
	runGit(t, dir, "tag", "v1.2.3")
	if err := os.WriteFile(dir+"/g.txt", []byte("y"), 0644); err != nil {
		t.Fatal(err)
	}
	runGit(t, dir, "add", "g.txt")
	runGit(t, dir, "commit", "-m", "second")

	wd, _ := os.Getwd()
	defer os.Chdir(wd)
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}

	baseVer, relNum := getGitVersion()

	if baseVer != "1.2.3" {
		t.Errorf("baseVer = %q, want 1.2.3", baseVer)
	}
	if relNum != "1" {
		t.Errorf("relNum = %q, want 1 (one commit past the tag)", relNum)
	}
}
