const excludesRoot=`
--exclude="/dev/*"
--exclude="/cdrom/*"
--exclude="/mnt/*"
--exclude="/sys/*"
--exclude="/proc/*"
--exclude="/tmp/*"
--exclude="/run/*"
--exclude="/live"
--exclude="/swapfile"
--exclude="/persistence.conf"`;

const excludesBoot=`
--exclude="/boot/grub/grub.cfg"
--exclude="/boot/grub/menu.lst"
--exclude="/boot/grub/device.map"
--exclude="/boot/*.bak"
--exclude="/boot/*.old-dkms"`;

const excludesEtc=`
--exclude="/etc/udev/rules.d/70-persistent-cd.rules"
--exclude="/etc/udev/rules.d/70-persistent-net.rules"
--exclude="/etc/fstab"
--exclude="/etc/fstab.d/*"
--exclude="/etc/mtab"
--exclude="/etc/blkid.tab"
--exclude="/etc/blkid.tab.old"
--exclude="/etc/apt/sources.list~"
--exclude="/etc/crypttab"
--exclude="/etc/initramfs-tools/conf.d/resume"
--exclude="/etc/initramfs-tools/conf.d/cryptroot"
--exclude="/etc/popularity-contest.conf"
--exclude="/etc/pve/*"
--exclude="/etc/ssh/ssh_host_*_key*"
--exclude="/etc/ssh/ssh_host_key*"`;

const excludesLib=`
--exclude="/lib/live/overlay"
--exclude="/lib/live/image"
--exclude="/lib/live/rootfs"
--exclude="/lib/live/mount"`;

const excludesUsr=`
--exclude="/usr/share/icons/*/icon-theme.cache" `;

const excludesVar=`
--exclude="/var/lib/lxcfs/*"
--exclude="/var/lib/vz/*"
--exclude="/var/cache/apt/archives/*.deb"
--exclude="/var/cache/apt/pkgcache.bin"
--exclude="/var/cache/apt/srcpkgcache.bin"
--exclude="/var/cache/apt/apt-file/*"
--exclude="/var/cache/debconf/*~old"
--exclude="/var/lib/apt/lists/*"
--exclude="/var/lib/apt/*~"
--exclude="/var/lib/apt/cdroms.list"
--exclude="/var/lib/aptitude/*.old"
--exclude="/var/lib/dhcp/*"
--exclude="/var/lib/dpkg/*~old"
--exclude="/var/log/*"
--exclude="/var/spool/mail/*"
--exclude="/var/mail/*"
--exclude="/var/backups/*.gz"
--exclude="/var/backups/*.bak"
--exclude="/var/lib/dbus/machine-id"
--exclude="/var/lib/live/config/*"`;

const excludesHome=`
--exclude="/home/*/.local/share/Trash/*"
--exclude="/home/*/.config/google-chrome/*"
--exclude="/home/*/.bash_history"
--exclude="/home/*/.xsession-errors*"
--exclude="/home/*/.ICEauthority"
--exclude="/home/*/.Xauthority"
--exclude="/home/*/.gnupg"
--exclude="/home/*/.ssh"`;

const excludesHomeRoot=`
--exclude="/root/*"`;

const excludes= excludesRoot +
                excludesBoot +
                excludesEtc +
                excludesLib +
                excludesUsr +
                excludesVar +
                excludesHome +
                excludesHomeRoot;


export default excludes;
