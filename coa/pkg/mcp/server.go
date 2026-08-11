package mcp

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"

	"coa/pkg/distro"
	"coa/pkg/utils"
)

// Server è la struttura del daemon listener MCP su Stdio
type Server struct {
	version string
}

// NewServer crea una nuova istanza dell'MCP Server
func NewServer(version string) *Server {
	return &Server{
		version: version,
	}
}

// Start avvia il loop di ascolto su os.Stdin e risposta su os.Stdout
func (s *Server) Start() error {
	// Disattiva i colori ANSI per evitare che output sporco comprometta il protocollo JSON-RPC
	utils.DisableColors = true

	reader := bufio.NewReader(os.Stdin)
	for {
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}

		lineStr := strings.TrimSpace(string(line))
		if lineStr == "" {
			continue
		}

		var req JSONRPCRequest
		if err := json.Unmarshal([]byte(lineStr), &req); err != nil {
			s.sendError(nil, ErrCodeParseError, "Parse error: "+err.Error())
			continue
		}

		s.handleRequest(&req)
	}

	return nil
}

func (s *Server) sendResponse(resp JSONRPCResponse) {
	data, err := json.Marshal(resp)
	if err != nil {
		return
	}
	os.Stdout.Write(data)
	os.Stdout.Write([]byte("\n"))
	os.Stdout.Sync()
}

func (s *Server) sendError(id interface{}, code int, message string) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &JSONRPCError{
			Code:    code,
			Message: message,
		},
	}
	s.sendResponse(resp)
}

func (s *Server) handleRequest(req *JSONRPCRequest) {
	// Gestione delle Notifiche (senza risposta ID)
	if req.ID == nil {
		// e.g. notifications/initialized
		return
	}

	switch req.Method {
	case "initialize":
		result := InitializeResult{
			ProtocolVersion: "2024-11-05",
			Capabilities: ServerCapabilities{
				Tools:     map[string]interface{}{},
				Resources: map[string]interface{}{},
			},
			ServerInfo: ServerInfo{
				Name:    "penguins-eggs",
				Version: s.version,
			},
		}
		s.sendResponse(JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result:  result,
		})

	case "ping":
		s.sendResponse(JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result:  map[string]interface{}{},
		})

	case "tools/list":
		s.handleToolsList(req.ID)

	case "tools/call":
		s.handleToolCall(req.ID, req.Params)

	case "resources/list":
		s.handleResourcesList(req.ID)

	case "resources/read":
		s.handleResourceRead(req.ID, req.Params)

	default:
		s.sendError(req.ID, ErrCodeMethodNotFound, fmt.Sprintf("Method '%s' not found", req.Method))
	}
}

func (s *Server) handleToolsList(id interface{}) {
	tools := []Tool{
		{
			Name:        "eggs_remaster",
			Description: "Remaster system into a live bootable ISO image (eggs remaster / produce)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"clone":       {Type: "boolean", Description: "Preserve users and /home directory"},
					"crypted":     {Type: "boolean", Description: "Enable LUKS encryption for live system"},
					"compression": {Type: "string", Description: "Compression algorithm: zstd, xz, lz4, gzip"},
					"path":        {Type: "string", Description: "Custom output directory path for live ISO"},
					"stop_after":  {Type: "string", Description: "Stop flight after specific stage"},
					"debug":       {Type: "boolean", Description: "Enable verbose debug output"},
				},
			},
		},
		{
			Name:        "eggs_wardrobe",
			Description: "Manage wardrobes and system configuration presets (eggs wardrobe)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"action":  {Type: "string", Description: "Action to execute: list, get, show, wear", Enum: []string{"list", "get", "show", "wear"}},
					"costume": {Type: "string", Description: "Costume or profile name for show or wear"},
				},
				Required: []string{"action"},
			},
		},
		{
			Name:        "eggs_sysinstall",
			Description: "Install live system environment permanently to local disk storage (eggs sysinstall)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"installer":  {Type: "string", Description: "Installer interface: krill (TUI) or calamares (GUI)", Enum: []string{"krill", "calamares"}},
					"unattended": {Type: "boolean", Description: "Run unattended non-interactive installation (krill only)"},
				},
			},
		},
		{
			Name:        "eggs_export",
			Description: "Export ISO, packages, or logs to remote Proxmox storage array (eggs export)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"target": {Type: "string", Description: "Export target: iso, pkg, or log", Enum: []string{"iso", "pkg", "log"}},
				},
				Required: []string{"target"},
			},
		},
		{
			Name:        "eggs_tools",
			Description: "Execute penguins-eggs system utilities: clean, grub40, skel, build (eggs tools)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"tool": {Type: "string", Description: "Subcommand: clean, grub40, skel, build", Enum: []string{"clean", "grub40", "skel", "build"}},
					"args": {Type: "string", Description: "Space-separated extra arguments for the tool"},
				},
				Required: []string{"tool"},
			},
		},
		{
			Name:        "eggs_destroy",
			Description: "Clean active staging setup, unmount temporary filesystems, and purge build nest (eggs destroy)",
			InputSchema: InputSchema{
				Type:       "object",
				Properties: map[string]Property{},
			},
		},
		{
			Name:        "eggs_version",
			Description: "Get runtime penguins-eggs release version tag, target architecture, and build info (eggs version)",
			InputSchema: InputSchema{
				Type:       "object",
				Properties: map[string]Property{},
			},
		},
		{
			Name:        "eggs_exec",
			Description: "Execute an arbitrary eggs/coa CLI command safely",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"command": {Type: "string", Description: "Full command arguments string to pass to eggs, e.g. 'remaster --clone'"},
				},
				Required: []string{"command"},
			},
		},
	}

	s.sendResponse(JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  ToolsListResult{Tools: tools},
	})
}

func (s *Server) handleToolCall(id interface{}, rawParams json.RawMessage) {
	var params ToolCallParams
	if err := json.Unmarshal(rawParams, &params); err != nil {
		s.sendError(id, ErrCodeInvalidParams, "Invalid params: "+err.Error())
		return
	}

	eggsBin := getEggsBinaryPath()
	var cmdStr string
	var err error
	var out string

	switch params.Name {
	case "eggs_remaster":
		cmdArgs := []string{"remaster"}
		if val, ok := params.Arguments["clone"].(bool); ok && val {
			cmdArgs = append(cmdArgs, "--clone")
		}
		if val, ok := params.Arguments["crypted"].(bool); ok && val {
			cmdArgs = append(cmdArgs, "--crypted")
		}
		if val, ok := params.Arguments["compression"].(string); ok && val != "" {
			cmdArgs = append(cmdArgs, "--compression", val)
		}
		if val, ok := params.Arguments["path"].(string); ok && val != "" {
			cmdArgs = append(cmdArgs, "--path", val)
		}
		if val, ok := params.Arguments["stop_after"].(string); ok && val != "" {
			cmdArgs = append(cmdArgs, "--stop-after", val)
		}
		if val, ok := params.Arguments["debug"].(bool); ok && val {
			cmdArgs = append(cmdArgs, "--debug")
		}
		cmdStr = fmt.Sprintf("sudo %s %s", eggsBin, strings.Join(cmdArgs, " "))

	case "eggs_wardrobe":
		action, _ := params.Arguments["action"].(string)
		costume, _ := params.Arguments["costume"].(string)
		if action == "" {
			action = "list"
		}
		if costume != "" {
			cmdStr = fmt.Sprintf("sudo %s wardrobe %s %s", eggsBin, action, costume)
		} else {
			cmdStr = fmt.Sprintf("sudo %s wardrobe %s", eggsBin, action)
		}

	case "eggs_sysinstall":
		installer, _ := params.Arguments["installer"].(string)
		if installer == "" {
			installer = "krill"
		}
		unattended, _ := params.Arguments["unattended"].(bool)
		if installer == "krill" && unattended {
			cmdStr = fmt.Sprintf("sudo %s sysinstall krill --unattended", eggsBin)
		} else {
			cmdStr = fmt.Sprintf("sudo %s sysinstall %s", eggsBin, installer)
		}

	case "eggs_export":
		target, _ := params.Arguments["target"].(string)
		cmdStr = fmt.Sprintf("sudo %s export %s", eggsBin, target)

	case "eggs_tools":
		tool, _ := params.Arguments["tool"].(string)
		extraArgs, _ := params.Arguments["args"].(string)
		if tool == "build" {
			// REGOLE AGENTS.md: MAI eseguire tools build con sudo!
			cmdStr = fmt.Sprintf("%s tools build %s", eggsBin, extraArgs)
		} else {
			cmdStr = fmt.Sprintf("sudo %s tools %s %s", eggsBin, tool, extraArgs)
		}

	case "eggs_destroy":
		cmdStr = fmt.Sprintf("sudo %s destroy", eggsBin)

	case "eggs_version":
		cmdStr = fmt.Sprintf("%s version", eggsBin)

	case "eggs_exec":
		rawCmd, _ := params.Arguments["command"].(string)
		trimmed := strings.TrimSpace(rawCmd)
		if strings.HasPrefix(trimmed, "tools build") {
			cmdStr = fmt.Sprintf("%s %s", eggsBin, trimmed)
		} else {
			cmdStr = fmt.Sprintf("sudo %s %s", eggsBin, trimmed)
		}

	default:
		s.sendError(id, ErrCodeInvalidParams, fmt.Sprintf("Unknown tool '%s'", params.Name))
		return
	}

	out, err = utils.ExecCaptureCombined(cmdStr)
	isError := err != nil

	s.sendResponse(JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result: ToolCallResult{
			Content: []ContentItem{
				{
					Type: "text",
					Text: out,
				},
			},
			IsError: isError,
		},
	})
}

func (s *Server) handleResourcesList(id interface{}) {
	resources := []Resource{
		{
			URI:         "eggs://config",
			Name:        "Penguins Eggs Configuration",
			Description: "Main system configuration file (/etc/penguins-eggs.conf)",
			MimeType:    "text/plain",
		},
		{
			URI:         "eggs://exclude-list",
			Name:        "Custom Exclude List",
			Description: "Custom filesystem exclusions (/etc/penguins-eggs.d/custom.exclude.list)",
			MimeType:    "text/plain",
		},
		{
			URI:         "eggs://version",
			Name:        "Penguins Eggs Version Info",
			Description: "System build version, architecture, and binaries info",
			MimeType:    "text/plain",
		},
		{
			URI:         "eggs://status",
			Name:        "System Remaster Status",
			Description: "Host distribution, kernel release, and live environment status",
			MimeType:    "text/plain",
		},
	}

	s.sendResponse(JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  ResourcesListResult{Resources: resources},
	})
}

func (s *Server) handleResourceRead(id interface{}, rawParams json.RawMessage) {
	var params ResourceReadParams
	if err := json.Unmarshal(rawParams, &params); err != nil {
		s.sendError(id, ErrCodeInvalidParams, "Invalid params: "+err.Error())
		return
	}

	var text string
	var mimeType = "text/plain"

	switch params.URI {
	case "eggs://config":
		content, err := os.ReadFile("/etc/penguins-eggs.conf")
		if err != nil {
			text = fmt.Sprintf("Error reading /etc/penguins-eggs.conf: %v", err)
		} else {
			text = string(content)
		}

	case "eggs://exclude-list":
		content, err := os.ReadFile("/etc/penguins-eggs.d/custom.exclude.list")
		if err != nil {
			text = fmt.Sprintf("Error reading /etc/penguins-eggs.d/custom.exclude.list: %v", err)
		} else {
			text = string(content)
		}

	case "eggs://version":
		eggsBin := getEggsBinaryPath()
		out, err := utils.ExecCaptureCombined(fmt.Sprintf("%s version", eggsBin))
		if err != nil {
			text = fmt.Sprintf("Version: %s\nError: %v", s.version, err)
		} else {
			text = out
		}

	case "eggs://status":
		d := distro.NewDistro()
		uname, _ := utils.ExecCaptureCombined("uname -a")
		isLive := utils.IsLive()
		text = fmt.Sprintf("Distribution: %s (%s)\nFamily: %s\nRelease: %s\nCodename: %s\nKernel: %sLive Environment: %v\n",
			d.DistroID, d.DistroLike, d.FamilyID, d.ReleaseID, d.CodenameID, uname, isLive)

	default:
		s.sendError(id, ErrCodeInvalidParams, fmt.Sprintf("Resource URI '%s' not found", params.URI))
		return
	}

	s.sendResponse(JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result: ResourceReadResult{
			Contents: []ResourceContent{
				{
					URI:      params.URI,
					MimeType: mimeType,
					Text:     text,
				},
			},
		},
	})
}

// getEggsBinaryPath individua il percorso del binario eggs/coa
func getEggsBinaryPath() string {
	for _, path := range []string{"/usr/bin/eggs", "/usr/local/bin/eggs", "/usr/bin/coa", "/usr/local/bin/coa"} {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	execPath, err := os.Executable()
	if err == nil {
		return execPath
	}
	return "eggs"
}
