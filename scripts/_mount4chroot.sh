for i in /dev/pts /dev /proc /sys; do mount -o $i /TARGET/$i; done
#mount -o bind /proc /TARGET/proc
#mount -o bind /dev /TARGET/dev
#mount -o bind /sys /TARGET/sys
#mount -o bind /run /TARGET/run
#for i in /dev/pts /dev /proc /sys; do umount /TARGET/$i; done
