/**
 * 
 */
export function createTmp(): string {
    let text = ``
    text += `#!/bin/bash\n`
    text += `\n`
    text += `CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")\n`
    text += `\n`
    text += `# Creo la directory $CHROOT/tmp se mancante \n`
    text += `TMPDIR=$CHROOT/tmp\n`
    text += `if [ ! -d $TMPDIR ]; then\n`
    text += `    mkdir $TMPDIR\n`
    text += `fi\n`
    return text
}