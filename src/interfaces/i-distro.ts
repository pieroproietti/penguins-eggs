export interface IDistro {
  familyId: string
  distroId: string
  distroLike: string
  versionId: string
  versionLike: string
  usrLibPath: string
  isolinuxPath: string
  syslinuxPath: string
  mountpointSquashFs: string
  homeUrl: string
  supportUrl: string
  bugReportUrl: string
  isCalamaresAvailable: boolean
}
