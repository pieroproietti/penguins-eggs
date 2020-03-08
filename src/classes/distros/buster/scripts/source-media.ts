/**
 * 
 */
export function sourceMedia(): string {

    let text = ''
    text += `#!/bin/sh\n`
    text += `\n`
    text += `CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")\n`
    text += `MEDIUM_PATH="/run/live/medium"\n`
    text += `RELEASE="bullseye"\n`
    text += `\n`
    text += `if [ "$1" = "-u" ]; then\n`
    text += `    umount $CHROOT/$MEDIUM_PATH\n`
    text += `    rm $CHROOT/etc/apt/sources.list.d/debian-live-media.list\n`
    text += `    chroot $CHROOT apt-get update\n`
    text += `    exit 0\n`
    text += `fi\n`
    text += `\n`
    text += `# Remove the base sources, we will configure sources in a later phase\n`
    text += `rm -f $CHROOT/etc/apt/sources.list.d/base.list\n`
    text += `\n`
    text += `mkdir -p $CHROOT/$MEDIUM_PATH\n`
    text += `mount --bind $MEDIUM_PATH $CHROOT/$MEDIUM_PATH\n`
    text += `echo "deb [trusted=yes] file:$MEDIUM_PATH $RELEASE main" > $CHROOT/etc/apt/sources.list.d/debian-live-media.list\n`
    text += `chroot $CHROOT apt-get update\n`
    text += `# Attempt safest way to remove cruft\n`
    text += `rmdir $CHROOT/run/live/medium\n`
    text += `rmdir $CHROOT/run/live\n`
    text += `\n`
    text += `exit 0\n`

    return text
}