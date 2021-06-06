/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import chalk from 'chalk'
import Utils from '../classes/utils'
import Pacman from '../classes/pacman'
import Bleach from '../classes/bleach'
import { IInstall } from '../interfaces'
import Distro from '../classes/distro'
import { IRemix, IDistro } from '../interfaces'

const exec = require('../lib/utils').exec

/**
 * 
 */
export default class Config extends Command {
    static description = 'Configure eggs and install packages prerequisites to run it'

    static aliases = ['prerequisites']
    static flags = {
        nointeractive: flags.boolean({ char: 'n', description: 'assume yes' }),
        clean: flags.boolean({ char: 'c', description: 'remove old configuration before to create' }),
        help: flags.help({ char: 'h' }),
        verbose: flags.boolean({ char: 'v', description: 'verbose' }),
    }

    static examples = [`~$ sudo eggs config\nConfigure eggs and install prerequisites`]

    async run() {
        const { flags } = this.parse(Config)
        const nointeractive = flags.nointeractive
        const verbose = flags.verbose

        if (!nointeractive) {
            Utils.titles(this.id + ' ' + this.argv)
        }

        if (Utils.isRoot(this.id)) {
            if (flags.clean) {
                await exec('rm /etc/penguins-eggs.d -rf')
            }

            /**
             * Se siamo in un pacchetto npm
             * Aggiunge autocomplete e manPage
             */
            if (!Utils.isNpmPackage()) {
                await Pacman.autocompleteInstall(verbose)
                await Pacman.manPageInstall(verbose)
            }

            // Vede che cosa c'è da fare...
            const i = await Config.thatWeNeed(nointeractive, verbose)

            /**
             * ...e lo fa!
             */
            if (i.needApt || i.configurationInstall || i.configurationRefresh || i.distroTemplate) {
                if (nointeractive) {
                    await Config.install(i, nointeractive, verbose)
                } else {
                    if (await Utils.customConfirm()) {
                        await Config.install(i, verbose)
                    }
                }
            } else {
                Utils.warning('config: nothing to do!')
            }
        }
    }


    /**
     * 
     * 
     * @param verbose 
     */
    static async thatWeNeed(nointeractive = false, verbose = false): Promise<IInstall> {
        const i = {} as IInstall

        i.distroTemplate = !Pacman.distroTemplateCheck()

        if (process.arch === 'x64') {
            i.efi = (!Utils.isUefi())
        }

        if (!await Pacman.calamaresCheck() && (await Pacman.isGui())) {
            /**
             * Se non è jessie o stretch...
             */
            const remix = {} as IRemix
            const distro = new Distro(remix)
            if (calamaresAble()) {
                Utils.warning('config: you are on a graphic system, I suggest to use the GUI installer calamares')
                if (nointeractive) {
                    i.calamares = true
                } else {
                    i.calamares = (await Utils.customConfirm('Want You install calamares?'))
                }
            }
        }

        i.configurationInstall = !Pacman.configurationCheck()
        if (!i.configurationInstall) {
            i.configurationRefresh = !Pacman.configurationMachineNew()
        }

        i.prerequisites = !await Pacman.prerequisitesCheck()

        if (i.efi || i.calamares || i.prerequisites) {
            i.needApt = true
        }

        /**
         * Visualizza cosa c'è da fare
         */
        if (!nointeractive) {
            Utils.warning('config: that we need...')
            if (i.needApt) {
                console.log('- update the system')
                console.log(chalk.yellow('  apt update --yes\n'))
            }

            if (i.efi) {
                if (process.arch === 'x64') {
                    console.log('- install efi packages')
                    console.log(chalk.yellow('  apt install -y grub-efi-amd64-bin\n'))
                }
            }

            if (i.prerequisites) {
                console.log('- install prerequisites')
                console.log(chalk.yellow('  apt install --yes ' + Pacman.debs2line(Pacman.debs4notRemove)))

                const packages = Pacman.packages(verbose)
                console.log(chalk.yellow('  apt install --yes ' + Pacman.debs2line(packages)))
            }

            if (i.configurationInstall) {
                console.log('- creating configuration\'s files...')
                Pacman.configurationInstall(verbose)
            }

            if (i.configurationRefresh) {
                console.log('- refreshing configuration\'s files...')
                Pacman.configurationFresh()
            }

            if (i.distroTemplate) {
                console.log('- copy distro template\n')
            }

            /*
            const packagesLocalisation = Pacman.packagesLocalisation()
            if (packagesLocalisation.length > 0) {
                console.log('- localisation')
                console.log(chalk.yellow('  apt install --yes --no-install-recommends live-task-localisation ' + Pacman.debs2line(packagesLocalisation)) + '\n')
            } else {
                console.log()
            }
            */

            if (i.calamares) {
                console.log('- install calamares')
                const packages = Pacman.debs4calamares
                console.log(chalk.yellow('  apt install -y ' + Pacman.debs2line(packages) + '\n'))
            }

            if (i.needApt) {
                console.log('- cleaning apt\n')
            }

            if (i.configurationInstall) {
                console.log('- creating/updating configuration')
                console.log('  files: ' + chalk.yellow('/etc/penguins-eggs.d/eggs.yaml') + ' and ' + chalk.yellow('/usr/local/share/penguins-eggs/exclude.list\n'))
            } else if (i.configurationRefresh) {
                console.log('- refreshing configuration for new machine')
            }

            if (i.needApt) {
                Utils.warning('Be sure! It\'s just a series of apt install from your repo.\nYou can follows them using flag --verbose')
            }
        }
        return i
    }


    /**
     * 
     * @param i
     * @param verbose 
     */
    static async install(i: IInstall, nointeractive = false, verbose = false) {
        const echo = Utils.setEcho(verbose)

        Utils.warning('config: install')

        if (i.configurationInstall) {
            Utils.warning('creating configuration...')
            await Pacman.configurationInstall(verbose)
        }

        if (i.configurationRefresh) {
            Utils.warning('refreshing configuration for new machine...')
            await Pacman.configurationMachineNew(verbose)
        }

        if (i.distroTemplate) {
            Utils.warning('coping distro templates...')
            await Pacman.distroTemplateInstall(verbose)
        }

        if (i.needApt && !nointeractive) {
            if (!nointeractive) {
                Utils.warning('updating system...')
                await exec('apt-get update --yes', echo)
            }
        }

        if (i.efi) {
            let arch = 'amd64'
            if (process.arch === 'x64') {
               arch = 'amd64'
            } else if (process.arch === 'arm64') {
               arch = 'armel'
            } else if (process.arch === 'arm64') {
               arch = 'arm64'
            }
            if (nointeractive) {
                Utils.error('config: you are on a system UEFI capable, but I can\'t install grub-efi-' + arch + '-bin now!')
                Utils.warning('I suggest You to install grub-efi-' + arch + '-bin before to produce your ISO.\nJust write:\n    sudo apt install ')
            } else {
                Utils.warning('Installing uefi support...')
                await exec('apt-get install grub-efi-' + arch + '-bin --yes', echo)
            }
        }

        if (i.prerequisites) {
            Utils.warning('Installing prerequisites...')
            await Pacman.prerequisitesInstall(verbose)
        }

        Utils.warning('prerequisites installed!')

        if (i.calamares) {
            if (calamaresAble()) {
                if (nointeractive) {
                    // solo un avviso
                    Utils.error('config: you are on a graphic system, I suggest to use the GUI installer calamares. I can\'t install calamares now!')
                    Utils.warning('I suggest You to install calamares GUI installer before to produce your ISO.\nJust write:\n    sudo eggs calamares --install')
                } else {
                    Utils.warning('Installing calamares...')
                    await Pacman.calamaresInstall(verbose)
                }
            }
        }

        if (i.needApt && !nointeractive) {
            Utils.warning('cleaning the system...')
            const bleach = new Bleach()
            await bleach.clean(verbose)
        }
    }
}

function calamaresAble(): boolean {
    let result = true
    const remix = {} as IRemix
    const distro = new Distro(remix)
    if (distro.versionLike === 'jessie' || distro.versionLike === 'stretch') {
        result = false
    }
    return result
}
