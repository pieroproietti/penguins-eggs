/**
 * penguins-eggs: tailor.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

import chalk from 'chalk'
import Utils from './utils'
import { IMateria } from '../interfaces'
import { exec } from '../lib/utils'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import Pacman from './pacman'
import Distro from './distro'
import SourcesList from './sources_list'
import { exit } from 'process'
import Xdg from './xdg'
import Daddy from '../classes/daddy'


/**
 * 
 */
export default class Tailor {
    private verbose = false
    private echo = {}
    private costume = ''
    private wardrobe = ''
    materials = {} as IMateria

    /**
     * @param wardrobe 
     * @param costume 
     */
    constructor(wardrobe: string, costume: string) {
        this.costume = costume
        this.wardrobe = wardrobe
    }

    /**
     * 
     */
    async prepare(verbose = true, no_accessories = false) {
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

        let tailorList = `${this.wardrobe}/${this.costume}/index.yml`
        if (fs.existsSync(tailorList)) {
            this.materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as IMateria
        } else {
            tailorList = `${this.wardrobe}/accessories/${this.costume}/index.yml`
            if (fs.existsSync(tailorList)) {
                this.materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as IMateria
            } else {
                console.log('costume ' + chalk.cyan(this.costume) + ' not found in wardrobe: ' + chalk.green(this.wardrobe) + ', not in accessories')
            }
        }


        /**
         * sequence
         */
        if (this.materials.sequence !== undefined) {

            /**
             * sequence/repositories
             */
            if (this.materials.sequence.repositories !== undefined) {
                Utils.warning(`analyzing repositories`)

                /**
                * sequence/repositories/source_list_d
                */
                if (this.materials.sequence.repositories.sources_list !== undefined) {
                    let step = 'analyzing /etc/apt/sources.list'
                    Utils.warning(step)

                    const sources_list = new SourcesList()
                    sources_list.distribution(this.materials.sequence.repositories.sources_list)
                    sources_list.components(this.materials.sequence.repositories.sources_list)
                }


                /**
                * sequence/repositories/source_list_d
                */
                if (this.materials.sequence.repositories.sources_list_d !== undefined) {
                    if (this.materials.sequence.repositories.sources_list_d[0] !== null) {
                        let step = `adding repositories to /etc/apt/sources.list.d`
                        Utils.warning(step)

                        for (const cmd of this.materials.sequence.repositories.sources_list_d) {
                            try {
                                await exec(cmd, this.echo)
                            } catch (error) {
                                await Utils.pressKeyToExit(JSON.stringify(error))
                            }
                        }
                    }
                }

                /**
                 * sequence/repositories/update
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
                 * sequence/repositories/upgrade
                 */
                if (this.materials.sequence.repositories.upgrade !== undefined) {
                    let step = `apt-get full-upgrade`
                    Utils.warning(step)
                    if (this.materials.sequence.repositories.upgrade) {
                        await exec('apt-get full-upgrade -y', Utils.setEcho(false))
                    }
                }
            }


            /**
             * sequence/preinst
             */
            if (this.materials.sequence.preinst !== undefined) {
                if (Array.isArray(this.materials.sequence.preinst)) {
                    let step = `preinst scripts`
                    Utils.warning(step)
                    for (const script of this.materials.sequence.preinst) {
                        await exec(`${this.wardrobe}/${this.costume}/${script}`, Utils.setEcho(true))
                    }
                }
            }


            /**
             * apt-get install packages
             */
            if (this.materials.sequence.packages !== undefined) {
                await this.helper(this.materials.sequence.packages)
            }

            /**
            * sequence/packages_no_install_recommends
            */
            if (this.materials.sequence.packages_no_install_recommends !== undefined) {
                await this.helper(
                    this.materials.sequence.packages_no_install_recommends,
                    "packages without recommends and suggests",
                    'apt-get install --no-install-recommends --no-install-suggests -yq '
                )
            }


            /**
             * sequence/debs
             */
            if (this.materials.sequence.debs !== undefined) {
                if (this.materials.sequence.debs) {
                    let step = `installing local packages`
                    Utils.warning(step)
                    let cmd = `dpkg -i ${this.wardrobe}/${this.costume}/debs/*.deb`
                    await exec(cmd)
                }
            }


            /**
            * sequence/packages_python 
            */
            if (this.materials.sequence.packages_python !== undefined) {
                if (Array.isArray(this.materials.sequence.packages_python)) {
                    let cmd = 'pip install '
                    let pip = ''
                    for (const elem of this.materials.sequence.packages_python) {
                        cmd += ` ${elem}`
                        pip += `, ${elem}`
                    }
                    let step = `installing python packages pip ${pip.substring(2)}`
                    Utils.warning(step)
                    await exec(cmd, this.echo)
                }
            }


            /**
             * sequence/accessories
             */
            if (!no_accessories) {
                if (this.materials.sequence.accessories !== undefined) {
                    if (Array.isArray(this.materials.sequence.accessories)) {
                        let step = `wearing accessories`
                        for (const elem of this.materials.sequence.accessories) {
                            if (elem.substring(0, 2) === './') {
                                const tailor = new Tailor(this.wardrobe, `${this.costume}/${elem.substring(2)}`)
                                await tailor.prepare(verbose)
                            } else {
                                const tailor = new Tailor(this.wardrobe, `./accessories/${elem}`)
                                await tailor.prepare(verbose)
                            }
                        }
                    }
                }
            }
        }

        // customize è sempre indefinito
        if (this.materials.customize !== undefined) {

            /**
             * customize/dirs
             */
            if (this.materials.customize.dirs) {
                if (fs.existsSync(`${this.wardrobe}/${this.costume}/dirs`)) {
                    let step = `copying dirs`
                    Utils.warning(step)
                    let cmd = `rsync -avx  ${this.wardrobe}/${this.costume}/dirs/* /`
                    await exec(cmd, this.echo)

                    // chown root:root /etc -R
                    cmd = "chown root:root /etc -R"
                    await exec(cmd, this.echo)

                    /**
                     * Copyng skel in /home/user
                     */
                    if (fs.existsSync(`${this.wardrobe}/${this.costume}/dirs/etc/skel`)) {
                        const user = Utils.getPrimaryUser()
                        step = `copying skel in /home/${user}/`
                        Utils.warning(step)
                        cmd = `rsync -avx  ${this.wardrobe}/${this.costume}/dirs/etc/skel/.config /home/${user}/`
                        await exec(cmd, this.echo)
                        await exec(`chown ${user}:${user} /home/${user}/ -R`)
                    }
                }
            }



            /**
             * customize/hostname
             */
            if (this.materials.customize.hostname) {
                Utils.warning(`changing hostname = ${this.materials.name}`)
                await this.hostname()
            }

            /**
             * customize/scripts
             */
            if (this.materials.customize.scripts !== undefined) {
                if (Array.isArray(this.materials.customize.scripts)) {
                    let step = `customize scripts`
                    Utils.warning(step)
                    const user = process.env.SUDO_USER
                    const desktop = `/home/${user}/${Xdg.traduce("DESKTOP")}`
                    for (const script of this.materials.customize.scripts) {
                        await exec(`${this.wardrobe}/${this.costume}/${script} ${user} ${desktop}`, Utils.setEcho(true))
                    }
                }
            }
        }



        /**
         * reboot
         */
        if (this.materials.reboot) {
            /**
             * eggs dad -d before to reboot
             */
            const daddy = new Daddy()
            const flagDefault = true
            const flagVerbose = false
            const flagSkip = true 
            await daddy.helpMe(flagDefault, flagVerbose, flagSkip)

            Utils.warning(`Reboot`)
            await Utils.pressKeyToExit('system need to reboot', true)
            await exec('reboot')
        } else {
            console.log(`You look good with: ${this.materials.name}`)
        }
    }




    /**
     * - check if every package if installed
     * - if find any packages to install
     * - install packages
     */
    async helper(packages: string[], comment = 'packages', cmd = 'apt-get install -yqq ') {

        if (packages[0] !== null) {
            let elements: string[] = []
            let strElements = ''
            for (const elem of packages) {
                if (!Pacman.packageIsInstalled(elem)) {
                    elements.push(elem)
                    cmd += ` ${elem}`
                    strElements += `, ${elem}`
                }
            }
            if (elements.length > 0) {
                let step = `installing ${comment}: `
                // if not verbose show strElements
                if (!this.verbose) {
                    step += strElements.substring(2)
                }


                /**
                 * prova 5 volte
                 */
                for (let tempts = 1; tempts < 5; tempts++) {
                    Utils.titles(step)
                    Utils.warning(`tempts ${tempts} of 5`)
                    if (await tryCheckSuccess(cmd, this.echo)) {
                        break
                    }
                }
            }
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

/**
 * 
 * @param cmd 
 * @param echo 
 * @returns 
 */
async function tryCheckSuccess(cmd: string, echo: {}): Promise<boolean> {
    let success = false
    try {
        await exec(cmd, echo)
        success = true
    }
    catch (e) {
        success = false
    }
    return success
}