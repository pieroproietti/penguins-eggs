# sidecar START
if [ -n "${KOPT_alpinelivelabel}" ]; then
	rootflags="mode=0755"

	$MOCK mount -t tmpfs -o $rootflags tmpfs $sysroot

	alpinelive=$(blkid | grep "${KOPT_alpinelivelabel}" | awk -F: '{print $1}')
	if [ -z "$alpinelive" ]; then
		alpinelive=/dev/sr0
	fi
	fstype=$(blkid | grep "${KOPT_alpinelivelabel}" | awk -F' ' '{for(i=1;i<=NF;i++) if ($i ~ /TYPE/) print $i}' | awk -F'"' '{print $2}')
	if [ -z "$fstype" ]; then
		fstype=iso9660
	fi

	clear
	echo "Penguins' eggs: sidecar"
	echo "======================="
	echo "- device: $alpinelive"
	echo "- fstype: $fstype"
	echo "- label device: $KOPT_alpinelivelabel"
	echo "- filesystem.squashfs: $KOPT_alpinelivesquashfs"
	sleep 5

	# Creating mountpoint
	mkdir /mnt

	# mount /dev/sr0
	mount -t $fstype ${alpinelive} /mnt

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
# sidecar END
