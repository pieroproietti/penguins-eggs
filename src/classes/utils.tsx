/**
 * ./src/classes/utils.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * 
 * Refactored Utils class - imports from modular utilities
 */

// Import all utility modules
import System from './utils.d/system.js'
import PackageInfo from './utils.d/package-info.js'
import Network from './utils.d/network.js'
import Filesystem from './utils.d/filesystem.js'
import Snapshot from './utils.d/snapshot.js'
import Architecture from './utils.d/architecture.js'
import UserInteraction from './utils.d/user-interaction.js'
import ConsoleOutput from './utils.d/console-output.js'
import Formatters from './utils.d/formatters.js'
import Kernel from './utils.d/kernel.js'

/**
 * Utils: general purpose utils
 * @remarks all the utilities - refactored into modular structure
 */
export default class Utils {
   // ===== SYSTEM UTILITIES =====
   static isContainer = System.isContainer
   static isSystemd = System.isSystemd
   static isSysvinit = System.isSysvinit
   static isOpenRc = System.isOpenRc
   static isLive = System.isLive
   static isMountpoint = System.isMountpoint
   static isBlockDevice = System.isBlockDevice
   static isRoot = System.isRoot
   static machineId = System.machineId
   static getDebianVersion = System.getDebianVersion
   static getLiveRootSpace = System.getLiveRootSpace

   // ===== PACKAGE INFO UTILITIES =====
   static getPackageName = PackageInfo.getPackageName
   static getFriendName = PackageInfo.getFriendName
   static getPackageVersion = PackageInfo.getPackageVersion
   static getAuthorName = PackageInfo.getAuthorName
   static isPackage = PackageInfo.isPackage
   static isSources = PackageInfo.isSources
   static isNpmPackage = PackageInfo.isNpmPackage
   static rootPenguin = PackageInfo.rootPenguin
   static wardrobe = PackageInfo.wardrobe
   static getPrimaryUser = PackageInfo.getPrimaryUser

   // ===== NETWORK UTILITIES =====
   static iface = Network.iface
   static address = Network.address
   static netmask = Network.netmask
   static cidr = Network.cidr
   static broadcast = Network.broadcast
   static getDns = Network.getDns
   static getDomain = Network.getDomain
   static gateway = Network.gateway

   // ===== FILESYSTEM UTILITIES =====
   static searchOnFile = Filesystem.searchOnFile
   static uuid = Filesystem.uuid
   static uuidGen = Filesystem.uuidGen
   static getUsedSpace = Filesystem.getUsedSpace
   static write = Filesystem.write
   static writeX = Filesystem.writeX
   static writeXs = Filesystem.writeXs
   static getOsRelease = Filesystem.getOsRelease

   // ===== SNAPSHOT UTILITIES =====
   static snapshotPrefix = Snapshot.snapshotPrefix
   static getSnapshotCount = Snapshot.getSnapshotCount
   static getSnapshotSize = Snapshot.getSnapshotSize
   static getPrefix = Snapshot.getPrefix
   static getVolid = Snapshot.getVolid
   static getPostfix = Snapshot.getPostfix

   // ===== ARCHITECTURE UTILITIES =====
   static isi686 = Architecture.isi686
   static uefiArch = Architecture.uefiArch
   static uefiFormat = Architecture.uefiFormat
   static usrLibPath = Architecture.usrLibPath
   static kernelVersion = Architecture.kernelVersion

   // ===== USER INTERACTION UTILITIES =====
   static customConfirm = UserInteraction.customConfirm
   static customConfirmCompanion = UserInteraction.customConfirmCompanion
   static customConfirmAbort = UserInteraction.customConfirmAbort
   static pressKeyToExit = UserInteraction.pressKeyToExit
   static useRoot = UserInteraction.useRoot
   static setEcho = UserInteraction.setEcho

   // ===== CONSOLE OUTPUT UTILITIES =====
   static warning = ConsoleOutput.warning
   static error = ConsoleOutput.error
   static titles = ConsoleOutput.titles
   static flag = ConsoleOutput.flag

   // ===== FORMATTERS UTILITIES =====
   static sortObjectKeys = Formatters.sortObjectKeys
   static formatDate = Formatters.formatDate
   static formatBytes = Formatters.formatBytes

   // ===== KERNEL UTILITIES (already existing) =====
   /**
    * @deprecated Use Kernel.vmlinuz() instead
    */
   static vmlinuz(kernel = ''): string {
      return Kernel.vmlinuz(kernel)
   }

   /**
    * @deprecated Use Kernel.initramfs() instead  
    */
   static initrdImg(kernel = ''): string {
      return Kernel.initramfs(kernel)
   }
}

// Export individual modules for direct access if needed
export {
   System,
   PackageInfo,
   Network,
   Filesystem,
   Snapshot,
   Architecture,
   UserInteraction,
   ConsoleOutput,
   Formatters,
   Kernel
}