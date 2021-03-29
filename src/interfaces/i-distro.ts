export interface IDistro {
   distroId: string
   distroLike: string
   versionId: string
   versionLike: string
   isolinuxPath: string
   syslinuxPath: string
   mountpointSquashFs: string
   homeUrl: string
   supportUrl: string
   bugReportUrl: string
   guiInstaller: boolean
}
