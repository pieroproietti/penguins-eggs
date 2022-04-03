/**
 * penguins-eggs: tailor.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

import chalk from 'chalk'
import Utils from './utils'
import { ICostume } from '../interfaces'
import { exec } from '../lib/utils'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import Pacman from './pacman'
import { emitWarning } from 'process'

/**
 * 
 */
export default class Tailor {
    private verbose = false
    private echo = {}
    private costume = ''
    private wardrobe = ''
    materials = {} as ICostume

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
    async prepare(verbose = true) {
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
            this.materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as ICostume
        } else {
            tailorList = `${this.wardrobe}/accessories/${this.costume}/index.yml`
            if (fs.existsSync(tailorList)) {
                this.materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as ICostume
            } else {
                console.log('costume ' + chalk.cyan(this.costume) + ' not found in wardrobe: ' + chalk.green(this.wardrobe) + ', not in accessories')
            }
        }

        /**
         * Repositories
         */
        if (this.materials.sequence.repositories !== undefined) {
            Utils.warning(`analyzing repositories`)


            /**
            * sources.list
            */
            if (this.materials.sequence.repositories.sourcesList !== undefined) {
                let step = 'analyzing /etc/apt/sources.list'
                Utils.warning(step)

                let components: string[] = []
                if (this.materials.sequence.repositories.sourcesList.main) {
                    components.push('main')
                }
                if (this.materials.sequence.repositories.sourcesList.contrib) {
                    components.push('contrib')
                }
                if (this.materials.sequence.repositories.sourcesList.nonFree) {
                    components.push('non-free')
                }

                //deb http://site.example.com/debian distribution component1 component2 component3
                let checkRepos = await exec(`grep "deb http"</etc/apt/sources.list`, { echo: false, capture: true })
                let tmp: string[] = []
                if (checkRepos.code === 0) {
                    tmp = checkRepos.data.split('\n')
                }

                // remove empty line
                let repos: string[] = []
                for (const repo of tmp) {
                    if (repo !== '') {
                        repos.push(repo)
                    }
                }

                let repOk = true
                const codenameId = this.materials.codenameId
                for (const repo of repos) {
                    if (!repo.includes(codenameId)) {
                        console.log('codenameid: ' + chalk.green(codenameId) + ' it\'s not included in repo: ' + chalk.green(repo))
                        repOk = false
                    }
                    for (const component of components) {
                        if (!repo.includes(component)) {
                            console.log('component: ' + chalk.green(component) + ' is not included in repo: ' + chalk.green(repo))
                            repOk = false
                        }
                    }
                }

                if (repOk) {
                    Utils.warning('repositories checked')
                } else {
                    Utils.pressKeyToExit('check your repositories: sudo /etc/apt/sources.list', true)
                }
            }


            /**
             * sources.list.d
             */
            if (this.materials.sequence.repositories.sourcesListD !== undefined) {
                if (this.materials.sequence.repositories.sourcesListD[0] !== null) {
                    let step = `adding repositories to /etc/apt/sources.list.d`
                    Utils.warning(step)

                    for (const cmd of this.materials.sequence.repositories.sourcesListD) {
                        try {
                            await exec(cmd, this.echo)
                        } catch (error) {
                            await Utils.pressKeyToExit(JSON.stringify(error))
                        }
                    }
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
        }




        /**
         * checking dependencies
         */
        if (this.materials.sequence.dependencies !== undefined) {
            await this.helper(this.materials.sequence.dependencies, 'dependencies')
        }


        /**
         * apt-get install packages
         */
        if (this.materials.sequence.packages !== undefined) {
            await this.helper(this.materials.sequence.packages)
        }

        /**
        * apt-get install --no-install-recommends --no-install-suggests
        */
        if (this.materials.sequence.noInstallRecommends !== undefined) {
            await this.helper(
                this.materials.sequence.noInstallRecommends,
                "packages without recommends and suggests",
                'apt-get install --no-install-recommends --no-install-suggests -y '
            )
        }

        /**
         * firmwares
         */
        if (this.materials.sequence.firmwares !== undefined) {

            /**
             * codecs
             */
            if (this.materials.sequence.firmwares.codecs !== undefined) {
                await this.helper(this.materials.sequence.firmwares.codecs, 'codecs')
            }

            /**
             * drivers_graphics_tablet
             */
            if (this.materials.sequence.firmwares.drivers_graphics_tablet !== undefined) {
                await this.helper(this.materials.sequence.firmwares.drivers_graphics_tablet, "graphics tablet")
            }

            /**
             * drivers_network
             */
            if (this.materials.sequence.firmwares.drivers_network !== undefined) {
                await this.helper(this.materials.sequence.firmwares.drivers_network, "network")
            }

            /**
             * drivers_various
             */
            if (this.materials.sequence.firmwares.drivers_various !== undefined) {
                await this.helper(this.materials.sequence.firmwares.drivers_various, "various firmwares")
            }

            /**
             * drivers_video_amd
             */
            if (this.materials.sequence.firmwares.drivers_video_amd !== undefined) {
                await this.helper(this.materials.sequence.firmwares.drivers_video_amd, "video AMD")
            }

            /**
             * drivers_video_nvidia
             */
            if (this.materials.sequence.firmwares.drivers_video_nvidia !== undefined) {
                await this.helper(this.materials.sequence.firmwares.drivers_video_nvidia, "video NVIDIA")
            }

            /**
             * drivers_wifi
             */
            if (this.materials.sequence.firmwares.drivers_wifi !== undefined) {
                await this.helper(this.materials.sequence.firmwares.drivers_wifi, "wifi")
            }

            /**
             * drivers_printer
             */
            if (this.materials.sequence.firmwares.drivers_printer !== undefined) {
                await this.helper(this.materials.sequence.firmwares.drivers_printer, 'printers')
            }
        }



        /**
         * dpkg -i *.deb
         */
        if (this.materials.sequence.debs !== undefined) {
            if (this.materials.sequence.debs) {
                let step = `installing local packages`
                Utils.warning(step)
                let cmd = `dpkg -i ${this.wardrobe}\*.deb`
                await exec(cmd)
            }
        }



        /**
        * packages python
        */
        if (this.materials.sequence.packagesPip !== undefined) {
            if (this.materials.sequence.packagesPip[0] !== null) {
                let cmd = 'pip install '
                let pip = ''
                for (const elem of this.materials.sequence.packagesPip) {
                    cmd += ` ${elem}`
                    pip += `, ${elem}`
                }
                let step = `installing python packages pip ${pip.substring(2)}`
                Utils.warning(step)
                await exec(cmd, this.echo)
            }
        }



        /**
         * dirs
         */
        if (this.materials.sequence.dirs !== undefined) {
            if (this.materials.sequence.dirs) {
                if (fs.existsSync(`${this.wardrobe}/${this.costume}/dirs`)) {
                    let step = `copying dirs`
                    Utils.warning(step)
                    let cmd = `rsync -avx  ${this.wardrobe}/${this.costume}/dirs/* /`
                    await exec(cmd, this.echo)

                    /**
                     * Copyng skel in /home/user
                     */
                    const user = Utils.getPrimaryUser()
                    step = `copying skel in /home/${user}/`
                    Utils.warning(step)
                    cmd = `rsync -avx  ${this.wardrobe}/${this.costume}/dirs/etc/skel/.* /home/${user}/`
                    await exec(cmd, this.echo)
                    await exec(`chown ${user}:${user} /home/${user}/ -R`)
                }
            }
        }



        /**
         * accessories
         */
        if (this.materials.sequence.accessories !== undefined) {
            if (this.materials.sequence.accessories[0] !== null) {
                let step = `wearing accessories`
                for (const elem of this.materials.sequence.accessories) {
                    const tailor = new Tailor(this.wardrobe, `./accessories/${elem}`)
                    await tailor.prepare(verbose)
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
                    for (const script of this.materials.sequence.customizations.scripts) {
                        await exec(`${this.wardrobe}/${this.costume}/${script}`, Utils.setEcho(true))
                    }
                }
            }
        }



        /**
         * reboot
         */
        if (this.materials.sequence.reboot === undefined) {
            this.materials.sequence.reboot = false // Accessories
        }
        if (this.materials.sequence.reboot) {
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
    async helper(packages: string[], comment = 'packages', cmd = 'apt-get install -y ') {

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
                let step = `installing ${comment}: ${strElements.substring(2)}`
                Utils.warning(step)
                await exec(cmd, this.echo)
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


