/**
 *
 */
export function machineid(): string {
   let text = ``
   text += `---\n`
   text += `# Whether to create /etc/machine-id for systemd.\n`
   text += `systemd: true\n`
   text += `# Whether to create /var/lib/dbus/machine-id for D-Bus.\n`
   text += `dbus: true\n`
   text += `# Whether /var/lib/dbus/machine-id should be a symlink to /etc/machine-id\n`
   text += `# (ignored if dbus is false, or if there is no /etc/machine-id to point to).\n`
   text += `symlink: true\n`

   return text
}
