/**
 * penguins-eggs: Calamares.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import { IDistro } from "../interfaces";
declare class Calamares {
    private distro;
    constructor(distro: IDistro);
    /**
     * configure calamares-settings-eggs
     * @param c
     * @param o
     */
    configure(o: any): void;
    isCalamaresInstalled(): boolean;
    /**
     * create
     */
    create(): Promise<void>;
    /**
     * settingsConf
     */
    settingsConf(versionLike: string): Promise<void>;
    unpackModule(mountpointSquashFs: string): void;
    brandingDesc(versionLike: string, homeUrl: string, supportUrl: string, bugReportUrl: string): Promise<void>;
}
export default Calamares;
