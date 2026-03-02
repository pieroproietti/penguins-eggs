// Package ai provides an HTTP client for the eggs-ai API server.
//
// Drop this file into eggs-gui/tui/internal/client/ and use it
// from BubbleTea views to add AI-powered features to the TUI.
//
// Usage:
//
//	client := ai.NewClient("http://127.0.0.1:3737")
//	answer, err := client.Ask("How do I use wardrobe?")
//	diagnosis, err := client.Doctor("ISO fails to boot")
package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client connects to the eggs-ai HTTP API server.
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
	SessionID  string
}

// NewClient creates a new eggs-ai API client.
func NewClient(baseURL string) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 120 * time.Second,
		},
		SessionID: fmt.Sprintf("tui-%d", time.Now().UnixMilli()),
	}
}

// aiResponse is the standard response format from eggs-ai.
type aiResponse struct {
	Result string `json:"result"`
	Error  string `json:"error,omitempty"`
}

type statusResponse struct {
	System map[string]interface{} `json:"system"`
	Daemon interface{}            `json:"daemon"`
}

type providersResponse struct {
	Providers []string `json:"providers"`
}

func (c *Client) post(path string, body interface{}) (string, error) {
	data, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequest("POST", c.BaseURL+path, bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Session-Id", c.SessionID)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("eggs-ai not reachable: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != 200 {
		var errResp aiResponse
		json.Unmarshal(respBody, &errResp)
		return "", fmt.Errorf("eggs-ai error (%d): %s", resp.StatusCode, errResp.Error)
	}

	var result aiResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("parse response: %w", err)
	}
	return result.Result, nil
}

func (c *Client) get(path string) ([]byte, error) {
	resp, err := c.HTTPClient.Get(c.BaseURL + path)
	if err != nil {
		return nil, fmt.Errorf("eggs-ai not reachable: %w", err)
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// Health checks if the eggs-ai server is running.
func (c *Client) Health() bool {
	data, err := c.get("/api/health")
	if err != nil {
		return false
	}
	var result map[string]string
	json.Unmarshal(data, &result)
	return result["status"] == "ok"
}

// Providers returns the list of available LLM providers.
func (c *Client) Providers() ([]string, error) {
	data, err := c.get("/api/providers")
	if err != nil {
		return nil, err
	}
	var result providersResponse
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}
	return result.Providers, nil
}

// Ask sends a general question about penguins-eggs.
func (c *Client) Ask(question string) (string, error) {
	return c.post("/api/ask", map[string]string{"question": question})
}

// Doctor runs AI diagnostics.
func (c *Client) Doctor(complaint string) (string, error) {
	body := map[string]interface{}{}
	if complaint != "" {
		body["complaint"] = complaint
	}
	return c.post("/api/doctor", body)
}

// Chat sends a message in a stateful conversation.
func (c *Client) Chat(question string) (string, error) {
	return c.post("/api/chat", map[string]string{"question": question})
}

// Build generates an AI-guided build plan.
func (c *Client) Build(opts map[string]interface{}) (string, error) {
	return c.post("/api/build", map[string]interface{}{"build": opts})
}

// ConfigExplain explains the current eggs.yaml.
func (c *Client) ConfigExplain() (string, error) {
	return c.post("/api/config/explain", map[string]string{})
}

// ConfigGenerate generates an eggs.yaml for a purpose.
func (c *Client) ConfigGenerate(purpose string) (string, error) {
	return c.post("/api/config/generate", map[string]string{"purpose": purpose})
}

// Calamares gets Calamares assistance.
func (c *Client) Calamares(question string) (string, error) {
	body := map[string]interface{}{}
	if question != "" {
		body["question"] = question
	}
	return c.post("/api/calamares", body)
}

// Wardrobe gets wardrobe/costume assistance.
func (c *Client) Wardrobe(question string) (string, error) {
	body := map[string]interface{}{}
	if question != "" {
		body["question"] = question
	}
	return c.post("/api/wardrobe", body)
}
