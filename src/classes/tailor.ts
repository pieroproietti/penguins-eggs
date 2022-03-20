import chalk from 'chalk'
import Utils from './utils'
import { IMaterial } from '../interfaces'
import { exec } from '../lib/utils'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import Pacman from './pacman'


/**
 * 
 */
export default class Tailor {
    private verbose = false
    private echo = {}
    private costume = ''
    private wardrobe = ''
    materials = {} as IMaterial

    constructor(wardrobe: string, costume: string, verbose = false) {
        this.costume = costume
        this.wardrobe = wardrobe
    }


    /**
     * 
     */
    async prepare(verbose = false) {
        this.verbose = verbose
        this.echo = Utils.setEcho(verbose)
        Utils.warning(`preparing ${this.costume}`)

        /**
         * check curl presence
         */
        if (!Pacman.packageIsInstalled('curl')) {
            Utils.pressKeyToExit('In this tailoring shop we use curl. sudo apt update | apt install curl')
            process.exit()
        }

        const tailorList = `${this.wardrobe}/${this.costume}/index.yml`

        if (fs.existsSync(tailorList)) {
            this.materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as IMaterial
        } else {
            console.log('costume ' + chalk.cyan(this.costume) + ' not found in wardrobe: ' + chalk.green(this.wardrobe))
        }

        /**
         * Repositories
         */
        if (this.materials.sequence.repositories === undefined) {
            console.log('repositiories, and repositories.update MUDE be defined on sequence ')
            process.exit()
        }
        Utils.warning(`analyzing repositories`)

        /**
        * sources.list
        */
        if (this.materials.sequence.repositories.sourcesList !== undefined) {
            let step = '/etc/apt/sources.list'

            Utils.warning(step)
            let components = ''

            if (this.materials.sequence.repositories.sourcesList.main) {
                components += ' main'
            }

            if (this.materials.sequence.repositories.sourcesList.contrib) {
                components += ' contrib'
            }

            if (this.materials.sequence.repositories.sourcesList.nonFree) {
                components += ' non-free'
            }
            console.log(`using: ${components}`)
        }

        /**
         * sources.list.d
         */
        if (this.materials.sequence.repositories.sourcesListD !== undefined) {
            if (this.materials.sequence.repositories.sourcesListD[0] !== null) {
                let step = `adding repositories to /etc/apt/sources.list.d`
                Utils.warning(step)
                this.materials.sequence.repositories.sourcesListD.forEach(async cmd => {
                    try {
                        await exec(cmd, this.echo)
                    } catch (error) {
                        await Utils.pressKeyToExit(JSON.stringify(error))
                    }
                })
            }
        }


        /**
         * apt-get update
         */
        if (this.materials.sequence.repositories.update === undefined) {
            console.log('repositiories, and repositories.update MUDE be defined on sequence ')
            process.exit()
        }
        let step = `updating repositories`
        Utils.warning(step)
        if (this.materials.sequence.repositories.update) {
            await exec('apt-get update', Utils.setEcho(false))
        }


        /**
         * apt-get full-upgrade
         */
        if (this.materials.sequence.repositories.fullUpgrade !== undefined) {
            let step = `apt-get full-upgrade`
            Utils.warning(step)
            if (this.materials.sequence.repositories.fullUpgrade) {
                await exec('apt-get full-upgrade -y', Utils.setEcho(false))
            }
        }

        /**
         * checking dependencies
         */
        if (this.materials.sequence.dependencies !== undefined) {
            if (this.materials.sequence.dependencies[0] !== null) {
                let cmd = 'apt-get install -y '
                let dependencies = ''
                this.materials.sequence.dependencies.forEach(dependence => {
                    cmd += ` ${dependence}`
                    dependencies += `, ${dependence}`
                })
                let step = `installing dependencies: ${dependencies.substring(2)}`
                Utils.warning(step)
                await exec(cmd, this.echo)
            }
        }


        /**
         * apt-get install packages
         */
        if (this.materials.sequence.packages !== undefined) {
            if (this.materials.sequence.packages[0] !== null) {
                let packages = ''
                let cmd = 'apt-get install -y '
                this.materials.sequence.packages.forEach(elem => {
                    cmd += ` ${elem}`
                    packages += `, ${elem}`
                })
                let step = `installing packages: ${packages.substring(2)}`
                Utils.warning(step)
                await exec(cmd, this.echo)
            }
        }

        /**
        * apt-get install --no-install-recommends --no-install-suggests
        */
        if (this.materials.sequence.noInstallRecommends !== undefined) {

            if (this.materials.sequence.noInstallRecommends[0] !== null) {
                let cmd = 'apt-get install --no-install-recommends --no-install-suggests -y '
                let noInstallRecommends = ''
                this.materials.sequence.noInstallRecommends.forEach(elem => {
                    cmd += ` ${elem}`
                    noInstallRecommends += `, ${elem}`
                })
                let step = `installing packages --no-install-recommends --no-install-suggests ${noInstallRecommends.substring(2)}`
                Utils.warning(step)
                await exec(cmd, this.echo)
            }
        }

        /**
         * dpkg -i *.deb
         */
        if (this.materials.sequence.debs !== undefined) {
            if (this.materials.sequence.debs) {
                let step = `installing local packages`
                Utils.warning(step)
                await exec(`dpkg -i ${this.wardrobe}\*.deb`)
            }
        }

        /**
         * customizations
         */
        if (this.materials.sequence.customizations !== undefined) {

            /**
             * customizations/scripts
             */
            if (this.materials.sequence.customizations.scripts !== undefined) {
                if (this.materials.sequence.customizations.scripts[0] !== null) {
                    let step = `customizations scripts`
                    Utils.warning(step)
                    this.materials.sequence.customizations.scripts.forEach(async script => {
                        await exec(`${this.wardrobe}/${this.costume}/${script}`, Utils.setEcho(true))
                    })
                }
            }

            /**
             * customizations/skel
             */
            if (this.materials.sequence.customizations.skel !== undefined) {
                if (this.materials.sequence.customizations.skel) {
                    let step = `customizations skel`
                    if (fs.existsSync(`${this.wardrobe}/${this.costume}/skel`)) {
                        Utils.warning(step)
                        await exec(`rm /etc/skel -rf`)
                        await exec(`mkdir /etc/skel`)
                        await exec(`cp -r ${this.wardrobe}/${this.costume}/skel/.local /etc/skel/`)
                        // copy skep to home of the current user
                        const primaryUser = Utils.getPrimaryUser()
                        await exec(`cp -r ${this.wardrobe}/${this.costume}/skel/.local /home/${primaryUser}/.local`)
                        await exec(`chown ${primaryUser}:${primaryUser} /home/${primaryUser} -R`)
                    } else {
                        Utils.warning(`${this.wardrobe}/${this.costume}/skel not found!`)
                    }
                }
            }

            /**
             * customizations/usr
             */
            if (this.materials.sequence.customizations.usr !== undefined) {
                if (this.materials.sequence.customizations.usr) {
                    let step = `customizations usr`
                    if (fs.existsSync(`${this.wardrobe}/${this.costume}/usr`)) {
                        Utils.warning(step)
                        await exec(`cp -r ${this.wardrobe}/${this.costume}/usr/* /usr/`)
                    } else {
                        Utils.warning(`${this.wardrobe}/${this.costume}/usr not found!`)
                    }
                }
            }
        }

        /**
         * hostname and hosts
         */
        if (this.materials.sequence.hostname !== undefined) {
            if (this.materials.sequence.hostname) {
                Utils.warning(`changing hostname = ${this.materials.name}`)
                await this.hostname()
            }
        }

        /**
         * reboot
         * mandatory
         */
        if (this.materials.sequence.reboot === undefined) {
            this.materials.sequence.reboot = true
        }
        if (this.materials.sequence.reboot) {
            Utils.warning(`Reboot`)
            await Utils.pressKeyToExit('system need to reboot', true)
            await exec('reboot')
        }
    }

    

    /**
    * hostname and hosts
    */
    private async hostname() {

        /**
         * hostname
         */
        let file = '/etc/hostname'
        let text = this.materials.name
        await exec(`rm ${file} `, this.echo)
        fs.writeFileSync(file, text)

        /**
         * hosts
         */
        file = '/etc/hosts'
        text = ''
        text += '127.0.0.1 localhost localhost.localdomain\n'
        text += `127.0.1.1 ${this.materials.name} \n`
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
