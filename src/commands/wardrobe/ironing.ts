import { Command, Flags } from '@oclif/core'
import Utils from '../../classes/utils'
import path from 'path'
import yaml from 'js-yaml'
import fs from 'fs'
import { ICostume, IMateria } from '../../interfaces'


export class Ironing extends Command {
  static description = 'ordered show of costumes or accessories in wardrobe'

  static args = [{ name: 'costume', description: 'costume to iron', required: false }]

  static flags = {
    wardrobe: Flags.string({ char: 'w', description: 'wardrobe' }),
    verbose: Flags.boolean({ char: 'v' }),
    help: Flags.help({ char: 'h' })
  }

  async run() {
    const { args, flags } = await this.parse(Ironing)
    Utils.titles(this.id + ' ' + this.argv)

    let verbose = false
    if (flags.verbose) {
      verbose = true
    }
    const echo = Utils.setEcho(verbose)

    let wardrobe = await Utils.wardrobe()
    if (flags.wardrobe !== undefined) {
      wardrobe = flags.wardrobe
    }
    if (!wardrobe.endsWith('/')) {
      wardrobe += '/'
    }
    wardrobe = `${path.resolve(process.cwd(), wardrobe)}/`

    if (!fs.existsSync(wardrobe)) {
      Utils.warning(`wardrobe: ${wardrobe} not found!`)
      process.exit()
    }

    /**
     * costume
     */
     let costume = wardrobe + this.argv[0]
     if (costume===undefined) {
       costume = 'colibri'
     }
 

    /**
     * tailorList
     */
     let tailorList = `${costume}/index.yml`
     if (!fs.existsSync(tailorList)) {
       Utils.warning(`index.yml not found in : ${costume}!`)
       process.exit()
     }
 
    const orig = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as IMateria
    let sorted: IMateria = orig

    sorted.name = orig.name
    sorted.description = orig.description
    sorted.author = orig.author
    sorted.release = orig.release
    sorted.distributions = orig.distributions.sort()

    if (orig.sequence !== undefined) {
      if (orig.sequence.repositories !== undefined) {
        sorted.sequence.repositories = orig.sequence.repositories

        if (orig.sequence.repositories.sources_list !== undefined) {
          sorted.sequence.repositories.sources_list = orig.sequence.repositories.sources_list
        }

        if (orig.sequence.repositories.sources_list_d !== undefined) {
          sorted.sequence.repositories.sources_list_d = orig.sequence.repositories.sources_list_d
        }
        sorted.sequence.repositories.update = orig.sequence.repositories.update
        sorted.sequence.repositories.upgrade = orig.sequence.repositories.upgrade
      }

      if (orig.sequence.preinst !== undefined) {
        sorted.sequence.preinst = orig.sequence.preinst
      }


      if (orig.sequence.packages !== undefined) {
        if (Array.isArray(orig.sequence.packages)) {
          sorted.sequence.packages = orig.sequence.packages.sort()
        }
      }

      if (orig.sequence.packages_no_install_recommends !== undefined) {
        if (Array.isArray(orig.sequence.packages_no_install_recommends)) {
          sorted.sequence.packages_no_install_recommends = orig.sequence.packages_no_install_recommends.sort()
        }
      }

      if (orig.sequence.debs !== undefined) {
        sorted.sequence.debs = orig.sequence.debs
      }

      if (orig.sequence.packages_python !== undefined) {
        if (Array.isArray(orig.sequence.packages_python)) {
          sorted.sequence.packages_python = orig.sequence.packages_python.sort()
        }
      }


      if (orig.sequence.accessories !== undefined) {
        if (Array.isArray(orig.sequence.accessories)) {
          sorted.sequence.accessories = orig.sequence.accessories.sort()
        }

      }
    }

    if (orig.customize !== undefined) {
      sorted.customize = orig.customize
      if (orig.customize.dirs !== undefined) {
        sorted.customize.dirs = orig.customize.dirs
      }

      if (orig.customize.hostname !== undefined) {
        sorted.customize.hostname = orig.customize.hostname
      }

      if (orig.customize.scripts !== undefined) {
        orig.customize.scripts = orig.customize.scripts
      }
    }


    if (orig.reboot !== undefined) {
      sorted.reboot = orig.reboot
    }

    const ironed = `# costume: ${costume}\n---\n` + yaml.dump(sorted)
    console.log(ironed)

    // Well be usefull to have scrolling
    // Set scrolling margins back to default.
    // await exec(`printf '\e[;r'`)
  }

}
