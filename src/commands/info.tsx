/**
 * info
 */

import { Command, flags } from '@oclif/command'
import shx from 'shelljs'
import pjson from 'pjson'
import Utils from '../classes/utils'
import React from 'react'
import { render, Text, Box } from 'ink'
import Gradient from 'ink-gradient'
import BigText from 'ink-big-text'
import Settings from '../classes/settings'
import Pacman from '../classes/pacman'
const exec = require('../lib/utils').exec
import fs from 'fs'
import yaml from 'js-yaml'
import Title from '../components/elements/title'

export default class Info extends Command {
   static description = 'thinking a different approach to CLI...'

   static flags = {
      verbose: flags.boolean({ char: 'v' }),
      help: flags.help({ char: 'h' })
   }

   async run() {
      const { args, flags } = this.parse(Info)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      const echo = Utils.setEcho(verbose)
      console.clear()

      const settings = new Settings()
      settings.load()


      /**
       * nest
       */
      const Nest = () => (
         <Box borderStyle="round" marginRight={2}>
            <Box marginRight={2}><Text>nest: <Text color="cyan">{settings.config.snapshot_dir}</Text></Text></Box>
            <Box marginRight={2}><Text>name: <Text color="cyan">{settings.config.snapshot_prefix}{settings.config.snapshot_basename}</Text></Text></Box>
            <Box marginRight={2}><Text>ovarium: <Text color="cyan">{settings.work_dir.path}</Text></Text></Box>
         </Box>
      )
      //render(<Nest />)


      /**
       * Boot
       * @returns 
       */
      const Boot = () => (
         <Box borderStyle="round" marginRight={2}>
            <Box marginRight={2}><Text>kernel: <Text color="cyan">{settings.kernel_image}</Text></Text></Box>
            <Box marginRight={2}><Text>initrd.img: <Text color="cyan">{settings.initrd_image}</Text></Text></Box>
         </Box>
      )
      render(<Boot />)

      /**
       * Live
       */
      const Live = () => (
         <Box borderStyle="round" marginRight={2}>
            <Box marginRight={2}><Text>live user/passwd: <Text color="cyan">{settings.config.user_opt}/{settings.config.user_opt_passwd}</Text></Text></Box>
            <Box marginRight={2}><Text>root passwd: <Text color="cyan">{settings.config.root_passwd}</Text></Text></Box>
         </Box>
      )
      render(<Live />)


      const distroId = shx.exec('lsb_release -is', { silent: true }).stdout.trim()
      const versionId = shx.exec('lsb_release -cs', { silent: true }).stdout.trim()
      const Distro = () => (
         <Box flexDirection='column'>
            <Box borderStyle="round" marginRight={2} flexDirection='row' >
               <Box marginRight={2}><Text>distro: <Text color="cyan">{distroId}</Text></Text></Box>
               <Box marginRight={2}><Text>version: <Text color="cyan">{versionId}</Text></Text></Box>
               <Box marginRight={2}><Text>compatible: <Text color="cyan">{settings.distro.distroLike}</Text></Text></Box>
               <Box marginRight={2}><Text>version: <Text color="cyan">{settings.distro.versionLike}</Text></Text></Box>
            </Box>
         </Box>
      )
      render(<Distro />)

      const dependencies = await Pacman.prerequisitesCheck()
      const configurations = Pacman.configurationCheck()
      let uefi = Utils.isUefi()

      let installer = false
      if (await Pacman.isGui()) {
         installer = await Pacman.calamaresCheck()
      }


      const Ok = () => (
         <Text backgroundColor="green">OK</Text>
      )
      render(<Ok />)

      const Ko = () => (
         <Text backgroundColor="red" color="white">KO</Text>
      )
      render(<Ko />)

      const Krill = () => (
         <Text backgroundColor="yellow">krill</Text>
      )
      render(<Krill />)

      const Calamares = () => (
         <Text backgroundColor="green">calamares</Text>
      )
      render(<Calamares />)


      const Checks = () => (
         <Box borderStyle="round" marginRight={2} flexDirection="row">
            <Box marginRight={2}><Text>dependencies: {dependencies ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>configurations: {configurations ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>uefi: {uefi ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>installer: {installer ? <Calamares /> : <Krill />}</Text></Box>
         </Box>
      )
      render(<Checks />)

      const Presentation = () => (
         <>
            <Box ><Text> </Text></Box>
            <Box borderStyle="round" marginRight={2} flexDirection="column">
               <Box ><Text>ISOs made with eggs can be installed with calamares GUI installer or using krill, the CLI installer inside eggs.</Text></Box>
               <Box><Text>Krill - still experimental - is an opportunity if you are scarce in RAM, or if you are working in old distros not supported by calamares.</Text></Box>
               <Box><Text>sudo eggs install will run calamares - if installed - or krill. sudo eggs install -c will force CLI installation</Text></Box>
               <Box ><Text> </Text></Box>
               <Box flexDirection="row">
                  <Box marginRight={1}><Text>Info: </Text></Box>
                  <Box flexDirection="column">
                     <Box marginRight={2}><Text>blog    </Text><Text color="cyan">https://penguins-eggs.net</Text></Box>
                     <Box marginRight={2}><Text>sources </Text><Text color="cyan">https://github.com/pieroproietti/penguins-eggs</Text></Box>
                     <Box marginRight={2}><Text>meeting </Text><Text color="cyan">https://meet.jit.si/PenguinsEggsMeeting</Text></Box>
                  </Box>
               </Box>
            </Box>
         </>
      )
      render(<Presentation />)



      /**
       * 
       */
      const Main = () => (
         <>
            <Title />
            <Box >
               <Live />
               <Nest />
               <Boot />
            </Box>
            <Box>
               <Distro />
               <Checks />
            </Box>
            <Presentation />
         </>
      )
      render(<Main />)
   }
}

