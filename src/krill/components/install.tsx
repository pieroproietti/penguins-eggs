/**
 * ./src/components/install.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import { Box, Newline, Text } from 'ink'
import Spinner from 'ink-spinner'
import yaml from 'js-yaml'
import React, { useState } from 'react'

import { IBranding, ISettings } from '../../interfaces/index.js'
import Steps from './steps.js'
import Title from './title.js'


type InstallProps = {
  message?: string,
  percent?: number,
  spinner?: boolean,
}


export default function Install({ message = "Install", percent = 0, spinner = false }: InstallProps) {
  let productName = 'unknown'
  let version = 'x.x.x'
  let configRoot = '/etc/penguins-eggs.d/krill/'
  if (fs.existsSync('/etc/calamares/settings.conf')) {
    configRoot = '/etc/calamares/'
  }

  const settings = yaml.load(fs.readFileSync(configRoot + 'settings.conf', 'utf8')) as ISettings
  const {branding} = settings

  const calamares = yaml.load(fs.readFileSync(configRoot + 'branding/' + branding + '/branding.desc', 'utf8')) as unknown as IBranding
  productName = calamares.strings.productName
  version = calamares.strings.version

  const barLen = 53
  const progress = Math.round(barLen * percent / 100)
  const todo = barLen - progress
  const clean: string = "·".repeat(todo)
  const progressBar: string = "[" + "█".repeat(progress) + clean + "] " + percent + "%"

  /**
   * totale width=75
   * step width=15
   * finestra with=59
   *                 <Text><Spinner type="simpleDotsScrolling" /></Text>
   */
  return (
    <>
      <Title />
      <Box borderStyle="round" flexDirection="column" height={11} width={75}>
        <Box flexDirection="column">
          <Box flexDirection="row">
            <Steps step={8} />
            <Box flexDirection="column">
              <Box flexDirection="row"><Text>Installing: </Text><Text color="cyan">{productName}</Text></Box>
              <Newline />
              <Box flexDirection="row">
                <Text>Step: </Text>
                <Text color="cyan">{message} </Text>
                {spinner && <Text><Spinner type="simpleDotsScrolling" /></Text>}
              </Box>
              <Newline />
              <Box><Text>{progressBar}</Text></Box>
            </Box>
          </Box>
        </Box>
      </Box >
      <Text>
      </Text>
    </>
  )
}