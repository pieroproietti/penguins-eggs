/**
 * 
 */
export function sourcesFinal(): string {

    let text = ``
    text += `#!/bin/sh\n`
    text += `#\n`
    text += `# Writes the final sources.list file\n`
    text += `#\n`
    text += `\n`
    text += `CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")\n`
    text += `RELEASE="buster"\n`
    text += `\n`
    text += `cat << EOF > $CHROOT/etc/apt/sources.list\n`
    text += `# See https://wiki.debian.org/SourcesList for more information.\n`
    text += `deb http://deb.debian.org/debian $RELEASE main\n`
    text += `deb-src http://deb.debian.org/debian $RELEASE main\n`
    text += `\n`
    text += `deb http://deb.debian.org/debian $RELEASE-updates main\n`
    text += `deb-src http://deb.debian.org/debian $RELEASE-updates main\n`
    text += `\n`
    text += `deb http://security.debian.org/debian-security/ $RELEASE/updates main\n`
    text += `deb-src http://security.debian.org/debian-security/ $RELEASE/updates main\n`
    text += `EOF\n`
    text += `\n`
    text += `exit 0\n`

    return text
}