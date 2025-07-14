/**
 * ./src/classes/tailor.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import fs from 'node:fs'
import yaml from 'js-yaml'
import path from 'node:path'

import { exec } from '../lib/utils.js'
import { IMateria } from '../interfaces/index.js'
import Distro from './distro.js'
import Pacman from './pacman.js'
import SourcesList from './sources_list.js'
import Utils from './utils.js'

/**
 *
 */
export default class Tailor {
  materials = {} as IMateria
  private category = 'costume'
  private costume = ''
  private echo = {}
  private toNull = ' > /dev/null 2>&1'
  private verbose = false
  private wardrobe = ''
  private log = ''

  /**
   * @param wardrobe
   * @param costume
   */
  constructor(costume: string, category = 'costume') {
    this.costume = costume
    this.wardrobe = path.dirname(path.dirname(costume))
    this.log = path.dirname(this.wardrobe) + "/wardrobe.log"
    this.category = category
  }

  /**
   *
   */
  async prepare(verbose = true, no_accessories = false, no_firmwares = false) {

    if (verbose) {
      this.verbose = true
      this.toNull = ''
    }

    this.echo = Utils.setEcho(verbose)
    Utils.warning(`preparing ${this.costume}`)
    if (!fs.existsSync(this.log)) {
      fs.writeFileSync(this.log, "# eggs wardrobe wear\n\n")
    }
    fs.appendFileSync(this.log, `## ${this.costume}\n`)
    fs.appendFileSync(this.log, `Packages not found:\n`)



    /**
     * check curl presence
     */
    if (!Pacman.packageIsInstalled('curl')) {
      Utils.pressKeyToExit('In this tailoring shop we use curl. Install it with your package manager')
      process.exit()
    }

    // Analyze distro
    const distro = new Distro()
    let tailorList = ''

    switch (distro.distroLike) {
      case 'Debian': {
        tailorList = `${this.costume}/debian.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/devuan.yml`
          if (!fs.existsSync(tailorList)) {
            tailorList = `${this.costume}/ubuntu.yml`
            if (!fs.existsSync(tailorList)) {
              console.log(`no costume definition found compatible Debian`)
              process.exit()
            }
          }
        }
        break
      }

      case 'Devuan': {
        tailorList = `${this.costume}/devuan.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          if (!fs.existsSync(tailorList)) {
            tailorList = `${this.costume}/ubuntu.yml`
            if (!fs.existsSync(tailorList)) {
              console.log(`no costume definition found compatible Devuan`)
              process.exit()
            }
          }
        }
        break
      }

      case 'Ubuntu': {
        tailorList = `${this.costume}/ubuntu.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          console.log(`trying ` + tailorList)
          if (!fs.existsSync(tailorList)) {
            tailorList = `${this.costume}/devuan.yml`
            console.log(`trying ` + tailorList)
            if (!fs.existsSync(tailorList)) {
              console.log(`no costume definition found compatible Ubuntu`)
              process.exit()
            }
          }
        }
        break
      }

      case 'Alpine': {
        tailorList = `${this.costume}/alpine.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          if (!fs.existsSync(tailorList)) {
            console.log(`no costume definition found compatible Alpine`)
            process.exit()
          }
        }
        break
      }

      case 'Arch': {
        tailorList = `${this.costume}/arch.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          if (!fs.existsSync(tailorList)) {
            console.log(`no costume definition found compatible Arch`)
            process.exit()
          }
        }
        break
      }

      case 'Fedora': 
      case 'Almalinux':
      case 'Rocky': {
        tailorList = `${this.costume}/fedora.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          if (!fs.existsSync(tailorList)) {
            console.log(`no costume definition found compatible Fedora`)
            process.exit()
          }
        }
        break
      }

      case 'Opensuse': {
        tailorList = `${this.costume}/opensuse.yml`
        if (!fs.existsSync(tailorList)) {
          tailorList = `${this.costume}/debian.yml`
          if (!fs.existsSync(tailorList)) {
            console.log(`no costume definition found compatible opensuse`)
            process.exit()
          }
        }
        break
      }
    } // end analyze


    /**
     * find materials
     */
    if (fs.existsSync(tailorList)) {
      this.materials = yaml.load(fs.readFileSync(tailorList, 'utf8')) as IMateria
    } else {
      switch (this.category) {
        case 'costume': {
          Utils.titles(`${this.category}: ${this.costume}`)
          console.log("Tailor's list " + chalk.cyan(tailorList) + ' is not found \non your wardrobe ' + chalk.cyan(this.wardrobe) + '.\n')
          console.log('Costume will not be installed, operations will abort.\n')
          Utils.pressKeyToExit()
          process.exit()
          break
        }

        case 'accessory': {
          Utils.titles(`${this.category}: ${this.costume}`)
          console.log("Tailor's list " + chalk.cyan(tailorList) + ' is not found \non your wardrobe ' + chalk.cyan(this.wardrobe) + '.\n')
          console.log('vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv')
          console.log('Accessory will not be installed,')
          console.log('operations will continue.')
          console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')
          sleep(3000)
          return
        }
      }
    }


    /**
     * sequence
     */
    const sources_list = new SourcesList()
    let step = ''
    if (this.materials.sequence !== undefined) {
      step = 'analyzing sequence'
      Utils.warning(step)

      /**
       * sequence/repositories
       */
      if (this.materials.sequence.repositories !== undefined) {
        if (distro.familyId === 'debian') {
          /**
           * sequence/repositories/sources_list
           */
          // evito di fallire se sources_list non è presente
          if (this.materials.sequence.repositories.sources_list !== undefined) {
            step = 'analyzing repositories'
            Utils.warning(step)
            if (distro.distroLike === 'Debian') {
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
        }

        /**
         * sequence/repositories/update
         */
        if (this.materials.sequence.repositories.update === undefined) {
          console.log('repositiories, and repositories.update MUST be defined on sequence')
          process.exit()
        }

        step = 'repositories update'
        Utils.warning(step)
        if (this.materials.sequence.repositories.update) {
          switch (distro.familyId) {
            case 'alpine': {
              await exec('apk update', Utils.setEcho(false))
              break
            }

            case 'archlinux': {
              await exec('pacman -Sy', Utils.setEcho(false))
              break
            }

            case 'debian': {
              await exec('apt-get update', Utils.setEcho(false))
              break
            }

            case 'fedora': {
              await exec('dnf check-update --refresh', Utils.setEcho(false))
              break
            }

            case 'opensuse': {
              await exec('zypper refresh', Utils.setEcho(true))
              break
            }
          }
        }

        /**
         * sequence/repositories/upgrade
         */
        if (this.materials.sequence.repositories.upgrade !== undefined) {
          step = 'repositories upgrade'
          Utils.warning(step)
          if (this.materials.sequence.repositories.upgrade) {
            switch (distro.familyId) {
              case 'alpine': {
                await exec('apk upgrade', Utils.setEcho(false))
                break
              }

              case 'archlinux': {
                await exec('pacman -Su', Utils.setEcho(false))
                break
              }

              case 'debian': {
                await exec('apt-get full-upgrade', Utils.setEcho(false))
                break
              }

              case 'fedora': {
                await exec('dnf upgrade', Utils.setEcho(false))
                break
              }

              case 'opensuse': {
                await exec('zypper update', Utils.setEcho(true))
                break
              }
            }
          } //  upgrade true
        } // undefined upgrade
      } // end sequence/repositories

      /**
       * sequence/cmds
       */
      if (this.materials.sequence.cmds !== undefined && Array.isArray(this.materials.sequence.cmds)) {
        step = 'sequence commands'
        Utils.warning(step)
        for (const cmd of this.materials.sequence.cmds) {
          if (fs.existsSync(`${this.costume}/${cmd}`)) {
            // exec ./costume/cmd
            await exec(`${this.costume}/${cmd} `, Utils.setEcho(true))
          } else {
            // exec cmd 
            await exec(`${cmd}`, Utils.setEcho(true))
          }
        }
      }

      /**
       * install packages
       */
      if (this.materials.sequence.packages !== undefined) {
        const packages = await this.packagesExists(this.materials.sequence.packages)
        console.log(this.materials.sequence.packages)
        if (packages.length > 1) {
          switch (distro.familyId) {
            case 'alpine': {
              await this.packagesInstall(this.materials.sequence.packages, 'packages', `apk add`)
              break
            }

            case 'archlinux': {
              await this.packagesInstall(this.materials.sequence.packages, 'packages', `pacman -Sy --noconfirm`)
              break
            }

            case 'debian': {
              await this.packagesInstall(packages)
              break
            }

            case 'fedora': {
              await this.packagesInstall(this.materials.sequence.packages, 'packages', `dnf install -y`)
              break
            }

            case 'opensuse': {
              // Quanto mi è costato
              // await this.packagesInstall(this.materials.sequence.packages, 'packages', `zypper install --no-confirm`)
              await this.packagesInstall(this.materials.sequence.packages, 'packages', `zypper install --no-confirm`)
              break
            }
          }
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
        if (this.materials.sequence.accessories !== undefined && Array.isArray(this.materials.sequence.accessories)) {
          step = 'wearing accessories'
          for (const elem of this.materials.sequence.accessories) {
            if ((elem === 'firmwares' || elem === './firmwares') && no_firmwares) {
              continue
            }

            if (elem.slice(0, 2) === './') {
              // local accessory
              const tailor = new Tailor(`${this.costume}/${elem.slice(2)}`, 'accessory')
              await tailor.prepare(verbose)
            } else {
              // global accessory
              const tailor = new Tailor(`${this.wardrobe}/accessories/${elem}`, 'accessory')
              await tailor.prepare(verbose)
            }
          }
        }
      } // no-accessories
    } // end sequence

    /**
     * customize
     */
    if (this.materials.finalize !== undefined) {
      /**
       * finalize/customize
       */
      if (this.materials.finalize.customize && fs.existsSync(`/${this.costume}/sysroot`)) {
        step = `finalize/customize: copying ${this.costume}/sysroot/ to /`
        Utils.warning(step)
        let cmd = `rsync -avx  ${this.costume}/sysroot/* / ${this.toNull}`
        await exec(cmd, this.echo)

        // chown
        cmd = `chown root:root /etc/sudoers.d /etc/skel -R`
        await exec(cmd, this.echo)

        /**
         * Copyng skel in /home/user
         */
        if (fs.existsSync(`${this.costume}/sysroot/etc/skel`)) {
          const user = await Utils.getPrimaryUser()
          step = `finalize/customize: copying skel in /home/${user}/`
          Utils.warning(step)
          cmd = `rsync -avx  ${this.costume}/sysroot/etc/skel/.config /home/${user}/  ${this.toNull}`
          await exec(cmd, this.echo)
          await exec(`chown ${user}:${user} /home/${user}/ -R`)
        }
      }

      /**
       * finalize/cmds
       */
      if (this.materials.finalize.cmds !== undefined && Array.isArray(this.materials.finalize.cmds)) {
        step = 'finalize/commands'
        Utils.warning(step)

        for (const cmd of this.materials.finalize.cmds) {
          if (fs.existsSync(`${this.costume}/${cmd}`)) {
            // Qui passiamo ${this.materials.name}
            await exec(`${this.costume}/${cmd} ${this.materials.name}`, Utils.setEcho(true))
          } else {
            // exec cmd real env
            await exec(`${cmd}`, Utils.setEcho(true))
          }
        }
      }
    }


    // show log
    if (fs.existsSync(this.log)) {
      await exec(`cat ${this.log}`)
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
  async packagesExists(wanted: string[]): Promise<string[]> {
    Utils.warning(`checking packages exists ${this.costume}`)
    wanted.sort()

    const distro = new Distro()
    let cmd = ""
    if (distro.familyId === "alpine") {
      cmd = `apk search | awk -F'-[0-9]' '{print $1}' | sort -u`

    } else if (distro.familyId === "archlinux") {
      cmd = `pacman -S --list | awk '{print $2}'`

    } else if (distro.familyId === "debian") {
      // cmd=`apt-cache --no-generate pkgnames`
      cmd = `apt-cache pkgnames`

    } else if (distro.familyId === 'fedora') {
      cmd = `dnf list --available | awk '{print $1}' | sed 's/\.[^.]*$//'`

    } else if (distro.familyId === 'opensuse') { //controllare
      // questo funziona diretto
      cmd = `zypper --non-interactive packages | cut -d '|' -f 3 | sed '1,2d' | sed '/^$/d' | sort -u`
    }
    let available: string[] = []
    const result = await exec(cmd, { capture: true, echo: false, ignore: false })
    // trim di tutto per eseguire il confronto
    available = result.data.split('\n').map(line => line.trim())
    // precedente
    // available = (await exec(cmd, { capture: true, echo: false, ignore: false })).data.split('\n')
    available.sort()
    wanted.sort()
    let exists: string[] = []
    let not_exists: string[] = []
    for (const elem of wanted) {
      if (available.includes(elem)) {
        exists.push(elem)
      } else {
        not_exists.push(elem)
        fs.appendFileSync(this.log, `- ${elem}\n`)
      }
    }

    if (not_exists.length > 0) {
      console.log(`${this.materials.name}, ${not_exists.length} following packages was not found:`)
      for (const elem of not_exists) {
        console.log(`-${elem}`)
      }
      console.log()
      console.log("Wait 3 seconds")
      await sleep(3000)
    }

    return exists
  }


  /**
 * - check if every package if installed
 * - if find any packages to install, install it
 */
  async packagesInstall(packages: string[], comment = 'packages', cmd = 'apt-get install -yqq ') {
    Utils.warning(`installing existing packages ${this.costume}`)
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
        if (!this.verbose) {
          step += strElements.slice(2)
        }

        /**
         * prova 3 volte
         */
        const limit = 3
        for (let tempts = 1; tempts < limit; tempts++) {
          Utils.titles(step)
          Utils.warning(`tempts ${tempts} of ${limit}`)
          if (await this.tryCheckSuccess(cmd, this.echo)) {
            break
          }
        }
      }
    }
  }

  /**
   *
   * @param cmd
   * @param echo
   * @returns
   */
  async tryCheckSuccess(cmd: string, echo: {}): Promise<boolean> {
    let success = false
    try {
      await exec(cmd, Utils.setEcho(true))
      success = true
    } catch {
      success = false
    }

    return success
  }
}


/**
 *
 * @param ms
 * @returns
 */
function sleep(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
