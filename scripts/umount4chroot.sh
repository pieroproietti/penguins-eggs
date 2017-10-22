for i in /dev/pts /dev /proc /sys; do umount /TARGET/$i; done
# umount /TARGET/proc
# sleep 1
# umount  /TARGET/dev
# sleep 1
# umount  /TARGET/sys
# sleep 1
# umount  /TARGET/run
# sleep 1
