package mcp

import (
	"encoding/json"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"

	"coa/pkg/utils"
)

// MCPConfigTarget descrive un percorso di configurazione client MCP
type MCPConfigTarget struct {
	Name         string
	RelativePath string
}

var defaultTargets = []MCPConfigTarget{
	{Name: "Antigravity CLI", RelativePath: ".config/antigravity/mcp.json"},
	{Name: "Claude Desktop", RelativePath: ".config/Claude/claude_desktop_config.json"},
	{Name: "Roo-Cline (VSCode Server)", RelativePath: ".vscode-server/data/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json"},
	{Name: "Roo-Cline (VSCode Local)", RelativePath: ".config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json"},
	{Name: "Cursor Editor", RelativePath: ".cursor/mcp.json"},
	{Name: "Zed Editor", RelativePath: ".config/zed/settings.json"},
}

// Enable esegue la configurazione una tantum del server MCP e dei sudoers
func Enable() error {
	// 1. Configurazione Sudoers (/etc/sudoers.d/penguins-eggs-mcp)
	if os.Geteuid() != 0 {
		utils.LogWarning("Creating /etc/sudoers.d rule requires root privileges.")
		utils.LogNormal("Run: sudo eggs mcp enable")
		os.Exit(1)
	}

	sudoersPath := "/etc/sudoers.d/penguins-eggs-mcp"
	sudoersContent := fmt.Sprintf("# penguins-eggs MCP passwordless sudo access\nALL ALL=(ALL) NOPASSWD: /usr/bin/eggs, /usr/local/bin/eggs, /usr/bin/coa, /usr/local/bin/coa, %s\n", getEggsBinaryPath())
	err := os.WriteFile(sudoersPath, []byte(sudoersContent), 0440)
	if err != nil {
		utils.LogError("Failed to write %s: %v", sudoersPath, err)
		return err
	}
	utils.LogSuccess("Sudoers rule created: %s", sudoersPath)

	// 2. Configurazione file JSON dei Client MCP
	targetUser, targetHome, uid, gid := getTargetUserHome()
	eggsBin := getEggsBinaryPath()

	mcpNode := map[string]interface{}{
		"command": eggsBin,
		"args":    []string{"mcp", "start"},
	}

	homes := []string{targetHome}
	if targetHome != "/root" && os.Geteuid() == 0 {
		homes = append(homes, "/root")
	}

	configuredCount := 0
	for _, homeDir := range homes {
		// Se la cartella .config/antigravity non esiste per il target user, la creiamo in automatico per garantire il supporto ad Antigravity
		antigravityDir := filepath.Join(homeDir, ".config", "antigravity")
		if _, err := os.Stat(antigravityDir); os.IsNotExist(err) {
			os.MkdirAll(antigravityDir, 0755)
			if homeDir == targetHome && uid != 0 {
				os.Chown(filepath.Dir(antigravityDir), uid, gid)
				os.Chown(antigravityDir, uid, gid)
			}
		}

		for _, target := range defaultTargets {
			filePath := filepath.Join(homeDir, target.RelativePath)
			parentDir := filepath.Dir(filePath)

			// Configura se il parentDir esiste già o se è antigravity
			if _, err := os.Stat(parentDir); err == nil {
				if updateJSONConfigAdd(filePath, mcpNode) {
					if homeDir == targetHome && uid != 0 {
						os.Chown(filePath, uid, gid)
					}
					utils.LogSuccess("MCP configuration added to %s (%s)", target.Name, filePath)
					configuredCount++
				}
			}
		}
	}

	if configuredCount == 0 {
		utils.LogWarning("No client MCP directories found, but Sudoers rules are set.")
	} else {
		utils.LogSuccess("penguins-eggs MCP server enabled for %s (%s).", targetUser, targetHome)
	}

	return nil
}

// Disable rimuove il nodo penguins-eggs dai client MCP e elimina la regola sudoers
func Disable() error {
	if os.Geteuid() != 0 {
		utils.LogWarning("Removing /etc/sudoers.d rule requires root privileges.")
		utils.LogNormal("Run: sudo eggs mcp disable")
		os.Exit(1)
	}

	// 1. Rimuove sudoers
	sudoersPath := "/etc/sudoers.d/penguins-eggs-mcp"
	if _, err := os.Stat(sudoersPath); err == nil {
		if err := os.Remove(sudoersPath); err == nil {
			utils.LogSuccess("Removed sudoers rule: %s", sudoersPath)
		} else {
			utils.LogError("Failed to remove %s: %v", sudoersPath, err)
		}
	}

	// 2. Rimuove configurazione dai client JSON
	_, targetHome, uid, gid := getTargetUserHome()
	homes := []string{targetHome}
	if targetHome != "/root" && os.Geteuid() == 0 {
		homes = append(homes, "/root")
	}

	for _, homeDir := range homes {
		for _, target := range defaultTargets {
			filePath := filepath.Join(homeDir, target.RelativePath)
			if _, err := os.Stat(filePath); err == nil {
				if updateJSONConfigRemove(filePath) {
					if homeDir == targetHome && uid != 0 {
						os.Chown(filePath, uid, gid)
					}
					utils.LogSuccess("Removed MCP configuration from %s (%s)", target.Name, filePath)
				}
			}
		}
	}

	utils.LogSuccess("penguins-eggs MCP server disabled.")
	return nil
}

// Status mostra lo stato corrente della configurazione MCP, dei sudoers e del processo listener
func Status() error {
	utils.LogNormal("Checking penguins-eggs MCP status...")

	// 1. Sudoers
	sudoersPath := "/etc/sudoers.d/penguins-eggs-mcp"
	if _, err := os.Stat(sudoersPath); err == nil {
		utils.LogSuccess("Sudoers rule: ENABLED (%s)", sudoersPath)
	} else {
		utils.LogWarning("Sudoers rule: NOT CONFIGURED")
	}

	// 2. Client JSON Configs
	_, targetHome, _, _ := getTargetUserHome()
	homes := []string{targetHome}
	if targetHome != "/root" {
		homes = append(homes, "/root")
	}

	for _, homeDir := range homes {
		for _, target := range defaultTargets {
			filePath := filepath.Join(homeDir, target.RelativePath)
			if _, err := os.Stat(filePath); err == nil {
				if isMCPConfigured(filePath) {
					utils.LogSuccess("Client %s [%s]: ENABLED", target.Name, filePath)
				} else {
					utils.LogNormal("Client %s [%s]: DISABLED", target.Name, filePath)
				}
			} else {
				utils.LogNormal("Client %s [%s]: NOT PRESENT", target.Name, filePath)
			}
		}
	}

	// 3. Process status
	pids := findMCPRunningPIDs()
	if len(pids) > 0 {
		utils.LogSuccess("Daemon Listener (`eggs mcp start`): RUNNING (PIDs: %v)", pids)
	} else {
		utils.LogNormal("Daemon Listener (`eggs mcp start`): STOPPED")
	}

	return nil
}

// Stop interrompe eventuali processi `eggs mcp start` attivi
func Stop() error {
	pids := findMCPRunningPIDs()
	if len(pids) == 0 {
		utils.LogNormal("No running `eggs mcp start` process found.")
		return nil
	}

	for _, pid := range pids {
		proc, err := os.FindProcess(pid)
		if err == nil {
			proc.Signal(syscall.SIGTERM)
			utils.LogSuccess("Sent SIGTERM to MCP server process (PID %d)", pid)
		}
	}
	return nil
}

// Helper functions

func getTargetUserHome() (string, string, int, int) {
	sudoUser := os.Getenv("SUDO_USER")
	if sudoUser != "" && sudoUser != "root" {
		u, err := user.Lookup(sudoUser)
		if err == nil {
			uid, _ := strconv.Atoi(u.Uid)
			gid, _ := strconv.Atoi(u.Gid)
			return sudoUser, u.HomeDir, uid, gid
		}
	}

	current, err := user.Current()
	if err == nil {
		uid, _ := strconv.Atoi(current.Uid)
		gid, _ := strconv.Atoi(current.Gid)
		return current.Username, current.HomeDir, uid, gid
	}

	homeDir, _ := os.UserHomeDir()
	return "root", homeDir, os.Getuid(), os.Getgid()
}

func updateJSONConfigAdd(filePath string, mcpNode map[string]interface{}) bool {
	dataMap := make(map[string]interface{})
	content, err := os.ReadFile(filePath)
	if err == nil && len(content) > 0 {
		json.Unmarshal(content, &dataMap)
	}

	var mcpServers map[string]interface{}
	if rawServers, ok := dataMap["mcpServers"].(map[string]interface{}); ok {
		mcpServers = rawServers
	} else {
		mcpServers = make(map[string]interface{})
	}

	mcpServers["penguins-eggs"] = mcpNode
	dataMap["mcpServers"] = mcpServers

	bytes, err := json.MarshalIndent(dataMap, "", "  ")
	if err != nil {
		return false
	}

	err = os.WriteFile(filePath, bytes, 0644)
	return err == nil
}

func updateJSONConfigRemove(filePath string) bool {
	content, err := os.ReadFile(filePath)
	if err != nil || len(content) == 0 {
		return false
	}

	dataMap := make(map[string]interface{})
	if err := json.Unmarshal(content, &dataMap); err != nil {
		return false
	}

	rawServers, ok := dataMap["mcpServers"].(map[string]interface{})
	if !ok {
		return false
	}

	if _, exists := rawServers["penguins-eggs"]; !exists {
		return false
	}

	delete(rawServers, "penguins-eggs")
	dataMap["mcpServers"] = rawServers

	bytes, err := json.MarshalIndent(dataMap, "", "  ")
	if err != nil {
		return false
	}

	err = os.WriteFile(filePath, bytes, 0644)
	return err == nil
}

func isMCPConfigured(filePath string) bool {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return false
	}

	dataMap := make(map[string]interface{})
	if err := json.Unmarshal(content, &dataMap); err != nil {
		return false
	}

	rawServers, ok := dataMap["mcpServers"].(map[string]interface{})
	if !ok {
		return false
	}

	_, exists := rawServers["penguins-eggs"]
	return exists
}

func findMCPRunningPIDs() []int {
	var pids []int
	currentPID := os.Getpid()

	out, err := utils.ExecCapture("pgrep -f 'mcp start'")
	if err != nil || strings.TrimSpace(out) == "" {
		return pids
	}

	lines := strings.Split(strings.TrimSpace(out), "\n")
	for _, line := range lines {
		pid, err := strconv.Atoi(strings.TrimSpace(line))
		if err == nil && pid != currentPID {
			pids = append(pids, pid)
		}
	}
	return pids
}
