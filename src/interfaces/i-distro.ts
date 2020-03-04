export interface IDistro {
    name: string;
    branding: string;
    versionName: string;
    versionNumber: string;
    kernel: string;
    pathHome: string;
    pathRODir: string;
    pathRWDir: string;
    pathWKDir: string
    pathLowerdir: string;
    pathUpperdir: string;
    pathWorkdir: string;
    pathLiveFs: string;
    pathIso: string;
}
