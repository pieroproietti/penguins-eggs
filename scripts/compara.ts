
Utils.warning('Creating volume luks-users-data of ' + Utils.formatBytes(volumeSize, 0))
execSync('dd if=/dev/zero of=/tmp/luks-users-data bs=1 count=0 seek=' + Utils.formatBytes(volumeSize, 0) + this.toNull, { stdio: 'inherit' })

Utils.warning('Formatting volume luks-users-data. You will insert a passphrase and confirm it')
execSync('cryptsetup luksFormat /tmp/luks-users-data', { stdio: 'inherit' })

Utils.warning('Opening volume luks-users-data and map it in /dev/mapper/eggs-users-data')
Utils.warning('You will insert the same passphrase you choose before')
execSync('cryptsetup luksOpen /tmp/luks-users-data eggs-users-data', { stdio: 'inherit' })

Utils.warning('Formatting volume eggs-users-data with ext4')
execSync('mkfs.ext2 /dev/mapper/eggs-users-data' + this.toNull, { stdio: 'inherit' })

Utils.warning('mounting volume eggs-users-data in /mnt')
execSync('mount /dev/mapper/eggs-users-data /mnt', { stdio: 'inherit' })

Utils.warning('Saving users datas in eggs-users-data')
await this.copyUsersDatas(verbose)

const bytesUsed = parseInt(shx.exec(`du -b --summarize /mnt |awk '{ print $1 }'`, { silent: true }).stdout.trim())
Utils.warning('We used ' + Utils.formatBytes(bytesUsed, 0) + ' on ' + Utils.formatBytes(volumeSize, 0) + ' in volume luks-users-data')

Utils.warning('Unmount /mnt')
execSync('umount /mnt', { stdio: 'inherit' })

Utils.warning('closing eggs-users-data')
execSync('cryptsetup luksClose eggs-users-data', { stdio: 'inherit' })

Utils.warning('moving luks-users-data in ' + this.settings.config.snapshot_dir + 'ovarium/iso/live')
execSync('mv /tmp/luks-users-data ' + this.settings.config.snapshot_dir + 'ovarium/iso/live', { stdio: 'inherit' })
}

await this.makeDotDisk(backup, verbose)
await this.makeIso(backup, scriptOnly, verbose)
