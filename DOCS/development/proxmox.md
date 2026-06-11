# Interfacing oa-tools with Proxmox VE

## Goodbye Vagrant: transitioning to a native, high-performance test environment

This document summarizes the architecture and the configuration steps needed to interface the **oa-tools** development and testing system (`oa` / `coa`) directly with a **Proxmox VE (KVM/QEMU)** hypervisor, abandoning Vagrant.

### Why Proxmox, and why the farewell to Vagrant/containers

1. **Removing abstraction:** Vagrant is useful for local development, but when the physical host already runs Proxmox, running Vagrant inside a VM adds a useless layer of nested virtualization, degrading build and packaging performance.
2. **Containers are inadequate (LXC/Docker):** developing and testing remastering and live-ISO tools requires total control of the boot cycle, direct filesystem manipulation (`mksquashfs`), kernel management and real hardware emulation. Containers share the host kernel and carry intrinsic security restrictions that rule these advanced use cases out.
3. **Native performance:** "naked" KVM virtual machines on Proxmox, combined with very fast data exchange (VirtFS), give maximum execution fidelity at RAM speed.

---

## System Architecture

The workflow uses one main host machine (**father**) exposing the resources and coordinating the tests, plus several isolated guest VMs (the test *forges*) that compile the C/Go code and produce the native packages (`.deb`, `.pkg.tar.zst`, `.rpm`).

The umbilical cord between host and guests rests on three pillars:
1. **Serial console (`ttyS0`)**: low-level control and `xterm.js` access from Proxmox.
2. **QEMU Guest Agent**: bidirectional orchestration and hot command execution from the host.
3. **VirtFS / Plan 9 (9p)**: source code sharing between host and guests.

---

## 1. Host-side Configuration (Proxmox VE)

Since Proxmox does not fully expose the VirtFS (9p) shared folder configuration through the GUI, you must edit the QEMU configuration files on the host.

Open the Proxmox terminal and edit the target VM file (e.g. `201.conf`):

```bash
nano /etc/pve/qemu-server/VMID.conf
```

Add the `args:` directive mapping the host physical directory onto the virtual bus:

```text
args: -virtfs local,path=/eggs/shared,mount_tag=eggs_shared,security_model=none,id=eggs_shared
```

*Note: once the file is modified, a **cold boot** (full Stop and Start) of the VM from the GUI is mandatory to virtually solder the hardware to the machine.*

---

## 2. Common Guest-side Configuration

The shared filesystem configuration is identical for all forges.

Create the mount point in the guest:
```bash
sudo mkdir -p /shared
```

To avoid system hangs, force the modules to load at boot:
```bash
echo -e "9p\n9pnet_virtio" | sudo tee /etc/modules-load.d/9p.conf
```

Edit `/etc/fstab`. **CRITICAL:** always use the `nofail` and `_netdev` options. If the VirtFS hardware does not respond, the VM will still complete the boot instead of dropping into *Emergency Mode*.

```text
# /etc/fstab
UUID=your-root-uuid        /       ext4    defaults        1 1
eggs_shared                /shared 9p      trans=virtio,version=9p2000.L,nofail,_netdev,rw  0 0
```

Apply the configuration:
```bash
sudo systemctl daemon-reload
sudo mount -a
```

---

## 3. The Three Forges: OS-specific Configuration

Each Linux ecosystem needs specific commands to enable the serial console, install the Guest Agent and prepare the packaging environment.

### A. The Debian/Ubuntu forge (`.deb` packages)

**1. Serial console:**
Edit `/etc/default/grub` and add the console parameters to `GRUB_CMDLINE_LINUX`:
```text
GRUB_CMDLINE_LINUX="console=tty0 console=ttyS0,115200"
```
Update GRUB and enable the service:
```bash
sudo update-grub
sudo systemctl enable --now serial-getty@ttyS0.service
```

**2. Guest Agent and build tools:**
```bash
sudo apt update
sudo apt install -y qemu-guest-agent build-essential golang git dpkg-dev
sudo systemctl enable --now qemu-guest-agent
```

### B. The Fedora/RHEL forge (`.rpm` packages)

**1. Serial console:**
On Fedora use the surgical `grubby` tool to inject the parameters:
```bash
sudo grubby --update-kernel=ALL --args="console=tty0 console=ttyS0,115200"
sudo systemctl enable --now serial-getty@ttyS0.service
```

**2. Guest Agent and build tools:**
```bash
sudo dnf update -y
sudo dnf install -y qemu-guest-agent gcc make git golang rpm-build rpmdevtools
sudo systemctl enable --now qemu-guest-agent
```

**3. RPM tree preparation:**
Unlike the other distros, the RPM environment requires a rigid directory structure. As a regular user run:
```bash
rpmdev-setuptree
```

### C. The Arch Linux forge (`.pkg.tar.zst` packages)

**1. Serial console:**
Edit `/etc/default/grub` and add the parameters:
```text
GRUB_CMDLINE_LINUX_DEFAULT="console=tty0 console=ttyS0,115200"
```
Regenerate the GRUB configuration and enable the service:
```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
sudo systemctl enable --now serial-getty@ttyS0.service
```

**2. Guest Agent and build tools:**
```bash
sudo pacman -Syu
sudo pacman -S --needed qemu-guest-agent base-devel go git
sudo systemctl enable --now qemu-guest-agent
```

---

## 4. Operational Workflow

With this architecture in place, development becomes linear and lightning fast:

1. The `oa-tools` code is modified on the main development environment and centralized in `/eggs/shared` on the host.
2. The host orchestrator launches the deploy script (e.g. `p4push <target>`).
3. The target VM receives the code instantly through the `/shared` directory mounted via VirtIO.
4. Inside the VM, the native build environment runs (`dpkg-buildpackage`, `rpmbuild` or `makepkg`), producing the final package free of contamination or virtualization overhead.
