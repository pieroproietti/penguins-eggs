package init

// LUKS2 encryption support for pif init --encrypt.
//
// When encryption is requested, the root partition is formatted as a LUKS2
// container before the inner filesystem is created. The opened device
// (/dev/mapper/pif-root) is then used in place of the raw partition for all
// subsequent format and mount operations.
//
// Key slot 0 uses the passphrase supplied in DiskLayout.LUKSPassword.
// If LUKSPassword is empty, cryptsetup reads from the terminal.
//
// The LUKS header is stored in-band (default cryptsetup behaviour).
// Argon2id is used as the KDF (cryptsetup 2.x default for LUKS2).

import (
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

const (
	// luksMapperName is the device-mapper name used for the opened container.
	luksMapperName = "pif-root"

	// luksMapperPath is the full path to the opened device.
	luksMapperPath = "/dev/mapper/" + luksMapperName
)

// LUKSResult holds the paths produced by setupLUKS.
type LUKSResult struct {
	// RawDevice is the underlying block device (e.g. /dev/sda3).
	RawDevice string

	// MapperDevice is the opened dm-crypt device (e.g. /dev/mapper/pif-root).
	MapperDevice string
}

// setupLUKS formats rawDev as a LUKS2 container and opens it.
// Returns a LUKSResult whose MapperDevice should be used for all subsequent
// filesystem operations in place of rawDev.
//
// If password is empty, cryptsetup prompts interactively.
func setupLUKS(rawDev, password string) (*LUKSResult, error) {
	if err := checkCryptsetup(); err != nil {
		return nil, err
	}

	fmt.Printf("init: formatting %s as LUKS2 container\n", rawDev)

	if err := luksFormat(rawDev, password); err != nil {
		return nil, fmt.Errorf("luks format %s: %w", rawDev, err)
	}

	fmt.Printf("init: opening LUKS container as %s\n", luksMapperPath)

	if err := luksOpen(rawDev, luksMapperName, password); err != nil {
		return nil, fmt.Errorf("luks open %s: %w", rawDev, err)
	}

	return &LUKSResult{
		RawDevice:    rawDev,
		MapperDevice: luksMapperPath,
	}, nil
}

// CloseLUKS closes the dm-crypt device opened by setupLUKS.
// Call this after the filesystem has been unmounted.
func CloseLUKS() error {
	if _, err := os.Stat(luksMapperPath); os.IsNotExist(err) {
		return nil // already closed
	}
	return run("cryptsetup", "close", luksMapperName)
}

// LUKSPassphraseEnvVar is the environment variable checked for a LUKS
// passphrase when neither --encrypt-passphrase-file nor an interactive
// terminal is available. Using an env var keeps the passphrase out of
// the process argument list (/proc/<pid>/cmdline).
const LUKSPassphraseEnvVar = "ILF_LUKS_PASSPHRASE"

// ResolvePassphrase returns the LUKS passphrase to use, applying this
// precedence (highest to lowest):
//
//  1. Contents of passphraseFile (if non-empty path given)
//  2. ILF_LUKS_PASSPHRASE environment variable
//  3. Empty string — cryptsetup will prompt interactively
//
// The file is read with a trailing newline stripped. It must be
// readable only by root (0400/0600); a warning is printed if it is
// world- or group-readable.
func ResolvePassphrase(passphraseFile string) (string, error) {
	if passphraseFile != "" {
		data, err := os.ReadFile(passphraseFile)
		if err != nil {
			return "", fmt.Errorf("luks: read passphrase file %s: %w", passphraseFile, err)
		}
		// Warn if the file is readable by group or others.
		if info, err := os.Stat(passphraseFile); err == nil {
			if info.Mode().Perm()&0o077 != 0 {
				fmt.Fprintf(os.Stderr,
					"init: warning: passphrase file %s has loose permissions (%04o); "+
						"restrict to 0400\n", passphraseFile, info.Mode().Perm())
			}
		}
		return strings.TrimRight(string(data), "\r\n"), nil
	}

	if v := os.Getenv(LUKSPassphraseEnvVar); v != "" {
		return v, nil
	}

	// Empty — cryptsetup will prompt on the terminal.
	return "", nil
}

// checkCryptsetup verifies that cryptsetup is present and is version ≥ 2.0.
// LUKS2 format and Argon2id KDF require cryptsetup 2.x; 1.x only supports LUKS1.
func checkCryptsetup() error {
	if _, err := exec.LookPath("cryptsetup"); err != nil {
		return fmt.Errorf("luks: cryptsetup not found (install cryptsetup ≥ 2.0)")
	}
	out, err := exec.Command("cryptsetup", "--version").Output()
	if err != nil {
		// If --version fails for some reason, allow execution to continue;
		// cryptsetup itself will produce a clear error if LUKS2 is unsupported.
		return nil
	}
	// Output format: "cryptsetup 2.6.1"
	fields := strings.Fields(strings.TrimSpace(string(out)))
	if len(fields) < 2 {
		return nil
	}
	parts := strings.SplitN(fields[1], ".", 3)
	if len(parts) == 0 {
		return nil
	}
	major, err := strconv.Atoi(parts[0])
	if err != nil {
		return nil
	}
	if major < 2 {
		return fmt.Errorf(
			"luks: cryptsetup %s is too old — LUKS2 requires version ≥ 2.0 (found %s)",
			fields[1], fields[1])
	}
	return nil
}

// luksFormat runs cryptsetup luksFormat on rawDev.
func luksFormat(rawDev, password string) error {
	args := []string{
		"luksFormat",
		"--type", "luks2",
		"--cipher", "aes-xts-plain64",
		"--key-size", "512",
		"--hash", "sha256",
		"--pbkdf", "argon2id",
		"--batch-mode",
		rawDev,
	}

	if password != "" {
		// Pass the passphrase via stdin to avoid it appearing in /proc/cmdline.
		cmd := exec.Command("cryptsetup", args...)
		cmd.Stdin = strings.NewReader(password + "\n")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if out, err := cmd.CombinedOutput(); err != nil {
			return fmt.Errorf("cryptsetup luksFormat: %s: %w",
				strings.TrimSpace(string(out)), err)
		}
		return nil
	}

	// Interactive: let cryptsetup prompt for the passphrase.
	cmd := exec.Command("cryptsetup", args...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// luksOpen runs cryptsetup open on rawDev, mapping it to mapperName.
func luksOpen(rawDev, mapperName, password string) error {
	args := []string{"open", "--type", "luks2", rawDev, mapperName}

	if password != "" {
		cmd := exec.Command("cryptsetup", args...)
		cmd.Stdin = strings.NewReader(password + "\n")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if out, err := cmd.CombinedOutput(); err != nil {
			return fmt.Errorf("cryptsetup open: %s: %w",
				strings.TrimSpace(string(out)), err)
		}
		return nil
	}

	cmd := exec.Command("cryptsetup", args...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// LUKSStatus reports whether a LUKS container is currently open.
func LUKSStatus() bool {
	_, err := os.Stat(luksMapperPath)
	return err == nil
}
