/**
 * ./src/components/finished.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import { Box, Newline, Spacer, Text } from 'ink'
import yaml from 'js-yaml'
import React, { useState } from 'react'

import { IBranding, ISettings } from '../../interfaces/index.js'
import Steps from './steps.js'
import Title from './title.js'

type FinishedProps = {
  hostName?: string,
  installationDevice?: string,
  message?: string
  userName?: string,
}


export default function Finished({ 
                        hostName='', 
                        installationDevice='', 
                        message='Press a key to continue...', 
                        userName=''}: FinishedProps) {

  let productName = 'unknown'
  let version = 'x.x.x'
  let configRoot = '/etc/penguins-eggs.d/krill/'
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

  const [activeField, setActiveField] = React.useState(0)
  const [submission, setSubmission] = React.useState()
  return (
    <>
      <Title />
      <Box borderStyle="round" flexDirection="column" height={11} width={75}>

        <Box flexDirection="column">
          <Box flexDirection="row">
            <Steps step={9} />
            <Box flexDirection="column">
              <Box><Text backgroundColor="white" color='black'>Installation is finished!</Text></Box>
              <Newline/>
              <Box><Text>Your system was installed on </Text><Text color="green">{installationDevice}</Text></Box>
              <Box><Text>Host name was set as </Text><Text color="green">{hostName}</Text></Box>
              <Box><Text>The user name is </Text><Text color="green">{userName}</Text></Box>
              <Newline/>
              <Box><Spacer/><Text backgroundColor="white" color="black">{message}</Text></Box>
            </Box>
          </Box>
        </Box>
      </Box >
    </>
  )
}
