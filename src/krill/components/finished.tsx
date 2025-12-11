/**
 * ./src/components/finished.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React, { useState } from 'react'
import { Box, Newline, Text, Spacer } from 'ink'
import Title from './title.js'
import Steps from './steps.js'

import yaml from 'js-yaml'
import fs from 'fs'
import { ISettings, IBranding } from '../../interfaces/index.js'

type FinishedProps = {
  installationDevice?: string,
  hostName?: string,
  userName?: string,
  message?: string
}


export default function Finished({ 
                        installationDevice='', 
                        hostName='', 
                        userName='', 
                        message='Press a key to continue...'}: FinishedProps) {

  let productName = 'unknown'
  let version = 'x.x.x'
  let configRoot = '/etc/penguins-eggs.d/krill/'
  if (fs.existsSync('/etc/calamares/settings.conf')) {
      configRoot = '/etc/calamares/'
  }
  const settings = yaml.load(fs.readFileSync(configRoot + 'settings.conf', 'utf-8')) as unknown as ISettings
  const branding = settings.branding
  const calamares = yaml.load(fs.readFileSync(configRoot + 'branding/' + branding + '/branding.desc', 'utf-8')) as unknown as IBranding
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
      <Box width={75} height={11} borderStyle="round" flexDirection="column">

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
