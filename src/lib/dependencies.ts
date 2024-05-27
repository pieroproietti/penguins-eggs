/**
 * penguins-eggs
 * lib: dependencies.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

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
 * removable: isolinux live-boot live-boot-doc live-boot-initramfs-tools live-tools syslinux syslinux-common
 * sudo apt purge cryptsetup dosfstools dpkg-dev isolinux live-boot live-boot-initramfs-tools  squashfs-tools syslinux-common coreutils xorriso
 */
export const depCommon = [
  'coreutils', // whoami
  'cryptsetup',
  'curl', // wardrobe
  'dosfstools', // eggs
  'dpkg-dev', // yolk
  'git', // wardrobe
  'grub-efi-amd64-bin', // grub
  'isolinux', // eggs
  'jq', // mom restored
  'live-boot-initramfs-tools', // eggs
  'live-boot', // eggs
  'lsb-release', // eggs
  'lvm2', // pvdisplay in krill
  'nodejs', // eggs
  'parted', // eggs
  'pxelinux', // cuckoo
  'rsync', // eggs
  'squashfs-tools', // eggs
  'sshfs', // eggs
  'syslinux-common', // eggs
  'xorriso', // eggs
]

/**
 * Dependencies for architectures
 */
export const depArch = [
  {
    package: 'syslinux',
    arch: ['amd64', 'i386'],
  },
  {
    package: 'syslinux-efi',
    arch: ['arm64', 'armel'],
  },
]

/**
 * dependencies for versions
 *
 */
export const depVersions = [
  {
    package: 'live-config',
    versions: ['jessie', 'stretch'], // jessie and stretch need it
  },
  {
    package: 'live-config-systemd',
    versions: ['jessie', 'stretch', 'buster'], // jessie, stretch and buster need it
  },
  {
    package: 'live-config-sysvinit',
    versions: ['beowulf'], // only Devuan beowulf
  },
  {
    package: 'open-infrastructure-system-config',
    versions: ['bionic'], // only Ubuntu bionic
  },
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
    init: 'sysvinit',
  },
]
