/**
 * 
 */
export function installDebian(): string {
    let text = ''
    text += `#!/bin/sh\n`
    text += `###\n`
    text += `# Wrapper for running calamares on Debian live media\n`
    text += `###\n`
    text += `\n`
    text += `# Stale file left behind by live-build that messes with partitioning\n`
    text += `sudo mv /etc/fstab /etc/fstab.orig.calamares\n`
    text += `\n`
    text += `# Access control to run calamares as root for xwayland\n`
    text += `xhost +si:localuser:root\n`
    text += `pkexec calamares\n`
    text += `xhost -si:localuser:root\n`
    text += `\n`
    text += `# Restore stale fstab, for what it's worth\n`
    text += `sudo mv /etc/fstab.orig.calamares /etc/fstab\n`
    return text
}