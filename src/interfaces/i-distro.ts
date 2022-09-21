export interface IDistro {
  familyId: string
  distroId: string
  distroLike: string
  codenameId: string
  codenameLikeId: string
  releaseId: string
  releaseLike: string
  usrLibPath: string
  isolinuxPath: string
  syslinuxPath: string
  pxelinuxPath: string
  memdiskPath: string
  liveMediumPath: string
  mountpointSquashFs: string
  homeUrl: string
  supportUrl: string
  bugReportUrl: string
  isCalamaresAvailable: boolean
}
