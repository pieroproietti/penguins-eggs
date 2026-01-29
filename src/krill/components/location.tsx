/**
 * ./src/components/location.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import {Box, Newline, Text }from 'ink'
import yaml from 'js-yaml'
// pjson
import { createRequire } from 'module';
import React, { useState } from 'react'

import { IBranding, ISettings } from '../../interfaces/index.js'
import Steps from './steps.js'
import Title from './title.js'
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');


type LocationProps = {
    dateNumbers?: string
    language?: string,
    region?: string,
    zone?: string,
}

export default function Location({ dateNumbers = '', language = '', region = '', zone = '' }: LocationProps) {
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
                        <Steps step={2} />
                        <Box flexDirection="column">
                            <Box><Text>Select your timezone</Text></Box>
                            <Box><Text>Area: </Text><Text color="cyan">{region} </Text></Box>
                            <Box><Text>Zone: </Text><Text color="cyan">{zone}</Text></Box>
                            <Newline />
                            <Box><Text>Language: </Text><Text color="cyan">{language}</Text></Box>
                            <Box><Text>Locale date/numbers: </Text><Text color="cyan">{language}</Text></Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    )
}