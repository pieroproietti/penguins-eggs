/**
 * ./src/components/summary.tsx
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React from 'react'
import Title from './title.js'
import Steps from './steps.js'

import yaml from 'js-yaml'
import fs from 'fs'
import { ISettings, IBranding } from '../interfaces/index.js'
import { Text, Box } from 'ink'


type SummaryProps = {

  language?: string,
  region?: string,
  zone?: string,
  // dateNumbers: string,
  // from keyboard
  keyboardModel?: string,
  keyboardLayout?: string,
  //keyboardVariant: string,
  //keyboardOptions: string,
  installationDevice?: string,
  filesystemType?: string,
  // filesystemType: string,
  // userSwapChoice: string,
  username?: string,
  // fullname: string,
  password?: string,
  rootPassword?: string,
  hostname?: string,
  // autologin: boolean,
  // sameUserPassword: boolean,

  message?: string
}

export default function Summary({ username='', password='', rootPassword='', hostname='', region='', zone='', language='', keyboardModel='', keyboardLayout='', installationDevice='', filesystemType, message=''}: SummaryProps) {

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
              <Box>
                <Text bold={true}>Erase disk </Text>
                <Text>{installationDevice} formatting: {filesystemType}</Text>
              </Box>
              <Box><Text color="red">{message}</Text></Box>
            </Box>
          </Box>
        </Box>
      </Box >
    </>
  )
}
