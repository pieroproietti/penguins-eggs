# Architectures

## Beyond the x86_64 Standard
We often tend to consider the x86_64 architecture as the only possible standard, but the technological landscape is changing rapidly. Today we are witnessing the massive spread of ARM64 — which powers almost all smartphones and Chromebooks — and the rise of RISC-V. The latter, being an open source architecture, allows manufacturers to innovate freely without the constraint of royalties.

Although penguins-eggs is a system tool, it is written entirely in TypeScript. This technical choice makes portability extremely easy, facilitating the transition not only between different Linux distributions, but also between different hardware architectures.

# My Laboratory
Managing a project of this scale with limited resources requires inventiveness. For development, I use a workstation running Debian Trixie with Proxmox VE. This setup allows me to easily create minimal (naked) systems using QEMU for initial testing, although testing on real hardware remains essential for the final validation of the ISOs produced. In this sense, the support of sponsors—especially for the purchase of specific hardware—would be essential to further accelerate development.

## Project Genesis and Vision
Penguins-eggs began as a personal challenge after my retirement. I didn't want my technical skills to go to waste, and deep down, I hoped to make a tangible contribution to the Linux community.

## From Origins to Multi-Architecture
The first versions were dedicated exclusively to Debian, but my vision has always been agnostic: I wanted to create a tool for Linux as a whole, not limited to a single distribution or architecture.

This approach prompted me to extend support over time:

Architectures: Starting with amd64 and i386, I moved on to [ARM64](ARM64.md) (thanks to testing on Raspberry Pi 4) and the recent challenge of [RISCV64](RISCV64.md), born out of my constant curiosity about innovations in the field.

Distributions: Today, the tool supports a vast ecosystem, including Arch, Debian, Devuan, Fedora, Manjaro, openSUSE, and RHEL.


# Installazione qemu su Colibri
```
sudo apt update && sudo apt install -y \
  qemu-system \
  qemu-utils \
  libvirt-clients \
  libvirt-daemon-system \
  virt-manager \
  ovmf \
  qemu-efi-aarch64 \
  qemu-system-gui
```

# Avvio della ISO
```
qemu-system-x86_64 \
  -enable-kvm \
  -cpu host \
  -m 4G \
  -smp 4 \
  -bios /usr/share/ovmf/OVMF.fd \
  -cdrom /home/eggs/*.iso \
  -vga virtio \
  -display gtk,gl=on \
  -device virtio-tablet-pci
```

Seguite [DEBIAN-RISCV](./DEBIAN-RISCV.md) per maggiori informazioni.