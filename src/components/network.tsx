/**
 * Welcome
 */
import React, { useState } from 'react'
import { Box, Text } from 'ink'

import pjson from 'pjson'
import Title from './elements/title'
import Steps from './elements/steps'

import yaml from 'js-yaml'
import fs from 'fs'
import { ISettings, IBranding } from '../interfaces'
import { Interface } from 'readline'


type NetworkProps = {
  iface?: string,
  addressType?: string,
  address?: string,
  netmask?: string,
  gateway?: string,
  dns?: string,
}


export default function Network({ iface, addressType, address, netmask, gateway, dns }: NetworkProps) {
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

  const [activeField, setActiveField] = React.useState(0)
  const [submission, setSubmission] = React.useState()
  return (
    <>
      <Title title={productName} />
      <Box width={74} height={11} borderStyle="round" flexDirection="column">

        <Box width={74} height={8} flexDirection="column">
          <Box flexDirection="row">
            <Steps step={6} />
            <Box flexDirection="column">
            <Box><Text>Network interface: </Text><Text color='green'>{iface}</Text></Box>
            <Box><Text>Address type: </Text><Text color='green'>{addressType}</Text></Box>
            <Box><Text>address: </Text><Text color='green'>{address}</Text></Box>
            <Box><Text>netmask: </Text><Text color='green'>{netmask}</Text></Box>
            <Box><Text>gateway: </Text><Text color='green'>{gateway}</Text></Box>
            <Box><Text>dns: </Text><Text color='green'>{dns}</Text></Box>
            </Box>
          </Box>
        </Box>
      </Box >
    </>
  )
}
