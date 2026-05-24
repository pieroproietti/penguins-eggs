# Alpine sidecar
sidecar-mkinitfs
Facciamo un backup di initramfs-init in initramfs-init-original

cp /usr/share/mkinitfs/initramfs-init ~/penguins-alpine/aports/sidecar/initramfs-init-original
Quindi, ci copiamo initramfs-init per modificarlo:

cp ~/penguins-alpine/aports/sidecar/initramfs-init-original ~/penguins-alpine/aports/sidecar/initramfs-init
ed andiamo ad aggiungerervi il sidecar.in.

A questo punto, non ci resta che sostituire /usr/share/mkinitfs/initramfs-init con la nostra modifica.
```
doas cp ~/penguins-alpine/aports/sidecar/initramfs-init /usr/share/mkinitfs/initramfs-init
```

# sidecar.in (originale)
```
# sidecar start <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
# edit /usr/share/mkinitfs/initramfs-init
#
# add to myopts:
#	alpinelivesquashfs
#	alpinelivelabel 
#	cow_spacesize
#
# find 
# # check if root=... was set
#  if [ -n "$KOPT_root" ]; then
#   ...
# 	echo "initramfs emergency recovery shell launched"
# 	insert sidecar.in affer the line
	# exec /bin/busybox sh
# fi
if [ -z "$KOPT_root" ]; then
  	# Sidecar will run if the variable is empty.
	if [ -n "${KOPT_alpinelivelabel}" ] && [ -n "${KOPT_alpinelivesquashfs}" ]; then
		ebegin "Attempting boot from live media (sidecar method)"
		$MOCK nlplug-findfs -p /sbin/mdev ${KOPT_usbdelay:+-t $(( $KOPT_usbdelay * 1000 ))}
		eend 0	# Ci interessa solo settare /dev/disk/by-lanel
		
		devicelive=$(findfs "LABEL=${KOPT_alpinelivelabel}")
		if [ -z "$devicelive" ]; then
			eend 1 "Live media not found!" && /bin/busybox sh
		fi
		
		# Controlla se il dispositivo è stato trovato
		if [ -n "$devicelive" ]; then
			fstype=$(blkid | grep -m 1 "${KOPT_alpinelivelabel}" | sed -n 's/.*TYPE="\([^"]*\)".*/\1/p')
			echo "Live media found: $devicelive (type: $fstype)" > "$ROOT"/dev/kmsg

			mkdir -p /mnt 
			
			# Monta il dispositivo e poi il filesystem squashfs
			if mount -t "$fstype" -o ro "$devicelive" /mnt/ && \
				mkdir -p /media/root-ro 
				mount -t squashfs -o ro "${KOPT_alpinelivesquashfs}" /media/root-ro; then
				
				# mount tmpfs on /media/root-rw
				mkdir -p /media/root-rw 
				mount -t tmpfs root-tmpfs /media/root-rw

				# creare i punti di montaggio necessari
				mkdir -p /media/root-rw/work 
				mkdir -p /media/root-rw/root

				# mount  overlayfs on /sysroot
				mount -t overlay overlay -o lowerdir=/media/root-ro,upperdir=/media/root-rw/root,workdir=/media/root-rw/work $sysroot
				
				# we need a value for /etc/machine-id
				echo 21733847458759515a19bd2466cdd5de | tee /sysroot/etc/machine-id

				# Verifica che l'overlay sia riuscito e che init sia presente
				if [ -x "$sysroot/$KOPT_init" ]; then
					eend 0 "Live media boot successful"
					
					# La root è pronta. Saltiamo al finale.
					# Aggiungi configurazioni finali necessarie
					# setup_inittab_console
					! [ -f "$sysroot"/etc/resolv.conf ] && [ -f /etc/resolv.conf ] && \
						cp /etc/resolv.conf "$sysroot"/etc

					# Finalizza e passa il controllo al nuovo sistema
					cat "$ROOT"/proc/mounts 2>/dev/null | while read DEV DIR TYPE OPTS ; do
						if [ "$DIR" != "/" -a "$DIR" != "$sysroot" -a -d "$DIR" ]; then
							mkdir -p "$sysroot/$DIR"
							$MOCK mount -o move "$DIR" "$sysroot/$DIR"
						fi
					done
					sync
					echo "Switching to live system..." > "$ROOT"/dev/kmsg
					exec switch_root $switch_root_opts "$sysroot" $chart_init "$KOPT_init" $KOPT_init_args
				else 
					eend 1 "Live media boot problems"
				fi
			fi
		fi
		
		# Se siamo qui, il sidecar boot è fallito
		eend 1 "Sidecar boot failed. Falling back to default method."
	fi
fi

# next line will be:
# resume_from_disk
# sidecar end <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
```




# live conf (originale)
```
modules="8139cp e1000e r8169 virtio-pci virtio_net tg3 " 
features="ata base ide scsi cdrom usb virtio ext4 blkid squashfs"
```