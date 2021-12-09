echo 'eggs>>> color patch'
mkdir /eggs
mkdir /eggs/medium
mkdir /eggs/.lowerdir
mkdir /eggs/.upperdir
mkdir /eggs/.workdir
mount /dev/sr0 /eggs/medium
mount -t squashfs /eggs/medium/live/filesystem.squashfs /eggs/.lowerdir -o loop
mount -t overlay overlay -o lowerdir=/eggs/.lowerdir,upperdir=/eggs/.upperdir,workdir=/eggs/.workdir /sysroot
# Now we need to mount vfs
mount -o bind /dev /sysroot/dev
mount -o bind /dev/pts /sysroot/dev/pts
mount -o bind /proc /sysroot/proc
mount -o bind /sys /sysroot/sys
mount -o bind /run /sysroot/run

