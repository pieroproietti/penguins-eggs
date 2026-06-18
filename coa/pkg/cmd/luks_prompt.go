package cmd

import (
	"fmt"
	"os"
	"strconv"

	"coa/pkg/config"
	"coa/pkg/tui"
	"coa/pkg/utils"
)

const luksDefaultPassword = "0"

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
	SectorSize:    512,
	Pbkdf:         "argon2id",
	PbkdfMemory:   524288,
	PbkdfParallel: 4,
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

func promptLuksPassword() (string, error) {
	useDefault := tui.RunConfirmDefault(
		fmt.Sprintf("Usare la password di default \"%s\" per la cifratura LUKS?", luksDefaultPassword))

	if useDefault {
		utils.LogNormal("Password di default \"%s\" selezionata.", luksDefaultPassword)
		return luksDefaultPassword, nil
	}

	return tui.RunPassword("Inserisci la passphrase LUKS")
}

func promptCryptoConfig() CryptoConfig {
	useDefault := tui.RunConfirmDefault("Usare la configurazione LUKS di default?")

	if useDefault {
		utils.LogNormal("Configurazione LUKS di default selezionata.")
		return DefaultCryptoConfig
	}

	cfg := DefaultCryptoConfig

	if val, err := tui.RunSelect("Algoritmo di cifratura:", []tui.SelectOption{
		{Label: "aes-xts-plain64 (default, hardware-accelerated)", Value: "aes-xts-plain64"},
		{Label: "serpent-xts-plain64 (più sicuro, più lento)", Value: "serpent-xts-plain64"},
		{Label: "twofish-xts-plain64", Value: "twofish-xts-plain64"},
	}, 0); err == nil {
		cfg.Cipher = val
	}

	if val, err := tui.RunSelect("Dimensione chiave:", []tui.SelectOption{
		{Label: "512 bit (AES-256/XTS standard)", Value: "512"},
		{Label: "256 bit (AES-128/XTS)", Value: "256"},
	}, 0); err == nil {
		cfg.KeySize, _ = strconv.Atoi(val)
	}

	if val, err := tui.RunSelect("Algoritmo di hash:", []tui.SelectOption{
		{Label: "SHA-256 (default)", Value: "sha256"},
		{Label: "SHA-512", Value: "sha512"},
	}, 0); err == nil {
		cfg.Hash = val
	}

	if val, err := tui.RunSelect("Dimensione settore:", []tui.SelectOption{
		{Label: "512 byte (default, compatibile loop device)", Value: "512"},
		{Label: "4096 byte (SSD/NVMe moderni)", Value: "4096"},
	}, 0); err == nil {
		size, _ := strconv.Atoi(val)
		if size == 4096 {
			utils.LogWarning("Su loop device il sector_size sarà forzato a 512.")
			size = 512
		}
		cfg.SectorSize = size
	}

	if val, err := tui.RunSelect("Key derivation function (PBKDF):", []tui.SelectOption{
		{Label: "argon2id (raccomandato, default LUKS2)", Value: "argon2id"},
		{Label: "argon2i", Value: "argon2i"},
		{Label: "pbkdf2 (standard LUKS1)", Value: "pbkdf2"},
	}, 0); err == nil {
		cfg.Pbkdf = val
	}

	switch cfg.Pbkdf {
	case "argon2id", "argon2i":
		if val, err := tui.RunSelect("Costo memoria Argon2 (KiB):", []tui.SelectOption{
			{Label: "512 MiB (default)", Value: "524288"},
			{Label: "1 GiB", Value: "1048576"},
			{Label: "2 GiB", Value: "2097152"},
		}, 0); err == nil {
			cfg.PbkdfMemory, _ = strconv.Atoi(val)
		}

		if val, err := tui.RunSelect("Thread paralleli Argon2:", []tui.SelectOption{
			{Label: "4 thread (default)", Value: "4"},
			{Label: "1 thread", Value: "1"},
			{Label: "2 thread", Value: "2"},
			{Label: "8 thread", Value: "8"},
		}, 0); err == nil {
			cfg.PbkdfParallel, _ = strconv.Atoi(val)
		}

	case "pbkdf2":
		if val, err := tui.RunSelect("Iteration time PBKDF2 (ms):", []tui.SelectOption{
			{Label: "2 secondi (default)", Value: "2000"},
			{Label: "5 secondi", Value: "5000"},
			{Label: "10 secondi", Value: "10000"},
		}, 0); err == nil {
			cfg.IterTime, _ = strconv.Atoi(val)
		}
	}

	return cfg
}

func saveCryptoConfig(cfg CryptoConfig) error {
	content := cfg.FormatArgs()
	return os.WriteFile(config.LuksCryptoArgs, []byte(content), 0600)
}
