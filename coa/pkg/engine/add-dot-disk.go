package engine // o il package che usi in questo file

import (
	"crypto/rand"
	"fmt"
	"os/exec"
	"strings"
	"time"
	// importa i tuoi moduli pilot, utils, ecc.
)

// 1. Funzione per ottenere l'UUID dal kernel (con fallback di sicurezza)
func getLinuxUUID() string {
	out, err := exec.Command("cat", "/proc/sys/kernel/random/uuid").Output()
	if err != nil {
		// Fallback UUID v4 se il kernel non lo espone
		b := make([]byte, 16)
		rand.Read(b)
		return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
	}
	return strings.TrimSpace(string(out))
}

// 2. Costruiamo lo script bash.
// Usiamo cat << 'EOF' (con gli apici) per evitare che i caratteri speciali
// e gli apici dentro i comandi xorriso/mksquashfs rompano lo script Bash!
func buildDotDiskScript(isoWorkDir, isoFilename, mksquashfsCmd, xorrisoCmd string) string {
	uuid := getLinuxUUID()
	currentTime := time.Now().Format("2006-01-02 15:04:05")

	return fmt.Sprintf(`#!/bin/bash
set -e

DOTDISK="%s/.disk"
mkdir -p "$DOTDISK/id"

# 1. info
echo "%s" > "$DOTDISK/info"

# 2. comandi (usiamo EOF quotato per sicurezza)
cat << 'EOFCMD' > "$DOTDISK/mksquashfs"
%s
EOFCMD

cat << 'EOFCMD' > "$DOTDISK/mkisofs"
%s
EOFCMD

# 3. touch UUID (La firma di Debian)
touch "$DOTDISK/id/%s"

# 4. README.md
cat << 'EOF' > "$DOTDISK/README.md"
# oa-tools

Volinfo: %s
Image created at: %s
repo: [oa-tools](https://github.com/pieroproietti/oa-tools)
blog: [penguins-eggs.net](https://penguins-eggs.net)
author: [Piero Proietti](mailto://piero.proietti@gmail.com)
EOF
`, isoWorkDir, isoFilename, mksquashfsCmd, xorrisoCmd, uuid, isoFilename, currentTime)
}
