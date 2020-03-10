/**
 * 
 */
export function sourcesTrusted(): string {

    let text = ``
    text = `#!/bin/sh\n`
    text += `CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")\n`
    text += `RELEASE="buster"\n`
    text += `\n`
    text += `if [ "$1" = "-u" ]; then\n`
    text += `    rm $CHROOT/etc/apt/sources.list.d/debian-trusted.list\n`
    text += `    chroot $CHROOT apt-get update\n`
    text += `    exit 0\n`
    text += `fi\n`
    text += `\n`
    text += `# Remove previous sources, we will configure sources in a later phase\n`
    text += `rm -f $CHROOT/etc/apt/sources.list\n`
    text += `rm -f $CHROOT/etc/apt/sources.list.d/*.list\n`
    text += `if [ ! -d $CHROOT/etc/apt/sources.list.d ]; then\n`
    text += `   mkdir -p $CHROOT/etc/apt/sources.list.d\n`
    text += `fi\n`
    text += `#\n`
    text += `# Writes the debian-trusted.list file\n`
    text += `\n`
    text += `cat << EOF > $CHROOT/etc/apt/sources.list.d/debian-trusted.list\n`
    text += `# See https://wiki.debian.org/SourcesList for more information.\n`
    text += `# debian-trusted.lis That list is only installation\n`
    text += `deb [trusted = yes] http://deb.debian.org/debian $RELEASE main\n`
    text += `deb-src [trusted = yes] http://deb.debian.org/debian $RELEASE main\n`
    text += `\n`
    text += `deb [trusted = yes] http://deb.debian.org/debian $RELEASE-updates main\n`
    text += `deb-src [trusted = yes] http://deb.debian.org/debian $RELEASE-updates main\n`
    text += `\n`
    text += `deb [trusted = yes] http://security.debian.org/debian-security/ $RELEASE/updates main\n`
    text += `deb-src [trusted = yes] http://security.debian.org/debian-security/ $RELEASE/updates main\n`
    text += `EOF\n`
    text += `\n`
    text += `exit 0\n`

    return text
}
