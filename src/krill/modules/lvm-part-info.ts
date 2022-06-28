/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

 import Sequence from '../krill-sequence'
 import Utils from '../../classes/utils'
 import { exec } from '../../lib/utils'
 
/**
* Return lvmPartname, lvmSwapSize, lvmRootSize
*/
export default async function lvmPartInfo(installDevice = '/dev/sda'): Promise<[string, number, number, number]> {

    // Partizione LVM
    const lvmPartname = shx.exec(`fdisk ${installDevice} -l | grep LVM | awk '{print $1}' | cut -d "/" -f3`).stdout.trim()
    const lvmByteSize = Number(shx.exec(`cat /proc/partitions | grep ${lvmPartname}| awk '{print $3}' | grep "[0-9]"`).stdout.trim())
    const lvmSize = lvmByteSize / 1024

    // La partizione di root viene posta ad 1/4 della partizione LVM, limite max 100 GB
    const lvmSwapSize = 8192
    let lvmRootSize = lvmSize / 8
    if (lvmRootSize < 20480) {
        lvmRootSize = 20480
    }
    const lvmDataSize = lvmSize - lvmRootSize - lvmSwapSize
    return [lvmPartname, lvmSwapSize, lvmRootSize, lvmDataSize]
}
