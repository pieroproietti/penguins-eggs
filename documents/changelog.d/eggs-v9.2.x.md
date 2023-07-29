### eggs-9.2.9
I have completely or nearly completely rewritten the pxe.ts library for the cuckoo command, replacing the dnsmasq package with a node library so that there are no additional dependencies. Also-using iPXE-I was able to eliminate the need for configuring a real dhcp server by relying on the proxydhcpd included in eggs itself. I also added in the PXE boot screen, the ability to boot through the netbootxyz server. This is really a great new feature of eggs and allows you to boot all computers on the network using only one live system as the PXE server.

### eggs-9.2.8
* added ubunti 22.10 kinetic
* krill installer: Trying to solve a problem on mac-mini (T2 chip), I moved the grub installation to the end of the installation process itself, to still have the installation working even in case of an error.

### eggs-9.2.7
install:
* added flag --domain to pass domain for unattended installation, eg: ```sudo eggs install unrd penguins-eggs.net```
* added flag --none create a minimun swap partition of 256M
* rewrote routines autologin for sddm and lightdm. 

Note: to have autologin on the live your current used MUST to be configured with autologin.

### eggs-9.2.6
Mostly a stabilitation version, with same add:
* eggs install --unattanded --ip, added flag --ip, put hostname as ip-x-x-x-x. Example: ip 192.168.1.2 will have hostname ip-192-168-1-12
* swap 'small' size swap the same of RAM, swap 'suspend' size swap = 2 * RAM
* tested on: Debian: jessie, stretch, buster, bullseye, bookwork, Ubuntu bionic, focal, jammy, Devuan chimaera.

### eggs-9.2.5
```cuckoo``` since version **eggs-9.2.5**, 16 on **september 2022**, is capable to boot BIOS and UEFI machines via PXE on the LAN, however due to a bug in slim package, using sudo eggs cuckoo in dhcp-proxy version will not get UEFI machines to boot. Instead, use: sudo eggs cuckoo --real. 

__Warning__: using ``eggs cuckpp --real`` adds additional dhcp to the network, this may lead to problems or be prohibited by your organization,

### eggs-9.2.4
Added a new command: ```sudo eggs cuckoo```

This command launches a complete PXE server -automatically configured- that allows the ISO image to boot across the local network. It works directly from the live system by installing the dnsmasq and pxelinux packages. Its main limitation is the inability to operate in UEFI mode, but I decided to release it anyway to have it tested and to be able to start a new clean branch for the UEFI features planned for the next release. 

You can partecipate to discussion joining on [telegram channel](https://t.me/penguins_eggs).

### eggs-9.2.3
Introduced unattended installation: ```sudo eggs install --unattended```:
* values configured in /etc/penguins-eggs.d/krill.yaml are used both for unattended installation and as default values for standard installation;
* empty variables in in krill.yaml will take their value from the live system. Example: ```hostname = ''``` take the same hostname of the live;
* created a new module in krill: packages who take cure to add and remove packages during installation according on that specified on ```/etc/calamares/modules/packages.conf```;
* unattended install now wait 30 seconds, before to run without any prompt;
* bugfixes in module setKeyboard, autologin and others.

### eggs-9.2.2
* bugfix flag --release, actually passing release to produce correctly configurare calamares to remove penguins-eggs and itself from the installed system;
* removed same commands actually unusefull: eggs config and eggs remove (config is included in dad and remove fully became a problem of package manager).

### eggs-9.2.1
* produce: added flag --clone. 

Using this flag all user accounts and data will be included uncrypted on the live system and will be possible to install the live system with calamares or krill. 

Example:   '''sudo eggs produce --fast --clone```

You will get on live and installed exactly the same system you cloned.
