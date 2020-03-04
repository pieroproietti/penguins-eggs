export interface IDistro {
    name: string;
    branding: string;
    versionName: string;
    versionNumber: string;
    kernel: string;
    pathHome: string;
    level0 :
    {
        pathLowerdir: string;
        pathUpperdir: string;
        pathWorkdir: string;
        pathMerged: string;
    },
    level1 :
    {
        pathLowerdir: string;
        pathUpperdir: string;
        pathWorkdir: string;
        pathMerged: string;
    },
    pathLiveFs: string;
    pathIso: string;
}
