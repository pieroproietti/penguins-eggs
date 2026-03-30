// ilf — Immutable Linux Framework CLI
//
// Dispatches all operations through the HAL to the configured backend.
// Backend is selected from ilf.toml at startup; all commands are
// backend-agnostic from the caller's perspective.
package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/ilf/core/config"
	"github.com/ilf/core/hal"
	ilfinit "github.com/ilf/core/init"
	"github.com/ilf/core/snapshot"
	"github.com/ilf/core/update"

	// Import all backend adapters so their init() functions register them.
	_ "github.com/ilf/backends/abroot"
	_ "github.com/ilf/backends/akshara"
	_ "github.com/ilf/backends/ashos"
	_ "github.com/ilf/backends/btrfsdwarfs"
	_ "github.com/ilf/backends/frzr"
	_ "github.com/ilf/backends/nixos"

	"github.com/ilf/core/mutable"
)

var (
	cfgFile string
	verbose bool
)

func main() {
	root := &cobra.Command{
		Use:   "ilf",
		Short: "Immutable Linux Framework",
		Long: `ilf manages immutable Linux systems through a unified interface.
The active backend is selected in ilf.toml ([ilf].backend).`,
		SilenceUsage: true,
	}

	root.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default: /etc/ilf/ilf.toml)")
	root.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")

	root.AddCommand(
		cmdInit(),
		cmdUpgrade(),
		cmdRollback(),
		cmdSnapshot(),
		cmdStatus(),
		cmdMutable(),
		cmdPkg(),
		cmdBackends(),
	)

	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}

// loadBackend reads config and returns the active backend.
func loadBackend() (hal.Backend, *config.ILF, error) {
	var cfg *config.ILF
	var err error
	if cfgFile != "" {
		cfg, err = config.LoadFile(cfgFile)
	} else {
		cfg, err = config.Load()
	}
	if err != nil {
		return nil, nil, err
	}
	b, err := hal.Get(cfg.ILF.Backend)
	if err != nil {
		return nil, nil, err
	}
	return b, cfg, nil
}

// ── Commands ──────────────────────────────────────────────────────────────────

func cmdInit() *cobra.Command {
	var distro, backend, arch, disk string
	var efi, encrypt bool
	var extraSubvols []string

	cmd := &cobra.Command{
		Use:   "init",
		Short: "Initialise ILF on this system",
		Long: `Partition the target disk, format filesystems, create the BTRFS subvolume
layout for the chosen backend, and run the backend's own Init() routine.

If --disk is omitted, only the backend Init() is run (useful when the disk
is already partitioned, e.g. inside a live installer that handled partitioning).`,
		RunE: func(cmd *cobra.Command, args []string) error {
			b, cfg, err := loadBackend()
			if err != nil && (distro == "" || backend == "") {
				return fmt.Errorf("init: provide --distro and --backend, or create ilf.toml first: %w", err)
			}
			if backend != "" {
				b, err = hal.Get(backend)
				if err != nil {
					return err
				}
			}

			// ── Real disk setup ───────────────────────────────────────────
			if disk != "" {
				layout := ilfinit.DiskLayout{
					Disk:         disk,
					Backend:      b.Name(),
					EFI:          efi,
					Encrypt:      encrypt,
					ExtraSubvols: extraSubvols,
				}
				if err := ilfinit.Run(layout, "/mnt"); err != nil {
					return fmt.Errorf("init: disk setup: %w", err)
				}
			}

			// ── Backend Init() ────────────────────────────────────────────
			var bcfg map[string]string
			if cfg != nil {
				bcfg = cfg.BackendConfig(b.Name())
			}
			if err := b.Init(bcfg); err != nil {
				return fmt.Errorf("init: backend: %w", err)
			}

			fmt.Printf("ilf: initialised backend %q on distro %q (%s)\n",
				b.Name(), distro, arch)
			return nil
		},
	}

	cmd.Flags().StringVar(&distro, "distro", "", "target distro (e.g. arch, debian, fedora)")
	cmd.Flags().StringVar(&backend, "backend", "", "immutability backend to use")
	cmd.Flags().StringVar(&arch, "arch", "", "target architecture (default: auto-detect)")
	cmd.Flags().StringVar(&disk, "disk", "", "target block device to partition (e.g. /dev/sda); omit to skip partitioning")
	cmd.Flags().BoolVar(&efi, "efi", true, "create an EFI System Partition (disable for BIOS/legacy boot)")
	cmd.Flags().BoolVar(&encrypt, "encrypt", false, "encrypt the root partition with LUKS")
	cmd.Flags().StringSliceVar(&extraSubvols, "extra-subvols", nil, "additional BTRFS subvolumes to create (e.g. @snapshots,@opt)")
	return cmd
}

func cmdUpgrade() *cobra.Command {
	var dryRun, force bool
	var packages []string
	cmd := &cobra.Command{
		Use:   "upgrade",
		Short: "Perform an atomic system upgrade",
		RunE: func(cmd *cobra.Command, args []string) error {
			b, cfg, err := loadBackend()
			if err != nil {
				return err
			}
			return update.Run(b, update.Options{
				DryRun:        dryRun,
				Force:         force,
				Packages:      packages,
				PreHook:       cfg.ILF.PreUpgradeHook,
				PostHook:      cfg.ILF.PostUpgradeHook,
				AutoRollback:  true,
				SnapshotLabel: "pre-upgrade",
				MaxSnapshots:  cfg.ILF.MaxSnapshots,
			})
		},
	}
	cmd.Flags().BoolVar(&dryRun, "dry-run", false, "report what would change without applying")
	cmd.Flags().BoolVar(&force, "force", false, "skip pre-flight checks")
	cmd.Flags().StringSliceVar(&packages, "pkg", nil, "additional packages to install")
	return cmd
}

func cmdRollback() *cobra.Command {
	var snapshotID string
	cmd := &cobra.Command{
		Use:   "rollback",
		Short: "Revert to the previous system state",
		RunE: func(cmd *cobra.Command, args []string) error {
			b, cfg, err := loadBackend()
			if err != nil {
				return err
			}
			mgr := snapshot.New(b, cfg.ILF.MaxSnapshots)
			return mgr.Rollback(snapshotID)
		},
	}
	cmd.Flags().StringVar(&snapshotID, "snapshot", "", "specific snapshot ID to roll back to")
	return cmd
}

func cmdSnapshot() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "snapshot",
		Short: "Manage snapshots",
	}

	var label string
	create := &cobra.Command{
		Use:   "create",
		Short: "Create a snapshot of the current root",
		RunE: func(cmd *cobra.Command, args []string) error {
			b, cfg, err := loadBackend()
			if err != nil {
				return err
			}
			mgr := snapshot.New(b, cfg.ILF.MaxSnapshots)
			id, err := mgr.Create(label)
			if err != nil {
				return err
			}
			fmt.Printf("snapshot created: %s\n", id)
			return nil
		},
	}
	create.Flags().StringVar(&label, "label", "", "human-readable label prefix")

	list := &cobra.Command{
		Use:   "list",
		Short: "List all snapshots",
		RunE: func(cmd *cobra.Command, args []string) error {
			b, cfg, err := loadBackend()
			if err != nil {
				return err
			}
			mgr := snapshot.New(b, cfg.ILF.MaxSnapshots)
			snaps, err := mgr.List()
			if err != nil {
				return err
			}
			fmt.Printf("%-20s %-30s %-10s %s\n", "ID", "NAME", "DEPLOYED", "PARENT")
			for _, s := range snaps {
				deployed := ""
				if s.Deployed {
					deployed = "*"
				}
				fmt.Printf("%-20s %-30s %-10s %s\n", s.ID, s.Name, deployed, s.Parent)
			}
			return nil
		},
	}

	var deleteID string
	del := &cobra.Command{
		Use:   "delete",
		Short: "Delete a snapshot",
		RunE: func(cmd *cobra.Command, args []string) error {
			b, cfg, err := loadBackend()
			if err != nil {
				return err
			}
			mgr := snapshot.New(b, cfg.ILF.MaxSnapshots)
			return mgr.Delete(deleteID)
		},
	}
	del.Flags().StringVar(&deleteID, "id", "", "snapshot ID to delete")
	_ = del.MarkFlagRequired("id")

	var deployID string
	deploy := &cobra.Command{
		Use:   "deploy",
		Short: "Set a snapshot as the next boot target",
		RunE: func(cmd *cobra.Command, args []string) error {
			b, cfg, err := loadBackend()
			if err != nil {
				return err
			}
			mgr := snapshot.New(b, cfg.ILF.MaxSnapshots)
			return mgr.Deploy(deployID)
		},
	}
	deploy.Flags().StringVar(&deployID, "id", "", "snapshot ID to deploy")
	_ = deploy.MarkFlagRequired("id")

	cmd.AddCommand(create, list, del, deploy)
	return cmd
}

func cmdStatus() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Display current system state",
		RunE: func(cmd *cobra.Command, args []string) error {
			b, _, err := loadBackend()
			if err != nil {
				return err
			}
			st, err := b.Status()
			if err != nil {
				return err
			}
			fmt.Printf("Backend:      %s\n", st.Backend)
			fmt.Printf("Current root: %s\n", st.CurrentRoot)
			fmt.Printf("Mutable:      %v\n", st.Mutable)
			fmt.Printf("Snapshots:    %d\n", len(st.Snapshots))
			for k, v := range st.Extra {
				fmt.Printf("  %-20s %s\n", k+":", v)
			}
			return nil
		},
	}
}

func cmdMutable() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "mutable",
		Short: "Toggle filesystem mutability",
	}

	enter := &cobra.Command{
		Use:   "enter",
		Short: "Make the root filesystem temporarily writable",
		RunE: func(cmd *cobra.Command, args []string) error {
			b, _, err := loadBackend()
			if err != nil {
				return err
			}

			// Try the backend's own implementation first.
			restore, err := b.MutableEnter()
			if err != nil && err != hal.ErrNotSupported {
				return fmt.Errorf("mutable enter: %w", err)
			}

			// Backend doesn't support it — fall back to core/mutable.
			if err == hal.ErrNotSupported {
				t := mutable.New("/", mutable.MethodBind)
				restore, err = t.Enter()
				if err != nil {
					return fmt.Errorf("mutable enter (fallback): %w", err)
				}
			}

			fmt.Println("Root is now writable. Run `ilf mutable exit` to restore immutability.")
			_ = restore // cross-process restore is handled via /run/ilf-mutable.lock
			return nil
		},
	}

	exit := &cobra.Command{
		Use:   "exit",
		Short: "Restore immutability",
		RunE: func(cmd *cobra.Command, args []string) error {
			if !mutable.LockExists() {
				return fmt.Errorf("mutable: no active session found")
			}
			if err := mutable.Exit(); err != nil {
				return fmt.Errorf("mutable exit: %w", err)
			}
			fmt.Println("Immutability restored.")
			return nil
		},
	}

	cmd.AddCommand(enter, exit)
	return cmd
}

func cmdPkg() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "pkg",
		Short: "Manage packages inside an atomic transaction",
	}

	add := &cobra.Command{
		Use:   "add [packages...]",
		Short: "Install packages atomically",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			b, _, err := loadBackend()
			if err != nil {
				return err
			}
			if !hal.Has(b, hal.CapAtomicPkg) {
				return fmt.Errorf("backend %q does not support atomic package management", b.Name())
			}
			return b.PkgAdd(args)
		},
	}

	remove := &cobra.Command{
		Use:   "remove [packages...]",
		Short: "Remove packages atomically",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			b, _, err := loadBackend()
			if err != nil {
				return err
			}
			if !hal.Has(b, hal.CapAtomicPkg) {
				return fmt.Errorf("backend %q does not support atomic package management", b.Name())
			}
			return b.PkgRemove(args)
		},
	}

	cmd.AddCommand(add, remove)
	return cmd
}

func cmdBackends() *cobra.Command {
	return &cobra.Command{
		Use:   "backends",
		Short: "List registered backends and their capabilities",
		Run: func(cmd *cobra.Command, args []string) {
			names := hal.Registered()
			fmt.Printf("%-16s %s\n", "BACKEND", "CAPABILITIES")
			for _, name := range names {
				b, _ := hal.Get(name)
				caps := describeCaps(b.Capabilities())
				fmt.Printf("%-16s %s\n", name, caps)
			}
		},
	}
}

func describeCaps(c hal.Capability) string {
	type flag struct {
		cap  hal.Capability
		name string
	}
	flags := []flag{
		{hal.CapSnapshot, "snapshot"},
		{hal.CapRollback, "rollback"},
		{hal.CapAtomicPkg, "atomic-pkg"},
		{hal.CapOCIImages, "oci-images"},
		{hal.CapMutable, "mutable"},
		{hal.CapCompression, "compression"},
		{hal.CapMultiBoot, "multi-boot"},
		{hal.CapThinProvision, "thin-provision"},
	}
	var out []string
	for _, f := range flags {
		if c&f.cap != 0 {
			out = append(out, f.name)
		}
	}
	if len(out) == 0 {
		return "(none)"
	}
	result := ""
	for i, s := range out {
		if i > 0 {
			result += ", "
		}
		result += s
	}
	return result
}
