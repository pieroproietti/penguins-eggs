/**
 * ./src/components/welcome.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React, { useState } from 'react'

import Title from './title.js'
import Steps from './steps.js'

import yaml from 'js-yaml';
import fs from 'fs';

import { ISettings, IBranding } from '../../interfaces/index.js';
import { Box, Newline, Text } from 'ink';

// pjson
import { createRequire } from 'module';
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

  const settings = yaml.load(fs.readFileSync(configRoot + 'settings.conf', 'utf-8')) as unknown as ISettings
  const branding = settings.branding
  const calamares = yaml.load(fs.readFileSync(configRoot + 'branding/' + branding + '/branding.desc', 'utf-8')) as unknown as IBranding
  productName = calamares.string_product_name
  version = calamares.string_product_version

  /**
  * totale width=75
  * step width=15
  * finestra with=59
  */


  return (
    <>
      <Title />
      <Box width={75} height={11} borderStyle="round" flexDirection="column">

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
