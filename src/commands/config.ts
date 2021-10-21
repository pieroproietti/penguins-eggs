/**
 * penguins-eggs-v8
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
import { array2spaced } from '../lib/dependencies'

const exec = require('../lib/utils').exec

/**
 * 
 */
export default class Config extends Command {
    static description = 'Configure and install prerequisites deb packages to run it'

    static aliases = ['prerequisites']
    static flags = {
        nointeractive: flags.boolean({ char: 'n', description: 'assume yes' }),
        clean: flags.boolean({ char: 'c', description: 'remove old configuration before to create new one' }),
        help: flags.help({ char: 'h' }),
        verbose: flags.boolean({ char: 'v', description: 'verbose' }),
    }

    static examples = [`~$ sudo eggs config\nConfigure and install prerequisites deb packages to run it`]

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
                await Pacman.autocompleteInstall(nointeractive)
                await Pacman.manPageInstall(verbose)
            }

            // Vediamo che cosa c'è da fare...
            const i = await Config.thatWeNeed(nointeractive, verbose)

            if (i.needApt || i.configurationInstall || i.configurationRefresh || i.distroTemplate) {
                if (nointeractive) {
                    await Config.install(i, nointeractive, verbose)
                } else {
                    if (await Utils.customConfirm()) {
                        await Config.install(i, nointeractive, verbose)
                    }
                }
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

        if (Utils.machineArch() !== 'i386') {
            i.efi = (!Utils.isUefi())
        }

        if (!await Pacman.calamaresCheck() && (await Pacman.isGui())) {
            /**
             * Se non è jessie o stretch...
             */
            const remix = {} as IRemix
            const distro = new Distro(remix)
            if (Pacman.calamaresAble()) {
                Utils.warning('config: you are on a graphic system, I suggest to install the GUI installer calamares')
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
            Utils.warning('config: we need...')
            if (i.needApt) {
                console.log('- update the system')
                console.log(chalk.yellow('  apt update --yes\n'))
            }

            if (i.efi) {
                if (Utils.machineArch() !== 'i386') {
                    console.log('- install efi packages')
                    console.log(chalk.yellow('  apt install -y grub-efi-' + Utils.machineArch() + '-bin\n'))
                }
            }


            if (i.prerequisites) {
                console.log('- install packages prerequisites')
                const packages = Pacman.filterInstalled(Pacman.packages(verbose))
                if (packages.length > 0) {
                    console.log(chalk.yellow('  apt install --yes ' + array2spaced(packages)))
                }
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

            if (i.calamares) {
                console.log('- install calamares')
                const packages = Pacman.debs4calamares
                console.log(chalk.yellow('  apt install -y ' + array2spaced(packages) + '\n'))
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

        Utils.warning('config: so, we install')

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
            if (nointeractive) {
                Utils.error('config: you are on a system UEFI')
                Utils.warning('I suggest You to install grub-efi-' + Utils.machineArch() + '-bin before to produce your ISO.\nJust write:\n    sudo apt install grub-efi-' + Utils.machineArch())
            } else {
                Utils.warning('Installing uefi support...')
                await exec('apt-get install grub-efi-' + Utils.machineArch() + '-bin --yes', echo)
            }
        }

        if (i.prerequisites) {
            if (nointeractive) {
                Utils.warning('Can\'t installa prerequisites now...')
            } else {
                await Pacman.prerequisitesInstall(verbose)
            }
        }

        if (i.calamares) {
            if (Pacman.calamaresAble()) {
                if (nointeractive) {
                    Utils.error('config: you are on a graphic system, I suggest to install the GUI installer calamares')
                    Utils.warning('I suggest You to install calamares GUI installer before to produce your ISO.\nJust write:\n    sudo eggs calamares --install')
                } else {
                    Utils.warning('Installing calamares...')
                    await Pacman.calamaresInstall(verbose)
                    await Pacman.calamaresPolicies()
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
