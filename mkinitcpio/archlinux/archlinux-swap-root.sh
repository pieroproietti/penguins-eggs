. /init_functions

mkdir /run/archiso/cowspace/.lower
mount /run/archiso/bootmnt/live/filesystem.squashfs /run/archiso/cowspace/.lower
mkdir /run/archiso/cowspace/.upper
mkdir /run/archiso/cowspace/.work
mount -t overlay overlay -o lowerdir=/run/archiso/cowspace/.lower,upperdir=/run/archiso/cowspace/.upper,workdir=/run/archiso/cowspace/.work /new_root

init="/sbin/init"
#echo rdlogger_stop
exec env -i "TERM=$TERM" \usr\bin\swap_root $init "$@"