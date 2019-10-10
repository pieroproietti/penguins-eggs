#!/bin/bash
#
# System backup and restore script for Debian-based distributions
# Tested only on Ubuntu
#
# 2018-2019, Krisztián Kende <krisztiankende@gmail.com>
#
# This script can be used freely at your own risk.
# I will not take any responsibility!
#

################################################################################
# Configuration settings
################################################################################

# Storage directory for created restore points.
# If the value is empty then the current directory (see 'pwd' command) will be
# used.
# The default value is empty.
storage_dir=""

# Maximum number of the restore points in a storage directory.
# The oldest restore points will be automatically removed when the new ones are
# created.
# Possible values are between 1 and 99.
# The default value is 5.
max_rp_num=5

# File size limit in MiB. Affects only to the files in the user's home
# directories.
# If the file in the user's home directory is greater than this value, then the
# restore point will not include it.
# Possible values are between 0 and 1024. 0 means that there is no size limit.
# The default value is 8, which means 8 MiB.
max_size=8

# These items will be excluded from the restore points. Affects only to the
# files and dirs in the user's home directories.
# Each lines must begin with a dot, because the restore points do not include
# any other items.
# The default items are .cache/gvfs
#                       .gvfs
#                       .local/share/Trash/files/*
#                       .local/share/Trash/info/*
#                       .Xauthority
#                       .ICEauthority
exclude="\
.cache/gvfs
.gvfs
.local/share/Trash/files/*
.local/share/Trash/info/*
.Xauthority
.ICEauthority"

################################################################################
# End of configuration settings
################################################################################

vers=1.11 # 2019.06.18

################################################################################

trap "grep -sq $$ /run/systemback.sh.pid && rm /run/systemback.sh.pid" EXIT
trap ctrlc INT TERM # Catch SIGINT and SIGTERM
tty= sdir=""

# ANSI escape codes for terminal emulators
[ -t 1 ] && {
    bold1="\e[1m"
    norm1="\e[0m"
    clear1="\e[2J\e[1;1H\ec"
  } || bold1= norm1= clear1=""

[ -t 2 ] && {
    bold2="\e[0;1m"
    red="\e[1;31m"
    norm2="\e[0m"
    clear2="\e[2J\e[1;1H\ec"

    # Write the error output to a temporary file
    efile=/tmp/SB_$(tr -dc a-zA-Z0-9 </dev/urandom 2>/dev/null | head -c 16)
    exec 2> >(tee $efile >&2 ; rm $efile)
  } || bold2= red= norm2= clear2= efile=""

getkey()
{
  while read -n 1 -t .1 ; do : ; done # Flush input buffer
  stty -echo -icanon
  head -c 1
  stty $tty
}

error()
{
  [ "$efile" ] && eout="$(<$efile)" || eout=""
  [ "$sdir" ] && sumount
  printf "$clear2\n $red"

  case $1 in
    1)
      printf "A required tool is missing from the system!\n Please install the '$3' package and try again."
      ;;
    2)
      printf "The 'systemback.sh' is currently running!\n Please wait until it is exited, then try again."
      ;;
    3)
      printf "Permission denied!\n Please try again with 'root' user, instead of '$(whoami)'."
      ;;
    4)
      printf "A required filesystem is missing!\n Please mount the system partition(s) under the '/mnt' directory and try again."
      ;;
    5)
      printf "The following configuration setting is not correct!\n\n   $3"
      ;;
    6)
      printf "A Debian package manager is currently active!\n Please wait until it is closed, then try again."
      ;;
    7)
      printf "The storage directory is missing or incorrect!"
      ;;
    8)
      printf "Incompatible filesystem!\n Please try again with a different storage directory."
      ;;
    9)
      printf "Failed to mount the system partition(s)!"
      ;;
    10)
      printf "Failed to create a new restore point!"
      ;;
    11)
      printf "The selected restore point is missing, incompatible or ambiguous."
      ;;
    12)
      printf "Failed to complete the $3 process."
  esac

  printf "$norm2\n\n  Debug code: $vers-$(($2-$(wc -l <<< $exclude)+6))" # Print script version and line number

  [ "$eout" ] && {
      printf "\n\n ${bold2}Press ENTER to see the error output, or any other key to exit.$norm2 " && [ "$(getkey)" ] || printf "\n\n$eout"
    }

  printf "\n\n"
  exit $1
} >&2

check()
{
  [ "$1" ] && [ ! "$bold1" ] && exit 13 # Need an interactive shell for the restoration
  tty=$(stty -g)
  req="$(which ps fuser rsync)"

  [ $? -eq 0 ] || \
    for t in /{ps_procps,fuser_psmisc,rsync_rsync}
    do [[ "$req" =~ ${t%_*} ]] || error 1 $LINENO ${t#*_}
    done

  [ -s /run/systemback.sh.pid ] && {
      ps -p $(</run/systemback.sh.pid) >/dev/null 2>&1 && error 2 $LINENO # Avoid multiple starting
    }

  [ $(id -u) -eq 0 ] || error 3 $LINENO # This script does not work without root permissions
  [ "$2" ] && ! grep -q " /mnt " /proc/self/mounts && error 4 $LINENO # Allow the system reparation only when a partition is mounted
  [ "${max_rp_num##*[!0-9]*}" ] && [ ${max_rp_num:0:1} -ne 0 ] && [ $max_rp_num -le 99 ] || error 5 $LINENO "${bold2}max_rp_num=$red$max_rp_num"
  [ "${max_size##*[!0-9]*}" ] && [ ${#max_size} -eq 1 -o ${max_size:0:1} -ne 0 ] && [ $max_size -le 1024 ] || error 5 $LINENO "${bold2}max_size=$red$max_size"

  [ "$2" ] || {
      fuser /var/lib/{dpkg,apt/lists}/lock >/dev/null && error 6 $LINENO # Avoid interfere with Debian package managers
    }

  cd "$([ "$storage_dir" ] && printf "$storage_dir" || printf "$PWD")" || error 7 $LINENO

  # Filesystem check
  tfile=$(tr -dc a-zA-Z0-9 </dev/urandom 2>/dev/null | head -c 16)
  touch $tfile && chmod 1345 $tfile && chown 99:101 $tfile
  [ $(stat -c %a%u%g $tfile ; rm -f $tfile) -eq 134599101 ] || error 8 $LINENO

  printf $$ >/run/systemback.sh.pid
}

ctrlc()
{
  pgrep ^rsync$ >/dev/null && pkill -9 ^rsync$
  [ "$sdir" ] && [ -d $sdir ] && sumount
  [ "$efile" ] && rm $efile
  [ "$tty" ] && [ $tty != $(stty -g) ] && stty $tty
  printf "\n\n ${red}Interrupted processing, the script is exiting now.$norm2\n\n"
  exit 14
}

smount()
{
  sdir=/tmp/SB_$(tr -dc a-zA-Z0-9 </dev/urandom 2>/dev/null | head -c 16)
  mkdir $sdir && \
  mount -B $1 $sdir || error 9 $LINENO
  rid=$(stat -fc %i $1)

  for d in boot{,/efi} home opt srv usr{,/local} var
  do [ -d $1$d ] && [ "$(stat -fc %i $1$d)" != "$rid" ] && ! mount -B $1$d $sdir/$d && error 9 $LINENO
  done
}

sumount()
{
  for d in boot{/efi,} home opt srv usr{/local,} var
  do [ -d $sdir/$d ] && [ "$(stat -fc %i $sdir/$d)" != "$rid" ] && umount -l $sdir/$d
  done

  umount -l $sdir
  rmdir $sdir
}

restore()
{
  [ "$2" ] && {
      [ "${2##*[!0-9]*}" ] && [ ${2:0:1} -ne 0 ] && [ $2 -le $max_rp_num ] || error 11 $LINENO
      [ $2 -lt 10 ] && rp=0$2 || rp=$2
    } || \
      for i in $(seq 1 $max_rp_num)
      do
        rp=$([ $i -lt 10 ] && printf 0)$i
        [ "$(echo SB${rp}_*)" = "SB${rp}_*" ] || break
      done

  [[ ! "$(echo SB${rp}_*)" =~ " SB${rp}_" ]] && [ -d SB${rp}_* ] && rp="$(printf SB${rp}_*)" && \
  . "$rp"/.config || error 11 $LINENO
  [ "$1" = / ] && rtype=restoration || rtype=reparation
  printf "$clear1\n ${bold1}Selected restore point:$norm1\n\n  ${rp:5}\n\n ${bold1}Press ENTER to start the system files $rtype, or any other key to skip.$norm1 "

  [ "$(getkey)" ] && echo || {
      # At system restoration, make mounted directories in /snap and /var removable if missing from the restore point
      [ "$1" = / ] && {
          mpts="$(grep -e " /snap/" -e " /var/" /proc/self/mounts | cut -d " " -f 2 | tac)"

          [ "$mpts" ] && {
              while read l
              do [ -d "$rp$l" ] || umount -l "$l"
              done <<< $mpts
            }
        }

      printf "\n\n"
      smount $1
      rsync -ah --progress --delete --include=/{bin,boot,cdrom,dev,etc,home,lib,lib32,lib64,libx32,media,mnt,opt,proc,run,sbin,snap,srv,sys,tmp,usr,var,initrd.img,initrd.img.old,vmlinuz,vmlinuz.old} --exclude=/{*,etc/mtab,usr/local/bin/systemback.sh$([ -s $sdir/usr/local/bin/systemback.sh ] || printf _)} --exclude=/{home,media,mnt,root,run,tmp,var/cache/fontconfig,var/lib/udisks2,var/run,var/tmp}/* --exclude={SB[0-9][0-9]_*,lost+found} "$rp"/ $sdir || error 12 $LINENO $rtype
    }

  printf "\n ${bold1}Press ENTER to start the user's configuration files $rtype, or any other\n key to $([ "$sdir" ] && printf skip || printf exit).$norm1 "

  [ "$(getkey)" ] && {
      [ "$sdir" ] && echo || true
    } || {
      printf "\n\n"
      [ "$sdir" ] || smount $1

      [ -d $sdir/home ] || {
          [ -e $sdir/home -o -h $sdir/home ] && ! rm -rf $sdir/home && error 12 $LINENO $rtype
          mkdir $sdir/home || error 12 $LINENO $rtype
        }

      cnt=0 excl=()

      while read l
      do [ "${l:0:1}" = . ] && excl[$((cnt++))]="--exclude=/$l"
      done <<< $exclude

      [ $max_size -eq 0 ] && msize="" || {
          msize=--min-size=$((max_size*1024*1024+1)) # This is in bytes, $max_size + 1
          bdir=SB_$(tr -dc a-zA-Z0-9 </dev/urandom 2>/dev/null | head -c 16)
        }

      for d in "$rp"/root $([ "$(echo "$rp"/home/*)" = "$rp/home/*" ] || echo "$rp"/home/*)
      do
        usr=${d##*/}
        idir=${d:${#rp}:${#d}-${#rp}-${#usr}-1}

        [ -d $sdir$idir/$usr ] || {
            [ -e $sdir$idir/$usr -o -h $sdir$idir/$usr ] && ! rm -rf $sdir$idir/$usr && error 12 $LINENO $rtype
            mkdir -p $sdir$idir/$usr || error 12 $LINENO $rtype
          }

        [ "$msize" ] && {
            rsync -rptgoDh --progress $msize "${excl[@]}" --include=/.* --exclude=/* --exclude={SB[0-9][0-9]_*,*~} --link-dest=../ $sdir$idir/$usr/ $sdir$idir/$usr/$bdir || error 12 $LINENO $rtype
          }

        rsync -ah --progress --delete "${excl[@]}" --include=.* --exclude=/* --exclude={SB[0-9][0-9]_*,*~} "$rp"$idir/$usr/ $sdir$idir/$usr
        rv=$?

        [ "$msize" ] && {
            rsync -ahm --progress --link-dest=$bdir/ $sdir$idir/$usr/$bdir/ $sdir$idir/$usr
            rm -rf $sdir$idir/$usr/$bdir
          }

        [ $rv -eq 0 ] || error 12 $LINENO $rtype
      done
    }

  [ "$sdir" ] && {
      sumount
      printf "\nFlushing filesystem buffers... "
      sync
      printf "done\n\n ${bold1}The $rtype process is done.\n\n Press ENTER to restart the system, or any other key to exit.$norm1 "
      [ "$(getkey)" ] || reboot
    }

  printf "\n\n"
}

remove()
{
  # Removable restore points begin with 'SB00_'

  [ "$(echo SB00_*)" = "SB00_*" ] || {
      printf "\nRemoving old or incomplete restore point(s)... "

      for r in SB00_*
      do [ -d "$r" ] && rm -rf "$r"
      done

      sync
      printf "done\n"
    }
}

case $1 in
  -n|--new)
    check
    remove
    smount /
    cnt=0 excl=() ldest=()

    while read l
    do [ "${l:0:1}" = . ] && excl[$((cnt++))]="--exclude=/$l"
    done <<< $exclude

    [ "$(echo SB[0-9][0-9]_*)" = "SB[0-9][0-9]_*" ] || {
        cnt=0

        for r in SB[0-9][0-9]_*
        do [ -d "$r" ] && ldest[$((cnt++))]="--link-dest=../../$r/root"
        done
      }

    [ $max_size -eq 0 ] && msize="" || msize=--max-size=${max_size}M
    rp=SB00_$(date +%Y-%m-%d,%H.%M.%S) # Year-Month-Day,Hour.Minute.Second
    mkdir -p $rp/home || error 10 $LINENO

    for d in $(grep :/home/ /etc/passwd | cut -d : -f 6)
    do [ -d $d ] && {
        cnt=0 ldest2=()

        for l in "${ldest[@]}"
        do [ -d "${l:18:-5}$d" ] && ldest2[$((cnt++))]="--link-dest=../${l:12:-5}$d"
        done

        until rsync -ah --progress $msize "${excl[@]}" --include=/.* --exclude=/* --exclude={SB[0-9][0-9]_*,*~} "${ldest2[@]}" $sdir$d/ $rp$d
        do [ $? = 24 ] && sleep 0.5s || error 10 $LINENO
        done
      }
    done

    until rsync -ah --progress $msize "${excl[@]}" --include=/.* --exclude=/* --exclude={SB[0-9][0-9]_*,*~} "${ldest[@]}" $sdir/root/ $rp/root
    do [ $? = 24 ] && sleep 0.5s || error 10 $LINENO
    done

    cnt=0

    for l in "${ldest[@]}"
    do ldest[$((cnt++))]="--link-dest=${l:15:-5}"
    done

    until rsync -ah --progress --include=/{bin,boot,cdrom,dev,etc,home,lib,lib32,lib64,libx32,media,mnt,opt,proc,root,run,sbin,snap,srv,sys,tmp,usr,var,initrd.img,initrd.img.old,vmlinuz,vmlinuz.old} --exclude=/{*,etc/mtab,etc/*.dpkg-old} --exclude=/{home,media,mnt,root,run,tmp,var/cache/apt/archives/partial,var/cache/fontconfig,var/lib/udisks2,var/lib/ureadahead,var/run,var/tmp}/* --exclude=/var/cache/apt/{*.bin,*.bin.*,archives/*.deb} --exclude={SB[0-9][0-9]_*,lost+found,*~} "${ldest[@]}" $sdir/ $rp
    do [ $? = 24 ] && sleep 0.5s || error 10 $LINENO
    done

    printf "max_size=$max_size\n\nexclude=\"\\\\\n$exclude\"\n" >$rp/.config

    for r in SB[0-9][0-9]_*
    do
      num=${r:2:2} num=${num#0}
      [ -d "$r" ] && mv "$r" "SB$([ $num -ge $max_rp_num ] && printf 00 || printf "$([ $num -le 8 ] && printf 0)$((num+1))")${r:4}"
    done

    printf "\nFlushing filesystem buffers... "
    sync
    printf "done\n"
    sumount
    remove
    printf "\n ${bold1}The restore point is successfully created.$norm1\n\n"
    ;;
  -r|--restore)
    check i
    restore / $2
    ;;
  -l|--repair)
    check i l
    restore /mnt/ $2
    ;;
  *)
    printf "\n ${bold1}System backup and restore script for Debian-based distributions v$vers by Kendek$norm1\n\n  Available options:\n\n   -n, --new\n      Create a new restore point in the following directory\n       $([ "$storage_dir" ] && printf "$storage_dir" || printf "$PWD")\n\n   -r, --restore [1-$max_rp_num]\n      Perform a system and/or user's configuration files restoration with the\n      selected restore point\n\n   -l, --repair [1-$max_rp_num]\n      Perform a system and/or user's configuration files reparation with the\n      selected restore point\n      The target (root) directory will be the '/mnt', instead of the '/'\n\n"
esac
