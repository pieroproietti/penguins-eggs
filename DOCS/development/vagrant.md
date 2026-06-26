# Local Test Lab with Vagrant and KVM/libvirt

> **Note:** the project's primary test environment has since moved to native Proxmox VE virtual machines — see [proxmox.md](./proxmox.md). This guide remains valid for a self-contained local lab when no Proxmox host is available.

**Current focus: Arch Linux guest on a Debian host**

This document describes how to set up, use and manage the local virtualization environment based on **Vagrant** and **KVM/libvirt** for end-to-end testing and packaging of **penguins-eggs (oa edition)**.

Using Vagrant with libvirt makes it possible to test real remastering on native kernels, exploiting hardware acceleration and isolating the complex mounts from the host system.

---

## 1. Host Configuration (Debian)

For maximum stability and to avoid conflicts, we use the official HashiCorp repository and the native KVM engine instead of VirtualBox.

### 1.1 Installing Vagrant and KVM
```bash
# 1. Download and install the HashiCorp GPG key
wget -q https://apt.releases.hashicorp.com/gpg -O /tmp/hashicorp.gpg
sudo gpg --dearmor --yes -o /usr/share/keyrings/hashicorp-archive-keyring.gpg /tmp/hashicorp.gpg
rm /tmp/hashicorp.gpg

# 2. Add the official repository
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list > /dev/null

# 3. Install the virtualization dependencies and Vagrant
sudo apt update
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils ruby-dev libvirt-dev vagrant

# 4. Install the plugin connecting Vagrant to libvirt
vagrant plugin install vagrant-libvirt
```

### 1.2 Permissions and Network Modules (essential)
To avoid Polkit errors and problems with the libvirt network interfaces (missing `/dev/net/tun`):

```bash
# Add your user to the virtualization groups
sudo usermod -aG libvirt $USER
sudo usermod -aG libvirt-qemu $USER
sudo usermod -aG kvm $USER

# Load the TUN network module and make it persistent across reboots
echo "tun" | sudo tee /etc/modules-load.d/tun.conf
sudo modprobe tun

# Apply the group permissions to the current shell immediately
su - $USER
```

### 1.3 Hardware Acceleration (Nested Virtualization)
If the Debian host is itself a virtual machine (e.g. on Proxmox), you must set the host VM's processor type to **"Host"** to pass the virtualization extensions (VT-x / AMD-V) through, otherwise KVM will not work.

---

## 2. Arch Linux Guest Configuration

The Arch base images (`generic/arch`) often suffer from quickly aging maintainer PGP keys. In the `Vagrantfile`, the Arch provisioning line must update the keyring first, or `pacman` will refuse to install `base-devel` and `go`:

```ruby
# Vagrantfile snippet
'arch' => {
  :box => 'generic/arch',
  :pkg => 'pacman-key --init && pacman-key --populate archlinux && pacman -Sy archlinux-keyring --noconfirm && pacman -Su --noconfirm && pacman -S --noconfirm base-devel go git xorriso squashfs-tools'
}
```

---

## 3. Test Workflow

The `Vagrantfile` is dynamic and accepts the `DISTRO` environment variable. Commands must always be launched **from the monorepo root**.

### Start and access
```bash
# Launch the environment using libvirt
DISTRO=arch vagrant up --provider=libvirt

# Enter the VM
vagrant ssh
```

### Fixing DNS on Arch (`proxy.golang.org` errors)
Sometimes the Arch image misconfigures `systemd-resolved` for local IPv6, preventing Go from downloading modules such as `charmbracelet/bubbles` (`connection refused`).
Right after entering the VM, if the network does not resolve, force public DNS:
```bash
sudo rm -f /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf
```

### Native build and test
Your local code is automatically mapped to `/home/vagrant/penguins-eggs`.
```bash
cd /home/vagrant/penguins-eggs
./m  # or your build command for coa/oa

# Run the full remastering flight on a real kernel
sudo ./coa remaster
```

---

## 4. VM Lifecycle Management

When you are done testing, exit the VM with `exit` and manage the state from the Debian host:

* **Clean shutdown (`vagrant halt`):** powers off the VM cleanly. Keeps the disk state, installed packages and caches intact; the next `vagrant up` takes seconds.
* **Tabula rasa (`vagrant destroy -f`):** completely deletes the associated virtual disk. The source code on the host is untouched. Use it to guarantee the next test starts from a pristine Arch environment free of old mounts.
* **Freeze (`vagrant suspend`):** saves the RAM state to disk and pauses the VM. Resume with `vagrant resume`.
