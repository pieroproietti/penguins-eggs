#!/bin/bash
#
# Mini Rescue Live System: Only Focus Recovery
# Copyright (C) 2021 Yuchen Deng [Zz] <loaden@gmail.com>
# QQ Group: 19346666, 111601117
#
# Redo Rescue: Backup and Recovery Made Easy <redorescue.com>
# Copyright (C) 2010-2020 Zebradots Software
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.
#

VER=1.1
ARCH=amd64
ROOT=rootdir
FILE=setup.sh
USER=live
NONFREE=true

if [ -z "$BASE" ]; then
    BASE=bullseye
fi

if [ -z "$MIRROR" ]; then
    MIRROR=https://mirrors.tuna.tsinghua.edu.cn/debian
fi

# Set colored output codes
red='\e[1;31m'
wht='\e[1;37m'
yel='\e[1;33m'
off='\e[0m'

# Show title
echo -e "\n$off---------------------------"
echo -e "$wht  MINI RESCUE ISO CREATOR$off"
echo -e "       Version $VER"
echo -e "---------------------------\n"

# Check: Must be root
if [ "$EUID" -ne 0 ]
    then echo -e "$red* ERROR: Must be run as root.$off\n"
    exit
fi

# Check: No spaces in cwd
if [[ `pwd` == *" "* ]]
    then echo -e "$red* ERROR: Current absolute pathname contains a space.$off\n"
    exit
fi

# Get requested action
ACTION=$1

function chroot_mount() {
    #
    # Execute system mounts
    #
    mount -t sysfs -o nodev,noexec,nosuid sysfs $ROOT/sys
    mount -t proc -o nodev,noexec,nosuid proc $ROOT/proc

    # Some things don't work properly without /etc/mtab.
    ln -sf $ROOT/proc/mounts $ROOT/etc/mtab

    # Note that this only becomes /dev on the real filesystem if udev's scripts
    # are used; which they will be, but it's worth pointing out
    if ! mount -t devtmpfs -o mode=0755 udev $ROOT/dev; then
        echo "W: devtmpfs not available, falling back to tmpfs for $ROOT/dev"
        mount -t tmpfs -o mode=0755 udev $ROOT/dev
        [ -e $ROOT/dev/console ] || mknod -m 0600 $ROOT/dev/console c 5 1
        [ -e $ROOT/dev/null ] || mknod $ROOT/dev/null c 1 3
    fi
    mkdir -p $ROOT/dev/pts
    mount -t devpts -o noexec,nosuid,gid=5,mode=0620 devpts $ROOT/dev/pts || true
    mount -t tmpfs -o "noexec,nosuid,size=10%,mode=0755" tmpfs $ROOT/run
    mkdir $ROOT/run/initramfs

    # Compatibility symlink for the pre-oneiric locations
    ln -sf $ROOT/run/initramfs $ROOT/dev/.initramfs
}

function chroot_umount() {
    #
    # Execute system umounts
    #
    sleep 1
    umount -lf $ROOT/sys 2>/dev/null
    umount -lf $ROOT/proc 2>/dev/null
    umount -lf $ROOT/dev/pts 2>/dev/null
    umount -lf $ROOT/dev 2>/dev/null
    umount -lf $ROOT/run 2>/dev/null
    sleep 1
}

function clean() {
    #
    # Remove all build files
    #
    chroot_umount
    rm -rf {cache,image,scratch,$ROOT,*.iso,*.log}
    echo -e "$yel* All clean!$off\n"
    exit
}

function prepare() {
    #
    # Prepare host environment
    #
    echo -e "$yel* Building from scratch.$off"
    chroot_umount
    rm -rf {image,scratch,$ROOT}
    CACHE=debootstrap-$BASE-$ARCH.tar.zst
    if [ -f "$CACHE" ]; then
        echo -e "$yel* $CACHE exists, extracting existing archive...$off"
        sleep 2
        tar -xpvf $CACHE
    else
        echo -e "$yel* $CACHE does not exist, running debootstrap...$off"
        sleep 2
        apt install --yes --no-install-recommends debootstrap squashfs-tools mtools xorriso zstd
        rm -rf $ROOT
        mkdir -p $ROOT
        debootstrap --arch=$ARCH --variant=minbase --no-check-gpg $BASE $ROOT $MIRROR
        tar -I "zstd -T0" -capvf $CACHE $ROOT
    fi
}

function script_init() {
    #
    # Setup script: Base configuration
    #
    cat > $ROOT/$FILE <<EOL
#!/bin/bash

# Set hostname
echo 'rescue' > /etc/hostname

# Set hosts
cat > /etc/hosts <<END
127.0.0.1  localhost
127.0.1.1  rescue
::1        localhost ip6-localhost ip6-loopback
ff02::1    ip6-allnodes
ff02::2    ip6-allrouters
END

# Set default locale
[ -z $(grep "^export LANG=C" /etc/bash.bashrc) ] && cat >> /etc/bash.bashrc <<END
export LANG=C
export LC_ALL=C
export LANGUAGE=en_US
END

# Set modprobe env
export MODPROBE_OPTIONS="-qb"

# Export environment
export HOME=/root; export LANG=C; export LC_ALL=C; export LANGUAGE=en_US
EOL
}

function script_base() {
    #
    # Setup script: Install packages
    #
    if [[ "$ARCH" == "i386" || "$ARCH" == "x86" ]]; then
        KERN="686"
    else
        KERN="amd64"
    fi
    cat >> $ROOT/$FILE <<EOL
# Install base packages
export DEBIAN_FRONTEND=noninteractive
apt install --yes --no-install-recommends \
    linux-image-$KERN init dbus dmsetup firmware-linux-free live-boot sudo nano procps fdisk \
    parted bash-completion ifupdown dhcpcd5 iputils-ping rsync zstd efibootmgr \
    arch-install-scripts

# Add regular user
useradd --create-home $USER --shell /bin/bash
adduser $USER sudo
echo '$USER:$USER' | chpasswd
EOL
}

function script_desktop() {
    #
    # Setup script: Install desktop packages
    #
    cat >> $ROOT/$FILE <<EOL
# Install desktop packages
apt install --yes --no-install-recommends \
    \
    xserver-xorg blackbox lightdm \
    pcmanfm engrampa lxterminal mousepad gpicview fonts-wqy-microhei \
    trayer dhcpcd-gtk openresolv numix-gtk-theme \
    \
    gparted dosfstools exfat-fuse ntfs-3g btrfs-progs \
    \
    $EXTRA_PACKAGES
EOL
}

function script_add_nonfree() {
    #
    # Setup script: Install non-free packages for hardware support
    #
    # Non-free firmware does not comply with the Debian DFSG and is
    # not included in official releases.  For more information, see
    # <https://www.debian.org/social_contract> and also
    # <http://wiki.debian.org/Firmware>.
    #
    # WARNING: Wireless connections are *NOT* recommended for backup
    # and restore operations, but are included for other uses.
    #
    cat >> $ROOT/$FILE <<EOL
echo "Adding non-free packages..."
# Briefly activate non-free repo to install non-free firmware packages
perl -p -i -e 's/main$/main non-free/' /etc/apt/sources.list
apt update --yes
apt install --yes --no-install-recommends \
    firmware-linux-nonfree \
    firmware-misc-nonfree \
    firmware-realtek \
    firmware-atheros \
    firmware-iwlwifi
perl -p -i -e 's/ non-free$//' /etc/apt/sources.list
apt update --yes
EOL
}

function script_shell() {
    #
    # Setup script: Insert command to open shell for making changes
    #
    cat >> $ROOT/$FILE << EOL
echo -e "$red>>> Opening interactive shell. Type 'exit' when done making changes.$off"
echo
bash
EOL
}

function script_config() {
    #
    # Setup script: Configure the system
    #
    cat >> $ROOT/$FILE <<EOL
# Autologin for shell
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/override.conf <<END
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $USER --noclear %I 38400 linux
END

# Autologin for lightdm
[ -f /etc/lightdm/lightdm.conf ] && sed -i "s/.*autologin-user=.*/autologin-user=$USER/" /etc/lightdm/lightdm.conf

# No password for sudo
sed -i "s/.*sudo.*ALL=(ALL:ALL) ALL/%sudo ALL=(ALL) NOPASSWD:ALL/" /etc/sudoers

# Update kernel module of depends
uname_r=\$(dpkg-query -W -f='\${binary:Package}\n' linux-image-* | head -n 1 | sed 's/linux-image-//')
depmod -b / \$uname_r

# Add extra modules to initrd
[ -z \$(grep ^md /etc/initramfs-tools/modules) ] && echo md >> /etc/initramfs-tools/modules

# Update initrd
update-initramfs -u

# Nano is better than vi
ln -sf /usr/bin/nano /usr/bin/vi

# Blackbox menu
su - \$USER -c "mkdir -p ~/.blackbox"

su - \$USER -c "cat > ~/.blackbox/menu <<END
[begin] (Mini Rescue $VER)
    [exec] (Bash) {x-terminal-emulator -T \"Bash\" -e /bin/bash --login}
    [exec] (GParted) {sudo /usr/sbin/gparted}
    [exec] (Files) {/usr/bin/pcmanfm}
    [exec] (Network) {x-terminal-emulator -T "Network" -e ~/.blackbox/network}
    [sep]
    [restart] (Restart)
    [exec] (Reboot) {sudo reboot}
[end]
END
"
su - \$USER -c "cat > ~/.blackboxrc <<END
session.menuFile: .blackbox/menu
session.styleFile: /usr/share/blackbox/styles/Gray
session.screen0.slit.placement: BottomRight
END
"
su - \$USER -c "cat > ~/.blackbox/network <<END
#/bin/bash
pkill -9 dhcpcd-gtk
pkill -9 trayer
sleep 0.2
nohup trayer --align right --widthtype request --distance 0 --margin 0 --padding 0 --iconspacing 1 --SetDockType false --SetPartialStrut false --transparent true --alpha 0 --tint 0x00aaaaaa &
sleep 0.2
nohup dhcpcd-gtk &
sleep 0.2
echo
echo -n Please wait...
sleep 3
exit
END
"
su - \$USER -c "chmod u+x ~/.blackbox/network"

# Fast reboot
su - \$USER -c "echo alias reboot=\'sudo reboot\' > ~/.bash_aliases"

# Fast shutdown
su - \$USER -c "echo alias poweroff=\'sudo poweroff\' >> ~/.bash_aliases"
su - \$USER -c "echo alias shutdown=\'sudo shutdown\' >> ~/.bash_aliases"

# Enable dhcpcd service
systemctl enable dhcpcd.service

# Gtk config
su - \$USER -c "cat > ~/.gtkrc-2.0 <<END
gtk-theme-name=\"Numix\"
gtk-icon-theme-name=\"hicolor\"
gtk-font-name=\"Sans 10\"
gtk-cursor-theme-name=\"Adwaita\"
gtk-cursor-theme-size=0
gtk-toolbar-style=GTK_TOOLBAR_BOTH
gtk-toolbar-icon-size=GTK_ICON_SIZE_LARGE_TOOLBAR
gtk-button-images=1
gtk-menu-images=0
gtk-enable-event-sounds=1
gtk-enable-input-feedback-sounds=1
gtk-xft-antialias=1
gtk-xft-hinting=1
gtk-xft-hintstyle=\"hintfull\"
END
"
su - \$USER -c "mkdir -p ~/.config/gtk-3.0"
su - \$USER -c "cat > ~/.config/gtk-3.0/settings.ini <<END
[Settings]
gtk-theme-name=Numix
gtk-icon-theme-name=hicolor
gtk-font-name=Sans 10
gtk-cursor-theme-name=Adwaita
gtk-cursor-theme-size=0
gtk-toolbar-style=GTK_TOOLBAR_BOTH
gtk-toolbar-icon-size=GTK_ICON_SIZE_LARGE_TOOLBAR
gtk-button-images=1
gtk-menu-images=0
gtk-enable-event-sounds=1
gtk-enable-input-feedback-sounds=1
gtk-xft-antialias=1
gtk-xft-hinting=1
gtk-xft-hintstyle=hintfull
END
"
EOL
}

function script_exit() {
    #
    # Setup script: Clean up and exit
    #
    cat >> $ROOT/$FILE <<EOL
# Save space
rm -f /usr/bin/{localedef,perl5.*,python3*m}
rm -rf /usr/share/doc
rm -rf /usr/share/man

# Clean up and exit
no_need_pkgs="mime-support bsdmainutils compton debconf-i18n \
    dictionaries-common eject emacsen-common gdbm-l10n \
    iptables locales logrotate menu tasksel tzdata util-linux-locales \
    vim-common whiptail xdg-utils xserver-xorg-video-vmware xxd
    "
for i in \$no_need_pkgs; do
    echo [ apt purge \$i ]
    apt purge --yes \$i 2>/dev/null
done

apt autopurge --yes
apt clean
[ -L /bin/X11 ] && unlink /bin/X11
[ -d /usr/share/locale/zh_CN ] && ls -d /usr/share/locale/* | grep -v -w en | grep -v -w en_US | xargs rm -rf
rm -rf /var/lib/dbus/machine-id
rm -rf /tmp/*
rm -f /etc/resolv.conf
rm -rf /var/lib/apt/lists/????????*
exit
EOL
}

function chroot_exec() {
    #
    # Execute setup script inside chroot environment
    #
    echo -e "$yel* Copying assets to root directory...$off"

    # Copy /etc/resolv.conf before running setup script
    cp /etc/resolv.conf $ROOT/etc/

    # Run setup script inside chroot
    chmod +x $ROOT/$FILE
    echo
    echo -e "$red>>> ENTERING CHROOT SYSTEM$off"
    echo
    sleep 2
    chroot_mount
    chroot $ROOT/ /bin/bash -c "./$FILE"
    chroot_umount
    echo
    echo -e "$red>>> EXITED CHROOT SYSTEM$off"
    echo
    sleep 2
    rm -f $ROOT/$FILE
}

function create_livefs() {
    #
    # Prepare to create new image
    #
    echo -e "$yel* Preparing image...$off"
    chroot_umount
    rm -f $ROOT/root/.bash_history
    rm -rf image/live
    mkdir -p image/live

    # Compress live filesystem
    echo -e "$yel* Compressing live filesystem...$off"
    mksquashfs $ROOT image/live/filesystem.squashfs -comp zstd -e boot
}

function create_iso() {
    #
    # Create ISO image from existing live filesystem
    #
    chroot_umount
    sleep 0.5
    if [ ! -s "image/live/filesystem.squashfs" ]; then
        echo -e "$red* ERROR: The squashfs live filesystem is missing.$off\n"
        exit
    fi

    # Sync boot stuff
    rsync -avh efi/ image/

    # Update version number
    perl -p -i -e "s/\\\$VERSION/$VER/g" image/boot/grub/grub.cfg

    # Update base distro
    perl -p -i -e "s/\\\$BASE/$BASE/g" image/boot/grub/grub.cfg

    # Prepare boot image
    cache_dir=cache
    if [ ! -f "$cache_dir/usr/bin/grub-mkstandalone" ]; then
        rm -rf $cache_dir
        mkdir -p $cache_dir
        tar -xpvf debootstrap-$BASE-$ARCH.tar.zst --directory=$cache_dir
        pushd $cache_dir
            mv $ROOT/* .
            rm -r $ROOT
        popd
    fi

    cp -f image/boot/grub/grub.cfg $cache_dir/
    root_bak=$ROOT
    export ROOT=$cache_dir
    script_init
    cat >> $ROOT/$FILE <<EOL
    export DEBIAN_FRONTEND=noninteractive
    apt install --yes --no-install-recommends \
        grub-efi-amd64-bin grub-efi-amd64-signed shim-signed grub-pc-bin fonts-hack
    # Generate GRUB font
    grub-mkfont -n Cantarell -o yuchen.pf2 -s16 -v /usr/share/fonts/truetype/hack/Hack-Regular.ttf
    # Create image for BIOS and CD-ROM
    grub-mkstandalone \
        --format=i386-pc \
        --output=core.img \
        --install-modules="linux normal iso9660 biosdisk memdisk search help tar ls all_video font gfxmenu png" \
        --modules="linux normal iso9660 biosdisk search help all_video font gfxmenu png" \
        --locales="" \
        --fonts="yuchen" \
        "boot/grub/grub.cfg=grub.cfg"
    # Prepare image for UEFI
    cat /usr/lib/grub/i386-pc/cdboot.img core.img > bios.img
EOL
    script_exit
    chroot_exec
    export ROOT=$root_bak

    mkdir -p {image/{EFI/boot,boot/grub/fonts},scratch}
    touch image/DENG
    cp -f $cache_dir/bios.img scratch/
    cp -rf $cache_dir/usr/lib/grub/x86_64-efi image/boot/grub/
    cp -f $cache_dir/usr/lib/shim/shimx64.efi.signed image/EFI/boot/bootx64.efi
    cp -f $cache_dir/usr/lib/grub/x86_64-efi-signed/grubx64.efi.signed image/EFI/boot/grubx64.efi
    cp -f $cache_dir/yuchen.pf2 image/boot/grub/fonts/
    cp -f $ROOT/boot/vmlinuz-* image/vmlinuz
    cp -f $ROOT/boot/initrd.img-* image/initrd.img

    # Create EFI partition
    UFAT="scratch/efiboot.img"
    dd if=/dev/zero of=$UFAT bs=1M count=3
    mkfs.vfat $UFAT
    mcopy -s -i $UFAT image/EFI ::

    # Create final ISO image
    if [ -f BASE ]; then
        iso_image_file=mini-rescue-$BASE-base-$VER.iso
    else
        iso_image_file=mini-rescue-$BASE-$VER.iso
    fi
    rm -f $iso_image_file
    xorriso \
        -as mkisofs \
        -r -o $iso_image_file \
        -iso-level 3 \
        -full-iso9660-filenames \
        -J -joliet-long \
        -volid "Mini Rescue $VER" \
        -eltorito-boot \
            boot/grub/bios.img \
            -no-emul-boot \
            -boot-load-size 4 \
            -boot-info-table \
            --eltorito-catalog boot/grub/boot.cat \
        --grub2-boot-info \
        --grub2-mbr $cache_dir/usr/lib/grub/i386-pc/boot_hybrid.img \
        -eltorito-alt-boot \
            -e EFI/efiboot.img \
            -no-emul-boot \
        -append_partition 2 0xef scratch/efiboot.img \
        -graft-points \
            image \
            /boot/grub/bios.img=scratch/bios.img \
            /EFI/efiboot.img=scratch/efiboot.img

    # Report final ISO size
    echo -e "$yel\nISO image saved:"
    du -sh $iso_image_file
    echo -e "$off"
    echo
    echo "Done."
    echo
}


#
# Execute functions based on the requested action
#

if [ "$ACTION" == "clean" ]; then
    # Clean all build files
    clean
fi

if [ "$ACTION" == "" ]; then
    # Build new ISO image
    prepare
    script_init
    script_base
    script_desktop
    script_add_nonfree
    script_config
    script_exit
    chroot_exec
    create_livefs
    [ $? = 0 ] && rm -f BASE
    create_iso
fi

if [ "$ACTION" == "base" ]; then
    # Create base system
    prepare
    script_init
    script_base
    script_add_nonfree
    script_config
    script_exit
    chroot_exec
    create_livefs
    [ $? = 0 ] && touch BASE
    create_iso
fi

if [ "$ACTION" == "changes" ]; then
    # Enter existing system to make changes
    echo -e "$yel* Updating existing image.$off"
    script_init
    script_shell
    script_config
    script_exit
    chroot_exec
    create_livefs
    create_iso
fi

if [ "$ACTION" == "play" ]; then
    # Enter existing system to happy play
    echo -e "$yel* Just look around and have fun.$off"
    script_init
    script_shell
    script_exit
    chroot_exec
fi

if [ "$ACTION" == "boot" ]; then
    # Rebuild existing ISO image (update bootloader)
    create_iso
fi
