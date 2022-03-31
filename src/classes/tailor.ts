import chalk from 'chalk'
import Utils from './utils'
import { ICostume } from '../interfaces'
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
    materials = {} as ICostume

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
            this.materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as ICostume
        } else {
            console.log('costume ' + chalk.cyan(this.costume) + ' not found in wardrobe: ' + chalk.green(this.wardrobe))
        }

        /**
         * Repositories
         */
        if (this.materials.sequence.repositories === undefined) {
            console.log('repositiories, and repositories.update MUST be defined on sequence ')
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

        /**
         * checking dependencies
         */
        if (this.materials.sequence.dependencies !== undefined) {
            if (this.materials.sequence.dependencies[0] !== null) {
                let cmd = 'apt-get install -y '
                let dependencies = ''
                for (const dependence of this.materials.sequence.dependencies) {
                    cmd += ` ${dependence}`
                    dependencies += `, ${dependence}`
                }
                let step = `installing dependencies: ${dependencies.substring(2)}`
                Utils.warning(step)
                if (verbose) {
                    Utils.titles()
                    // Utils.pressKeyToExit(cmd, true)
                }
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
                for (const elem of this.materials.sequence.packages) {
                    cmd += ` ${elem}`
                    packages += `, ${elem}`
                }
                let step = `installing packages: ${packages.substring(2)}`
                Utils.warning(step)
                if (verbose) {
                    Utils.titles()
                    //Utils.pressKeyToExit(cmd, true)
                }
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
                for (const elem of this.materials.sequence.noInstallRecommends) {
                    cmd += ` ${elem}`
                    noInstallRecommends += `, ${elem}`
                }
                let step = `installing packages --no-install-recommends --no-install-suggests ${noInstallRecommends.substring(2)}`
                Utils.warning(step)
                if (verbose) {
                    Utils.titles()
                    // Utils.pressKeyToExit(cmd, true)
                }
                await exec(cmd, this.echo)
            }
        }

        /**
        * pip packages
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
                if (verbose) {
                    Utils.titles()
                    //Utils.pressKeyToExit(cmd, true)
                }
                await exec(cmd, this.echo)
            }
        }


        /**
         * firmwares
         */
        if (this.materials.sequence.firmwares !== undefined) {
            /**
             * codecs
             */
            if (this.materials.sequence.firmwares.codecs !== undefined) {
                if (this.materials.sequence.firmwares.codecs[0] !== null) {
                    let cmd = 'apt-get install -y '
                    let codecs = ''
                    for (const elem of this.materials.sequence.firmwares.codecs) {
                        cmd += ` ${elem}`
                        codecs += `, ${elem}`
                    }
                    let step = `installing packages firmware codecs ${codecs.substring(2)}`
                    Utils.warning(step)
                    if (verbose) {
                        Utils.titles()
                        //Utils.pressKeyToExit(cmd, true)
                    }
                    await exec(cmd, this.echo)
                }
            }

            /**
             * drivers_graphics_tablet
             */
            if (this.materials.sequence.firmwares.drivers_graphics_tablet !== undefined) {
                if (this.materials.sequence.firmwares.drivers_graphics_tablet[0] !== null) {
                    let cmd = 'apt-get install -y '
                    let drivers_graphics_tablet = ''
                    for (const elem of this.materials.sequence.firmwares.drivers_graphics_tablet) {
                        cmd += ` ${elem}`
                        drivers_graphics_tablet += `, ${elem}`
                    }
                    let step = `installing packages firmware drivers_graphics_tablet ${drivers_graphics_tablet.substring(2)}`
                    Utils.warning(step)
                    if (verbose) {
                        Utils.titles()
                        Utils.pressKeyToExit(cmd, true)
                    }
                    await exec(cmd, this.echo)
                }
            }

            /**
             * drivers_network
             */
            if (this.materials.sequence.firmwares.drivers_network !== undefined) {
                if (this.materials.sequence.firmwares.drivers_network[0] !== null) {
                    let cmd = 'apt-get install -y '
                    let drivers_network = ''
                    for (const elem of this.materials.sequence.firmwares.drivers_network) {
                        cmd += ` ${elem}`
                        drivers_network += `, ${elem}`
                    }
                    let step = `installing packages firmware drivers_network ${drivers_network.substring(2)}`
                    Utils.warning(step)
                    if (verbose) {
                        Utils.titles()
                        //Utils.pressKeyToExit(cmd, true)
                    }
                    await exec(cmd, this.echo)
                }

                /**
                 * drivers_various
                 */
                if (this.materials.sequence.firmwares.drivers_various !== undefined) {
                    if (this.materials.sequence.firmwares.drivers_various[0] !== null) {
                        let cmd = 'apt-get install -y '
                        let drivers_various = ''
                        for (const elem of this.materials.sequence.firmwares.drivers_various) {
                            cmd += ` ${elem}`
                            drivers_various += `, ${elem}`
                        }
                        let step = `installing packages firmware drivers_network ${drivers_various.substring(2)}`
                        Utils.warning(step)
                        if (verbose) {
                            Utils.titles()
                            Utils.pressKeyToExit(cmd, true)
                        }
                        await exec(cmd, this.echo)
                    }
                }
            }

            /**
             * drivers_video_amd
             */
            if (this.materials.sequence.firmwares.drivers_video_amd !== undefined) {
                if (this.materials.sequence.firmwares.drivers_video_amd[0] !== null) {
                    let cmd = 'apt-get install -y '
                    let drivers_video_amd = ''
                    for (const elem of this.materials.sequence.firmwares.drivers_video_amd) {
                        cmd += ` ${elem}`
                        drivers_video_amd += `, ${elem}`
                    }
                    let step = `installing packages firmware drivers_network ${drivers_video_amd.substring(2)}`
                    Utils.warning(step)
                    if (verbose) {
                        Utils.titles()
                        // Utils.pressKeyToExit(cmd, true)
                    }
                    await exec(cmd, this.echo)
                }
            }

            /**
             * drivers_video_nvidia
             */
            if (this.materials.sequence.firmwares.drivers_video_nvidia !== undefined) {
                if (this.materials.sequence.firmwares.drivers_video_nvidia[0] !== null) {
                    let cmd = 'apt-get install -y '
                    let drivers_video_nvidia = ''
                    for (const elem of this.materials.sequence.firmwares.drivers_video_nvidia) {
                        cmd += ` ${elem}`
                        drivers_video_nvidia += `, ${elem}`
                    }
                    let step = `installing packages firmware drivers_network ${drivers_video_nvidia.substring(2)}`
                    Utils.warning(step)
                    if (verbose) {
                        Utils.titles()
                        Utils.pressKeyToExit(cmd, true)
                    }
                    await exec(cmd, this.echo)
                }
            }

            /**
             * drivers_wifi
             */
            if (this.materials.sequence.firmwares.drivers_wifi !== undefined) {
                if (this.materials.sequence.firmwares.drivers_wifi[0] !== null) {

                    let cmd = 'apt-get install -y '
                    let drivers_wifi = ''
                    for (const elem of this.materials.sequence.firmwares.drivers_wifi) {
                        cmd += ` ${elem}`
                        drivers_wifi += `, ${elem}`
                    }
                    let step = `installing packages firmware drivers_network ${drivers_wifi.substring(2)}`
                    Utils.warning(step)
                    if (verbose) {
                        Utils.titles()
                        // Utils.pressKeyToExit(cmd, true)
                    }
                    await exec(cmd, this.echo)
                }
            }

            /**
             * drivers_printer
             */
            if (this.materials.sequence.firmwares.drivers_printer !== undefined) {
                if (this.materials.sequence.firmwares.drivers_printer[0] !== null) {

                    let cmd = 'apt-get install -y '
                    let drivers_printer = ''
                    for (const elem of this.materials.sequence.firmwares.drivers_printer) {
                        cmd += ` ${elem}`
                        drivers_printer += `, ${elem}`
                    }
                    let step = `installing packages firmware drivers_network ${drivers_printer.substring(2)}`
                    Utils.warning(step)
                    if (verbose) {
                        Utils.titles()
                        // Utils.pressKeyToExit(cmd, true)
                    }
                    await exec(cmd, this.echo)
                }
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
                if (verbose) {
                    Utils.titles()
                    // Utils.pressKeyToExit(cmd, true)
                }
                await exec(cmd)
            }
        }

        /**
         * dirs
         */
        if (this.materials.sequence.dirs !== undefined) {
            if (this.materials.sequence.dirs) {
                if (fs.existsSync(`${this.wardrobe}/${this.costume}/dirs`)) {
                    let step = `copying dirs`
                    let cmd = `rsync -avx  ${this.wardrobe}/${this.costume}/dirs/* /`
                    if (verbose) {
                        Utils.titles()
                        // Utils.pressKeyToExit(cmd, true)
                    }
                    await exec(cmd, this.echo)

                    /**
                     * Copyng skel in /home/user
                     */
                    const user = Utils.getPrimaryUser()
                    cmd = `rsync -avx  ${this.wardrobe}/${this.costume}/dirs/etc/skel/.* /home/${user}/`
                    await exec(cmd, this.echo)
                    await exec(`chown ${user}:${user} /home/${user}/ -R`)
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
