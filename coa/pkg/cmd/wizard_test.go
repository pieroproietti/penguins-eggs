package cmd

import (
	"testing"
)

func TestWizardCommandRegistered(t *testing.T) {
	var foundWizard bool
	for _, cmd := range rootCmd.Commands() {
		if cmd.Name() == "wizard" {
			foundWizard = true
			break
		}
	}
	if !foundWizard {
		t.Errorf("wizard command is not registered in rootCmd")
	}
}

func TestWizardFlags(t *testing.T) {
	pathFlag := wizardCmd.Flag("path")
	if pathFlag == nil {
		t.Errorf("wizardCmd is missing '--path' flag")
	}
}

func TestRemasterWizardFlag(t *testing.T) {
	remasterWizard := remasterCmd.Flag("wizard")
	if remasterWizard == nil {
		t.Errorf("remasterCmd is missing '--wizard' flag")
	}
	if remasterWizard.Shorthand != "w" {
		t.Errorf("remasterCmd '--wizard' flag shorthand is not 'w'")
	}

	remasterInteractive := remasterCmd.Flag("interactive")
	if remasterInteractive == nil {
		t.Errorf("remasterCmd is missing '--interactive' alias flag")
	}
	if remasterInteractive.Shorthand != "i" {
		t.Errorf("remasterCmd '--interactive' flag shorthand is not 'i'")
	}
}

func TestRemasterCryptedCloneFlag(t *testing.T) {
	remasterCryptedCloneFlag := remasterCmd.Flag("cryptedclone")
	if remasterCryptedCloneFlag == nil {
		t.Errorf("remasterCmd is missing '--cryptedclone' flag")
	}
}

func TestProduceRemoved(t *testing.T) {
	for _, cmd := range rootCmd.Commands() {
		if cmd.Name() == "produce" {
			t.Errorf("produce command should no longer be registered in rootCmd")
		}
	}
}

func TestRootCommandNotHijacked(t *testing.T) {
	if rootCmd.Run != nil || rootCmd.RunE != nil {
		t.Errorf("rootCmd has a Run/RunE handler; bare root command must not be hijacked")
	}
}
