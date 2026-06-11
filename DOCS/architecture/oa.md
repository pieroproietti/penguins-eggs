# 🦾 The C Arm: `oa`

If `coa` is the mind that designs the "flight plan" by analyzing the YAML files, the **`oa`** binary is the arm that physically performs the low-level work.

The C engine receives the plan as a JSON file parsed with `cJSON`. The heart of the system is the `execute_verb` function, which extracts the `action` key from each task and routes it to the competent native C module.

---

## 🎛️ Native Action Table (C-Core)

The operational actions mapped by the internal `execute_verb` router:

| JSON action | C function | Role |
| :--- | :--- | :--- |
| `oa_mkdir` | `oa_mkdir()` | Creates the given directory `mkdir -p` style, guaranteeing the full path chain. |
| `oa_bind` | `oa_bind()` | Performs a bind mount (`MS_BIND \| MS_REC`). Hardens the mount with `MS_PRIVATE` for isolation and supports read-only mode (`MS_RDONLY`). |
| `oa_cp` | `oa_cp()` | Physical copies in `cp -a` fashion, rigorously preserving permissions, symlinks and original timestamps. |
| `oa_mount_generic` | `oa_mount_generic()` | Creates the destination directory on the fly and invokes the `mount()` syscall for virtual filesystems (proc, sysfs, overlay). |
| `oa_shell` | `oa_shell()` | Executes shell commands, either on the host via `system()` or inside a `chroot` using `fork()`, `chroot()` and `execl()`. |
| `oa_users` | `oa_users()` | Identity management: removes (sanitizes) the host users and injects the live user (Purge & Inject). |
| `oa_umount` | `oa_umount()` | Reads `/proc/mounts`, finds everything belonging to the project and unmounts it starting from the deepest path. |

---

## 🔬 Deep Dive: The Operational Modules

### 1. The passepartout: `oa_shell`
This module is the perfect bridge between the orchestrator and the system. It reads the `run_command` and `chroot` parameters.
*   **Bimodal engine:** if the target is the system being installed (`mode="install"`), the target root is `LiveRoot`; otherwise it points to `LiveRoot/liveroot`.
*   **Native chroot:** to run isolated commands, it spawns a child with `fork()`, uses the `chroot()` syscall and pins the environment to `/` with `chdir("/")` before launching `/bin/sh -c`. The parent waits for completion and captures the exit code.

### 2. Identity management: `oa_users`
A Yocto-Project-style module for security and privacy. It works in two phases:
*   **Purge (sanitize):** unless the mode is "clone" or "crypted", it scrubs the live environment's `/etc/passwd`, `/etc/shadow` and `/etc/group`, removing the IDs of the human (host) users.
*   **Inject:** reads the JSON `users` array and injects the new identities natively. It uses `crypt()` with the `$6$oa$` salt to produce SHA-512 passwords when they are not already hashes. It also implements a fix for Debian systems by explicitly creating the user's primary group (GID), and finally populates the home directory from `/etc/skel`.

### 3. The mount infrastructure
The magic behind `oa`'s speed lies in using direct C syscalls instead of bash scripts.
*   **Isolation:** `oa_bind` first performs the recursive mount, then remounts `MS_RDONLY` if requested, and finally locks it down with `MS_PRIVATE`.
*   **OverlayFS:** the more complex virtual mounts — joining `lowerdir` and `upperdir` over `usr` and `var` — are handled by passing structured options straight to the `mount()` syscall. `/tmp` is handled by mounting a `tmpfs` with strict `mode=1777` permissions.

### 4. Smart umount and emergency cleanup
Host stability depends on correct cleanup.
*   **The clean way (`oa_umount`):** opens `/proc/mounts`, filters the mount points starting with the project root, collects them in an array and sorts them by decreasing length. This guarantees the most nested paths (e.g. `.../liveroot/proc`) are unmounted before their parents. It uses `MNT_DETACH` (lazy unmount) to force the release without blocking the system.
*   **The hard way (emergency cleanup):** if the C executable is invoked with the bare `cleanup` argument (`oa cleanup`), `main` skips the JSON parser entirely and fires a rapid burst of `umount2(..., MNT_DETACH)` on fundamental hardcoded paths, freeing the host instantly after fatal crashes. This is what `coa destroy` relies on.

### 5. Plan execution
Below is an example of what `oa` receives from `coa`: a complete remastering plan in JSON.

Why JSON instead of the more readable YAML? Because this plan has to be executed in C, and it is much lighter to write and execute as JSON.
```
{
  "plan": [
    {
      "description": "Setup base path",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/liveroot"
    },
    {
      "description": "Setup base path",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay"
    },
    {
      "description": "Setup base path",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay/upperdir"
    },
    {
      "description": "Setup base path",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay/workdir"
    },
    {
      "description": "Setup base path",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay/lowerdir"
    },
    {
      "description": "Copia fisica /etc",
      "action": "oa_cp",
      "chroot": false,
      "src": "/etc",
      "dst": "/home/eggs/liveroot"
    },
    {
      "description": "Copia fisica /boot",
      "action": "oa_cp",
      "chroot": false,
      "src": "/boot",
      "dst": "/home/eggs/liveroot"
    },
    {
      "description": "Copia symlink: vmlinuz",
      "action": "oa_cp",
      "chroot": false,
      "src": "/vmlinuz",
      "dst": "/home/eggs/liveroot/vmlinuz"
    },
    {
      "description": "Copia symlink: initrd.img",
      "action": "oa_cp",
      "chroot": false,
      "src": "/initrd.img",
      "dst": "/home/eggs/liveroot/initrd.img"
    },
    {
      "description": "Copia symlink: vmlinuz.old",
      "action": "oa_cp",
      "chroot": false,
      "src": "/vmlinuz.old",
      "dst": "/home/eggs/liveroot/vmlinuz.old"
    },
    {
      "description": "Copia symlink: initrd.img.old",
      "action": "oa_cp",
      "chroot": false,
      "src": "/initrd.img.old",
      "dst": "/home/eggs/liveroot/initrd.img.old"
    },
    {
      "description": "Replica Usrmerge symlink: bin",
      "action": "oa_shell",
      "run_command": "ln -sf usr/bin /home/eggs/liveroot/bin",
      "chroot": false
    },
    {
      "description": "Replica Usrmerge symlink: sbin",
      "action": "oa_shell",
      "run_command": "ln -sf usr/sbin /home/eggs/liveroot/sbin",
      "chroot": false
    },
    {
      "description": "Replica Usrmerge symlink: lib",
      "action": "oa_shell",
      "run_command": "ln -sf usr/lib /home/eggs/liveroot/lib",
      "chroot": false
    },
    {
      "description": "Replica Usrmerge symlink: lib64",
      "action": "oa_shell",
      "run_command": "ln -sf usr/lib64 /home/eggs/liveroot/lib64",
      "chroot": false
    },
    {
      "description": "Bind mount proiettivo: opt",
      "action": "oa_bind",
      "chroot": false,
      "src": "/opt",
      "dst": "/home/eggs/liveroot/opt",
      "readonly": true
    },
    {
      "description": "Bind mount proiettivo: root",
      "action": "oa_bind",
      "chroot": false,
      "src": "/root",
      "dst": "/home/eggs/liveroot/root",
      "readonly": true
    },
    {
      "description": "Bind mount proiettivo: srv",
      "action": "oa_bind",
      "chroot": false,
      "src": "/srv",
      "dst": "/home/eggs/liveroot/srv",
      "readonly": true
    },
    {
      "description": "",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay/lowerdir/usr"
    },
    {
      "description": "",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay/upperdir/usr"
    },
    {
      "description": "",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay/workdir/usr"
    },
    {
      "description": "",
      "action": "oa_bind",
      "chroot": false,
      "src": "/usr",
      "dst": "/home/eggs/.overlay/lowerdir/usr",
      "readonly": true
    },
    {
      "description": "Overlay mount per scrivibilità: usr",
      "action": "oa_mount_generic",
      "chroot": false,
      "src": "overlay",
      "dst": "/home/eggs/liveroot/usr",
      "type": "overlay",
      "opts": "lowerdir=/home/eggs/.overlay/lowerdir/usr,upperdir=/home/eggs/.overlay/upperdir/usr,workdir=/home/eggs/.overlay/workdir/usr"
    },
    {
      "description": "",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay/lowerdir/var"
    },
    {
      "description": "",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay/upperdir/var"
    },
    {
      "description": "",
      "action": "oa_mkdir",
      "chroot": false,
      "path": "/home/eggs/.overlay/workdir/var"
    },
    {
      "description": "",
      "action": "oa_bind",
      "chroot": false,
      "src": "/var",
      "dst": "/home/eggs/.overlay/lowerdir/var",
      "readonly": true
    },
    {
      "description": "Overlay mount per scrivibilità: var",
      "action": "oa_mount_generic",
      "chroot": false,
      "src": "overlay",
      "dst": "/home/eggs/liveroot/var",
      "type": "overlay",
      "opts": "lowerdir=/home/eggs/.overlay/lowerdir/var,upperdir=/home/eggs/.overlay/upperdir/var,workdir=/home/eggs/.overlay/workdir/var"
    },
    {
      "description": "",
      "action": "oa_mount_generic",
      "chroot": false,
      "src": "proc",
      "dst": "/home/eggs/liveroot/proc",
      "type": "proc"
    },
    {
      "description": "",
      "action": "oa_mount_generic",
      "chroot": false,
      "src": "sys",
      "dst": "/home/eggs/liveroot/sys",
      "type": "sysfs"
    },
    {
      "description": "API FS: dev",
      "action": "oa_bind",
      "chroot": false,
      "src": "/dev",
      "dst": "/home/eggs/liveroot/dev"
    },
    {
      "description": "API FS: run",
      "action": "oa_bind",
      "chroot": false,
      "src": "/run",
      "dst": "/home/eggs/liveroot/run"
    },
    {
      "description": "API FS: tmp (Sticky Bit + Tmpfs)",
      "action": "oa_shell",
      "run_command": "mkdir -p /home/eggs/liveroot/tmp \u0026\u0026 chmod 1777 /home/eggs/liveroot/tmp \u0026\u0026 mount -t tmpfs -o mode=1777 tmpfs /home/eggs/liveroot/tmp",
      "chroot": false
    },
    {
      "name": "coa-bootloaders",
      "description": "Staging degli assets per BIOS (ISOLINUX) e UEFI (GRUB/EFI)",
      "action": "oa_shell",
      "run_command": "mkdir -p /home/eggs/isodir/live /home/eggs/isodir/isolinux /home/eggs/isodir/boot/grub /home/eggs/isodir/EFI/BOOT\n\n# Copia assets BIOS\ncp /tmp/coa/bootloaders/ISOLINUX/isolinux.bin /home/eggs/isodir/isolinux/ 2\u003e/dev/null || true\ncp /tmp/coa/bootloaders/syslinux/modules/bios/*.c32 /home/eggs/isodir/isolinux/ 2\u003e/dev/null || true\n\n# Copia del binario EFI (Percorso corretto e unificato!)\nEFI_SRC=\"/tmp/coa/bootloaders/grub/x86_64-efi/monolithic/grubx64.efi\"\nif [ -f \"$EFI_SRC\" ]; then\n    cp \"$EFI_SRC\" /home/eggs/isodir/EFI/BOOT/BOOTX64.EFI\nfi\n\n# Generazione immagine FAT per EFI (12MB)\ndd if=/dev/zero of=/home/eggs/isodir/EFI/BOOT/efi.img bs=1M count=12\nmkfs.vfat /home/eggs/isodir/EFI/BOOT/efi.img\nmmd -i /home/eggs/isodir/EFI/BOOT/efi.img ::/EFI\nmmd -i /home/eggs/isodir/EFI/BOOT/efi.img ::/EFI/BOOT\n\n# Iniezione del binario nella partizione FAT\nif [ -f /home/eggs/isodir/EFI/BOOT/BOOTX64.EFI ]; then\n    mcopy -i /home/eggs/isodir/EFI/BOOT/efi.img /home/eggs/isodir/EFI/BOOT/BOOTX64.EFI ::/EFI/BOOT/BOOTX64.EFI\nfi",
      "chroot": false,
      "LiveRoot": "/home/eggs"
    },
    {
      "name": "coa-live-menus",
      "description": "Generazione dinamica dei menu di GRUB e ISOLINUX",
      "action": "oa_shell",
      "run_command": "set -e\n# 1. Variabili Universali\nVOL_ID=\"OA_LIVE\"\nBOOT_PARAMS=\"boot=live components quiet splash\"\nWORK_DIR=\"/home/eggs/isodir\"\nASSETS_DIR=\"/etc/oa-tools.d/brain.d/assets\"\n\nPRETTY=$(grep \"PRETTY_NAME\" /home/eggs/liveroot/etc/os-release | cut -d'\"' -f2 || echo \"OA Live\")\n\n# 2. Creazione Directory\nmkdir -p ${WORK_DIR}/boot/grub\nmkdir -p ${WORK_DIR}/isolinux\nmkdir -p ${WORK_DIR}/EFI/BOOT\n\n# 3. Copia Assets Universale\nif [ -f \"${ASSETS_DIR}/splash.png\" ]; then\n    cp \"${ASSETS_DIR}/splash.png\" ${WORK_DIR}/boot/grub/splash.png\n    cp \"${ASSETS_DIR}/splash.png\" ${WORK_DIR}/isolinux/splash.png\nfi\n\nif [ -f \"/usr/share/grub/unicode.pf2\" ]; then\n    cp /usr/share/grub/unicode.pf2 ${WORK_DIR}/boot/grub/font.pf2 2\u003e/dev/null || true\nelif [ -f \"${ASSETS_DIR}/unicode.pf2\" ]; then\n    cp \"${ASSETS_DIR}/unicode.pf2\" ${WORK_DIR}/boot/grub/font.pf2 2\u003e/dev/null || true\nfi\n\n# 4. Generazione GRUB.cfg (Main)\ncat \u003c\u003cEOF \u003e ${WORK_DIR}/boot/grub/grub.cfg\nset timeout=5\nset default=2\n\ninsmod efi_gop\ninsmod efi_uga\ninsmod all_video\ninsmod gfxterm\ninsmod png\ninsmod part_gpt\ninsmod part_msdos\ninsmod fat\ninsmod iso9660\n\nsearch --no-floppy --set=root --label ${VOL_ID}\n\nif loadfont /boot/grub/font.pf2; then\n    set gfxmode=auto\n    terminal_output gfxterm\nfi\n\nbackground_image /boot/grub/splash.png\nset menu_color_normal=black/black\nset menu_color_highlight=white/black\n\nmenuentry \"--- oa-tools ---\" {\n    true\n}\nmenuentry \"\" {\n    true\n}\nmenuentry \"Start ${PRETTY}\" {\n    linux /live/vmlinuz ${BOOT_PARAMS}\n    initrd /live/initrd.img\n}\nmenuentry \"Start ${PRETTY} - RAM mode\" {\n    linux /live/vmlinuz ${BOOT_PARAMS} toram\n    initrd /live/initrd.img\n}\nEOF\n\n# 5. Generazione ISOLINUX.cfg (BIOS)\ncat \u003c\u003cEOF \u003e ${WORK_DIR}/isolinux/isolinux.cfg\nUI vesamenu.c32\nTIMEOUT 50\nDEFAULT live\n\nMENU BACKGROUND splash.png\nMENU TITLE oa-tools\n\nLABEL live\n    MENU LABEL Start ${PRETTY}\n    LINUX /live/vmlinuz\n    APPEND ${BOOT_PARAMS}\n    INITRD /live/initrd.img\n\nLABEL ram\n    MENU LABEL Start ${PRETTY} - RAM mode\n    LINUX /live/vmlinuz\n    APPEND ${BOOT_PARAMS} toram\n    INITRD /live/initrd.img\nEOF\n\n# 6. Generazione Trampolino EFI\ncat \u003c\u003c 'EOF' \u003e ${WORK_DIR}/EFI/BOOT/grub.cfg\nsearch --set=root --file /live/filesystem.squashfs\nset prefix=($root)/boot/grub\nconfigfile $prefix/grub.cfg\nEOF",
      "chroot": false,
      "LiveRoot": "/home/eggs"
    },
    {
      "description": "Creazione home directory da /etc/skel",
      "action": "oa_shell",
      "run_command": "mkdir -p /home/eggs/liveroot/home/live \u0026\u0026 cp -a /home/eggs/liveroot/etc/skel/. /home/eggs/liveroot/home/live/",
      "chroot": false
    },
    {
      "description": "Iniezione identità utenti live",
      "action": "oa_users",
      "chroot": false,
      "users": [
        {
          "login": "live",
          "password": "$6$oa-tools$uTKAYeAVn.Y.Dy2To6HXsHt1Gt4HpMghmOV93a46jFY7hkAQ3tk7eRTKjcvSYDf5sOf3qnKzyyPYXurKp9ST3.",
          "home": "/home/live",
          "shell": "/bin/bash",
          "groups": [
            "cdrom",
            "floppy",
            "sudo",
            "audio",
            "dip",
            "video",
            "plugdev",
            "netdev",
            "wheel"
          ],
          "uid": 1000,
          "gid": 1000
        }
      ],
      "LiveRoot": "/home/eggs"
    },
    {
      "name": "coa-initrd",
      "description": "Generazione dell'Initramfs specifico per l'ambiente live",
      "action": "oa_shell",
      "run_command": "# Forziamo Debian a non cercare dischi di swap fantasma (evita timeout di 30s al boot)\necho \"RESUME=none\" \u003e /etc/initramfs-tools/conf.d/resume\nupdate-initramfs -u -k all",
      "chroot": true,
      "LiveRoot": "/home/eggs"
    },
    {
      "name": "coa-kernel-copy",
      "description": "Copia dinamica di kernel e initrd nella root ISO",
      "action": "oa_shell",
      "run_command": "KERNEL_PATH=$(ls -1 /home/eggs/liveroot/boot/vmlinuz-* 2\u003e/dev/null | grep -v \"rescue\" | head -n 1)\nINITRD_PATH=$(ls -1 /home/eggs/liveroot/boot/initrd* 2\u003e/dev/null | grep -v \"rescue\" | head -n 1)\n\nif [ -n \"$KERNEL_PATH\" ]; then cp \"$KERNEL_PATH\" /home/eggs/isodir/live/vmlinuz; fi\nif [ -n \"$INITRD_PATH\" ]; then cp \"$INITRD_PATH\" /home/eggs/isodir/live/initrd.img; fi",
      "chroot": false,
      "LiveRoot": "/home/eggs"
    },
    {
      "name": "coa-enable-live",
      "description": "Configurazione privilegi, launcher fidato e autologin universale",
      "action": "oa_shell",
      "run_command": "# 7.1. Sudoers e Gruppi (Usa template per sudo/wheel)\nUSER=\"live\"\necho \"${USER} ALL=(ALL) NOPASSWD:ALL\" \u003e /etc/sudoers.d/00-live\nchmod 0440 /etc/sudoers.d/00-live\ngroupadd autologin 2\u003e/dev/null || true\nusermod -aG sudo,autologin ${USER} 2\u003e/dev/null || true\n\n\n# 7.2. Creazione Icona Uovo (SVG 3D Golden Edition)\nICON_PATH=\"/usr/share/icons/hicolor/scalable/apps/penguins-eggs.svg\"\nmkdir -p $(dirname $ICON_PATH)\ncat \u003c\u003c 'EOF' \u003e $ICON_PATH\n\u003csvg width=\"64\" height=\"64\" viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\"\u003e\n\u003cdefs\u003e\n    \u003cradialGradient id=\"eggGrad\" cx=\"30%\" cy=\"30%\" r=\"65%\"\u003e\n    \u003cstop offset=\"0%\" stop-color=\"#ffe066\" /\u003e\n    \u003cstop offset=\"50%\" stop-color=\"#f0ad4e\" /\u003e\n    \u003cstop offset=\"100%\" stop-color=\"#b87311\" /\u003e\n    \u003c/radialGradient\u003e\n\u003c/defs\u003e\n\u003cellipse cx=\"32\" cy=\"59\" rx=\"18\" ry=\"3\" fill=\"rgba(0,0,0,0.2)\" /\u003e\n\u003cpath d=\"M 32 4 C 18 4, 8 24, 8 42 C 8 55, 18 60, 32 60 C 46 60, 56 55, 56 42 C 56 24, 46 4, 32 4 Z\" fill=\"url(#eggGrad)\" /\u003e\n\u003c/svg\u003e\nEOF\ngtk-update-icon-cache /usr/share/icons/hicolor/ 2\u003e/dev/null || true\n\n\n# 7.3. Desktop Launcher Certificato (Solo in usr/share)\nAPP_DIR=\"/usr/share/applications\"\nmkdir -p $APP_DIR\ncat \u003c\u003c EOF \u003e $APP_DIR/install-system.desktop\n[Desktop Entry]\nType=Application\nVersion=1.0\nName=Install System\nGenericName=Live Installer\nComment=Install this system to your hard disk\nExec=sudo eggs sysinstall calamares\nIcon=penguins-eggs\nTerminal=false\nCategories=System;\nEOF\nchmod +x $APP_DIR/install-system.desktop\n\n\n# 7.4. L'AGENTE DINAMICO (Crea e bypassa Sicurezza GIO/XFCE)\nmkdir -p /etc/xdg/autostart /usr/local/bin\ncat \u003c\u003c 'EOF' \u003e /usr/local/bin/oa-trust-desktop\n#!/bin/bash\n\n# 7.4.1. Trova la cartella Desktop corretta (Scrivania, Desktop, Bureau...)\nDESKTOP_DIR=\"$(xdg-user-dir DESKTOP 2\u003e/dev/null || echo \"$HOME/Desktop\")\"\nmkdir -p \"$DESKTOP_DIR\"\n\nLAUNCHER_SRC=\"/usr/share/applications/install-system.desktop\"\nLAUNCHER_DEST=\"$DESKTOP_DIR/install-system.desktop\"\n\n# 7.4.2. Copia il launcher sulla scrivania al volo\nif [ -f \"$LAUNCHER_SRC\" ]; then\n    cp \"$LAUNCHER_SRC\" \"$LAUNCHER_DEST\"\n    chmod +x \"$LAUNCHER_DEST\"\nfi\n\n# 7.4.3. Attesa del caricamento dell'ambiente grafico\nfor i in {1..15}; do\n    if pgrep -x xfdesktop \u003e/dev/null || pgrep -x nautilus \u003e/dev/null || pgrep -x nemo \u003e/dev/null || pgrep -x caja \u003e/dev/null || pgrep -f ding \u003e/dev/null || pgrep -x plasmashell \u003e/dev/null || pgrep -x pcmanfm \u003e/dev/null || pgrep -x pcmanfm-qt \u003e/dev/null; then\n        break\n    fi\n    sleep 1\ndone\nsleep 2\n\n# 7.4.4. Applica il trust\nif ! pgrep -x plasmashell \u003e /dev/null; then\n    if [ -f \"$LAUNCHER_DEST\" ]; then\n        gio set \"$LAUNCHER_DEST\" metadata::trusted yes 2\u003e/dev/null\n        gio set \"$LAUNCHER_DEST\" metadata::xfce-exe-checksum \"$(sha256sum \"$LAUNCHER_DEST\" | awk '{print $1}')\" 2\u003e/dev/null\n    fi\nfi\nEOF\nchmod +x /usr/local/bin/oa-trust-desktop\n\n# 7.4.5. Innesco per XDG Autostart\ncat \u003c\u003c 'EOF' \u003e /etc/xdg/autostart/trust-installer.desktop\n[Desktop Entry]\nType=Application\nName=Trust Installer\nExec=/usr/local/bin/oa-trust-desktop\nHidden=false\nNoDisplay=true\nEOF\n\n\n# 7.4.6. Autologin Universale (Forzato per tutte le distro)\nUSER=\"live\"\nif [ -d /etc/lightdm ]; then\n    passwd -d $USER 2\u003e/dev/null || true\n    usermod -U $USER 2\u003e/dev/null || true\n    \n    if [ -f /etc/pam.d/lightdm-autologin ]; then\n        sed -i '/pam_succeed_if.so.*user ingroup autologin/d' /etc/pam.d/lightdm-autologin\n    fi\n    \n    SESSION=$(ls -1 /usr/share/xsessions/ 2\u003e/dev/null | head -n 1 | sed 's/\\.desktop//')\n    \n    if [ -f /etc/lightdm/lightdm.conf ]; then\n        sed -i -e '/^[#]*autologin-user=/d' -e '/^[#]*autologin-user-timeout=/d' -e '/^[#]*autologin-session=/d' /etc/lightdm/lightdm.conf\n        sed -i \"/^\\[Seat:\\*\\]/a autologin-user=$USER\\nautologin-user-timeout=0\\nautologin-session=${SESSION:-xfce}\" /etc/lightdm/lightdm.conf\n    fi\nfi",
      "chroot": true,
      "LiveRoot": "/home/eggs"
    },
    {
      "name": "coa-squashfs",
      "description": "Compressione del filesystem root in formato SquashFS",
      "action": "oa_shell",
      "run_command": "mksquashfs /home/eggs/liveroot /home/eggs/isodir/live/filesystem.squashfs \\\n  -comp zstd \\\n  -Xcompression-level 3 \\\n  -b 1M \\\n  -processors 4 \\\n  -noappend \\\n  -wildcards \\\n  -ef /tmp/coa/excludes.list \\\n  -p \"mnt d 0755 root root\" \\\n  -p \"media d 0755 root root\"",
      "chroot": false,
      "LiveRoot": "/home/eggs"
    },
    {
      "name": "coa-xorriso",
      "description": "Generazione finale dell'immagine ISO ibrida (xorriso)",
      "action": "oa_shell",
      "run_command": "xorriso -as mkisofs -iso-level 3 -full-iso9660-filenames -volid 'OA_LIVE' \\\n-eltorito-boot isolinux/isolinux.bin -eltorito-catalog isolinux/boot.cat \\\n-no-emul-boot -boot-load-size 4 -boot-info-table \\\n-isohybrid-mbr /tmp/coa/bootloaders/ISOLINUX/isohdpfx.bin \\\n-eltorito-alt-boot -e EFI/BOOT/efi.img -no-emul-boot -isohybrid-gpt-basdat \\\n-o /home/eggs/egg-of-debian-trixie-colibri-amd64-2026-05-13_0656.iso /home/eggs/isodir",
      "chroot": false,
      "LiveRoot": "/home/eggs"
    },
    {
      "description": "Pulizia finale dei mount",
      "action": "oa_umount",
      "chroot": false,
      "LiveRoot": "/home/eggs"
    }
  ]
}
```