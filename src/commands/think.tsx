/**
 * ink-text-input - Text input.
 * ink-spinner - Spinner.
 * ink-select-input - Select (dropdown) input.
 * ink-link - Link component.
 * ink-gradient - Gradient color component.
 * ink-big-text - Awesome text component.
 * ink-image - Display images inside the terminal.
 * ink-tab - Tab component.
 * ink-color-pipe - Create color text with simpler style strings in Ink.
 * ink-multi-select - Select one or more values from a list
 * ink-divider - A divider component.
 * ink-progress-bar - Configurable component for rendering progress bars.
 * ink-table - Table component.
 * ink-ascii - Awesome text component with more font choices, based on Figlet.
 * ink-markdown - Render syntax highlighted Markdown.
 * ink-quicksearch-input - Select component with fast quicksearch-like navigation.
 * ink-confirm-input - Yes/No confirmation input.
 * ink-syntax-highlight - Code syntax highlighting.
 * ink-form - Form component.
 */

import { Command, flags } from '@oclif/command'
import shx from 'shelljs'
import Utils from '../classes/utils'
import React from 'react'
import { render, Text, Box } from 'ink'
import Ascii from "ink-ascii"
import Settings from '../classes/settings'
import Pacman from '../classes/pacman'
import { prompts } from 'inquirer'
const exec = require('../lib/utils').exec


export default class Think extends Command {
   static description = 'thinking a different approach to CLI...'

   static flags = {
      verbose: flags.boolean({ char: 'v' }),
      help: flags.help({ char: 'h' })
   }

   async run() {
      const { args, flags } = this.parse(Think)

      let verbose = false
      if (flags.verbose) {
         verbose = true
      }

      const echo = Utils.setEcho(verbose)
      console.clear()
      //Utils.titles(this.id + ' ' + this.argv)

      const settings = new Settings()
      settings.load()



      /**
       * Title
       */
      const Title = () => (
         <Box>
            <Text backgroundColor="green">      {settings.app.name}      </Text>
            <Text backgroundColor="white" color="blue"> Perri's brewery edition </Text>
            <Text backgroundColor="red">       ver. {settings.app.version}       </Text>
         </Box>
      )
      render(<Title />)

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
      render(<Nest />)


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

      const Checks = () => (
         <Box borderStyle="round" marginRight={2} flexDirection="row">
            <Box marginRight={2}><Text>dependencies: {dependencies ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>configurations: {configurations ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>installer: {installer ? <Ok /> : <Ko />}</Text></Box>
         </Box>
      )
      render(<Checks />)

      const Presentation = () => (
         <>
            <Box ><Text> </Text></Box>
            <Box borderStyle="round" marginRight={2} flexDirection="column">
               <Box ><Text>This is mostly an example of what you can achieve by using react in a CLI environment.</Text></Box>
               <Box ><Text> </Text></Box>
               <Box><Text>The idea is to rewrite some parts of eggs using react to improve the interactivity and especially to allow to write a CLI installer that looks similar to a GUI installer.</Text></Box>
               <Box ><Text> </Text></Box>
               <Box ><Text>A modern CLI installer would help facilitate users with low RAM machines and would also be very versatile.</Text></Box>
               <Box ><Text> </Text></Box>
               <Text>I'm trying to use <Text color="cyan">https://github.com/vadimdemedes/ink</Text>, to build a better CLI interface. If there is someone experienced in react, and want support me would be <Text inverse>really welcome</Text>.</Text>
               <Box ><Text> </Text></Box>
               <Box flexDirection="row">
                  <Box marginRight={1}><Text>Contacts: </Text></Box>
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
            <Ascii font="Standard" text="eggs" />
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