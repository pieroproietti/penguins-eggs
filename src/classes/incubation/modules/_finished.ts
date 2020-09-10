/**
 *
 */
export function finished(mountpointSquashFs: string): string {
   let text = ''
   text += '---\n'
   text += 'restartNowEnabled: true\n'
   text += 'restartNowChecked: true\n'
   text += 'restartNowCommand: "systemctl -i reboot"\n'
   return text
}
