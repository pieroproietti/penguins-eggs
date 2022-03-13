import Utils from '../classes/utils'
import { IRecipe } from '../interfaces'
import { exec } from '../lib/utils'

/**
 * 
 */
export default class Cooking {
    verbose = false
    echo = {}
    ingredients = {} as IRecipe

    constructor(ingredients: IRecipe, verbose = false) {
        this.ingredients = ingredients
    }

    /**
     * 
     */
    async prepare(verbose = false) {
        this.verbose = verbose
        this.echo = Utils.setEcho(verbose)

        const sequence = this.ingredients.sequence
        Utils.warning('sequence')

        if (sequence.includes('repositories')) {
            await this.execRepositories()
        }

        if (sequence.includes('packages')) {
            await this.execPackages()
        }
        if (sequence.includes('debs')) {
            await this.execDebs()
        }
    }

    /**
     * 
     */
    async execRepositories() {
        Utils.warning('execRepositories')
        const repositories = this.ingredients.repositories
        if (repositories.includes('sourceslist')) {
            await this.execSourceslist()
        }

        if (repositories.includes('sourceslistd')) {
            await this.execSourceslistd()
        }

        await exec ('apt-get update -y')
        await exec ('apt-get full-upgrade -y')

    }

    /**
     * 
     */
    async execSourceslist() {
        Utils.warning('adapt /etc/apt/sources.list')
        Utils.warning('at moment you must adapt /etc/apt/sources.list manually. Thanks')
        const sourceslist = this.ingredients.sourceslist
        if (sourceslist.includes('main')) {
            console.log('check or add main')
        }
        if (sourceslist.includes('contrib')) {
            console.log('check or add contrib')
        }
        if (sourceslist.includes('non-free')) {
            console.log('check or add non-free')
        }
    }

    /**
     * 
     */
    async execSourceslistd() {
        Utils.warning('adapt /etc/apt/sources.list.d')
        const sourceslistd = this.ingredients.sourceslistd

        const n = sourceslistd.length
        for (let i = 0; i < n; i++) {
            const cmd = sourceslistd[i]
            //await exec(cmd, this.echo)
            console.log(cmd)
        }
    }

    /**
     * 
     */
    async execPackages() {
        Utils.warning('installing packages')
        const packages = this.ingredients.packages

        let cmd = 'apt-get -y '
        const n = packages.length
        for (let i = 0; i < n; i++) {
            cmd += packages[i] + ' '// + '\n'
        }
        await exec (cmd, this.echo)
    }

    /**
     * 
     */
    async execDebs() {
        Utils.warning('installing local debs')
        const debs = this.ingredients.debs
        if (debs !== undefined) {
            console.log(`dpkg -i ${debs}/*.deb`)
        }
    }
}
