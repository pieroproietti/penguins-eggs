export interface Ilevel {
    lowerdir: string;
    upperdir: string;
    workdir: string;
    merged: string;
}

export interface IDistro {
    name: string;
    branding: string;
    versionName: string;
    versionNumber: string;
    kernel: string;
    pathHome: string;
    lowerdir: string;
    upperdir: string;
    workdir: string;
    merged: string;
    level0 : Ilevel;
    level1 : Ilevel;
    pathLiveFs: string;
    pathIso: string;
}
