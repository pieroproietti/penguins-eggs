// Partizionamento e creazione filesystem. Layout coerente con il
// partition.conf generato dalla pipeline: su gpt una ESP da 300MiB più
// root, su msdos solo root avviabile; la swap (se scelta) è una
// partizione dedicata prima della root.
package engine

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"unicode"
)

// layout descrive le partizioni calcolate per il piano.
type layout struct {
	Esp  string // vuota su msdos
	Swap string // vuota se la swap non è una partizione
	Root string
}

// partsFor calcola i nomi delle partizioni in modo deterministico,
// così ogni modulo (partition, mount, fstab) vede lo stesso layout.
func partsFor(plan *Plan) layout {
	n := 1
	var l layout
	if plan.TableType == "gpt" {
		l.Esp = devPart(plan.Device, n)
		n++
	}
	if swapSizeMiB(plan.Swap) > 0 {
		l.Swap = devPart(plan.Device, n)
		n++
	}
	l.Root = devPart(plan.Device, n)
	return l
}

// devPart compone il nome di una partizione: /dev/sda1, /dev/nvme0n1p1.
func devPart(device string, n int) string {
	last := rune(device[len(device)-1])
	if unicode.IsDigit(last) {
		return fmt.Sprintf("%sp%d", device, n)
	}
	return fmt.Sprintf("%s%d", device, n)
}

// swapSizeMiB restituisce la taglia della partizione di swap in MiB.
func swapSizeMiB(choice string) int {
	switch choice {
	case "small":
		return 2048
	case "suspend":
		return ramSizeMiB()
	default: // none, file
		return 0
	}
}

// ramSizeMiB legge la RAM totale da /proc/meminfo (fallback 2GiB).
func ramSizeMiB() int {
	file, err := os.Open("/proc/meminfo")
	if err != nil {
		return 2048
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) >= 2 && fields[0] == "MemTotal:" {
			var kb int
			fmt.Sscanf(fields[1], "%d", &kb)
			if kb > 0 {
				return kb / 1024
			}
		}
	}
	return 2048
}

func runPartition(c *ctx) error {
	plan := c.plan

	// Guardia: mai partizionare un disco con filesystem montati
	// (per esempio la chiavetta da cui gira il sistema live).
	if mounted, err := deviceInUse(plan.Device); err == nil && mounted {
		return fmt.Errorf("il device %s ha partizioni montate: scegliere un altro disco", plan.Device)
	}

	if err := c.run("wipefs", "-a", plan.Device); err != nil {
		return err
	}

	// Script per sfdisk: U = EFI System, S = swap, L = Linux.
	var lines []string
	if plan.TableType == "gpt" {
		lines = append(lines, "label: gpt", ",300MiB,U")
	} else {
		lines = append(lines, "label: dos")
	}
	if size := swapSizeMiB(plan.Swap); size > 0 {
		lines = append(lines, fmt.Sprintf(",%dMiB,S", size))
	}
	if plan.TableType == "gpt" {
		lines = append(lines, ",,L")
	} else {
		lines = append(lines, ",,L,*") // root avviabile su msdos
	}

	script := strings.Join(lines, "\n") + "\n"
	c.logf("schema sfdisk:\n%s", script)
	if err := c.runInput(script, "sfdisk", "--wipe", "always", plan.Device); err != nil {
		return err
	}

	// Lasciamo il tempo a udev di creare i device node delle partizioni.
	c.run("udevadm", "settle")

	l := partsFor(plan)
	if l.Esp != "" {
		_ = c.run("wipefs", "-a", l.Esp)
		if err := c.run("mkfs.fat", "-F32", l.Esp); err != nil {
			return err
		}
	}
	if l.Swap != "" {
		_ = c.run("wipefs", "-a", l.Swap)
		if err := c.run("mkswap", l.Swap); err != nil {
			return err
		}
	}
	_ = c.run("wipefs", "-a", l.Root)
	return c.run(mkfsCommand(plan.FsType), append(mkfsForceArgs(plan.FsType), l.Root)...)
}

// deviceInUse verifica se il device ha partizioni con mount point attivi.
func deviceInUse(device string) (bool, error) {
	out, err := exec.Command("lsblk", "-no", "MOUNTPOINTS", device).Output()
	if err != nil {
		return false, err
	}
	return strings.TrimSpace(string(out)) != "", nil
}

func mkfsCommand(fs string) string {
	return "mkfs." + fs
}

// mkfsForceArgs evita la richiesta di conferma interattiva dei vari mkfs.
func mkfsForceArgs(fs string) []string {
	switch fs {
	case "ext4", "ext3", "ext2":
		return []string{"-F"}
	case "btrfs", "xfs", "f2fs":
		return []string{"-f"}
	case "jfs":
		return []string{"-q"}
	default:
		return nil
	}
}
