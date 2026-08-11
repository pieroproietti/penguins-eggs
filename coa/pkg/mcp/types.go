package mcp

import "encoding/json"

// JSONRPCRequest rappresenta una richiesta JSON-RPC 2.0
type JSONRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id,omitempty"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

// JSONRPCResponse rappresenta una risposta JSON-RPC 2.0
type JSONRPCResponse struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      interface{}   `json:"id"`
	Result  interface{}   `json:"result,omitempty"`
	Error   *JSONRPCError `json:"error,omitempty"`
}

// JSONRPCError definisce l'oggetto errore di JSON-RPC 2.0
type JSONRPCError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Codici di errore standard JSON-RPC
const (
	ErrCodeParseError     = -32700
	ErrCodeInvalidRequest = -32600
	ErrCodeMethodNotFound = -32601
	ErrCodeInvalidParams  = -32602
	ErrCodeInternalError  = -32603
)

// ServerInfo specifica le informazioni del server MCP
type ServerInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// ServerCapabilities definisce le funzionalità dichiarate dal server MCP
type ServerCapabilities struct {
	Tools     map[string]interface{} `json:"tools"`
	Resources map[string]interface{} `json:"resources"`
}

// InitializeResult è la risposta al handshake `initialize`
type InitializeResult struct {
	ProtocolVersion string             `json:"protocolVersion"`
	Capabilities    ServerCapabilities `json:"capabilities"`
	ServerInfo      ServerInfo         `json:"serverInfo"`
}

// InputSchema definisce lo schema JSON per un Tool
type InputSchema struct {
	Type       string               `json:"type"`
	Properties map[string]Property `json:"properties,omitempty"`
	Required   []string             `json:"required,omitempty"`
}

// Property rappresenta un parametro nello schema di un Tool
type Property struct {
	Type        string   `json:"type"`
	Description string   `json:"description,omitempty"`
	Enum        []string `json:"enum,omitempty"`
}

// Tool rappresenta uno strumento esposto dall'MCP Server
type Tool struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema InputSchema `json:"inputSchema"`
}

// ToolsListResult è il risultato restituito da `tools/list`
type ToolsListResult struct {
	Tools []Tool `json:"tools"`
}

// ToolCallParams rappresenta i parametri ricevuti per `tools/call`
type ToolCallParams struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

// ContentItem rappresenta un frammento di contenuto di risposta Tool
type ContentItem struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// ToolCallResult rappresenta l'esito di un execution `tools/call`
type ToolCallResult struct {
	Content []ContentItem `json:"content"`
	IsError bool          `json:"isError"`
}

// Resource rappresenta una risorsa leggibile via MCP
type Resource struct {
	URI         string `json:"uri"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	MimeType    string `json:"mimeType,omitempty"`
}

// ResourcesListResult è il risultato restituito da `resources/list`
type ResourcesListResult struct {
	Resources []Resource `json:"resources"`
}

// ResourceReadParams contiene i parametri di `resources/read`
type ResourceReadParams struct {
	URI string `json:"uri"`
}

// ResourceContent descrive il contenuto di una risorsa letta
type ResourceContent struct {
	URI      string `json:"uri"`
	MimeType string `json:"mimeType"`
	Text     string `json:"text"`
}

// ResourceReadResult è il risultato restituito da `resources/read`
type ResourceReadResult struct {
	Contents []ResourceContent `json:"contents"`
}
