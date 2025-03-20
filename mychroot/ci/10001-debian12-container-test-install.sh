#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
export NEEDRESTART_MODE=a
export DEBIAN_FRONTEND=noninteractive

####################################################################################################################################
# 1 check
cd $CMD_PATH
env
pwd
whoami

####################################################################################################################################
# 2 hostname
echo -e "$(hostname)\n" > /etc/hostname

# 2.1 hosts
echo -e "\
127.0.0.1  localhost
::1        localhost ip6-localhost ip6-loopback
ff02::1    ip6-allnodes
ff02::2    ip6-allrouters
# This host address
127.0.1.1   $(hostname)" > /etc/hosts

####################################################################################################################################
# penguins-eggs mininal requisites for debian bookworm

cd $CMD_PATH
apt update -y
apt upgrade -y

# packages to be added for a minimum standard installation
apt install \
    apt-listchanges \
    apt-utils \
    bash-completion \
    cron \
    cron-daemon-common \
    debconf-i18n \
    debian-faq \
    dialog \
    dictionaries-common \
    discover \
    discover-data \
    distro-info-data \
    dnsutils \
    doc-debian \
    eject \
    emacsen-common \
    fdisk \
    file \
    git \
    grub-efi-amd64 \
    iamerican \
    ibritish \
    ienglish-common \
    ifupdown \
    inetutils-telnet \
    init \
    installation-report \
    iproute2 \
    iputils-ping \
    isc-dhcp-client \
    isc-dhcp-common \
    iso-codes \
    ispell \
    iucode-tool \
    laptop-detect \
    less \
    libdiscover2 \
    liblockfile-bin \
    libmagic-mgc \
    libmagic1 \
    libnewt0.52 \
    libnftables1 \
    libnftnl11 \
    libpci3 \
    libslang2 \
    libtext-charwidth-perl \
    libtext-iconv-perl \
    libtext-wrapi18n-perl \
    liburing2 \
    libusb-1.0-0 \
    locales \
    logrotate \
    lsb-release \
    lsof \
    mailcap \
    man \
    man-db \
    manpages \
    mime-support \
    nano \
    ncurses-term \
    net-tools \
    netcat-traditional \
    nftables \
    pci.ids \
    pciutils \
    procps \
    python-apt-common \
    python3-apt \
    python3-certifi \
    python3-chardet \
    python3-charset-normalizer \
    python3-debconf \
    python3-debian \
    python3-debianbts \
    python3-httplib2 \
    python3-idna \
    python3-pkg-resources \
    python3-pycurl \
    python3-pyparsing \
    python3-pysimplesoap \
    python3-reportbug \
    python3-requests \
    python3-six \
    python3-urllib3 \
    qemu-guest-agent \
    reportbug \
    sensible-utils \
    sudo \
    systemd-sysv \
    task-english \
    tasksel \
    tasksel-data \
    traceroute \
    tzdata \
    ucf \
    usbutils \
    util-linux-locales \
    vim \
    vim-tiny \
    wamerican \
    wget \
    whiptail -y


# We must install the same version of the host
apt install linux-image-$(uname -r) -y

# init /usr/share/applications
dpkg -S /usr/share/applications

apt install python3 -y
ls -al /usr/share/applications

# fix linuxefi.mod
apt-file update
apt-file search linuxefi.mod
apt install grub-efi-amd64-bin -y

# starting with eggs
cd /ci/
ls -al
apt install -y ./*.deb
eggs love


# clean debs on /ci
rm /ci/*.deb

date

echo "# enable bash_completion, running:"
echo "source /etc/bash_completion"
