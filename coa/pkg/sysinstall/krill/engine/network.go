// Modulo networkcfg: configurazione di rete statica nel target.
// È un modulo solo-Krill (Calamares non configura la rete): viene
// inserito nella sequenza da buildPlan, senza toccare settings.conf.
// Con NetType "dhcp" non fa nulla: il sistema installato eredita il
// comportamento di default della propria distribuzione.
package engine

import (
	"fmt"
	"net"
	"os"
	"strings"
)

func runNetworkcfg(c *ctx) error {
	p := c.plan
	if p.NetType != "static" || p.NetAddress == "" {
		c.logf("rete: dhcp, nessuna configurazione da scrivere")
		return nil
	}

	iface := p.NetIface
	if iface == "" {
		iface = "eth0"
	}
	prefix := maskToPrefix(p.NetNetmask)
	cidr := fmt.Sprintf("%s/%d", p.NetAddress, prefix)
	wrote := false

	// Netplan (Ubuntu, etc.)
	if exists(c.tpath("etc", "netplan")) {
		renderer := "networkd"
		if exists(c.tpath("etc", "NetworkManager")) {
			renderer = "NetworkManager"
		}

		var dnsList []string
		if p.NetDns != "" {
			for _, d := range strings.FieldsFunc(p.NetDns, func(r rune) bool { return r == ',' || r == ' ' }) {
				d = strings.TrimSpace(d)
				if d != "" {
					dnsList = append(dnsList, fmt.Sprintf("          - %s", d))
				}
			}
		}

		dnsSection := ""
		if len(dnsList) > 0 {
			dnsSection = "\n      nameservers:\n        addresses:\n" + strings.Join(dnsList, "\n")
		}

		routeSection := ""
		if p.NetGateway != "" {
			routeSection = fmt.Sprintf(`
      routes:
        - to: default
          via: %s`, p.NetGateway)
		}

		conf := fmt.Sprintf(`network:
  version: 2
  renderer: %s
  ethernets:
    %s:
      dhcp4: false
      addresses:
        - %s%s%s
`, renderer, iface, cidr, routeSection, dnsSection)

		if err := os.WriteFile(c.tpath("etc", "netplan", "99-krill-static.yaml"), []byte(conf), 0600); err != nil {
			return err
		}
		c.logf("rete statica scritta per netplan")
		wrote = true
	}

	// ifupdown (Debian server, Devuan, Alpine)
	interfaces := c.tpath("etc", "network", "interfaces")
	if exists(interfaces) {
		stanza := fmt.Sprintf(`
# krill: configurazione statica
auto %s
iface %s inet static
    address %s
    gateway %s
`, iface, iface, cidr, p.NetGateway)
		if p.NetDns != "" {
			stanza += fmt.Sprintf("    dns-nameservers %s\n", p.NetDns)
		}
		data, _ := os.ReadFile(interfaces)
		if err := os.WriteFile(interfaces, append(data, []byte(stanza)...), 0644); err != nil {
			return err
		}
		c.logf("rete statica scritta in /etc/network/interfaces")
		wrote = true
	}

	// NetworkManager (keyfile)
	if exists(c.tpath("etc", "NetworkManager")) {
		dir := c.tpath("etc", "NetworkManager", "system-connections")
		if err := os.MkdirAll(dir, 0755); err != nil {
			return err
		}
		conf := fmt.Sprintf(`[connection]
id=krill-static
uuid=%s
type=ethernet
interface-name=%s

[ipv4]
method=manual
address1=%s,%s
dns=%s;
ignore-auto-dns=true

[ipv6]
method=auto
`, randomUUID(), iface, cidr, p.NetGateway, p.NetDns)
		if err := os.WriteFile(dir+"/krill-static.nmconnection", []byte(conf), 0600); err != nil {
			return err
		}
		c.logf("rete statica scritta come connessione NetworkManager")
		wrote = true
	}

	// systemd-networkd
	if exists(c.tpath("etc", "systemd", "network")) {
		conf := fmt.Sprintf(`[Match]
Name=%s

[Network]
Address=%s
Gateway=%s
DNS=%s
`, iface, cidr, p.NetGateway, p.NetDns)
		if err := os.WriteFile(c.tpath("etc", "systemd", "network", "20-krill-static.network"), []byte(conf), 0644); err != nil {
			return err
		}
		c.logf("rete statica scritta per systemd-networkd")
		wrote = true
	}

	// resolv.conf statico, solo dove non è gestito da un symlink
	if p.NetDns != "" {
		resolv := c.tpath("etc", "resolv.conf")
		if info, err := os.Lstat(resolv); err != nil || info.Mode()&os.ModeSymlink == 0 {
			var sb strings.Builder
			for _, d := range strings.FieldsFunc(p.NetDns, func(r rune) bool { return r == ',' || r == ' ' }) {
				d = strings.TrimSpace(d)
				if d != "" {
					sb.WriteString("nameserver " + d + "\n")
				}
			}
			if sb.Len() > 0 {
				if err := os.WriteFile(resolv, []byte(sb.String()), 0644); err != nil {
					return err
				}
			}
		}
	}

	if !wrote {
		c.logf("nessun sistema di rete riconosciuto nel target: configurazione statica non applicata")
	}
	return nil
}

// maskToPrefix converte una netmask puntata (255.255.255.0) in prefisso
// CIDR; il fallback prudente è /24.
func maskToPrefix(mask string) int {
	ip := net.ParseIP(strings.TrimSpace(mask))
	if ip == nil {
		return 24
	}
	v4 := ip.To4()
	if v4 == nil {
		return 24
	}
	ones, bits := net.IPv4Mask(v4[0], v4[1], v4[2], v4[3]).Size()
	if bits != 32 || (ones == 0 && mask != "0.0.0.0") {
		return 24
	}
	return ones
}

// randomUUID legge un UUID dal kernel (per la connessione NetworkManager).
func randomUUID() string {
	data, err := os.ReadFile("/proc/sys/kernel/random/uuid")
	if err != nil {
		return "8b29be1d-a92b-4c2b-91b0-4e2cbb149c3a" // fallback statico
	}
	return strings.TrimSpace(string(data))
}
