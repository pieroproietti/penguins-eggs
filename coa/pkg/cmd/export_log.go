package cmd

import (
	"coa/pkg/pathDefaults"
	"coa/pkg/utils"
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"

	"github.com/spf13/cobra"
)

var exportLogCmd = &cobra.Command{
	Use:   "log",
	Short: "Export logs and plan in a single command",
	Run: func(cmd *cobra.Command, args []string) {
		user, _ := cmd.Flags().GetString("user")
		ip, _ := cmd.Flags().GetString("ip")
		dir, _ := cmd.Flags().GetString("dir")

		remoteHost := fmt.Sprintf("%s@%s", user, ip)

		files := []struct {
			LocalPath  string
			RemoteName string
		}{
			{pathDefaults.LogFile, "penguins-eggs.log.txt"},
			{pathDefaults.PlanFile, "oa-plan.json"},
			{"/tmp/oa-failed-yaml.txt", "oa-failed.yaml"},
		}

		validFiles := []struct {
			LocalPath  string
			RemoteName string
		}{}

		for _, f := range files {
			if _, err := os.Stat(f.LocalPath); err == nil {
				validFiles = append(validFiles, f)
				utils.LogNormal("📄 Found: %s -> %s", f.LocalPath, f.RemoteName)
			} else {
				utils.LogWarning("File not found: %s", f.LocalPath)
			}
		}

		if len(validFiles) == 0 {
			utils.LogError("No files found to export.")
			os.Exit(1)
		}

		utils.LogNormal("🚀 Connecting to %s (single password prompt)...", remoteHost)
		remoteCmd := fmt.Sprintf(`cd %s || exit 1`, dir)

		remoteCmd += "\n# Clean old files\n"
		for _, f := range validFiles {
			remoteCmd += fmt.Sprintf("rm -f %s\n", f.RemoteName)
		}

		remoteCmd += "\n# Receive new files\n"
		for _, f := range validFiles {
			remoteCmd += fmt.Sprintf(`
read size
dd bs=1 count="$size" 2>/dev/null | base64 -d > %s
read dummy
`, f.RemoteName)
		}

		sshCmd := exec.Command("ssh", remoteHost, remoteCmd)
		sshCmd.Stderr = os.Stderr

		stdin, err := sshCmd.StdinPipe()
		if err != nil {
			utils.LogError("Error creating pipe: %v", err)
			os.Exit(1)
		}

		if err := sshCmd.Start(); err != nil {
			utils.LogError("Error starting SSH: %v", err)
			os.Exit(1)
		}

		for _, f := range validFiles {
			fileData, err := os.ReadFile(f.LocalPath)
			if err != nil {
				utils.LogError("Unable to read %s: %v", f.LocalPath, err)
				os.Exit(1)
			}

			encoded := base64.StdEncoding.EncodeToString(fileData)
			size := len(encoded)

			fmt.Fprintf(stdin, "%d\n%s\n", size, encoded)
			utils.LogNormal("📤 Sent %s (%d bytes base64)", f.RemoteName, size)
		}

		stdin.Close()

		if err := sshCmd.Wait(); err != nil {
			utils.LogError("Remote execution error: %v", err)
			os.Exit(1)
		}

		utils.LogSuccess("Operation complete! %d files exported successfully.", len(validFiles))
	},
}

func init() {
	exportCmd.AddCommand(exportLogCmd)

	exportLogCmd.Flags().StringP("user", "u", "artisan", "Destination SSH user")
	exportLogCmd.Flags().StringP("ip", "i", "192.168.1.2", "Destination IP address")
	exportLogCmd.Flags().StringP("dir", "d", "/home/artisan", "Destination directory")
}
