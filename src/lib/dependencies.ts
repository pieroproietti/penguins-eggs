/**
* depCommon
* depArch
* depVersion
* depInit
*/


/**
 *
 * @param packages array packages
 */
export function array2comma(packages: string[]): string {
   let spaced = ''
   const last = packages.length

   for (let i = 0; i < last; i++) {
      spaced += packages[i]
      if (i < last -1 ) {
         spaced +=', '
      }
   }
   return spaced
}


export const depCommon = [
   'squashfs-tools',
   'xorriso',
   'live-boot',
   'live-boot-initramfs-tools',
   'dpkg-dev',
   'syslinux-common',
   'isolinux',
   'cryptsetup',
   'dosfstools',
   'net-tools',
   'parted',
   'rsync',
   'whois'
]

/**
 * Dependencies for arch
 */
export const depArch = [
   {
      package: 'syslinux',
      arch: ['amd64', 'i386']
   },
   {
      package: 'syslinux-efi',
      arch: ['arm64', 'armel']
   }
]

/**
 * dependencies for versions
 */
export const depVersions = [
   {
      package: 'live-config',
      versions: ['jessie', 'stretch', 'buster', 'bullseye', 'beowulf', 'focal', 'groovy', 'hirsute']
   },
   {
      package: 'live-config-systemd',
      versions: ['jessie', 'stretch', 'buster', 'bullseye', 'focal', 'groovy', 'hirsute']
   },
   {
      package: 'live-config-sysvinit',
      versions: ['beowulf']
   },
   {
      package: 'open-infrastructure-system-config',
      versions: ['bionic']
   }
]

/**
 * dependecies for init
 * 
 * We need for buster derivate with sysvinit MX-LINUX and probably others
 * 
 */
export const depInit = [
   {
      package: 'live-config-systemd',
      init: 'systemd'
   },
   {
      package: 'live-config-sysvinit',
      init: 'sysvinit'
   }
]