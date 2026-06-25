package cmd

import (
	"fmt"
	"os"
	"strconv"

	"coa/pkg/pathDefaults"
	"coa/pkg/tui"
	"coa/pkg/utils"
)

const luksDefaultPassword = "evolution"

type CryptoConfig struct {
	Cipher        string
	KeySize       int
	Hash          string
	SectorSize    int
	Pbkdf         string
	PbkdfMemory   int
	PbkdfParallel int
	IterTime      int
}

var DefaultCryptoConfig = CryptoConfig{
	Cipher:        "aes-xts-plain64",
	KeySize:       512,
	Hash:          "sha256",
	Pbkdf:         "argon2id",
	PbkdfMemory:   524288,
	PbkdfParallel: 4,
	SectorSize:    512,
}

func (c CryptoConfig) FormatArgs() string {
	args := fmt.Sprintf("--type luks2 --cipher %s --key-size %d --hash %s --sector-size %d --pbkdf %s",
		c.Cipher, c.KeySize, c.Hash, c.SectorSize, c.Pbkdf)

	switch c.Pbkdf {
	case "argon2id", "argon2i":
		args += fmt.Sprintf(" --pbkdf-memory %d --pbkdf-parallel %d", c.PbkdfMemory, c.PbkdfParallel)
	case "pbkdf2":
		args += fmt.Sprintf(" --iter-time %d", c.IterTime)
	}
	return args
}

// printLuksInfo mostra il profilo di sicurezza corrente all'utente
func printLuksInfo(cfg CryptoConfig) {
	fmt.Println("\n================================================================")
	fmt.Println("🛡️  ENCRYPTION PROFILE SUMMARY")
	fmt.Println("================================================================")
	fmt.Printf("  • ENCRYPTION:      %s (%d-bit)\n", cfg.Cipher, cfg.KeySize)
	fmt.Printf("  • KEY DERIVATION:  %s\n", cfg.Pbkdf)
	fmt.Printf("  • MEMORY COST:     %d KiB\n", cfg.PbkdfMemory)
	fmt.Printf("  • CPU EFFORT:      %d thread(s)\n", cfg.PbkdfParallel)
	fmt.Println("----------------------------------------------------------------")
	fmt.Println("This configuration provides MAXIMUM security protection.")
	fmt.Println("================================================================")
}

func promptLuksPassword() (string, error) {
	useDefault := tui.RunConfirmDefault(
		fmt.Sprintf("Use the default password \"%s\" for LUKS encryption?", luksDefaultPassword))

	if useDefault {
		utils.LogNormal("Default password \"%s\" selected.", luksDefaultPassword)
		return luksDefaultPassword, nil
	}

	return tui.RunPassword("Enter LUKS passphrase")
}

func promptCryptoConfig() CryptoConfig {
	useDefault := tui.RunConfirmDefault("Use the default LUKS configuration (Recommended: Maximum Security)?")

	if useDefault {
		utils.LogNormal("Default (Maximum Security) configuration selected.")
		printLuksInfo(DefaultCryptoConfig)
		return DefaultCryptoConfig
	}

	cfg := DefaultCryptoConfig

	if val, err := tui.RunSelect("Encryption algorithm:", []tui.SelectOption{
		{Label: "aes-xts-plain64 (default, hardware-accelerated)", Value: "aes-xts-plain64"},
		{Label: "serpent-xts-plain64 (more secure, slower)", Value: "serpent-xts-plain64"},
		{Label: "twofish-xts-plain64", Value: "twofish-xts-plain64"},
	}, 0); err == nil {
		cfg.Cipher = val
	}

	if val, err := tui.RunSelect("Key size:", []tui.SelectOption{
		{Label: "512 bit (AES-256/XTS standard)", Value: "512"},
		{Label: "256 bit (AES-128/XTS)", Value: "256"},
	}, 0); err == nil {
		cfg.KeySize, _ = strconv.Atoi(val)
	}

	if val, err := tui.RunSelect("Hash algorithm:", []tui.SelectOption{
		{Label: "SHA-256 (default)", Value: "sha256"},
		{Label: "SHA-512", Value: "sha512"},
	}, 0); err == nil {
		cfg.Hash = val
	}

	if val, err := tui.RunSelect("Sector size:", []tui.SelectOption{
		{Label: "512 byte (default, loop device compatible)", Value: "512"},
		{Label: "4096 byte (modern SSD/NVMe)", Value: "4096"},
	}, 0); err == nil {
		size, _ := strconv.Atoi(val)
		if size == 4096 {
			utils.LogWarning("On loop devices sector_size will be forced to 512.")
			size = 512
		}
		cfg.SectorSize = size
	}

	if val, err := tui.RunSelect("Key derivation function (PBKDF):", []tui.SelectOption{
		{Label: "argon2id (recommended, default LUKS2)", Value: "argon2id"},
		{Label: "argon2i", Value: "argon2i"},
		{Label: "pbkdf2 (standard LUKS1)", Value: "pbkdf2"},
	}, 0); err == nil {
		cfg.Pbkdf = val
	}

	switch cfg.Pbkdf {
	case "argon2id", "argon2i":
		if val, err := tui.RunSelect("Argon2 memory cost (KiB):", []tui.SelectOption{
			{Label: "512 MiB (default)", Value: "524288"},
			{Label: "1 GiB", Value: "1048576"},
			{Label: "2 GiB", Value: "2097152"},
		}, 0); err == nil {
			cfg.PbkdfMemory, _ = strconv.Atoi(val)
		}

		if val, err := tui.RunSelect("Argon2 parallel threads:", []tui.SelectOption{
			{Label: "4 threads (default)", Value: "4"},
			{Label: "1 thread", Value: "1"},
			{Label: "2 threads", Value: "2"},
			{Label: "8 threads", Value: "8"},
		}, 0); err == nil {
			cfg.PbkdfParallel, _ = strconv.Atoi(val)
		}

	case "pbkdf2":
		if val, err := tui.RunSelect("Iteration time PBKDF2 (ms):", []tui.SelectOption{
			{Label: "2 seconds (default)", Value: "2000"},
			{Label: "5 seconds", Value: "5000"},
			{Label: "10 seconds", Value: "10000"},
		}, 0); err == nil {
			cfg.IterTime, _ = strconv.Atoi(val)
		}
	}

	printLuksInfo(cfg)
	if !tui.RunConfirmDefault("Confirm this encryption profile?") {
		return promptCryptoConfig()
	}

	return cfg
}

func saveCryptoConfig(cfg CryptoConfig) error {
	content := cfg.FormatArgs()
	return os.WriteFile(pathDefaults.LuksCryptoArgs, []byte(content), 0600)
}
