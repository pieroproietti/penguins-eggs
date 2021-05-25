/**
 * Welcome
 */
import React, { useState } from 'react'
import { Box, Newline, Text } from 'ink'

import pjson from 'pjson'
import Title from './elements/title'
import Steps from './elements/steps'

import yaml from 'js-yaml'
import fs from 'fs'
import { ISettings, IBranding } from '../interfaces'


type WelcomeProps = {
  language?: string,
}


export default function Welcome({ language = '' }: WelcomeProps) {
  let installer = 'krill'
  let productName = 'unknown'
  let version = 'x.x.x'
  if (fs.existsSync('/etc/calamares/settings.conf')) {
    installer = 'calamares'
  }
  const settings = yaml.load(fs.readFileSync('/etc/' + installer + '/settings.conf', 'utf-8')) as unknown as ISettings
  const branding = settings.branding
  const calamares = yaml.load(fs.readFileSync('/etc/' + installer + '/branding/' + branding + '/branding.desc', 'utf-8')) as unknown as IBranding
  productName = calamares.strings.productName
  version = calamares.strings.version

  /**
  * totale width=74
  * step width=15
  * finestra with=59
  */


  return (
    <>
      <Title title={productName} />
      <Box width={74} height={11} borderStyle="round" flexDirection="column">

        <Box flexDirection="column">
          <Box flexDirection="row">
            <Steps step={1} />
            <Box flexDirection="column">
              <Text>Welcome to {pjson.shortName} system installer</Text>
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
