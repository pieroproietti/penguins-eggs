/**
 * ./src/components/network.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React, { useState } from 'react'

import Title from './title.js'
import Steps from './steps.js'
import {Text, Box, Newline } from 'ink'

import yaml from 'js-yaml'
import fs from 'fs'
import { ISettings, IBranding } from '../../interfaces/index.js'

// pjson
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');

type NetworkProps = {
  iface?: string,
  addressType?: string,
  address?: string,
  netmask?: string,
  gateway?: string,
  domain?: string
  dns?: string,
}


export default function Network({ iface, addressType, address, netmask, gateway, domain, dns }: NetworkProps) {

  let productName = ''
  let version = ''
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

        <Box width={74} height={8} flexDirection="column">
          <Box flexDirection="row">
            <Steps step={6} />
            <Box flexDirection="column">
            <Box><Text>interface: </Text><Text color='green'>{iface}</Text></Box>
            <Box><Text>type     : </Text><Text color='green'>{addressType}</Text></Box>
            <Box><Text>address  : </Text><Text color='green'>{address}</Text></Box>
            <Box><Text>netmask  : </Text><Text color='green'>{netmask}</Text></Box>
            <Box><Text>gateway  : </Text><Text color='green'>{gateway}</Text></Box>
            <Box><Text>domain   : </Text><Text color='green'>{domain}</Text></Box>
            <Box><Text>dns      : </Text><Text color='green'>{dns}</Text></Box>
            </Box>
          </Box>
        </Box>
      </Box >
    </>
  )
}
