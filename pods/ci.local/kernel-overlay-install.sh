#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
export NEEDRESTART_MODE=a
export DEBIAN_FRONTEND=noninteractive

cd $CMD_PATH

if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    if [[ "$ID" == "almalinux" ]]; then
        echo "install the package of capsh"
        mkdir /boot
        dnf -y install kernel 
        kernel_version=$(rpm -q kernel --qf "%{VERSION}-%{RELEASE}.%{ARCH}\n" | tail -n 1)
        cp /usr/lib/modules/$kernel_version/vmlinuz /boot/vmlinuz-$kernel_version
        dracut --force --kver $kernel_version

    elif [[ "$ID" == "arch" ]]; then
        echo "install the package of capsh"
        pacman -S --needed --noconfirm linux linux-headers
        pacman -S --needed --noconfirm libcap
        pacman -S --needed --noconfirmkmod
        
    elif [[ "$ID" == "debian" ]]; then
        echo "install the package of capsh"
        apt update -y
        apt install linux-image-amd64 -y
        apt install -y kmod
        apt install -y libcap2-bin
        
    elif [[ "$ID" == "devuan" ]]; then
        echo "install the package of capsh"
        apt update -y
        apt install linux-image-amd64 -y
        apt install -y kmod
        apt install -y libcap2-bin
        
    elif [[ "$ID" == "fedora" ]]; then
        echo "install the package of capsh"
        mkdir /boot
        dnf -y install kernel 
        kernel_version=$(rpm -q kernel --qf "%{VERSION}-%{RELEASE}.%{ARCH}\n" | tail -n 1)
        cp /usr/lib/modules/$kernel_version/vmlinuz /boot/vmlinuz-$kernel_version
        dracut --force --kver $kernel_version

    elif [[ "$ID" == "manjaro" ]]; then
        echo "install the package of capsh"
        pacman -S --needed --noconfirm linux linux-headers
        pacman -S --needed --noconfirm libcap
        pacman -S --needed --noconfirmkmod

    elif [[ "$ID" == "opensuse" ]]; then
        mkdir /boot
        zypper install --force kernel-default kernel-default-devel
        kernel_version=$(rpm -q kernel --qf "%{VERSION}-%{RELEASE}.%{ARCH}\n" | tail -n 1)
        cp /usr/lib/modules/$kernel_version/vmlinuz /boot/vmlinuz-$kernel_version
        dracut --force --kver $kernel_version

    elif [[ "$ID" == "opensuse-tumbleweed" ]]; then
        echo "install the package of capsh"
        zypper install -y kernel
        zypper install -y libcap-progs

    elif [[ "$ID" == "rocky" ]]; then
        echo "install the package of capsh"
        mkdir /boot
        dnf -y install kernel 
        kernel_version=$(rpm -q kernel --qf "%{VERSION}-%{RELEASE}.%{ARCH}\n" | tail -n 1)
        cp /usr/lib/modules/$kernel_version/vmlinuz /boot/vmlinuz-$kernel_version
        dracut --force --kver $kernel_version

        
    elif [[ "$ID" == "ubuntu" ]]; then
        echo "install the package of capsh"
        apt install linux-image-generic -y
        apt install -y kmod
        apt install -y libcap2-bin
        
    else
        echo "distro not supported"
        exit 1
    fi
fi

grep overlay /proc/filesystems
modprobe overlay

capsh --print

mkdir -p $CMD_PATH/lower $CMD_PATH/upper $CMD_PATH/work $CMD_PATH/merged

# Add test files
echo "Lower File" > $CMD_PATH/lower/test.txt
echo "Upper File" > $CMD_PATH/upper/test.txt

mount -t overlay overlay -o lowerdir=$CMD_PATH/lower,upperdir=$CMD_PATH/upper,workdir=$CMD_PATH/work $CMD_PATH/merged

ls $CMD_PATH/merged
cat $CMD_PATH/merged/test.txt

umount $CMD_PATH/merged

rm -rf $CMD_PATH/lower 
rm -rf $CMD_PATH/upper 
rm -rf $CMD_PATH/work 
rm -rf $CMD_PATH/merged
date
