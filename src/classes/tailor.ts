/**
 * penguins-eggs: tailor.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

// const tempfile=require('tempfile')
import chalk from 'chalk'
import Utils from './utils'
import { IMateria, IConfig } from '../interfaces'
import { exec } from '../lib/utils'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import Pacman from './pacman'
import Distro from './distro'
import SourcesList from './sources_list'

const pjson = require('../../package.json')

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
    constructor(costume: string) {
        this.costume = costume
        this.wardrobe = path.dirname((path.dirname(costume)))
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

        let tailorList = `${this.costume}/index.yml`
        if (fs.existsSync(tailorList)) {
            this.materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as IMateria
        }


        const distro = new Distro()

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
                * sequence/repositories/source_list
                */
                if (this.materials.distributions !== undefined) {

                    let step = 'analyzing /etc/apt/sources.list for distribution'
                    Utils.warning(step)

                    const sources_list = new SourcesList()
                    if (! await sources_list.distribution(this.materials.distributions)) {
                        Utils.pressKeyToExit(`costume ${this, this.materials.name}, is not compatible with your ${distro.distroId}/${distro.codenameId}`, false)
                    }
                    if (distro.distroId === 'Debian' || distro.distroId === 'Devuan') {
                        // evito di fallire se sources_list non serve, tipo base, etc
                        if (this.materials.sequence.repositories.sources_list !== undefined) {
                            await sources_list.components(this.materials.sequence.repositories.sources_list)
                        }
                    }
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
                                // repeat 3 times if fail curl or others commands
                                for (let i = 0; i < 2; i++) {
                                    let result = await exec(cmd, this.echo)
                                    if (result.code === 0) {
                                        break
                                    }
                                }
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
                    console.log('repositiories, and repositories.update MUST be defined on sequence ')
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
                        await exec(`${this.costume}/${script}`, Utils.setEcho(true))
                    }
                }
            }


            /**
             * apt-get install dependencies
             */
            if (this.materials.sequence.dependencies !== undefined) {
                const filterExists = await packagesExists(this.materials.sequence.dependencies)
                if (filterExists.length > 0) {
                    await this.helper(this.materials.sequence.dependencies, "dependencies")
                }
            }


            /**
             * apt-get install packages
             */
            if (this.materials.sequence.packages !== undefined) {
                const filterExists = await packagesExists(this.materials.sequence.packages, true, 'packages')
                if (filterExists.length > 0) {
                    await this.helper(filterExists)
                }
            }

            /**
            * sequence/packages_no_install_recommends
            */
            if (this.materials.sequence.packages_no_install_recommends !== undefined) {
                const filterExists = await packagesExists(this.materials.sequence.packages_no_install_recommends, true, 'packages_no_install_recommends')
                if (filterExists.length > 0) {
                    await this.helper(
                        filterExists,
                        "packages without recommends and suggests",
                        'apt-get install --no-install-recommends --no-install-suggests -yq '
                    )
                }
            }


            /**
             * apt-get TRY install packages
             */
            if (this.materials.sequence.try_packages !== undefined) {
                const filterExists = await packagesExists(this.materials.sequence.try_packages, false)
                if (filterExists.length > 0) {
                    await this.helper(filterExists, 'try packages ')
                }
            }

            /**
            * apt-get TRY packages_no_install_recommends
            */
            if (this.materials.sequence.try_packages_no_install_recommends !== undefined) {
                const filterExists = await packagesExists(this.materials.sequence.try_packages_no_install_recommends, false)
                if (filterExists.length > 0) {
                    await this.helper(
                        filterExists,
                        "try packages without recommends and suggests",
                        'apt-get install --no-install-recommends --no-install-suggests -yq '
                    )
                }
            }

            /**
             * sequence/debs
             */
            if (this.materials.sequence.debs !== undefined) {
                if (this.materials.sequence.debs) {
                    let step = `installing local packages`
                    Utils.warning(step)
                    let pathDebs = `${this.costume}/debs/${distro.codenameLikeId}`
                    if (!fs.existsSync(pathDebs)) {
                        pathDebs = `${this.costume}/debs`
                    }

                    // if exists pathDebs
                    if (fs.existsSync(pathDebs)) {
                        await exec(`dpkg -i ${pathDebs}/*.deb`)
                    }
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
                                const tailor = new Tailor(`${this.costume}/${elem.substring(2)}`)
                                await tailor.prepare(verbose)
                            } else {
                                const tailor = new Tailor(`${this.wardrobe}/accessories/${elem}`)
                                await tailor.prepare(verbose)
                            }
                        }
                    }
                }
            }
        }

        /**
         * customize
         */
        if (this.materials.customize !== undefined) {

            /**
             * customize/dirs
             */
            if (this.materials.customize.dirs) {
                if (fs.existsSync(`/${this.costume}/dirs`)) {
                    let step = `copying dirs`
                    Utils.warning(step)
                    let cmd = `rsync -avx  ${this.costume}/dirs/* /`
                    await exec(cmd, this.echo)

                    // chown root:root /etc -R
                    cmd = "chown root:root /etc/sudoers.d /etc/skel -R"
                    await exec(cmd, this.echo)

                    /**
                     * Copyng skel in /home/user
                     */
                    if (fs.existsSync(`${this.costume}/dirs/etc/skel`)) {
                        const user = Utils.getPrimaryUser()
                        step = `copying skel in /home/${user}/`
                        Utils.warning(step)
                        cmd = `rsync -avx  ${this.costume}/dirs/etc/skel/.config /home/${user}/`
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
                    let step = `customize script`
                    Utils.warning(step)

                    for (const script of this.materials.customize.scripts) {
                        if (fs.existsSync(`${this.costume}/${script}`)) {
                            // exec script in costume passing costume-name
                            await exec(`${this.costume}/${script} ${this.materials.name}`, Utils.setEcho(true))
                        } else {
                            // exec script real env
                            await exec(`${script}`, Utils.setEcho(true))
                        }
                    }
                }
            }
        }



        /**
         * reboot
         */
        if (this.materials.reboot) {
            Utils.warning(`Reboot`)
            await Utils.pressKeyToExit('system need to reboot', true)
            await exec('reboot')
        } else {
            console.log(`You look good with: ${this.materials.name}`)
        }
    }




    /**
     * - check if every package if installed
     * - if find any packages to install, install it
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
                 * prova 3 volte
                 */
                let limit = 3
                for (let tempts = 1; tempts < limit; tempts++) {
                    this.titles(step)
                    Utils.warning(`tempts ${tempts} of ${limit}`)
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

        /**
         * chenge config.snapshot.basename
         */
        const config_file = '/etc/penguins-eggs.d/eggs.yaml'
        let config = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IConfig
        config.snapshot_basename = this.materials.name
        fs.writeFileSync(config_file, yaml.dump(config), 'utf-8')
    }


    /**
     * 
     * @param command 
     */
    titles(command = '') {
        console.clear()
        console.log('')
        console.log(' E G G S: the reproductive system of penguins')
        console.log('')
        console.log(chalk.bgGreen.whiteBright('      ' + pjson.name + '      ') +
            chalk.bgWhite.blue(" Perri's Brewery edition ") +
            chalk.bgRed.whiteBright('       ver. ' + pjson.version + '       '))
        console.log('wearing: ' + chalk.bgBlack.cyan(this.costume) + ' ' + chalk.bgBlack.white(command) + '\n')
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

/**
 * 
 * @param packages 
 */
async function packagesExists(packages: string[], verbose = false, section = ''): Promise<string[]> {
    const packages_we_want = '/tmp/packages_we_want'
    const packages_not_exists = '/tmp/package_not_exists'
    const packages_exists = '/tmp/packages_exists'

    await exec(`rm -f ${packages_we_want}`)
    await exec(`rm -f ${packages_not_exists}`)
    await exec(`rm -f ${packages_exists}`)

    let content = ''
    packages.sort()
    for (const elem of packages) {
        content += elem + '\n'
    }
    fs.writeFileSync(packages_we_want, content, 'utf-8')
    if (verbose) {
        await exec(`apt-cache --no-generate pkgnames | sort | comm -13 - ${packages_we_want} > ${packages_not_exists}`)
        const not_exist_packages = fs.readFileSync(packages_not_exists, 'utf-8').split('\n')
        if (not_exist_packages.length > 0) {
            console.log(`Following packages from ${section} was not found:`)
            for (const elem of not_exist_packages) {
                if (elem !=='\n') {
                    console.log(`-${elem}\n`)
                }
            }
            Utils.pressKeyToExit('press a key to continue...', true)
        }
    }
    await exec(`apt-cache --no-generate pkgnames | sort | comm -12 - ${packages_we_want} > ${packages_exists}`)
    return fs.readFileSync(packages_exists, 'utf-8').split('\n')
}

