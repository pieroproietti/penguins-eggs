/**
 * Location
 */

import React, { useState } from 'react'
import { render, Text, Box, Newline } from 'ink'
import Title from './elements/title.js'
import Steps from './elements/steps.js'

import yaml from 'js-yaml'
import fs from 'fs'
import { ISettings, IBranding } from '../interfaces/index.js'


type LocationProps = {
    region?: string,
    zone?: string,
    language?: string,
    dateNumbers?: string
}

export default function Location({ region = '', zone = '', language = '', dateNumbers = '' }: LocationProps) {
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
            <Title title={productName} />
            <Box width={74} height={11} borderStyle="round" flexDirection="column">

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