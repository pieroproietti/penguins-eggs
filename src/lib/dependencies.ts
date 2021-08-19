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
   let commaSep = ''
   const last = packages.length

   for (let i = 0; i < last; i++) {
      commaSep += packages[i]
      if (i < last - 1) {
         commaSep += ', '
      }
   }
   return commaSep
}

/**
 * 
 * @param packages 
 * @returns 
 */
export function array2spaced(packages: string[]) {
   let spaced = ''
   for (const i in packages) {
      spaced += packages[i] + ' '
   }
   return spaced
}


/**
 * common dependencies
 */
export const depCommon = [
   'cryptsetup',
   'dosfstools',
   'dpkg-dev',
   'isolinux',
   'live-boot',
   'live-boot-initramfs-tools',
   'net-tools',
   'parted',
   'rsync',
   'squashfs-tools',
   //   'syslinux-common',
   'whois',
   'xorriso'
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
 * We need for buster derivate with systemd and using sysvinit 
 * like MX-LINUX and probably others
 * 
 */
export const depInit = [
   {
      package: 'live-config-sysvinit',
      init: 'sysvinit'
   }
]


/*
Questi sono i pacchetti live in debian11 live
live-boot
live-boot-doc
live-config 
live-config-boot *
live-config-systemd
live-tools
live-task-localisation * This metapackage installs packages and documentation to help support Debian live environments for other languages.
live-task-recommend * This metapackage installs recommended packages and documentation to help support Debian live environments.
calamares-setting-debian

Questi sono i pacchetti live in debian11 live rimasterizzata da live e debian11 rimasterizzata 

live-boot
live-boot-doc
live-boot-initramfs-tools
live-config
live-config-doc
live-config-systemd
live-tools

*/