package setup

import (
	"os"
	"path/filepath"
	"testing"
)

func TestRenderAndSaveFile(t *testing.T) {
	dir := t.TempDir()
	templatePath := filepath.Join(dir, "message.tmpl")
	outputPath := filepath.Join(dir, "message")

	if err := os.WriteFile(templatePath, []byte("hello {{ .Name }}\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := renderAndSaveFile(templatePath, outputPath, struct{ Name string }{Name: "eggs"}, 0644); err != nil {
		t.Fatal(err)
	}

	content, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatal(err)
	}
	if got, want := string(content), "hello eggs\n"; got != want {
		t.Fatalf("rendered content = %q, want %q", got, want)
	}
}
