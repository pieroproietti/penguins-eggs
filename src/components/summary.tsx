/**
 * Welcome
 */
import React from 'react'
import { Box, Text } from 'ink'

import Title from './elements/title'
import Steps from './elements/steps'

import yaml from 'js-yaml'
import fs from 'fs'
import { ISettings, IBranding } from '../interfaces'


type SummaryProps = {
  // From welcome
  language: string,
  // From location
  region: string,
  zone: string,
  // dateNumbers: string,
  // from keyboard
  keyboardModel: string,
  keyboardLayout: string,
  //keyboardVariant: string,
  //keyboardOptions: string,
  //  from partitions
  installationDevice: string,
  // filesystemType: string,
  // userSwapChoice: string,
  // from users
  // name: string,
  // fullname: string,
  // password: string,
  // rootPassword: string,
  // hostname: string,
  // autologin: boolean,
  // sameUserPassword: boolean,
}


export default function Summary({ region, zone, language, keyboardModel, keyboardLayout, installationDevice }: SummaryProps) {
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
            <Steps step={7} />
            <Box flexDirection="column">
              <Box><Text>Set timezone to </Text><Text color="green">{region}/{zone}</Text></Box>
              <Box><Text>The system language will be set to </Text><Text color="green">{language}</Text></Box>
              <Box><Text>The numbers and date locale will be set to </Text><Text color="green">{language}</Text></Box>
              <Box><Text>Set keyboard model to </Text><Text color="green">{keyboardModel}</Text></Box>
              <Box><Text>Set keyboard layout to </Text><Text color="green">{keyboardLayout}</Text></Box>
              <Box><Text bold={true}>Erase disk </Text><Text color="green">{installationDevice}</Text><Text>, install </Text><Text color="green">{productName}</Text></Box>
            </Box>
          </Box>
        </Box>
      </Box >
    </>
  )
}
