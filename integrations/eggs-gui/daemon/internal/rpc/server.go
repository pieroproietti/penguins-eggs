package rpc

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"sync"

	"github.com/eggs-gui/daemon/internal/config"
	"github.com/eggs-gui/daemon/internal/eggs"
	"github.com/eggs-gui/daemon/internal/iso"
	"github.com/eggs-gui/daemon/internal/system"
	"github.com/eggs-gui/daemon/internal/wardrobe"
)

const SocketPath = "/tmp/eggs-gui.sock"

// Request represents a JSON-RPC 2.0 request.
type Request struct {
	JSONRPC string          `json:"jsonrpc"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
	ID      *json.RawMessage `json:"id,omitempty"`
}

// Response represents a JSON-RPC 2.0 response.
type Response struct {
	JSONRPC string          `json:"jsonrpc"`
	Result  interface{}     `json:"result,omitempty"`
	Error   *RPCError       `json:"error,omitempty"`
	ID      *json.RawMessage `json:"id"`
}

// RPCError represents a JSON-RPC error.
type RPCError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Notification represents a JSON-RPC 2.0 notification (no id).
type Notification struct {
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params"`
}

// Server is the JSON-RPC server that exposes the eggs-gui API.
type Server struct {
	executor *eggs.Executor
	listener net.Listener
	clients  map[net.Conn]struct{}
	mu       sync.RWMutex
}

// NewServer creates a new RPC server.
func NewServer() *Server {
	return &Server{
		executor: eggs.NewExecutor(),
		clients:  make(map[net.Conn]struct{}),
	}
}

// Start begins listening on the Unix socket.
func (s *Server) Start() error {
	// Remove stale socket
	os.Remove(SocketPath)

	listener, err := net.Listen("unix", SocketPath)
	if err != nil {
		return fmt.Errorf("listening on %s: %w", SocketPath, err)
	}
	s.listener = listener

	// Make socket accessible
	os.Chmod(SocketPath, 0666)

	log.Printf("eggs-gui daemon listening on %s", SocketPath)

	for {
		conn, err := listener.Accept()
		if err != nil {
			if s.listener == nil {
				return nil // server stopped
			}
			log.Printf("accept error: %v", err)
			continue
		}

		s.mu.Lock()
		s.clients[conn] = struct{}{}
		s.mu.Unlock()

		go s.handleConnection(conn)
	}
}

// Stop shuts down the server.
func (s *Server) Stop() {
	if s.listener != nil {
		s.listener.Close()
		s.listener = nil
	}
	os.Remove(SocketPath)
}

func (s *Server) handleConnection(conn net.Conn) {
	defer func() {
		s.mu.Lock()
		delete(s.clients, conn)
		s.mu.Unlock()
		conn.Close()
	}()

	decoder := json.NewDecoder(conn)
	encoder := json.NewEncoder(conn)

	for {
		var req Request
		if err := decoder.Decode(&req); err != nil {
			if err != io.EOF {
				log.Printf("decode error: %v", err)
			}
			return
		}

		resp := s.dispatch(&req, conn)
		if req.ID != nil {
			if err := encoder.Encode(resp); err != nil {
				log.Printf("encode error: %v", err)
				return
			}
		}
	}
}

func (s *Server) dispatch(req *Request, conn net.Conn) *Response {
	resp := &Response{
		JSONRPC: "2.0",
		ID:      req.ID,
	}

	switch req.Method {
	// Config methods
	case "config.read":
		cfg, err := config.ReadEggsConfig()
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = cfg
		}

	case "config.readTools":
		cfg, err := config.ReadToolsConfig()
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = cfg
		}

	// System methods
	case "system.versions":
		resp.Result = system.GetVersions()

	case "system.checkDeps":
		resp.Result = system.CheckDeps()

	case "system.sudoAuth":
		var params struct {
			Password string `json:"password"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			resp.Error = &RPCError{Code: -32602, Message: "invalid params"}
		} else {
			s.executor.SetSudoPassword(params.Password)
			resp.Result = map[string]bool{"authenticated": true}
		}

	// Eggs command methods
	case "eggs.produce":
		var opts eggs.ProduceOptions
		if err := json.Unmarshal(req.Params, &opts); err != nil {
			resp.Error = &RPCError{Code: -32602, Message: "invalid params"}
		} else {
			cmd := eggs.BuildProduceCommand(opts)
			exitCode, err := s.executor.Run(context.Background(), cmd, true, func(line eggs.OutputLine) {
				s.sendNotification(conn, "stream.output", map[string]interface{}{
					"line":     line.Text,
					"isStderr": line.IsStderr,
				})
			})
			if err != nil {
				resp.Error = &RPCError{Code: -32000, Message: err.Error()}
			} else {
				resp.Result = map[string]int{"exitCode": exitCode}
			}
		}

	case "eggs.kill":
		exitCode, err := s.executor.Run(context.Background(), "eggs kill -n", true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	case "eggs.dad":
		var params struct {
			Default bool `json:"default"`
		}
		json.Unmarshal(req.Params, &params)
		cmd := "eggs dad"
		if params.Default {
			cmd += " -d"
		}
		exitCode, err := s.executor.Run(context.Background(), cmd, true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	case "eggs.status":
		exitCode, err := s.executor.Run(context.Background(), "eggs status", false, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	// Calamares
	case "calamares.install":
		exitCode, err := s.executor.Run(context.Background(), "eggs calamares --install", true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	case "calamares.remove":
		exitCode, err := s.executor.Run(context.Background(), "eggs calamares --remove --nointeractive", true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	// Tools
	case "tools.clean":
		exitCode, err := s.executor.Run(context.Background(), "eggs tools clean -n", true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	case "tools.ppa.add":
		exitCode, err := s.executor.Run(context.Background(), "eggs tools ppa --add --nointeractive", true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	case "tools.ppa.remove":
		exitCode, err := s.executor.Run(context.Background(), "eggs tools ppa --remove --nointeractive", true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	case "tools.skel":
		exitCode, err := s.executor.Run(context.Background(), "eggs tools skel --nointeractive", true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	case "tools.yolk":
		exitCode, err := s.executor.Run(context.Background(), "eggs tools yolk --nointeractive", true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	// Wardrobe
	case "wardrobe.list":
		contents, err := wardrobe.List()
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = contents
		}

	case "wardrobe.show":
		var params struct {
			Category string `json:"category"`
			Name     string `json:"name"`
			Distro   string `json:"distro"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			resp.Error = &RPCError{Code: -32602, Message: "invalid params"}
		} else {
			content, err := wardrobe.ShowContent(params.Category, params.Name, params.Distro)
			if err != nil {
				resp.Error = &RPCError{Code: -32000, Message: err.Error()}
			} else {
				resp.Result = map[string]string{"content": content}
			}
		}

	case "wardrobe.get":
		exitCode, err := s.executor.Run(context.Background(), "eggs wardrobe get --nointeractive", true, func(line eggs.OutputLine) {
			s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
		})
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = map[string]int{"exitCode": exitCode}
		}

	case "wardrobe.wear":
		var params struct {
			Costume string `json:"costume"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			resp.Error = &RPCError{Code: -32602, Message: "invalid params"}
		} else {
			cmd := "eggs wardrobe wear"
			if params.Costume != "" {
				cmd += " " + params.Costume
			}
			exitCode, err := s.executor.Run(context.Background(), cmd, true, func(line eggs.OutputLine) {
				s.sendNotification(conn, "stream.output", map[string]interface{}{"line": line.Text})
			})
			if err != nil {
				resp.Error = &RPCError{Code: -32000, Message: err.Error()}
			} else {
				resp.Result = map[string]int{"exitCode": exitCode}
			}
		}

	// ISO
	case "iso.list":
		cfg, _ := config.ReadEggsConfig()
		dir := "/home/eggs"
		if cfg != nil && cfg.SnapshotDir != "" {
			dir = cfg.SnapshotDir
		}
		isos, err := iso.List(dir)
		if err != nil {
			resp.Error = &RPCError{Code: -32000, Message: err.Error()}
		} else {
			resp.Result = isos
		}

	case "iso.size":
		var params struct {
			Path string `json:"path"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			resp.Error = &RPCError{Code: -32602, Message: "invalid params"}
		} else {
			info, err := os.Stat(params.Path)
			if err != nil {
				resp.Error = &RPCError{Code: -32000, Message: err.Error()}
			} else {
				resp.Result = map[string]interface{}{
					"bytes":     info.Size(),
					"formatted": iso.FormatSize(info.Size()),
				}
			}
		}

	default:
		resp.Error = &RPCError{Code: -32601, Message: fmt.Sprintf("method not found: %s", req.Method)}
	}

	return resp
}

func (s *Server) sendNotification(conn net.Conn, method string, params interface{}) {
	notif := Notification{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
	}
	data, err := json.Marshal(notif)
	if err != nil {
		return
	}
	data = append(data, '\n')
	conn.Write(data)
}
