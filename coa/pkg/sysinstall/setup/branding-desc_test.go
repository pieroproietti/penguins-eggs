package setup

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func setupBrandingTest(t *testing.T) (root, defaultDir, vendorDir string) {
	t.Helper()
	root = t.TempDir()

	oldInstallerDRoot := InstallerDRoot
	oldDefaultBranding := defaultCalamaresBranding
	oldVendorBranding := vendorCalamaresBranding

	InstallerDRoot = filepath.Join(root, "installer.d")
	defaultDir = filepath.Join(root, "branding.default", "calamares", "branding")
	vendorDir = filepath.Join(root, "branding", "calamares", "branding")

	defaultCalamaresBranding = defaultDir
	vendorCalamaresBranding = vendorDir

	t.Cleanup(func() {
		InstallerDRoot = oldInstallerDRoot
		defaultCalamaresBranding = oldDefaultBranding
		vendorCalamaresBranding = oldVendorBranding
	})

	if err := os.MkdirAll(defaultDir, 0755); err != nil {
		t.Fatal(err)
	}
	defaultTmpl := `---
componentName: eggs
slideshow: "show.qml"
slideshowAPI: 1
strings:
  productName: "{{ .ProductName }}"
  version: "{{ .Version }}"
`
	if err := os.WriteFile(filepath.Join(defaultDir, "branding.desc.tmpl"), []byte(defaultTmpl), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(defaultDir, "logo.png"), []byte("default-logo"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(defaultDir, "show.qml"), []byte("default-qml"), 0644); err != nil {
		t.Fatal(err)
	}

	return root, defaultDir, vendorDir
}

func TestBrandingDescDefault(t *testing.T) {
	root, _, _ := setupBrandingTest(t)

	if err := brandingDesc("9.9.9"); err != nil {
		t.Fatalf("brandingDesc failed: %v", err)
	}

	descPath := filepath.Join(root, "installer.d", "branding", "eggs", "branding.desc")
	data, err := os.ReadFile(descPath)
	if err != nil {
		t.Fatalf("failed to read branding.desc: %v", err)
	}

	content := string(data)
	if !strings.Contains(content, "penguins-eggs 9.9.9") {
		t.Fatalf("expected version in branding.desc, got: %s", content)
	}
	if !strings.Contains(content, "slideshowAPI: 1") {
		t.Fatalf("expected slideshowAPI: 1, got: %s", content)
	}

	// Verify template file was cleaned up
	tmplPath := filepath.Join(root, "installer.d", "branding", "eggs", "branding.desc.tmpl")
	if _, err := os.Stat(tmplPath); !os.IsNotExist(err) {
		t.Fatalf("branding.desc.tmpl should have been removed, got err: %v", err)
	}
}

func TestBrandingDescVendorTemplateOverride(t *testing.T) {
	root, _, vendorDir := setupBrandingTest(t)

	if err := os.MkdirAll(vendorDir, 0755); err != nil {
		t.Fatal(err)
	}

	customTmpl := `---
componentName: mydistro
slideshow: "custom-show.qml"
slideshowAPI: 2
strings:
  productName: "My Custom Distro"
  version: "{{ .Version }}"
style:
  SidebarBackground: "#112233"
`
	if err := os.WriteFile(filepath.Join(vendorDir, "branding.desc.tmpl"), []byte(customTmpl), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(vendorDir, "logo.png"), []byte("custom-logo"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(vendorDir, "custom-show.qml"), []byte("custom-qml-content"), 0644); err != nil {
		t.Fatal(err)
	}

	if err := brandingDesc("9.9.9"); err != nil {
		t.Fatalf("brandingDesc failed: %v", err)
	}

	descPath := filepath.Join(root, "installer.d", "branding", "eggs", "branding.desc")
	data, err := os.ReadFile(descPath)
	if err != nil {
		t.Fatalf("failed to read branding.desc: %v", err)
	}

	content := string(data)
	if !strings.Contains(content, "My Custom Distro") {
		t.Fatalf("expected custom productName in branding.desc, got: %s", content)
	}
	if !strings.Contains(content, "slideshowAPI: 2") {
		t.Fatalf("expected custom slideshowAPI: 2 in branding.desc, got: %s", content)
	}
	if !strings.Contains(content, "SidebarBackground: \"#112233\"") {
		t.Fatalf("expected custom style in branding.desc, got: %s", content)
	}
	if !strings.Contains(content, "penguins-eggs 9.9.9") {
		t.Fatalf("expected template variable .Version expanded, got: %s", content)
	}

	// Verify custom assets were copied
	logoData, err := os.ReadFile(filepath.Join(root, "installer.d", "branding", "eggs", "logo.png"))
	if err != nil || string(logoData) != "custom-logo" {
		t.Fatalf("expected custom logo, got: %s, err: %v", string(logoData), err)
	}

	qmlData, err := os.ReadFile(filepath.Join(root, "installer.d", "branding", "eggs", "custom-show.qml"))
	if err != nil || string(qmlData) != "custom-qml-content" {
		t.Fatalf("expected custom qml, got: %s, err: %v", string(qmlData), err)
	}

	// Verify template file was cleaned up from target directory
	tmplPath := filepath.Join(root, "installer.d", "branding", "eggs", "branding.desc.tmpl")
	if _, err := os.Stat(tmplPath); !os.IsNotExist(err) {
		t.Fatalf("branding.desc.tmpl should have been removed, got err: %v", err)
	}
}

func TestBrandingDescVendorStaticOverride(t *testing.T) {
	root, _, vendorDir := setupBrandingTest(t)

	if err := os.MkdirAll(vendorDir, 0755); err != nil {
		t.Fatal(err)
	}

	staticDesc := `---
componentName: static-distro
slideshow: "none"
strings:
  productName: "Static Distro"
`
	if err := os.WriteFile(filepath.Join(vendorDir, "branding.desc"), []byte(staticDesc), 0644); err != nil {
		t.Fatal(err)
	}

	if err := brandingDesc("9.9.9"); err != nil {
		t.Fatalf("brandingDesc failed: %v", err)
	}

	descPath := filepath.Join(root, "installer.d", "branding", "eggs", "branding.desc")
	data, err := os.ReadFile(descPath)
	if err != nil {
		t.Fatalf("failed to read branding.desc: %v", err)
	}

	if string(data) != staticDesc {
		t.Fatalf("expected static branding.desc, got: %s", string(data))
	}
}

func TestBrandingDescVendorAltDirFallback(t *testing.T) {
	root, _, _ := setupBrandingTest(t)

	// Set vendorCalamaresBranding to a non-existent path
	vendorCalamaresBranding = filepath.Join(root, "non-existent")

	// Create alt directory structure matching /etc/penguins-eggs.d/branding/calamares
	// but using temp directory
	altOld := vendorCalamaresBranding
	altDir := filepath.Join(root, "alt-branding")
	if err := os.MkdirAll(altDir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(altDir, "branding.desc.tmpl"), []byte("productName: AltDistro\n"), 0644); err != nil {
		t.Fatal(err)
	}

	vendorCalamaresBranding = altDir
	t.Cleanup(func() { vendorCalamaresBranding = altOld })

	if err := brandingDesc("9.9.9"); err != nil {
		t.Fatalf("brandingDesc failed: %v", err)
	}

	descPath := filepath.Join(root, "installer.d", "branding", "eggs", "branding.desc")
	data, err := os.ReadFile(descPath)
	if err != nil {
		t.Fatalf("failed to read branding.desc: %v", err)
	}

	if !strings.Contains(string(data), "productName: AltDistro") {
		t.Fatalf("expected AltDistro in branding.desc, got: %s", string(data))
	}
}

func TestBrandingDescEmbeddedFallback(t *testing.T) {
	root := t.TempDir()

	oldInstallerDRoot := InstallerDRoot
	oldDefaultBranding := defaultCalamaresBranding
	oldVendorBranding := vendorCalamaresBranding

	InstallerDRoot = filepath.Join(root, "installer.d")
	defaultCalamaresBranding = filepath.Join(root, "missing-default")
	vendorCalamaresBranding = filepath.Join(root, "missing-vendor")

	t.Cleanup(func() {
		InstallerDRoot = oldInstallerDRoot
		defaultCalamaresBranding = oldDefaultBranding
		vendorCalamaresBranding = oldVendorBranding
	})

	if err := brandingDesc("9.9.9"); err != nil {
		t.Fatalf("brandingDesc with embedded fallback failed: %v", err)
	}

	descPath := filepath.Join(root, "installer.d", "branding", "eggs", "branding.desc")
	data, err := os.ReadFile(descPath)
	if err != nil {
		t.Fatalf("failed to read branding.desc from embedded fallback: %v", err)
	}

	if !strings.Contains(string(data), "penguins-eggs 9.9.9") {
		t.Fatalf("expected version in branding.desc, got: %s", string(data))
	}
}
