# https://github.com/dracutdevs/fedora-container/blob/master/Dockerfile-latest
# but don't install dnssquash-live 
dnf -y install --setopt=install_weak_deps=False \
    dash \
    asciidoc \
    mdadm \
    lvm2 \
    dmraid \
    cryptsetup \
    nfs-utils \
    nbd \
    dhcp-server \
    scsi-target-utils \
    iscsi-initiator-utils \
    strace \
    btrfs-progs \
    kmod-devel \
    gcc \
    bzip2 \
    xz \
    tar \
    wget \
    rpm-build \
    make \
    git \
    bash-completion \
    sudo \
    kernel \
    dhcp-client \
    /usr/bin/qemu-kvm \
    /usr/bin/qemu-system-$(uname -i) \
    e2fsprogs \
    tcpdump \
    iproute \
    iputils \
    dbus-daemon \
    kbd \
    NetworkManager \
    python3-imgcreate \
    && dnf clean all
