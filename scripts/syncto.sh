#!/bin/sh
#
BACKUP_FOLDER="/home/artisan"
BACKUP_FILES="/etc/passwd /etc/group /etc/shadow"
IMAGE_FILE="/home/eggs/iso/live/luks-eggs-backup"
MAX_SIZE="15G"
LUKS_NAME="eggs"
# squashfs pads to 4096bytes (see mksquashfs manpage)
BLOCK_SIZE=4096
# even when the LUKS volume uses a different block size,
# the reported blocks in `cryptsetup status` and for `resize`
# seem to always be 512bytes (see manpage of cryptsetup)
LUKS_BLOCK_SIZE=512
set -e

echo "Creating sparse file with size ${MAX_SIZE}"
truncate -s "${MAX_SIZE}" "${IMAGE_FILE}"
echo "Set up encryption"
cryptsetup luksFormat "${IMAGE_FILE}"
echo "Open LUKS volume"
cryptsetup luksOpen "${IMAGE_FILE}" "${LUKS_NAME}"
echo "Creating squashfs"
mksquashfs "${BACKUP_FOLDER}" "/dev/mapper/${LUKS_NAME}" -progress -noappend

# Calculate used up space of squashfs
SIZE=`unsquashfs -s "/dev/mapper/${LUKS_NAME}" | grep "Filesystem size" | sed -e 's/.*size //' -e 's/ .*//'`
echo "Squashfs size: ${SIZE} bytes"
BLOCKS=`expr ${SIZE} / ${BLOCK_SIZE}`
[ `expr ${SIZE} % ${BLOCK_SIZE}` != 0 ] && {
    BLOCKS=`expr ${BLOCKS} + 1`
    SIZE=`expr ${BLOCKS} \* ${BLOCK_SIZE}`
}
echo "Padded squashfs size on device: ${SIZE} bytes"

# Shrink LUKS volume
LUKS_BLOCKS=`expr ${SIZE} / ${LUKS_BLOCK_SIZE}`
echo "Shrinking LUKS volume to ${LUKS_BLOCKS} blocks of ${LUKS_BLOCK_SIZE} bytes"
cryptsetup resize "${LUKS_NAME}" -b ${LUKS_BLOCKS}

# Get final size and shrink image file
LUKS_OFFSET=`cryptsetup status "${LUKS_NAME}" | grep offset | sed -e 's/ sectors$//' -e 's/.* //'`
FINAL_SIZE=`expr ${LUKS_OFFSET} \* ${LUKS_BLOCK_SIZE} + ${SIZE}`
cryptsetup luksClose "${LUKS_NAME}"
truncate -s ${FINAL_SIZE} "${IMAGE_FILE}"
echo "Final size is ${FINAL_SIZE} bytes"
I still have to do some verification to see if everything works out.

Maybe it helps you too :)