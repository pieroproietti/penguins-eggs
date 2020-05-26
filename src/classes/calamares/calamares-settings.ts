import { IOses, IRemix } from '../../interfaces'
import calamaresConfig from './buster/calamares-config'

/**
 * 
 */
export class calamaresSetting{
    remix: IRemix

    oses : IOses

    verbose = false

    /**
     * 
     * @param distro 
     * @param oses 
     * @param verbose 
     */
    constructor(remix: IRemix, oses: IOses, verbose = false){
        this.remix = remix
        this.oses = oses
        this.verbose = verbose
    }

    /**
     * 
     */
    async config() {
        const c = new calamaresConfig(this.remix, this.oses, this.verbose) 
        c.config()
    }
}

export default calamaresSetting