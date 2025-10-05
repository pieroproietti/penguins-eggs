/**
 * ./src/components/install.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React, { useState } from 'react'
import Spinner from 'ink-spinner'

import yaml from 'js-yaml'
import fs from 'fs'

import { ISettings, IBranding } from '../../interfaces/index.js'

import { Box, Newline, Text } from 'ink'
import Title from './title.js'
import Steps from './steps.js'


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

  const settings = yaml.load(fs.readFileSync(configRoot + 'settings.conf', 'utf-8')) as ISettings
  const branding = settings.branding

  const calamares = yaml.load(fs.readFileSync(configRoot + 'branding/' + branding + '/branding.desc', 'utf-8')) as unknown as IBranding
  productName = calamares.string_product_name
  version = calamares.string_product_version

  let barLen = 53
  let progress = Math.round(barLen * percent / 100)
  let todo = barLen - progress
  let clean: string = "·".repeat(todo)
  let progressBar: string = "[" + "█".repeat(progress) + clean + "] " + percent + "%"

  /**
   * totale width=75
   * step width=15
   * finestra with=59
   *                 <Text><Spinner type="simpleDotsScrolling" /></Text>
   */
  return (
    <>
      <Title />
      <Box width={75} height={11} borderStyle="round" flexDirection="column">
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