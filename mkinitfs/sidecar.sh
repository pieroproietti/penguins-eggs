myopts="alpinelivesquashfs alpinelivelabel autodetect_serial chart cow_spacesize 
    cryptroot cryptdm cryptheader cryptoffset cryptdiscards cryptkey debug_init 
	ds init init_args keep_apk_new modules pkgs quiet root_size root usbdelay ip 
	alpine_repo apkovl splash blacklist overlaytmpfs overlaytmpfsflags rootfstype 
	rootflags nbd resume resume_offset 	s390x_net dasd ssh_key BOOTIF zfcp 
	uevent_buf_size aoe aoe_iflist aoe_mtu wireguard"
	

# sidecar start #####################################################################
# 
# git clone https://gitlab.alpinelinux.org/alpine/mkinitfs 
#
# edit mkinitfs/initramfs-init.in
#
# add to myopts:
#	alpinelivesquashfs
#	alpinelivelabel 
#	cow_spacesize
#
# fing line: `$MOCK mount -t tmpfs -o $rootflags tmpfs $sysroot`
#
# and insert sidecar.in there
# 
####################################################################################
if [ -n "${KOPT_alpinelivelabel}" ]; then
	devicelive=$(blkid | grep "${KOPT_alpinelivelabel}" | awk -F: '{print $1}')
	fstype=$(blkid | grep "${KOPT_alpinelivelabel}" | awk -F' ' '{for(i=1;i<=NF;i++) if ($i ~ /TYPE/) print $i}' | awk -F'"' '{print $2}')

	clear
	echo "Penguins' eggs: sidecar"
	echo "======================="
	echo "booting from: $devicelive"
	echo "- fstype: $fstype"
	echo "- label: $KOPT_alpinelivelabel"
	echo "- filesystem.squashfs: $KOPT_alpinelivesquashfs"
	echo "- cow_spacesize: $KOPT_cow_spacesize NOT_USED!"
	sleep 5

	# Creating mountpoint
	mkdir /mnt

	# mount /dev/sr0
	mount -t $fstype ${devicelive} /mnt

	# mount filesystem squashfs on /media/root-ro
	mkdir -p /media/root-ro 
	mount -t squashfs ${KOPT_alpinelivesquashfs}  /media/root-ro

	# mount tmpfs on /media/root-rw
	mkdir -p /media/root-rw 
	mount -t tmpfs root-tmpfs /media/root-rw

	# creare i punti di montaggio necessari
	mkdir -p /media/root-rw/work 
	mkdir -p /media/root-rw/root

	# mount  overlayfs on /sysroot
	mount -t overlay overlay -o lowerdir=/media/root-ro,upperdir=/media/root-rw/root,workdir=/media/root-rw/work $sysroot

	# just a dummy value for /etc/machine-id
	echo 21733847458759515a19bd2466cdd5de | tee /sysroot/etc/machine-id
fi
# sidecar end   #####################################################################
