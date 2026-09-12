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
	"path/filepath"
	"runtime"
	"strings"
	"unicode"
)

// layout descrive le partizioni calcolate per il piano.
type layout struct {
	Boot string // p5 per Spacemit RISC-V
	Esp  string // vuota su msdos
	Swap string // vuota se la swap non è una partizione
	Root string
}

// partsFor calcola i nomi delle partizioni in modo deterministico,
// così ogni modulo (partition, mount, fstab) vede lo stesso layout.
func partsFor(plan *Plan) layout {
	if plan.Mode == "coexist" {
		return layout{Esp: plan.EspPartition, Root: plan.TargetPartition}
	}
	if runtime.GOARCH == "riscv64" {
		if plan.Mode == "replace" {
			return layout{
				Boot: devPart(plan.Device, 5),
				Root: plan.TargetPartition,
			}
		}
		return layout{
			Boot: devPart(plan.Device, 5),
			Root: devPart(plan.Device, 6),
		}
	}
	if plan.Mode == "replace" {
		return layout{
			Esp:  plan.EspPartition,
			Root: plan.TargetPartition,
		}
	}
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

	if err := validatePlan(plan, c.safetyChecks()); err != nil {
		return err
	}
	switch plan.Mode {
	case "replace", "coexist":
		return runRootFormat(c)
	case "erase":
		return runErase(c)
	default:
		return fmt.Errorf("unknown installation mode %q", plan.Mode)
	}
}

func runRootFormat(c *ctx) error {
	plan := c.plan

	if plan.TargetPartition == "" {
		return fmt.Errorf("nessuna partizione target specificata per la modalità replace")
	}
	mounted, err := c.safetyChecks().inUse(plan.TargetPartition)
	if err != nil && plan.Mode == "coexist" {
		return fmt.Errorf("Coexist root safety check: %w", err)
	}
	if err == nil && mounted {
		return fmt.Errorf("la partizione %s ha partizioni o filesystem montati: smontarla prima di procedere", plan.TargetPartition)
	}
	labelArgs, err := rootFilesystemLabelArgs(plan)
	if err != nil {
		return err
	}

	c.logf("root-only mode: wiping filesystem signatures on %s", plan.TargetPartition)
	if err := c.run("wipefs", "-a", plan.TargetPartition); err != nil && plan.Mode == "coexist" {
		return err
	}
	c.logf("formatting %s as %s", plan.TargetPartition, plan.FsType)
	mkfsArgs := append(mkfsForceArgs(plan.FsType), labelArgs...)
	if err := c.run(mkfsCommand(plan.FsType), append(mkfsArgs, plan.TargetPartition)...); err != nil {
		return fmt.Errorf("formattazione %s come %s fallita: %w", plan.TargetPartition, plan.FsType, err)
	}
	_ = c.run("udevadm", "settle")
	return nil
}

// rootFilesystemLabelArgs returns label arguments only for the Coexist root.
// The existing Coexist identity is also useful as a human-readable filesystem
// label, but labels remain descriptive; fstab continues to use UUIDs.
func rootFilesystemLabelArgs(plan *Plan) ([]string, error) {
	if plan.Mode != "coexist" || plan.EFIBootloaderID == "" {
		return nil, nil
	}

	option, maxBytes := filesystemLabelSpec(plan.FsType)
	if option == "" {
		return nil, fmt.Errorf("Coexist root filesystem %q does not support a known label format", plan.FsType)
	}
	if strings.IndexByte(plan.EFIBootloaderID, 0) >= 0 {
		return nil, fmt.Errorf("Coexist root filesystem label contains NUL")
	}
	if len([]byte(plan.EFIBootloaderID)) > maxBytes {
		return nil, fmt.Errorf("Coexist root filesystem label %q is too long for %s (maximum %d bytes)", plan.EFIBootloaderID, plan.FsType, maxBytes)
	}
	return []string{option, plan.EFIBootloaderID}, nil
}

// filesystemLabelSpec describes the mkfs option and on-disk label limit for
// filesystems that Krill can use as an installation root. Keeping the limit
// here prevents mkfs from silently truncating a user-selected identity.
func filesystemLabelSpec(fs string) (option string, maxBytes int) {
	switch strings.ToLower(fs) {
	case "ext2", "ext3", "ext4", "jfs", "reiserfs":
		return "-L", 16
	case "xfs":
		return "-L", 12
	case "btrfs":
		return "-L", 256
	case "f2fs":
		return "-L", 512
	case "fat", "vfat", "fat16", "fat32":
		return "-n", 11
	case "exfat":
		return "-L", 11
	case "ntfs":
		return "-L", 128
	default:
		return "", 0
	}
}

func runErase(c *ctx) error {
	plan := c.plan
	if plan.Mode != "erase" {
		return fmt.Errorf("whole-disk partitioning requires erase mode, got %q", plan.Mode)
	}

	// Guardia: mai partizionare un disco con filesystem montati
	// (per esempio la chiavetta da cui gira il sistema live).
	if mounted, err := c.safetyChecks().inUse(plan.Device); err == nil && mounted {
		return fmt.Errorf("il device %s ha partizioni montate: scegliere un altro disco", plan.Device)
	}

	if runtime.GOARCH == "riscv64" {
		return runSpacemitPartition(c, plan)
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

	if err := c.writePartitionTable(strings.Join(lines, "\n") + "\n"); err != nil {
		return err
	}
	l := partsFor(plan)
	if l.Esp != "" {
		if err := c.formatPartition(l.Esp, "fat", ""); err != nil {
			return err
		}
	}
	if l.Swap != "" {
		if err := c.formatPartition(l.Swap, "swap", ""); err != nil {
			return err
		}
	}
	return c.formatPartition(l.Root, plan.FsType, "")
}

// Shared by Erase and the one-time Coexist preparation action. Every failure
// stops the caller, including signature removal and device-node synchronization.
func (c *ctx) writePartitionTable(script string) error {
	if err := c.run("wipefs", "-a", c.plan.Device); err != nil {
		return err
	}
	c.logf("schema sfdisk:\n%s", script)
	if err := c.runInput(script, "sfdisk", "--wipe", "always", c.plan.Device); err != nil {
		return err
	}
	return c.run("udevadm", "settle")
}

func (c *ctx) formatPartition(device, fs, label string) error {
	if err := c.run("wipefs", "-a", device); err != nil {
		return err
	}
	command, args := mkfsCommand(fs), mkfsForceArgs(fs)
	if fs == "fat" {
		args = []string{"-F32"}
	} else if fs == "swap" {
		command = "mkswap"
	}
	if label != "" {
		args = append(args, "-L", label)
	}
	return c.run(command, append(args, device)...)
}

func runSpacemitPartition(c *ctx, plan *Plan) error {
	_ = c.run("wipefs", "-a", plan.Device)

	spacemitDir := "/usr/share/penguins-eggs/spacemit"
	if !exists(spacemitDir) {
		spacemitDir = "/etc/penguins-eggs.d/spacemit"
	}
	factoryDir := filepath.Join(spacemitDir, "factory")

	if _, err := exec.LookPath("sgdisk"); err == nil {
		_ = c.run("sgdisk", "-Z", plan.Device)
		_ = c.run("sgdisk", "-o", plan.Device)

		bootinfoPath := filepath.Join(factoryDir, "bootinfo_emmc.bin")
		if exists(bootinfoPath) {
			_ = c.run("dd", "if="+bootinfoPath, "of="+plan.Device, "bs=512", "count=1", "conv=notrunc")
		}

		parts := []string{
			"1:256:767",
			"2:768:895",
			"3:2048:4095",
			"4:4096:8191",
			"5:8192:532479",
			"6:532480:0",
		}
		names := []string{"fsbl", "env", "opensbi", "uboot", "bootfs", "rootfs"}

		for i, p := range parts {
			num := fmt.Sprintf("%d", i+1)
			if err := c.run("sgdisk", "-a", "1", "-n", p, "-c", num+":"+names[i], "-t", num+":0700", plan.Device); err != nil {
				return fmt.Errorf("sgdisk partition %d failed: %w", i+1, err)
			}
		}
	} else {
		c.logf("sgdisk non trovato, uso sfdisk di fallback per il partizionamento Spacemit")
		pPrefix := plan.Device
		lastRune := rune(plan.Device[len(plan.Device)-1])
		if unicode.IsDigit(lastRune) {
			pPrefix += "p"
		}

		sfdiskScript := `label: gpt
unit: sectors
first-lba: 256

start=256, size=512, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4, name="fsbl"
start=768, size=128, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4, name="env"
start=2048, size=2048, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4, name="opensbi"
start=4096, size=4096, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4, name="uboot"
start=8192, size=524288, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4, name="bootfs"
start=532480, type=0FC63DAF-8483-4772-8E79-3D69D8477DE4, name="rootfs"
`

		c.logf("schema sfdisk Spacemit:\n%s", sfdiskScript)
		if err := c.runInput(sfdiskScript, "sfdisk", "--wipe", "always", plan.Device); err != nil {
			return fmt.Errorf("sfdisk partition failed: %w", err)
		}

		bootinfoPath := filepath.Join(factoryDir, "bootinfo_emmc.bin")
		if exists(bootinfoPath) {
			_ = c.run("dd", "if="+bootinfoPath, "of="+plan.Device, "bs=512", "count=1", "conv=notrunc")
		}
	}

	c.run("udevadm", "settle")

	l := partsFor(plan)

	fsblPath := filepath.Join(factoryDir, "FSBL.bin")
	if exists(fsblPath) {
		_ = c.run("dd", "if="+fsblPath, "of="+devPart(plan.Device, 1), "conv=fsync")
	}
	envBinPath := filepath.Join(spacemitDir, "env.bin")
	if exists(envBinPath) {
		_ = c.run("dd", "if="+envBinPath, "of="+devPart(plan.Device, 2), "conv=fsync")
	}
	fwPath := filepath.Join(spacemitDir, "fw_dynamic.itb")
	if exists(fwPath) {
		_ = c.run("dd", "if="+fwPath, "of="+devPart(plan.Device, 3), "conv=fsync")
	}
	ubootPath := filepath.Join(spacemitDir, "u-boot.itb")
	if exists(ubootPath) {
		_ = c.run("dd", "if="+ubootPath, "of="+devPart(plan.Device, 4), "conv=fsync")
	}

	_ = c.run("wipefs", "-a", l.Boot)
	if err := c.run("mkfs.ext4", "-F", "-L", "bootfs", l.Boot); err != nil {
		return fmt.Errorf("mkfs.ext4 bootfs (%s) failed: %w", l.Boot, err)
	}
	_ = c.run("wipefs", "-a", l.Root)
	if err := c.run(mkfsCommand(plan.FsType), append(mkfsForceArgs(plan.FsType), "-L", "rootfs", l.Root)...); err != nil {
		return fmt.Errorf("mkfs rootfs (%s) failed: %w", l.Root, err)
	}
	return nil
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
