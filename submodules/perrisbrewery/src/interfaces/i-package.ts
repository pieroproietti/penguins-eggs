export interface IPackage {
  version: any;
  name: string;
  path: string;
  sourceVersion: string;
  buildVersion: string;
  linuxArch: string;
  nodeVersion: string;
  tempDir: string;
  destDir: string;
  htmlDir: string;
}
