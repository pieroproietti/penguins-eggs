/**
 * penguins-eggs: filters.ts 
 * 
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com  
 */
 


const filters=`\
--filter="- /dev/*" \
--filter="- /cdrom/*" \
--filter="- /media/*" \
--filter="- /mnt/*" \
--filter="- /proc/*" \
--filter="- /root/*" \
--filter="- /run/*" \
--filter="- /sys/*" \
--filter="- /tmp/*" \
--filter="- /swapfile" \
--filter="- /persistence.conf" \
--filter="- /live/*" \
--filter="- /lib/live/*" \
--filter="+ /lib/live/boot/*" \
--filter="- /usr/lib/live/*" \
--filter="- /boot/grub/grub.cfg" \
--filter="- /boot/grub/device.map" \
--filter="- /boot/grub/menu.lst" \
--filter="- /boot/*.bak"  \
--filter="- /boot/*.old-dkms" \
--filter="- /etc/apt/sources.list~" \
--filter="- /etc/blkid.tab" \
--filter="- /etc/blkid.tab.old" \
--filter="- /etc/crypttab" \
--filter="- /etc/fstab" \
--filter="- /etc/fstab.d/*" \
--filter="- /etc/initramfs-tools/conf.d/resume" \
--filter="- /etc/initramfs-tools/conf.d/cryptroot" \
--filter="- /etc/mtab" \
--filter="- /etc/popularity-contest.conf" \
--filter="- /etc/pve/*" \
--filter="- /etc/ssh/ssh_host_*_key*" \
--filter="- /etc/ssh/ssh_host_key*" \
--filter="- /etc/udev/rules.d/70-persistent-cd.rules" \
--filter="- /etc/udev/rules.d/70-persistent-net.rules" \
--filter="- /usr/share/icons/*/icon-theme.cache" \
--filter="- /var/backups/*.gz" \
--filter="- /var/backups/*.bak" \
--filter="- /var/cache/apt/archives/*.deb" \
--filter="- /var/cache/apt/pkgcache.bin" \
--filter="- /var/cache/apt/srcpkgcache.bin" \
--filter="- /var/cache/apt/apt-file/*" \
--filter="- /var/cache/debconf/*~old" \
--filter="- /var/lib/apt/*~" \
--filter="- /var/lib/apt/cdroms.list" \
--filter="- /var/lib/apt/lists/*" \
--filter="- /var/lib/aptitude/*.old" \
--filter="- /var/lib/dbus/machine-id" \
--filter="- /var/lib/dhcp/*" \
--filter="- /var/lib/dpkg/*~old" \
--filter="- /var/lib/lxcfs/*" \
--filter="- /var/lib/vz/*" \
--filter="- /var/log/*" \
--filter="- /var/spool/mail/*" \
--filter="- /var/mail/*" \
--filter="+ /home/undefined" \
--filter="- /home/*"`;

export default filters;
