// Package engine esegue il piano di installazione di Krill seguendo la
// sequenza exec di settings.conf: gli stessi moduli logici di Calamares,
// implementati in Go. Il log dettagliato finisce in /var/log/krill.log.
package engine

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// DefaultTarget è il mount point del sistema in installazione.
// Il nome imita Calamares di proposito: gli script shellprocess esistenti
// (oa-bridge.sh) trovano il target cercando /tmp/calamares-root-*.
const DefaultTarget = "/tmp/calamares-root-krill"

const logPath = "/var/log/krill.log"

// Plan raccoglie tutte le scelte necessarie all'installazione.
type Plan struct {
	ConfigRoot string            // /etc/penguins-eggs.d/installer.d
	Exec       []string          // sequenza moduli da settings.conf
	Instances  map[string]string // id shellprocess -> file di configurazione

	// Disco
	Device    string // es. /dev/sda
	TableType string // gpt | msdos
	FsType    string // ext4, btrfs, ...
	Swap      string // none | small | suspend | file

	// Utente e sistema
	Fullname  string
	Login     string
	UserPass  string
	RootPass  string // vuota = uguale a quella utente
	Hostname  string
	Autologin bool
	Shell     string
	Groups    []string

	// Localizzazione
	Language  string // es. it_IT.UTF-8
	Region    string // es. Europe
	Zone      string // es. Rome
	KbdModel  string // es. pc105
	KbdLayout string // es. us

	// Rete (NetType "static" scrive la configurazione nel target;
	// "dhcp" non fa nulla: il sistema installato eredita il default)
	NetIface   string
	NetType    string // dhcp | static
	NetAddress string
	NetNetmask string
	NetGateway string
	NetDns     string

	// Sorgente e pulizia
	UnpackSource string // squashfs da scompattare
	RemoveUser   string // utente live da rimuovere

	Target string // mount point, default DefaultTarget
}

// Event è il progresso comunicato alla UI (TUI o console).
type Event struct {
	Index   int
	Total   int
	Module  string
	Message string
}

// labels traduce i nomi dei moduli in messaggi leggibili.
var labels = map[string]string{
	"partition":      "Partitioning disk",
	"mount":          "Mounting filesystems",
	"unpackfs":       "Copying filesystem (this takes a while)",
	"machineid":      "Resetting machine-id",
	"fstab":          "Writing fstab",
	"locale":         "Configuring locale and timezone",
	"keyboard":       "Configuring keyboard",
	"localecfg":      "Configuring locale (cfg)",
	"users":          "Creating user",
	"networkcfg":     "Configuring network",
	"displaymanager": "Configuring display manager",
	"removeuser":     "Removing live user",
	"umount":         "Unmounting filesystems",
}

func labelFor(module string) string {
	if l, ok := labels[module]; ok {
		return l
	}
	if strings.HasPrefix(module, "shellprocess@") {
		return "Running " + strings.TrimPrefix(module, "shellprocess@")
	}
	return "Running " + module
}

// ctx è lo stato condiviso tra i moduli durante l'esecuzione.
type ctx struct {
	plan   *Plan
	log    *os.File
	mounts []string // mount point attivi, in ordine di mount
}

type moduleFunc func(*ctx) error

func modules() map[string]moduleFunc {
	return map[string]moduleFunc{
		"partition":      runPartition,
		"mount":          runMount,
		"unpackfs":       runUnpackfs,
		"machineid":      runMachineid,
		"fstab":          runFstab,
		"locale":         runLocale,
		"keyboard":       runKeyboard,
		"localecfg":      runNoop, // coperto dal modulo locale
		"users":          runUsers,
		"networkcfg":     runNetworkcfg, // modulo solo-Krill, non esiste in Calamares
		"displaymanager": runDisplaymanager,
		"removeuser":     runRemoveuser,
		"umount":         runUmount,
	}
}

// Run esegue il piano. progress viene chiamata all'inizio di ogni modulo
// e una volta alla fine; in caso di errore tenta comunque lo smontaggio.
func Run(plan *Plan, progress func(Event)) error {
	if plan.Target == "" {
		plan.Target = DefaultTarget
	}

	logFile, err := os.Create(logPath)
	if err != nil {
		return fmt.Errorf("unable to create %s: %w", logPath, err)
	}
	defer logFile.Close()

	c := &ctx{plan: plan, log: logFile}
	c.logf("=== krill install: device=%s fs=%s swap=%s target=%s ===",
		plan.Device, plan.FsType, plan.Swap, plan.Target)

	total := len(plan.Exec)
	for i, name := range plan.Exec {
		progress(Event{Index: i, Total: total, Module: name, Message: labelFor(name)})
		c.logf("--- module %d/%d: %s ---", i+1, total, name)

		var err error
		switch {
		case strings.HasPrefix(name, "shellprocess@"):
			err = c.runShellprocess(strings.TrimPrefix(name, "shellprocess@"))
		default:
			fn, ok := modules()[name]
			if !ok {
				c.logf("unknown module '%s': skipped", name)
				continue
			}
			err = fn(c)
		}

		if err != nil {
			c.logf("ERROR in module %s: %v", name, err)
			runUmount(c) // non lasciamo il sistema live con i mount appesi
			return fmt.Errorf("module %s: %w (details in %s)", name, err, logPath)
		}
	}

	progress(Event{Index: total, Total: total, Module: "done", Message: "Installation complete"})
	c.logf("=== installation completed ===")
	return nil
}

func runNoop(c *ctx) error { return nil }

// --- HELPER DI ESECUZIONE ---

func (c *ctx) logf(format string, a ...any) {
	fmt.Fprintf(c.log, format+"\n", a...)
}

// run esegue un comando sul sistema live, loggando comando e output.
func (c *ctx) run(name string, args ...string) error {
	return c.runInput("", name, args...)
}

// runInput come run, ma con input passato sullo stdin del comando.
func (c *ctx) runInput(input, name string, args ...string) error {
	c.logf("$ %s %s", name, strings.Join(args, " "))
	cmd := exec.Command(name, args...)
	if input != "" {
		cmd.Stdin = strings.NewReader(input)
	}
	cmd.Stdout = c.log
	cmd.Stderr = c.log
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("%s: %w", name, err)
	}
	return nil
}

// chroot esegue un comando dentro il target, garantendo i mount di sistema.
func (c *ctx) chroot(args ...string) error {
	return c.chrootInput("", args...)
}

func (c *ctx) chrootInput(input string, args ...string) error {
	if err := c.ensureChrootMounts(); err != nil {
		return err
	}
	return c.runInput(input, "chroot", append([]string{c.plan.Target}, args...)...)
}

// tpath restituisce un percorso dentro il target.
func (c *ctx) tpath(parts ...string) string {
	return filepath.Join(append([]string{c.plan.Target}, parts...)...)
}

// exists verifica l'esistenza di un percorso.
func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
