/**
 * script per test al volo
 * 
 * npx ts-node test
 */

let cmd = 'xorriso  -as mkisofs                             -volid dpin-x64_2020-06-10_1622.iso                             -joliet-long                             -l                             -iso-level 3                             -b isolinux/isolinux.bin                             -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin                             -partition_offset 16                             -c isolinux/boot.cat                             -no-emul-boot                             -boot-load-size 4                             -boot-info-table                                                          -output /home/eggs/dpin-x64_2020-06-10_1622.iso                             /home/eggs/ovarium/iso'
console.log('===================================================')
console.log('original')
console.log('===================================================')
console.log(cmd)
console.log('===================================================')
console.log('spaces remove')
console.log('===================================================')
cmd = cmd.replace(/\s\s+/g, ' ')
console.log(cmd)
