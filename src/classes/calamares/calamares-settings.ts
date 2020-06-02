import { IDistro, IRemix } from '../../interfaces'
import calamaresConfig from './buster/calamares-config'

/**
 * 
 */
export class calamaresSetting {
    remix: IRemix

    distro: IDistro

    verbose = false

    /**
     * 
     * @param distro 
     * @param oses 
     * @param verbose 
     */
    constructor(remix: IRemix, distro: IDistro, verbose = false) {
        this.remix = remix
        this.distro = distro
        this.verbose = verbose
    }

    /**
     * 
     */
    async config() {
        const c = new calamaresConfig(this.remix, this.distro, this.verbose)
        c.config()
    }
}

export default calamaresSetting