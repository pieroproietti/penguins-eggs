package cmd

import (
	"fmt"

	"coa/pkg/parser"
	"coa/pkg/pathDefaults"
	"coa/pkg/tui"
	"coa/pkg/utils"

	"github.com/spf13/cobra"
)

var wizardPath string

var wizardCmd = &cobra.Command{
	Use:   "wizard",
	Short: "Interactive wizard to configure and launch system remastering",
	Long: `The 'wizard' command provides a lightweight, guided 3-step interactive flow
to configure remaster mode, compression level, and launch the ISO remastering flight.`,
	Example: `  # Start interactive remastering wizard
  sudo coa wizard

  # Start wizard with a custom work path
  sudo coa wizard --path /home/eggs`,
	Run: func(cmd *cobra.Command, args []string) {
		RunWizard(wizardPath)
	},
}

func RunWizard(destPath string) {
	if destPath == "" {
		destPath = pathDefaults.DefaultWorkPath
	}

	// Step 1: Mode Selection
	modeOptions := []tui.SelectOption{
		{
			Label: "Standard Live  (Distributable image: cleans users, history, auth files)",
			Value: "standard",
		},
		{
			Label: "System Clone   (Full live backup preserving users, /home, and auth)",
			Value: "clone",
		},
		{
			Label: "Crypted Clone  (Encrypted backup preserving user data with LUKS)",
			Value: "crypted",
		},
	}

	selectedMode, err := tui.RunSelect("Step 1/3: Select Remaster Mode", modeOptions, 0)
	if err != nil {
		utils.LogWarning("Wizard cancelled.")
		return
	}

	// Step 2: Compression Level
	compOptions := []tui.SelectOption{
		{
			Label: "Fast      (Rapid compression, zstd level 1)",
			Value: "fast",
		},
		{
			Label: "Standard  (Default balanced compression, zstd level 3)",
			Value: "standard",
		},
		{
			Label: "Maximum   (Highest compression ratio, xz)",
			Value: "maximum",
		},
	}

	selectedComp, err := tui.RunSelect("Step 2/3: Select Compression Level", compOptions, 1)
	if err != nil {
		utils.LogWarning("Wizard cancelled.")
		return
	}

	var compAlgo string
	var compLevel int
	var compDisplay string

	switch selectedComp {
	case "fast":
		compAlgo = "zstd"
		compLevel = 1
		compDisplay = "Fast (zstd, level 1)"
	case "standard":
		if customCfg, _ := parser.LoadCustomSettings(); customCfg != nil && customCfg.Remaster.Compression.Algorithm != "" {
			compAlgo = customCfg.Remaster.Compression.Algorithm
			compLevel = customCfg.Remaster.Compression.Level
			if compLevel > 0 {
				compDisplay = fmt.Sprintf("Standard (%s, level %d)", compAlgo, compLevel)
			} else {
				compDisplay = fmt.Sprintf("Standard (%s)", compAlgo)
			}
		} else {
			compAlgo = "zstd"
			compLevel = 3
			compDisplay = "Standard (zstd, level 3)"
		}
	case "maximum":
		compAlgo = "xz"
		compLevel = 0
		compDisplay = "Maximum (xz)"
	}

	var modeDisplay string
	switch selectedMode {
	case "standard":
		modeDisplay = "Standard Live"
	case "clone":
		modeDisplay = "System Clone"
	case "crypted":
		modeDisplay = "Crypted Clone"
	}

	// Step 3: Minimal Confirmation & Execution
	utils.LogNormal("Flight summary:")
	utils.LogNormal("  Mode:        %s", modeDisplay)
	utils.LogNormal("  Compression: %s", compDisplay)
	utils.LogNormal("  Destination: %s", destPath)

	confirmed, err := tui.RunConfirm("Proceed with hatching?", true)
	if err != nil || !confirmed {
		utils.LogWarning("Remaster flight cancelled.")
		return
	}

	CheckSudoRequirements("wizard", true)

	opts := RemasterOptions{
		ProducePath:      destPath,
		ProduceMode:      selectedMode,
		CompressionAlgo:  compAlgo,
		CompressionLevel: compLevel,
	}

	RunRemasterFlight(opts)
}

func init() {
	wizardCmd.Flags().StringVar(&wizardPath, "path", pathDefaults.DefaultWorkPath, "working directory")
	rootCmd.AddCommand(wizardCmd)
}
