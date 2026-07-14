package setup

import (
	"os"
	"path/filepath"
	"strings"
)

// vendorFinishAsset es la ruta que un costume del wardrobe puede poblar
// (via su overlay sysroot normal, sin comandos extra) con un script de
// pasos finales especificos del vendor -- mismo directorio ya usado para
// el splash de GRUB/ISOLINUX y el branding.desc de Calamares.
const vendorFinishAsset = "/etc/penguins-eggs.d/brain.d/assets/calamares/finish.sh"

// vendorFinishStep, si el vendor proveyo un finish.sh, lo instala como un
// modulo shellprocess mas de Calamares y lo inserta en la sequence de
// settings.conf justo antes de "shellprocess@oa-chroot-runner": asi corre
// dentro del chroot, despues de que "users" ya creo la cuenta real, y
// antes de que oa-chroot-runner ejecute los pasos genericos de bootloader/
// initramfs de debian.bash.tmpl -- que son los que de verdad aplican
// cualquier cambio que finish.sh haya dejado en /etc/default/grub, sin
// que haga falta invocar update-grub una segunda vez desde el vendor.
//
// Si no hay finish.sh, no hace nada: esto es generico para cualquier
// costume, no exclusivo de Quirinux.
func vendorFinishStep() error {
	data, err := os.ReadFile(vendorFinishAsset)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}

	scriptTarget := filepath.Join(InstallerDRoot, "vendor-finish.sh")
	if err := os.WriteFile(scriptTarget, data, 0755); err != nil {
		return err
	}

	confContent := `# /etc/penguins-eggs.d/installer.d/modules/shellprocess_vendor-finish.conf
i18n:
     name: "Applying vendor customizations..."

dontChroot: false
timeout: 300
script:
  - /etc/penguins-eggs.d/installer.d/vendor-finish.sh
`
	confTarget := filepath.Join(InstallerDRoot, "modules", "shellprocess_vendor-finish.conf")
	if err := os.WriteFile(confTarget, []byte(confContent), 0644); err != nil {
		return err
	}

	return injectVendorFinishIntoSettings(filepath.Join(InstallerDRoot, "settings.conf"))
}

// injectVendorFinishIntoSettings inserisce testualmente il nuovo step nella
// sequence e la relativa istanza in settings.conf, senza toccare il resto
// del file (stesso approccio di stripUsersModule in sibling.go).
func injectVendorFinishIntoSettings(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	lines := strings.Split(string(data), "\n")
	var out []string
	instanceInserted := false
	sequenceInserted := false

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if !sequenceInserted && trimmed == "- shellprocess@oa-chroot-runner" {
			indent := line[:len(line)-len(strings.TrimLeft(line, " "))]
			out = append(out, indent+"- shellprocess@vendor-finish")
			sequenceInserted = true
		}

		out = append(out, line)

		if !instanceInserted && strings.HasPrefix(trimmed, "instances:") {
			out = append(out,
				"  - id:       vendor-finish",
				"    module:   shellprocess",
				"    config:   shellprocess_vendor-finish.conf",
				"",
			)
			instanceInserted = true
		}
	}

	return os.WriteFile(path, []byte(strings.Join(out, "\n")), 0644)
}
