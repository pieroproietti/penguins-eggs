// Mount del target e dei filesystem di sistema necessari al chroot,
// più lo smontaggio finale in ordine inverso.
package engine

import (
	"os"
)

func runMount(c *ctx) error {
	plan := c.plan
	l := partsFor(plan)

	if err := os.MkdirAll(plan.Target, 0755); err != nil {
		return err
	}
	if err := c.mount(l.Root, plan.Target); err != nil {
		return err
	}

	if l.Esp != "" {
		espDir := c.tpath("boot", "efi")
		if err := os.MkdirAll(espDir, 0755); err != nil {
			return err
		}
		if err := c.mount(l.Esp, espDir); err != nil {
			return err
		}
	}
	return nil
}

// mount esegue il mount e lo registra per lo smontaggio inverso.
func (c *ctx) mount(args ...string) error {
	mountPoint := args[len(args)-1]
	if err := c.run("mount", args...); err != nil {
		return err
	}
	c.mounts = append(c.mounts, mountPoint)
	return nil
}

// ensureChrootMounts monta i filesystem di sistema dentro il target
// (la lista rispecchia gli extraMounts di mount.conf). È idempotente:
// viene chiamata dal primo modulo che ha bisogno del chroot.
func (c *ctx) ensureChrootMounts() error {
	proc := c.tpath("proc")
	for _, m := range c.mounts {
		if m == proc {
			return nil // già fatto
		}
	}

	type sysMount struct {
		args []string
		dir  string
	}
	mounts := []sysMount{
		{[]string{"-t", "proc", "proc"}, c.tpath("proc")},
		{[]string{"-t", "sysfs", "sys"}, c.tpath("sys")},
		{[]string{"--bind", "/dev"}, c.tpath("dev")},
		{[]string{"-t", "devpts", "devpts"}, c.tpath("dev", "pts")},
		{[]string{"-t", "tmpfs", "tmpfs"}, c.tpath("run")},
	}
	if exists("/run/udev") {
		mounts = append(mounts, sysMount{[]string{"--bind", "/run/udev"}, c.tpath("run", "udev")})
	}
	if exists("/sys/firmware/efi/efivars") {
		mounts = append(mounts, sysMount{[]string{"-t", "efivarfs", "efivarfs"}, c.tpath("sys", "firmware", "efi", "efivars")})
	}

	for _, m := range mounts {
		if err := os.MkdirAll(m.dir, 0755); err != nil {
			return err
		}
		if err := c.mount(append(m.args, m.dir)...); err != nil {
			return err
		}
	}
	return nil
}

// runUmount smonta tutto in ordine inverso. Gli errori vengono solo
// loggati: a fine installazione meglio un umount pigro che un blocco.
func runUmount(c *ctx) error {
	for i := len(c.mounts) - 1; i >= 0; i-- {
		if err := c.run("umount", c.mounts[i]); err != nil {
			c.logf("umount %s failed, retrying lazy", c.mounts[i])
			c.run("umount", "-l", c.mounts[i])
		}
	}
	c.mounts = nil
	return nil
}
