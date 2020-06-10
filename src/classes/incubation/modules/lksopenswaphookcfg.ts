/**
 * 
 */
export function lksopenswaphookcfg(): string {
    let text = ``
    text += `# Writes an openswap configuration with LUKS settings to the given path\n`
    text += `---\n`
    text += `# Path of the configuration file to write (in the target system)\n`
    text += `configFilePath: /etc/openswap.conf\n`
    return text
}
