#!/usr/bin/env bash

# This script build a debian system from container

set -x

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
export NEEDRESTART_MODE=a
export DEBIAN_FRONTEND=noninteractive

# check if we are on Debian/Devuan/Ubuntu
if [ -f /etc/os-release ]; then
	source /etc/os-release
  if [[ "$ID" != "debian" && "$ID_LIKE" != *"debian"* ]]; then
   	echo "This script is only for Debian/Devuan/Ubuntu based systems"
   	exit
	fi
fi

# echo "base: system e init"
# echo "package manager"
# echo "login e console"
# echo "networking"
# echo "filesystem and disk support"
# echo "drivers and hw support"
# echo "tools"
# echo "optional tools debug/live ISO"
# echo "systemd configure/enable"
# echo "generate /etc/default/grub"
# echo "eggs requirements"



echo "base: system e init"
apt install -y \
  init \
  cron \
  cron-daemon-common \
  locales \
  linux-image-amd64 \
  logrotate \
  procps \
  tzdata \
  util-linux-locales \
  ucf

echo "package manager"
apt install -y \
  apt-utils \
  apt-listchanges \
  python3-apt \
  python-apt-common \
  python3-debconf \
  tasksel \
  tasksel-data

echo "login e console"
apt install -y \
  sudo \
  bash-completion \
  dialog \
  whiptail \
  nano \
  less \
  vim \
  vim-tiny \
  ncurses-term \
  man \
  man-db \
  manpages

echo "networking"
apt install -y \
  isc-dhcp-client \
  isc-dhcp-common \
  dnsutils \
  inetutils-telnet \
  ifupdown \
  iproute2 \
  iputils-ping \
  net-tools \
  netcat-traditional \
  nftables \
  traceroute \
  wget \
  python3-requests \
  python3-certifi \
  python3-chardet \
  python3-charset-normalizer \
  python3-idna \
  python3-urllib3 \
  python3-pycurl \
  python3-httplib2 \
  python3-pyparsing \
  python3-pysimplesoap \
  python3-six

echo "filesystem and disk support"
apt install -y \
  fdisk \
  eject \
  usbutils \
  lsof \
  lsb-release

echo "drivers and hw support"
apt install -y \
  discover \
  discover-data \
  libdiscover2 \
  laptop-detect \
  pciutils \
  pci.ids \
  iucode-tool \
  libpci3 \
  qemu-guest-agent

echo "tools"
apt install -y \
  file \
  libmagic1 \
  libmagic-mgc \
  git \
  debian-faq \
  doc-debian \
  installation-report \
  iso-codes \
  python3-debian \
  python3-debianbts \
  reportbug \
  sensible-utils

echo "optional tools debug/live ISO"
apt install -y \
  emacsen-common \
  ispell \
  iamerican \
  ibritish \
  wamerican \
  ienglish-common \
  dictionaries-common



echo "eggs requirements"
LIVE_CONFIG_INIT_SYSTEM="live-config-systemd"
if [[ "$ID" == "devuan" ]]; then
  LIVE_CONFIG_INIT_SYSTEM="live-config-sysvinit"
fi

apt-get install -y \
    coreutils \
    cryptsetup \
    curl \
    dosfstools \
    dpkg-dev \
    git \
    grub-efi-amd64-bin \
    jq \
    live-boot \
    live-boot-doc \
    live-boot-initramfs-tools \
    $LIVE_CONFIG_INIT_SYSTEM \
    live-tools \
    lvm2 \
    parted \
    rsync \
    squashfs-tools \
    sshfs \
    wget \
    xorriso