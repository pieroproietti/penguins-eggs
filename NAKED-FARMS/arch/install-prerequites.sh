pacman -Syu --noconfirm --needed \
		arch-install-scripts \
		bash-completion \
		dosfstools \
		erofs-utils \
		findutils \
		git \
		grub \
		jq \
		libarchive \
		libisoburn \
		lsb-release \
		lvm2 \
		mkinitcpio-archiso \
		mkinitcpio-nfs-utils \
		mtools \
		nbd \
		nodejs \
        npm \
		pacman-contrib \
		parted \
		procps-ng \
		pv \
		python \
		rsync \
		squashfs-tools \
		sshfs \
		syslinux \
        xdg-user-dirs \
		xdg-utils

	# install pnpm
    npm i pnpm -g

    # mkdir /usr/share/icons
    mkdir -p /usr/share/icons
    
