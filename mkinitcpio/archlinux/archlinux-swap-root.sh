mkdir /run/archiso/cowspace/.lower
mount /run/archiso/bootmnt/live/filesystem.squashfs /run/archiso/cowspace/.lower
mkdir /run/archiso/cowspace/.upper
mkdir /run/archiso/cowspace/.work
mount -t overlay overlay -o lowerdir=/run/archive/.lower,upperdir=/run/archive/.upper,workdir=/run/archive/.work /new_root
