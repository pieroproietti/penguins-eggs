package eggs

import (
	"bufio"
	"context"
	"fmt"
	"os/exec"
	"strings"
	"sync"
)

// OutputLine represents a single line of command output.
type OutputLine struct {
	Text     string
	IsStderr bool
}

// Task represents a running eggs command.
type Task struct {
	ID       string
	Command  string
	Cancel   context.CancelFunc
	Done     chan struct{}
	ExitCode int
	mu       sync.Mutex
}

// Executor runs penguins-eggs commands and streams output.
type Executor struct {
	sudoPassword string
	eggsPath     string
	tasks        map[string]*Task
	mu           sync.RWMutex
}

// NewExecutor creates a new command executor.
func NewExecutor() *Executor {
	return &Executor{
		eggsPath: detectEggsPath(),
		tasks:    make(map[string]*Task),
	}
}

// SetSudoPassword stores the sudo password for privileged commands.
func (e *Executor) SetSudoPassword(password string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.sudoPassword = password
}

// Run executes a command and streams output line by line via the callback.
// The command string should NOT include "sudo" - use sudo=true for that.
func (e *Executor) Run(ctx context.Context, command string, sudo bool, onOutput func(OutputLine)) (int, error) {
	var cmd *exec.Cmd

	if sudo && e.sudoPassword != "" {
		// Use sudo -S to read password from stdin
		fullCmd := fmt.Sprintf("echo '%s' | sudo -S %s", e.sudoPassword, command)
		cmd = exec.CommandContext(ctx, "bash", "-c", fullCmd)
	} else if sudo {
		cmd = exec.CommandContext(ctx, "sudo", strings.Fields(command)...)
	} else {
		parts := strings.Fields(command)
		if len(parts) == 0 {
			return -1, fmt.Errorf("empty command")
		}
		cmd = exec.CommandContext(ctx, parts[0], parts[1:]...)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return -1, fmt.Errorf("stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return -1, fmt.Errorf("stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return -1, fmt.Errorf("starting command: %w", err)
	}

	var wg sync.WaitGroup

	// Stream stdout
	wg.Add(1)
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := cleanANSI(scanner.Text())
			if onOutput != nil {
				onOutput(OutputLine{Text: line, IsStderr: false})
			}
		}
	}()

	// Stream stderr
	wg.Add(1)
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := cleanANSI(scanner.Text())
			if onOutput != nil {
				onOutput(OutputLine{Text: line, IsStderr: true})
			}
		}
	}()

	wg.Wait()
	err = cmd.Wait()

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return -1, err
		}
	}

	return exitCode, nil
}

// BuildProduceCommand constructs the `eggs produce` command from options.
func BuildProduceCommand(opts ProduceOptions) string {
	cmd := "eggs produce"

	if opts.Prefix != "" {
		cmd += " --prefix " + opts.Prefix
	}
	if opts.Basename != "" {
		cmd += " --basename " + opts.Basename
	}
	if opts.Addons != "" {
		cmd += " --addons " + opts.Addons
	}
	if opts.Links != "" {
		cmd += " --links " + opts.Links
	}
	if opts.Compression == "pendrive" {
		cmd += " --pendrive"
	} else if opts.Compression == "max" {
		cmd += " --max"
	}
	if opts.Theme != "" && opts.Theme != "eggs" {
		cmd += " --theme " + opts.Theme
	}
	if len(opts.Excludes) > 0 {
		cmd += " --excludes " + strings.Join(opts.Excludes, " ")
	}
	if opts.Clone {
		cmd += " --clone"
	}
	if opts.CryptedClone {
		cmd += " --cryptedclone"
	}
	if opts.Script {
		cmd += " --script"
	}
	if opts.Unsecure {
		cmd += " --unsecure"
	}
	if opts.Yolk {
		cmd += " --yolk"
	}

	return cmd
}

// ProduceOptions holds all options for the eggs produce command.
type ProduceOptions struct {
	Prefix       string   `json:"prefix"`
	Basename     string   `json:"basename"`
	Addons       string   `json:"addons"`
	Links        string   `json:"links"`
	Compression  string   `json:"compression"`
	Theme        string   `json:"theme"`
	Excludes     []string `json:"excludes"`
	Clone        bool     `json:"clone"`
	CryptedClone bool    `json:"cryptedclone"`
	Script       bool     `json:"script"`
	Unsecure     bool     `json:"unsecure"`
	Yolk         bool     `json:"yolk"`
}

func detectEggsPath() string {
	path, err := exec.LookPath("eggs")
	if err != nil {
		return "/usr/bin/eggs"
	}
	return path
}

// cleanANSI strips ANSI escape codes from terminal output.
func cleanANSI(s string) string {
	var result strings.Builder
	i := 0
	for i < len(s) {
		if s[i] == '\x1b' {
			// Skip ESC sequence
			i++
			if i < len(s) && s[i] == '[' {
				i++
				for i < len(s) && !((s[i] >= 'A' && s[i] <= 'Z') || (s[i] >= 'a' && s[i] <= 'z')) {
					i++
				}
				if i < len(s) {
					i++ // skip the final letter
				}
			}
		} else {
			result.WriteByte(s[i])
			i++
		}
	}
	return result.String()
}
