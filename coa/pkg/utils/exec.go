package utils

import (
	"bytes"
	"os"
	"os/exec"
)

func ensureRootPath() {
	if os.Geteuid() != 0 {
		return
	}

	const rootPath = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

	if os.Getenv("PATH") != rootPath {
		os.Setenv("PATH", rootPath)
	}
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
	return out.String(), cmd.Run()
}
