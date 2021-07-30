/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Prepare from '../classes/krill_prepare'
import Pacman from '../classes/pacman'
import fs from 'fs'
import { execSync } from 'child_process'

/**
 * Class Install
 */
export default class Install extends Command {
   static flags = {
      cli: flags.boolean({ char: 'c', description: 'force use CLI installer' }),
      mx: flags.boolean({ char: 'm', description: 'to use mx-installer' }),
      help: flags.help({ char: 'h' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }
   static description = 'command-line system installer - the egg became a penguin!'

   static aliases = ['hatch', 'krill']

   static examples = [`$ eggs install\nInstall the system using GUI or CLI installer\n`]

   /**
    * Execute
    */
   async run() {
      Utils.titles(this.id + ' ' + this.argv)

      const { flags } = this.parse(Install)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      if (Utils.isRoot(this.id)) {
         if (Utils.isLive()) {
            /**
            * MX-21_beta1_x64 Wildflower July 27, 2021
            * 
            * ln -s /lib/live/mount/rootfs/filesystem.squashfs/ /live/aufs
            * ln -s /lib/live/mount/rootfs/filesystem.squashfs/ /live/linux
           */
            if (Pacman.packageIsInstalled('mx-installer') && Pacman.guiEnabled() && !flags.mx) {
               if (!fs.existsSync('/live/')) {
                  execSync('mkdir /live/ ')
               }
               if (!fs.existsSync('/live/aufs')) {
                  execSync('ln -s /lib/live/mount/rootfs/filesystem.squashfs/ /live/aufs')
               }
               if (!fs.existsSync('/live/linux')) {
                  execSync('ln -s /lib/live/mount/rootfs/filesystem.squashfs/ /live/linux')
               }
               execSync('minstall')
            } else {
               if (Pacman.packageIsInstalled('calamares') && Pacman.guiEnabled() && !flags.cli) {
                  execSync('calamares')
               } else {
                  const krill = new Prepare()
                  await krill.prepare()
               }
            }
         } else {
            Utils.warning(`You are in an installed system!`)
         }
      }
   }
}

