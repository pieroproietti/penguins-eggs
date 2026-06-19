package engine

import (
	"fmt"
	"os"
	"strings"
)

func runUsers(c *ctx) error {
	plan := c.plan

	shell := plan.Shell
	if shell == "" {
		shell = "/bin/bash"
	}

	args := []string{"useradd", "-m", "-s", shell, "-c", plan.Fullname}
	if groups := c.existingGroups(plan.Groups); len(groups) > 0 {
		args = append(args, "-G", strings.Join(groups, ","))
	}
	args = append(args, plan.Login)
	if err := c.chroot(args...); err != nil {
		return err
	}

	if plan.UserPass == "" {
		return fmt.Errorf("empty user password")
	}
	if err := c.chrootInput(plan.Login+":"+plan.UserPass+"\n", "chpasswd"); err != nil {
		return err
	}
	rootPass := plan.RootPass
	if rootPass == "" {
		rootPass = plan.UserPass
	}
	if err := c.chrootInput("root:"+rootPass+"\n", "chpasswd"); err != nil {
		return err
	}

	// Hostname
	if plan.Hostname != "" {
		if err := os.WriteFile(c.tpath("etc", "hostname"), []byte(plan.Hostname+"\n"), 0644); err != nil {
			return err
		}
		hosts := fmt.Sprintf("127.0.0.1\tlocalhost\n127.0.1.1\t%s\n\n::1\tlocalhost ip6-localhost ip6-loopback\n", plan.Hostname)
		if err := os.WriteFile(c.tpath("etc", "hosts"), []byte(hosts), 0644); err != nil {
			return err
		}
	}
	return nil
}

// existingGroups filtra i gruppi del piano lasciando solo quelli che
// esistono davvero nel target (i gruppi del live possono differire).
func (c *ctx) existingGroups(groups []string) []string {
	data, err := os.ReadFile(c.tpath("etc", "group"))
	if err != nil {
		c.logf("reading target /etc/group failed: %v", err)
		return nil
	}
	content := string(data)
	var valid []string
	for _, g := range groups {
		if strings.HasPrefix(content, g+":") || strings.Contains(content, "\n"+g+":") {
			valid = append(valid, g)
		}
	}
	return valid
}

func runDisplaymanager(c *ctx) error {
	if !c.plan.Autologin {
		return nil
	}
	login := c.plan.Login

	// lightdm
	if exists(c.tpath("etc", "lightdm")) {
		// lightdm.conf (il file principale) viene letto DOPO i drop-in di
		// lightdm.conf.d, quindi un vecchio blocco [Seat:*] ereditato dalla
		// live (es. autologin-user=live, ormai rimosso) vincerebbe comunque
		// sulla nostra 90-autologin.conf: lo svuotiamo prima di scriverla.
		stripLightdmAutologinKeys(c.tpath("etc", "lightdm", "lightdm.conf"))

		dir := c.tpath("etc", "lightdm", "lightdm.conf.d")
		os.MkdirAll(dir, 0755)
		conf := fmt.Sprintf("[Seat:*]\nautologin-user=%s\nautologin-user-timeout=0\n", login)
		os.WriteFile(dir+"/90-autologin.conf", []byte(conf), 0644)
		c.logf("autologin lightdm configured for %s", login)
	}

	// sddm
	if exists(c.tpath("usr", "bin", "sddm")) || exists(c.tpath("etc", "sddm.conf.d")) {
		dir := c.tpath("etc", "sddm.conf.d")
		os.MkdirAll(dir, 0755)
		conf := fmt.Sprintf("[Autologin]\nUser=%s\nRelogin=false\n", login)
		os.WriteFile(dir+"/autologin.conf", []byte(conf), 0644)
		c.logf("autologin sddm configured for %s", login)
	}

	// gdm3 / gdm
	for _, gdm := range []string{"gdm3", "gdm"} {
		custom := c.tpath("etc", gdm, "custom.conf")
		if exists(custom) {
			data, _ := os.ReadFile(custom)
			content := string(data)
			autologin := fmt.Sprintf("AutomaticLoginEnable=true\nAutomaticLogin=%s", login)
			if strings.Contains(content, "[daemon]") {
				content = strings.Replace(content, "[daemon]", "[daemon]\n"+autologin, 1)
			} else {
				content = "[daemon]\n" + autologin + "\n" + content
			}
			os.WriteFile(custom, []byte(content), 0644)
			c.logf("autologin %s configured for %s", gdm, login)
		}
	}
	return nil
}

// stripLightdmAutologinKeys rimuove le righe autologin-* dal lightdm.conf
// principale, ovunque si trovino: i blocchi [Seat:*] residui della live
// (es. autologin-user=live) hanno la precedenza sui drop-in di conf.d e
// vanno eliminati, non semplicemente ignorati.
func stripLightdmAutologinKeys(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	keys := []string{"autologin-user=", "autologin-user-timeout=", "autologin-session=", "autologin-guest="}
	lines := strings.Split(string(data), "\n")
	kept := lines[:0]
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		stale := false
		for _, k := range keys {
			if strings.HasPrefix(trimmed, k) {
				stale = true
				break
			}
		}
		if !stale {
			kept = append(kept, line)
		}
	}
	os.WriteFile(path, []byte(strings.Join(kept, "\n")), 0644)
}

func runRemoveuser(c *ctx) error {
	user := c.plan.RemoveUser
	if user == "" || user == c.plan.Login {
		return nil
	}
	if err := c.chroot("userdel", "-r", user); err != nil {
		c.logf("userdel %s failed (non-fatal): %v", user, err)
	}
	return nil
}
