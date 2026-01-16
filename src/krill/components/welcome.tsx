/**
 * ./src/components/welcome.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs';
import { Box, Newline, Text } from 'ink';
import yaml from 'js-yaml';
// pjson
import { createRequire } from 'module';
import React, { useState } from 'react'

import { IBranding, ISettings } from '../../interfaces/index.js';
import Steps from './steps.js'
import Title from './title.js'
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');



type WelcomeProps = {
  language?: string,
}


export default function Welcome({ language = '' }: WelcomeProps) {
  let productName = 'unknown'
  let configRoot = '/etc/penguins-eggs.d/krill/'
  let version = 'unknown'
  if (fs.existsSync('/etc/calamares/settings.conf')) {
    configRoot = '/etc/calamares/'
  }

  const settings = yaml.load(fs.readFileSync(configRoot + 'settings.conf', 'utf8')) as unknown as ISettings
  const {branding} = settings
  const calamares = yaml.load(fs.readFileSync(configRoot + 'branding/' + branding + '/branding.desc', 'utf8')) as unknown as IBranding
  productName = calamares.strings.productName
  version = calamares.strings.version


  /**
   * totale width=75
   * step width=15
   * finestra with=59
   */


  return (
    <>
      <Title />
      <Box borderStyle="round" flexDirection="column" height={11} width={75}>

        <Box flexDirection="column">
          <Box flexDirection="row">
            <Steps step={1} />
            <Box flexDirection="column">
              <Text>Welcome to {pjson.name} system installer</Text>
              <Newline />
              <Text>We are installing </Text>
              <Box>
                <Text>Linux </Text>
                <Text color="cyan">{productName} </Text>
                <Text>version </Text>
                <Text color="cyan">{version}</Text>
                <Text> on </Text>
                <Text color="cyan">{process.arch}</Text>
              </Box>
              <Box flexDirection="column">
                <Newline />
                <Text>Language: {language} </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box >
    </>
  )
}
