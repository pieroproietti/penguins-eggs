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


mount -o bind /dev                     /sysroot/dev
mkdir /sysroot/mqueue
mount -o bind /dev/mqueue              /sysroot/dev/mqueue
mkdir /sysroot/hugepages
mount -o bind /dev/hugepages           /sysroot/dev/hugepages
mount -o bind /dev/shm                 /sysroot/dev/shm
mount -o bind /dev/pts                 /sysroot/dev/pts
mount -o bind /proc                    /sysroot/proc
mkdir /proc/sys/fs/binfmt_misc
mount -o bind /proc/sys/fs/binfmt_misc /sysroot/proc/sys/fs/binfmt_misc
mount -o bind /run                     /sysroot/run
mount -o bind /sys                     /sysroot/sys
mkdir /sysroot/sys/cgroup
mount -o bind /sys/fs/cgroup           /sysroot/sys/cgroup
mkdir /sysroot/sys/pstore 
mount -o bind /sys/fs/pstore           /sysroot/sys/pstore 
mkdir /sysroot/sys/bpf
mount -o bind /sys/fs/bpf              /sysroot/sys/bpf
mount -o bind /sys/fs/fuse/connections /sysroot/sys/fs/fuse/connections
mount -o bind /sys/fs/selinux          /sysroot/sys/fs/selinux
mount -o bind /sys/kernel/debug        /sysroot/sys/kernel/debug
mount -o bind /sys/kernel/security     /sysroot/sys/kernel/security
mount -o bind /sys/kernel/tracing      /sysroot/sys/kernel/tracing
mount -o bind /sys/kernel/config       /sysroot/sys/kernel/config
mount -o bind /tmp                     /sysroot/tmp
mount -o bind /var/lib/nfs/rpc_pipefs  /sysroot//var/lib/nfs/rpc_pipefs

