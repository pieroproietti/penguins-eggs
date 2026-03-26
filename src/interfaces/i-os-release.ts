export default interface IOsRelease {
  ID: string
  ID_LIKE?: string
  VERSION_CODENAME: string
  VERSION_ID: string
  NAME?: string
  PRETTY_NAME?: string
  HOME_URL?: string
  SUPPORT_URL?: string
  BUG_REPORT_URL?: string
}
