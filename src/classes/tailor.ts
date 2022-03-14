import Utils from './utils'
import { ICostume } from '../interfaces'
import { exec } from '../lib/utils'
import fs from 'fs'

/**
 * recipes->costumes
 * recipe->costume
 * src/interface/recipe.ts ->src/interface/costume.ts
 * src/classes/cooking -> src/classes/tailor
 * src/commands/recipe -> src/commands/dress
 * src/commands/recipe/produce -> src/commands/dress/wear
 * src/commands/recipe/list -> src/commands/dress/list
 */
export default class Tailor {
    private verbose = false
    private echo = {}
    private costume = {} as ICostume

    constructor(costume: ICostume, verbose = false) {
        this.costume = costume
    }

    /**
     * 
     */
    async prepare(verbose = false) {
        this.verbose = verbose
        this.echo = Utils.setEcho(verbose)

        Utils.warning(`preparing ${this.costume.name}...`)
        const sequence = this.costume.sequence

        if (sequence.includes('repositories')) {
            await this.repositories()
        }

        if (sequence.includes('packages')) {
            await this.packages()
        }
        if (sequence.includes('debs')) {
            await this.debs()
        }

        if (sequence.includes('accessories')) {
            await this.accessories()
        }

        if (sequence.includes('hostname')) {
            await this.hostname()
        }


        if (sequence.includes('reboot')) {
            Utils.pressKeyToExit('want to reboot', true)
            await exec('reboot')
        }
    }

    /**
     * 
     */
    private async repositories() {
        Utils.warning('preparing repositories')
        const repositories = this.costume.repositories
        if (repositories.includes('sourcesList')) {
            await this.sourcesList()
        }

        if (repositories.includes('sourcesListD')) {
            await this.sourcesListD()
        }

        if (repositories.includes('update')) {
            await exec('apt-get update -y')
        }

        if (repositories.includes('upgrade')) {
            await exec('apt-get full-upgrade -y')
        }
    }

    /**
     * 
     */
    private async sourcesList() {
        Utils.warning('adapting /etc/apt/sources.list')
        Utils.warning('at moment you must adapt /etc/apt/sources.list manually. Thanks')
        const sourcesList = this.costume.sourcesList
        if (sourcesList.includes('main')) {
            console.log('check or add main')
        }
        if (sourcesList.includes('contrib')) {
            console.log('check or add contrib')
        }
        if (sourcesList.includes('non-free')) {
            console.log('check or add non-free')
        }
    }

    /**
     * 
     */
    private async sourcesListD() {
        Utils.warning('adapting /etc/apt/sources.list.d')
        const sourcesListD = this.costume.sourcesListD

        const n = sourcesListD.length
        for (let i = 0; i < n; i++) {
            const cmd = sourcesListD[i]
            await exec(cmd, this.echo)
        }
    }

    /**
     * 
     */
    private async packages() {
        Utils.warning('installing minimal packages')
        const packages = this.costume.packages
        let cmd = 'apt-get install -y '
        const n = packages.length
        for (let i = 0; i < n; i++) {
            cmd += packages[i] + ' '// + '\n'
        }
        console.log(cmd)
        if (await Utils.customConfirm()) {
            await exec(cmd, Utils.setEcho(true))
        }
    }

    /**
     * 
     */
    private async debs() {
        Utils.warning(`You can install local packages from ${this.costume.debs}`)
        const debs = this.costume.debs
        if (debs !== undefined) {
            if (fs.existsSync(debs)) {
                const cmd = `dpkg -i ${debs}/*.deb`
                console.log(cmd)
                if (await Utils.customConfirm()) {
                    await exec(cmd, Utils.setEcho(true))
                }
            }
        }
    }

    /**
     * suggest
     */
    private async accessories() {
        Utils.warning(`You can install also suggest additionals packages`)

        const accessories = this.costume.accessories
        let cmd = 'apt-get install -y '
        const n = accessories.length
        for (let i = 0; i < n; i++) {
            cmd += accessories[i] + ' '// + '\n'
        }
        console.log(cmd)
        if (await Utils.customConfirm()) {
            await exec(cmd, Utils.setEcho(true))
        }
    }


    /**
    * hostname
    */
    private async hostname() {
        const file = '/etc/hostname'
        const text = this.costume.name
        await exec(`rm ${file} `, this.echo)
        fs.writeFileSync(file, text)
    }

    /**
     * hosts
     */
    private async hosts() {
        const file = '/etc/hosts'
        let text = ''
        text += '127.0.0.1 localhost localhost.localdomain\n'
        text += `127.0.1.1 ${this.costume.name} \n`
        text += `# The following lines are desirable for IPv6 capable hosts\n`
        text += `:: 1     ip6 - localhost ip6 - loopback\n`
        text += `fe00:: 0 ip6 - localnet\n`
        text += `ff00:: 0 ip6 - mcastprefix\n`
        text += `ff02:: 1 ip6 - allnodes\n`
        text += `ff02:: 2 ip6 - allrouters\n`
        text += `ff02:: 3 ip6 - allhosts\n`
        await exec(`rm ${file} `, this.echo)
        fs.writeFileSync(file, text)
    }
}
