/**
 * ./src/components/install.tsx
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React, { useState } from 'react'
import yaml from 'js-yaml'
import fs from 'fs'

import { ISettings, IBranding } from '../interfaces/index.js'

import { Box, Newline, Text } from 'ink'
import Title from './title.js'
import Steps from './steps.js'


type InstallProps = {
  message?: string,
  percent?: number,
  spinner?: boolean
}


export default function Install({ message="Install", percent=0, spinner = false }: InstallProps) {
  let productName = 'unknown'
  let version = 'x.x.x'
  let configRoot = '/etc/penguins-eggs.d/krill/'
  if (fs.existsSync('/etc/calamares/settings.conf')) {
    configRoot = '/etc/calamares/'
   }

  const settings = yaml.load(fs.readFileSync(configRoot + 'settings.conf', 'utf-8')) as ISettings
  const branding = settings.branding

  const calamares = yaml.load(fs.readFileSync(configRoot + 'branding/' + branding + '/branding.desc', 'utf-8')) as unknown as IBranding
  productName = calamares.strings.productName
  version = calamares.strings.version

  let perc = Math.round(percent * 100)
  let barLen = 52
  let progress = Math.round(barLen * percent)
  let todo = barLen - progress
  let clean: string = "·".repeat(todo)
  let progressBar: string = "[" + "█".repeat(progress) + clean + "] " + perc + "%"

  /**
   * totale width=74
   * step width=15
   * finestra with=59
   */
  return (
    <>
      <Title />
      <Box width={74} height={11} borderStyle="round" flexDirection="column">
        <Box flexDirection="column">
          <Box flexDirection="row">
            <Steps step={8} />
            <Box flexDirection="column">
              <Box flexDirection="row"><Text>Installing: </Text><Text color="cyan">{productName}</Text></Box>
              <Newline />
              <Box flexDirection="row"><Text>Step: </Text><Text color="cyan">{message}</Text></Box>
              <Newline/>
              <Box><Text>Progress:</Text></Box>
              <Box><Text>{progressBar}</Text></Box>
            </Box>
          </Box>
        </Box>
      </Box >
    </>
  )
}
