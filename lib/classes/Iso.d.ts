/**
 * penguins-eggs: iso.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * Al momento popolo solo le directory live ed isolinux, mentre boot ed EFI no!
 * createStructure
 * isolinuxPrepare, isolinuxCfg
 * liveKernel, liveSquashFs
 * makeIso
 *  xorriso -as mkisofs -r -J -joliet-long -l -cache-inodes -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin  -partition_offset 16 -volid "Penguin's eggs lm32-mate" -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o /home/eggs/lm32-mate_2019-04-17_1830-02.iso /home/eggs/lm32-mate/iso
 */
import { IDistro, IOses, INet, IUser, IPackage } from "../interfaces";
/**
 * Iso:
 */
declare class Iso {
    private app;
    private workDir;
    private distro;
    private net;
    private user;
    private root;
    constructor(app: IPackage, workDir?: string, distro?: IDistro, user?: IUser, root?: IUser, net?: INet);
    produce(o: IOses, c: any, force?: boolean): Promise<void>;
    /**
     *
     */
    liveDhcp(): Promise<void>;
    /**
     * eggCreateStructue
     */
    eggCreateStructure(): Promise<void>;
    /**
     * eggSystemCopy
     */
    eggSystemCopy(): Promise<void>;
    show(): void;
    kill(): Promise<void>;
    isoCreateStructure(): Promise<void>;
    isolinuxPrepare(o: any): Promise<void>;
    stdMenuCfg(o: IOses): Promise<void>;
    isolinuxCfg(o: IOses): void;
    menuCfg(o: IOses): Promise<void>;
    /**
     * alive: rende live
     */
    liveKernel(): Promise<void>;
    /**
     * squashFs: crea in live filesystem.squashfs
     */
    liveSquashFs(): Promise<void>;
    makeIsoFs(o: IOses): Promise<void>;
}
export default Iso;
