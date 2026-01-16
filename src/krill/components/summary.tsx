/**
 * ./src/components/summary.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import { Box, Newline, Text} from 'ink'
import yaml from 'js-yaml'
import React from 'react'

import { IBranding, ISettings } from '../../interfaces/index.js'
import Steps from './steps.js'
import Title from './title.js'



type SummaryProps = {

  erase?: string,
  filesystemType?: string,
  hostname?: string,
  installationDevice?: string,
  keyboardLayout?: string,
  keyboardModel?: string,
  language?: string,
  message?: string,
  password?: string,
  region?: string,
  rootPassword?: string,
  username?: string,
  zone?: string,
}

export default function Summary({ erase='', filesystemType, hostname='', installationDevice='', keyboardLayout='', keyboardModel='', language='', message='', password='', region='', rootPassword='', username='', zone=''}: SummaryProps) {

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
  return (
    <>
      <Title />
      <Box borderStyle="round" flexDirection="column" height={11} width={75}>

        <Box flexDirection="column">
          <Box flexDirection="row">
            <Steps step={7} />
            <Box flexDirection="column">
              <Box>
                <Text>Installing </Text><Text color="green">{productName}</Text>
              </Box>
              <Box>
                <Text></Text><Text color="green">{username}</Text><Text>/</Text><Text color="green">{password} </Text>
                <Text>pwd root </Text><Text color="green">{rootPassword} </Text>
                <Text>hostname </Text><Text color="green">{hostname}</Text>
              </Box>
              <Box><Text>Set timezone to </Text><Text color="green">{region}/{zone}</Text></Box>
              <Box><Text>The system language will be set to </Text><Text color="green">{language}</Text></Box>
              <Box><Text>Numbers and date locale will be set to </Text><Text color="green">{language}</Text></Box>
              <Box><Text>Set keyboard model to </Text>
                <Text color="green">{keyboardModel} </Text>
                <Text>layout </Text>
                <Text color="green">{keyboardLayout}</Text>
              </Box>
              <Box><Text>{erase}</Text></Box>
              <Box><Text backgroundColor="red"color="white">{message}</Text></Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}
