import { exec, execSync } from 'child_process'
import fs from 'fs'

let vmlinuz = ''
const cmdline = `root=UUID=3dc0f202-8ac8-4686-9316-dddcec060c48 initrd=boot\initrd.img-5.15.0-0.bpo.3-amd64`.split(" ")
//fs.readFileSync('/proc/cmdline', 'utf8').split(" ")
cmdline.forEach(cmd => {
   if (cmd.includes('BOOT_IMAGE')) {
      vmlinuz = cmd.substring(cmd.indexOf('=') + 1)
   }
})

if (vmlinuz === '') {
   cmdline.forEach(cmd => {
      if (cmd.includes('initrd')) {
         vmlinuz = '/boot/vmlinuz' + cmd.substring(cmd.indexOf('initrd.img') + 10)
      }
   })
}
console.log(vmlinuz)
