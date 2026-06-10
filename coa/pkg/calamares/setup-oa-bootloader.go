package calamares

import (
	"coa/pkg/parser"
	"os"
)

// SetupOABootloader genera i file necessari alla finalizzazione del sistema in staging (/tmp/coa)
func SetupOABootloader(profile *parser.Profile) error {
	// Assicuriamoci che la staging area esista
	if err := os.MkdirAll(stagingDir, 0755); err != nil {
		return err
	}

	/**
	* 1. GENERAZIONE DI oa-bootloader.sh
	* Questo script viene copiato dentro il sistema installato e lanciato da Calamares
	*/
	scriptContent := `#!/bin/bash
set -e

echo "oa-bootloader: Inizio installazione GRUB..."

# Rilevamento dinamico disco
TARGET_DISK=$(grub-probe -t disk / 2>/dev/null || echo "/dev/sda")

# Fix per initramfs-tools per evitare timeout al boot
echo "RESUME=none" > /etc/initramfs-tools/conf.d/resume
update-initramfs -u

# Rilevamento UEFI o BIOS e installazione GRUB
if [ -d /sys/firmware/efi ]; then
    echo "oa-bootloader: Sistema UEFI rilevato."
    grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=oa-live --recheck
else
    echo "oa-bootloader: Sistema BIOS/Legacy rilevato."
    grub-install --target=i386-pc --recheck "$TARGET_DISK"
fi

update-grub
echo "oa-bootloader: Installazione GRUB completata."
echo "oa-bootloader: Pulizia artefatti live..."
rm -f /usr/local/bin/oa-trust-desktop
rm -f /etc/xdg/autostart/trust-installer.desktop
rm -f /usr/share/applications/install-system.desktop
rm -f /etc/sudoers.d/00-live
`

	err := os.WriteFile(stagingDir+"/oa-bootloader.sh", []byte(scriptContent), 0755)
	if err != nil {
		return err
	}

	/**
	* 2. GENERAZIONE DI oa-prepare-target.sh
	* Questo è il ponte che Calamares lancia sul sistema LIVE. 
	* Copia lo script sopra dentro il sistema che si sta installando e lo esegue.
	*/
	bridgeScript := `#!/bin/bash
TARGET_ROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
if [ -z "$TARGET_ROOT" ]; then TARGET_ROOT=$(ls -d /tmp/calamares-root-* | head -n 1); fi

echo "oa-bootloader: Operando su $TARGET_ROOT"
cp /tmp/coa/oa-bootloader.sh "$TARGET_ROOT/tmp/oa-bootloader.sh"
chmod +x "$TARGET_ROOT/tmp/oa-bootloader.sh"
chroot "$TARGET_ROOT" /bin/bash /tmp/oa-bootloader.sh
rm "$TARGET_ROOT/tmp/oa-bootloader.sh"
`
	err = os.WriteFile(stagingDir+"/oa-prepare-target.sh", []byte(bridgeScript), 0755)
	if err != nil {
		return err
	}

	/**
	* 3. GENERAZIONE di shellprocess@oa_bootloader.conf
	* Configurazione che dice a Calamares di lanciare il bridge
	*/
	moduleContent := `---
i18n:
     name: "Installing bootloaders..."

dontChroot: true
timeout: 600
script:
    - "/bin/bash /tmp/coa/oa-prepare-target.sh"
`
	return os.WriteFile(stagingDir+"/shellprocess_oa_bootloader.conf", []byte(moduleContent), 0644)
}
