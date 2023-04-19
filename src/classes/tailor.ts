/**
* penguins-eggs: tailor.ts
* author: Piero Proietti
* mail: piero.proietti@gmail.com
*
*/
import chalk from 'chalk'
import Utils from './utils'
import { IMateria, IEggsConfig } from '../interfaces/index'
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
  private category = 'costume'

  materials = {} as IMateria

  /**
  * @param wardrobe
  * @param costume
  */
  constructor(costume: string, category = 'costume') {
    this.costume = costume
    this.wardrobe = path.dirname((path.dirname(costume)))
    this.category = category
  }

  /**
  *
  */
  async prepare(verbose = true, no_accessories = false, no_firmwares = false) {
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

    // Analyze distro
    let distro = new Distro()
    let tailorList = ''
    if (distro.distroLike === 'Debian') {
      tailorList = `${this.costume}/debian.yml`
      if (!fs.existsSync(tailorList)) {
        tailorList = `${this.costume}/devuan.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/ubuntu.yml`
          if (!fs.existsSync(tailorList)) {
            console.log(`no definition found compatible Debian`)
            process.exit()
          }
        }
      }

    } else if (distro.distroLike === 'Devuan') {
      tailorList = `${this.costume}/devuan.yml`
      if (!fs.existsSync(tailorList)) {
        tailorList = `${this.costume}/debian.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/ubuntu.yml`
          if (!fs.existsSync(tailorList)) {
            console.log(`no definition found compatible Devuan`)
            process.exit()
          }
        }
      }
    } else if (distro.distroLike === 'Ubuntu') {
      tailorList = `${this.costume}/ubuntu.yml`
      if (!fs.existsSync(tailorList)) {
        tailorList = `${this.costume}/debian.yml`
        console.log(`trying ` + tailorList)
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/devuan.yml`
          console.log(`trying ` + tailorList)
          if (!fs.existsSync(tailorList)) {
            console.log(`no definition found compatible Ubuntu`)
            process.exit()
          }
        }
      }
    } else if (distro.distroLike === 'Arch') {
      tailorList = `${this.costume}/arch-rolling.sh`
    }

    if (fs.existsSync(tailorList)) {
      this.materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as IMateria
    } else switch (this.category) {
      case 'costume': {
        this.titles(`${this.category}: ${this.costume}`)
        console.log('Tailor\'s list ' + chalk.cyan(tailorList) + ' is not found \non your wardrobe ' + chalk.cyan(this.wardrobe) + '.\n')
        console.log('Costume will not be installed, operations will abort.\n')
        Utils.pressKeyToExit()
        process.exit()

        break
      }

      case 'accessory': {
        this.titles(`${this.category}: ${this.costume}`)
        console.log('Tailor\'s list ' + chalk.cyan(tailorList) + ' is not found \non your wardrobe ' + chalk.cyan(this.wardrobe) + '.\n')
        console.log('Accessory will not be installed, operations will continue.\n')
        Utils.pressKeyToExit()
        return
      }

      case 'try_accessory': {
        return
      }
      // No default
    }

    /**
    * distro e sources_list
    * vengono definite qua perchè servono a tutti
    */
    const sources_list = new SourcesList()
    let step = ''

    if (this.materials.distributions !== undefined) {
      step = 'analyzing distribution'
      Utils.warning(step)

      if (!await sources_list.distribution(this.materials.distributions)) {
        switch (this.category) {
          case 'costume': {
            this.titles('step')
            console.log('Costume ' + chalk.cyan(this.materials.name) + ' is not compatible \nwith your ' + chalk.cyan(distro.distroId + '/' + distro.codenameId) + ' system.\n')
            console.log('Costume will not be installed, operations will abort.\n')
            Utils.pressKeyToExit()
            process.exit()

            break
          }

          case 'accessory': {
            this.titles('step')
            console.log('Accessory ' + chalk.cyan(this.materials.name) + ' is not compatible \nwith your ' + chalk.cyan(distro.distroId + '/' + distro.codenameId) + ' system.\n')
            console.log('Accessory will not be installed, operations will continue.\n')
            Utils.pressKeyToExit()
            return
          }

          case 'try_accessory': {
            return
          }
          // No default
        }
      }
    }

    /**
    * sequence
    */
    if (this.materials.sequence !== undefined) {
      step = 'analyzing sequence'
      Utils.warning(step)

      /**
      * sequence/repositories
      */
      if (this.materials.sequence.repositories !== undefined) {
        /**
              * sequence/repositories/sources_list
              */
        // evito di fallire se sources_list non è presente
        if (this.materials.sequence.repositories.sources_list !== undefined) {
          step = 'analyzing sources_list'
          Utils.warning(step)
          // controllo i componenti solo se Debian/Devuab
          if (distro.distroId === 'Debian' || distro.distroId === 'Devuan') {
            await sources_list.components(this.materials.sequence.repositories.sources_list)
          }
        }

        /**
        * sequence/repositories/sources_list_d
        */
        if (this.materials.sequence.repositories.sources_list_d !== undefined && this.materials.sequence.repositories.sources_list_d[0] !== null) {
          step = 'adding repositories to /etc/apt/sources_list_d'
          Utils.warning(step)

          for (const cmd of this.materials.sequence.repositories.sources_list_d) {
            try {
              // repeat 3 times if fail curl or others commands
              for (let i = 0; i < 2; i++) {
                const result = await exec(cmd, this.echo)
                if (result.code === 0) {
                  break
                }
              }
            } catch (error) {
              await Utils.pressKeyToExit(JSON.stringify(error))
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

        step = 'updating repositories'
        Utils.warning(step)
        if (this.materials.sequence.repositories.update) {
          await exec('apt-get update', Utils.setEcho(false))
        }

        /**
        * sequence/repositories/upgrade
        */
        if (this.materials.sequence.repositories.upgrade !== undefined) {
          step = 'apt-get full-upgrade'
          Utils.warning(step)
          if (this.materials.sequence.repositories.upgrade) {
            await exec('apt-get full-upgrade -y', Utils.setEcho(false))
          }
        }
      }
    } // fine repositories

    /**
    * sequence/preinst
    */
    if (this.materials.sequence.preinst !== undefined && Array.isArray(this.materials.sequence.preinst)) {
      step = 'preinst scripts'
      Utils.warning(step)
      for (const script of this.materials.sequence.preinst) {
        if (fs.existsSync(`${this.costume}/${script}`)) {
          await exec(`${this.costume}/${script}`, Utils.setEcho(true))
        } else {
          // exec script real env
          await exec(`${script}`, Utils.setEcho(true))
        }
      }
    }

    /**
    * apt-get install dependencies
    * I think its not more used! to check
    */
    // if (this.materials.sequence.dependencies !== undefined) {
    // const dependencies = await this.helperExists(this.materials.sequence.dependencies)
    // if (dependencies.length > 1) {
    //     await this.helperInstall(dependencies, 'dependencies')
    //   }
    // }

    /**
    * apt-get install packages
    */
    if (this.materials.sequence.packages !== undefined) {
      const packages = await this.helperExists(this.materials.sequence.packages, true, 'packages')
      if (packages.length > 1) {
        await this.helperInstall(packages)
      }
    }

    /**
    * sequence/packages_no_install_recommends
    */
    if (this.materials.sequence.packages_no_install_recommends !== undefined) {
      const packages_no_install_recommends = await this.helperExists(this.materials.sequence.packages_no_install_recommends, true, 'packages_no_install_recommends')
      if (packages_no_install_recommends.length > 1) {
        await this.helperInstall(
          packages_no_install_recommends,
          'packages without recommends and suggests',
          'apt-get install --no-install-recommends --no-install-suggests -yq ',
        )
      }
    }

    /**
    * sequence/try_packages
    */
    if (this.materials.sequence.try_packages !== undefined) {
      const try_packages = await this.helperExists(this.materials.sequence.try_packages, false)
      if (try_packages.length > 1) {
        await this.helperInstall(try_packages, 'try packages ')
      }
    }

    /**
    * sequence/try_packages_no_install_recommends
    */
    if (this.materials.sequence.try_packages_no_install_recommends !== undefined) {
      const try_packages_no_install_recommends = await this.helperExists(this.materials.sequence.try_packages_no_install_recommends, false)
      if (try_packages_no_install_recommends.length > 1) {
        await this.helperInstall(
          try_packages_no_install_recommends,
          'try packages without recommends and suggests',
          'apt-get install --no-install-recommends --no-install-suggests -yq ',
        )
      }
    }

    /**
    * sequence/debs
    */
    if (this.materials.sequence.debs !== undefined && this.materials.sequence.debs) {
      step = 'installing local packages'
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

    /**
    * sequence/packages_python
    */
    if (this.materials.sequence.packages_python !== undefined && Array.isArray(this.materials.sequence.packages_python)) {
      let cmd = 'pip install '
      let pip = ''
      for (const elem of this.materials.sequence.packages_python) {
        cmd += ` ${elem}`
        pip += `, ${elem}`
      }

      step = `installing python packages pip ${pip.slice(2)}`
      Utils.warning(step)
      await exec(cmd, this.echo)
    }

    /**
    * sequence/accessories
    */
    if (!no_accessories) {
      // accessories
      if (this.materials.sequence.accessories !== undefined && Array.isArray(this.materials.sequence.accessories)) {
        step = 'wearing accessories'
        for (const elem of this.materials.sequence.accessories) {
          if ((elem === 'firmwares' || elem === './firmwares') && no_firmwares) {
            continue
          }

          if (elem.slice(0, 2) === './') {
            const tailor = new Tailor(`${this.costume}/${elem.slice(2)}`, 'accessory')
            await tailor.prepare(verbose)
          } else {
            const tailor = new Tailor(`${this.wardrobe}/accessories/${elem}`, 'accessory')
            await tailor.prepare(verbose)
          }
        }
      }

      // try_accessories
      if (this.materials.sequence.try_accessories !== undefined && Array.isArray(this.materials.sequence.try_accessories)) {
        step = 'wearing try_accessories'
        for (const elem of this.materials.sequence.try_accessories) {
          if ((elem === 'firmwares' || elem === './firmwares') && no_firmwares) {
            continue
          }

          if (elem.slice(0, 2) === './') {
            const tailor = new Tailor(`${this.costume}/${elem.slice(2)}`, 'try_accessory')
            await tailor.prepare(verbose)
          } else {
            const tailor = new Tailor(`${this.wardrobe}/accessories/${elem}`, 'try_accessory')
            await tailor.prepare(verbose)
          }
        }
      }
    } // no-accessories

    /**
       * customize
       */
    if (this.materials.customize !== undefined) {
      /**
      * customize/dirs
      */
      if (this.materials.customize.dirs && fs.existsSync(`/${this.costume}/dirs`)) {
        step = 'copying dirs'
        Utils.warning(step)
        let cmd = `rsync -avx  ${this.costume}/dirs/* /`
        await exec(cmd, this.echo)

        // chown root:root /etc -R
        cmd = 'chown root:root /etc/sudoers.d /etc/skel -R'
        await exec(cmd, this.echo)

        /**
        * Copyng skel in /home/user
        */
        if (fs.existsSync(`${this.costume}/dirs/etc/skel`)) {
          const user = await Utils.getPrimaryUser()
          step = `copying skel in /home/${user}/`
          Utils.warning(step)
          cmd = `rsync -avx  ${this.costume}/dirs/etc/skel/.config /home/${user}/`
          await exec(cmd, this.echo)
          await exec(`chown ${user}:${user} /home/${user}/ -R`)
        }
      }

      /**
      * customize/hostname
      */
      // if (this.materials.customize.hostname) {
      // Utils.warning(`changing hostname = ${this.materials.name}`)
      //   await this.hostname()
      // }

      /**
      * customize/scripts
      */
      if (this.materials.customize.scripts !== undefined && Array.isArray(this.materials.customize.scripts)) {
        step = 'customize script'
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

    /**
    * reboot
    */
    if (this.materials.reboot) {
      Utils.warning('Reboot')
      await Utils.pressKeyToExit('system need to reboot', true)
      await exec('reboot')
    } else {
      console.log(`You look good with: ${this.materials.name}`)
    }
  }

  /**
  *
  * @param packages
  * @param verbose
  * @param section
  * @returns
  */
  async helperExists(packages: string[], verbose = false, section = ''): Promise<string[]> {
    const packages_we_want = '/tmp/packages_we_want'
    const packages_not_exists = '/tmp/packages_not_exists'
    const packages_exists = '/tmp/packages_exists'

    await exec(`rm -f ${packages_we_want}`)
    await exec(`rm -f ${packages_not_exists}`)
    await exec(`rm -f ${packages_exists}`)

    /**
    * packages_we_want
    */
    let content = ''
    packages.sort()
    for (const elem of packages) {
      if (!Pacman.packageIsInstalled(elem)) {
        content += elem + '\n'
      }
    }

    fs.writeFileSync(packages_we_want, content, 'utf-8')

    /**
    * packages_exists
    */
    await exec(`apt-cache --no-generate pkgnames | sort | comm -12 - ${packages_we_want} > ${packages_exists}`)

    /**
    * packages_not_exists
    */
    if (verbose) {
      await exec(`apt-cache --no-generate pkgnames | sort | comm -13 - ${packages_we_want} > ${packages_not_exists}`)
      const not_exist_packages = fs.readFileSync(packages_not_exists, 'utf-8').split('\n')
      if (not_exist_packages.length > 1) { // Una riga c'è sempre
        let content = ''
        // for (const elem of not_exist_packages) {
        for (let i = 0; i < not_exist_packages.length - 1; i++) {
          content += `- ${not_exist_packages[i]}\n`
        }

        this.titles('tailor')
        console.log('Following packages from ' + chalk.cyan(this.materials.name) + ' section: ' + chalk.cyan(section) + ', was not found:')
        console.log(content)
        Utils.pressKeyToExit('Press a key to continue...')
      }
    }

    return fs.readFileSync(packages_exists, 'utf-8').split('\n')
  }

  /**
  * - check if every package if installed
  * - if find any packages to install, install it
  */
  async helperInstall(packages: string[], comment = 'packages', cmd = 'apt-get install -yqq ') {
    if (packages[0] !== null) {
      const elements: string[] = []
      let strElements = ''
      for (const elem of packages) {
        elements.push(elem)
        cmd += ` ${elem}`
        strElements += `, ${elem}`
      }

      if (elements.length > 0) {
        let step = `installing ${comment}: `
        // if not verbose show strElements
        if (!this.verbose) {
          step += strElements.slice(2)
        }

        /**
        * prova 3 volte
        */
        const limit = 3
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
    text += '# The following lines are desirable for IPv6 capable hosts\n'
    text += ':: 1     ip6 - localhost ip6 - loopback\n'
    text += 'fe00:: 0 ip6 - localnet\n'
    text += 'ff00:: 0 ip6 - mcastprefix\n'
    text += 'ff02:: 1 ip6 - allnodes\n'
    text += 'ff02:: 2 ip6 - allrouters\n'
    text += 'ff02:: 3 ip6 - allhosts\n'
    await exec(`rm ${file} `, this.echo)
    fs.writeFileSync(file, text)

    /**
       * chenge config.snapshot.basename
       */
    const config_file = '/etc/penguins-eggs.d/eggs.yaml'
    const config = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IEggsConfig
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
  } catch {
    success = false
  }

  return success
}
