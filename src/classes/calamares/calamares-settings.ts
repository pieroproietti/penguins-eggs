import { IOses, IDistro } from '../../interfaces'
import calamaresConfig from './buster/calamares-config'

/**
 * 
 */
export class calamaresSetting{
    distro: IDistro

    oses : IOses

    verbose = false

    /**
     * 
     * @param distro 
     * @param oses 
     * @param verbose 
     */
    constructor(distro: IDistro, oses: IOses, verbose = false){
        this.distro = distro
        this.oses = oses
        this.verbose = verbose
    }

    /**
     * 
     */
    async config() {
        const c = new calamaresConfig(this.distro, this.oses, this.verbose) 
        c.config()
    }
}

export default calamaresSetting