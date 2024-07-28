#!/bin/sh -e

if [ 0 -ne `id -u` ]; then
  echo "This script needs root access" >&2
  exit 1
fi

if ! [ -d "$1" ] || [ x-h = x"$*" ] || [ x--help = x"$*" ]; then
  echo "Usage: ${0##*/} <chroot_directory>" >&2
  exit 1
fi

cd "$1"
if ! [ -d ./etc ]; then
  echo "No etc directory inside $1" >&2
  exit 1
fi
shift

MOUNTED=
umount_all() {
  case $MOUNTED in
  shm\ *) if [ -L ./dev/shm ]; then
            umount ./`readlink ./dev/shm`
          else
            umount ./dev/shm
          fi
          MOUNTED=${MOUNTED#shm };;
  esac
  case $MOUNTED in
  run\ *) umount ./run
          MOUNTED=${MOUNTED#run };;
  esac
  case $MOUNTED in
  tmp\ *) umount ./tmp
          MOUNTED=${MOUNTED#tmp };;
  esac
  case $MOUNTED in
  proc\ *) umount ./proc
          MOUNTED=${MOUNTED#proc };;
  esac
  case $MOUNTED in
  sys\ *) umount ./sys
          MOUNTED=${MOUNTED#sys };;
  esac
  case $MOUNTED in
  pts\ *) umount ./dev/pts
          MOUNTED=${MOUNTED#pts };;
  esac
  case $MOUNTED in
  dev\ *) umount ./dev
          MOUNTED=${MOUNTED#dev };;
  esac
}
trap 'umount_all' EXIT

#mkdir -p ./etc ./dev/pts ./sys ./proc ./tmp ./run ./boot ./root

cp -iL /etc/resolv.conf ./etc/ || true  # if ^C, will cancel script

mount --bind /dev ./dev
MOUNTED="dev $MOUNTED"

mount -t devpts devpts ./dev/pts -o nosuid,noexec
MOUNTED="pts $MOUNTED"

mount -t sysfs sys ./sys -o nosuid,nodev,noexec,ro
MOUNTED="sys $MOUNTED"

mount -t proc proc ./proc -o nosuid,nodev,noexec
MOUNTED="proc $MOUNTED"

mount -t tmpfs tmp ./tmp -o mode=1777,nosuid,nodev,strictatime
MOUNTED="tmp $MOUNTED"
mount -t tmpfs run ./run -o mode=0755,nosuid,nodev
MOUNTED="run $MOUNTED"
if [ -L ./dev/shm ]; then
  mkdir -p ./`readlink ./dev/shm`
  mount -t tmpfs shm ./`readlink ./dev/shm` -o mode=1777,nosuid,nodev
else
  #mkdir -p ./dev/shm
  mount -t tmpfs shm ./dev/shm -o mode=1777,nosuid,nodev
fi
MOUNTED="shm $MOUNTED"

case $1 in
  -l) shift;;
  -l*) one=${1#-l}; shift; set -- -"$one" "$@";;
esac
chroot . /usr/bin/env -i SHELL=/bin/sh HOME=/root TERM="$TERM" \
  PATH=/usr/sbin:/usr/bin:/sbin:/bin PS1='chroot # ' /bin/sh -l "$@"

# FIXME
# are USER and LOGNAME set automatically?
# perhaps: source /etc/profile && export PS1="chroot $PS1"

