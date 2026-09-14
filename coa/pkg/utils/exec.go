package utils

import (
	"bytes"
	"os"
	"os/exec"
	"strings"
)

func ensureRootPath() {
	const defaultPath = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

	current := os.Getenv("PATH")
	if current == "" {
		os.Setenv("PATH", defaultPath)
		return
	}

	for _, dir := range []string{"/usr/sbin", "/sbin", "/usr/local/sbin"} {
		if !strings.Contains(current, dir) {
			current += ":" + dir
		}
	}
	os.Setenv("PATH", current)
}

// Exec esegue un comando sh e mostra l'output in tempo reale sul terminale.
// stdin è collegato al terminale corrente in modo che i programmi interattivi
// (es. debconf con frontend readline) possano leggere l'input dell'utente.
func Exec(command string) error {
	ensureRootPath()

	cmd := exec.Command("sh", "-c", command)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// ExecQuiet esegue un comando senza mostrare nulla (utile per update veloci)
func ExecQuiet(command string) error {
	ensureRootPath()

	cmd := exec.Command("sh", "-c", command)
	return cmd.Run()
}

// ExecCapture esegue un comando e restituisce l'output come stringa
// Fondamentale per getAvailablePackages (apt-cache pkgnames) ecc.
func ExecCapture(command string) (string, error) {
	ensureRootPath()

	var out bytes.Buffer
	cmd := exec.Command("sh", "-c", command)
	cmd.Stdout = &out
	err := cmd.Run()
	return out.String(), err
}

// ExecCaptureCombined esegue un comando e restituisce sia stdout che stderr integrati come stringa
func ExecCaptureCombined(command string) (string, error) {
	ensureRootPath()

	var out bytes.Buffer
	cmd := exec.Command("sh", "-c", command)
	cmd.Stdout = &out
	cmd.Stderr = &out
	err := cmd.Run()
	return out.String(), err
}
