package client

import (
	"encoding/json"
	"fmt"
	"net"
	"sync"
	"sync/atomic"
)

const SocketPath = "/tmp/eggs-gui.sock"

// Request represents a JSON-RPC 2.0 request.
type Request struct {
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
	ID      int64       `json:"id"`
}

// Response represents a JSON-RPC 2.0 response.
type Response struct {
	JSONRPC string          `json:"jsonrpc"`
	Result  json.RawMessage `json:"result,omitempty"`
	Error   *RPCError       `json:"error,omitempty"`
	ID      *int64          `json:"id,omitempty"`
	Method  string          `json:"method,omitempty"` // for notifications
	Params  json.RawMessage `json:"params,omitempty"` // for notifications
}

// RPCError represents a JSON-RPC error.
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *RPCError) Error() string {
	return fmt.Sprintf("RPC error %d: %s", e.Code, e.Message)
}

// Client connects to the eggs-gui daemon via Unix socket.
type Client struct {
	conn    net.Conn
	encoder *json.Encoder
	decoder *json.Decoder
	nextID  atomic.Int64
	mu      sync.Mutex

	// OnNotification is called for streaming notifications from the daemon.
	OnNotification func(method string, params json.RawMessage)
}

// Connect establishes a connection to the daemon.
func Connect() (*Client, error) {
	conn, err := net.Dial("unix", SocketPath)
	if err != nil {
		return nil, fmt.Errorf("connecting to daemon: %w", err)
	}

	c := &Client{
		conn:    conn,
		encoder: json.NewEncoder(conn),
		decoder: json.NewDecoder(conn),
	}
	return c, nil
}

// Close closes the connection.
func (c *Client) Close() error {
	return c.conn.Close()
}

// Call makes a JSON-RPC call and returns the result.
func (c *Client) Call(method string, params interface{}) (json.RawMessage, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	id := c.nextID.Add(1)
	req := Request{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      id,
	}

	if err := c.encoder.Encode(req); err != nil {
		return nil, fmt.Errorf("encoding request: %w", err)
	}

	// Read responses, dispatching notifications until we get our response
	for {
		var resp Response
		if err := c.decoder.Decode(&resp); err != nil {
			return nil, fmt.Errorf("decoding response: %w", err)
		}

		// Check if this is a notification (no id, has method)
		if resp.ID == nil && resp.Method != "" {
			if c.OnNotification != nil {
				c.OnNotification(resp.Method, resp.Params)
			}
			continue
		}

		// This is our response
		if resp.Error != nil {
			return nil, resp.Error
		}
		return resp.Result, nil
	}
}

// CallStream makes a JSON-RPC call that streams output via notifications.
// The onLine callback receives each output line. Returns when the command completes.
func (c *Client) CallStream(method string, params interface{}, onLine func(line string)) (json.RawMessage, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	id := c.nextID.Add(1)
	req := Request{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      id,
	}

	if err := c.encoder.Encode(req); err != nil {
		return nil, fmt.Errorf("encoding request: %w", err)
	}

	for {
		var resp Response
		if err := c.decoder.Decode(&resp); err != nil {
			return nil, fmt.Errorf("decoding response: %w", err)
		}

		if resp.ID == nil && resp.Method == "stream.output" {
			var output struct {
				Line string `json:"line"`
			}
			json.Unmarshal(resp.Params, &output)
			if onLine != nil {
				onLine(output.Line)
			}
			continue
		}

		if resp.Error != nil {
			return nil, resp.Error
		}
		return resp.Result, nil
	}
}
