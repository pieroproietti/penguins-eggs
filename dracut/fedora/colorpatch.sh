echo 'eggs>>> color patch'
mkdir /eggs
mkdir /eggs/medium
mkdir /eggs/.lowerdir
mkdir /eggs/.upperdir
mkdir /eggs/.workdir
mount /dev/sr0 /eggs/medium
mount -t squashfs /eggs/medium/live/filesystem.squashfs /eggs/.lowerdir -o loop
mount -t overlay overlay -o lowerdir=/eggs/.lowerdir,upperdir=/eggs/.upperdir,workdir=/eggs/.workdir /sysroot
