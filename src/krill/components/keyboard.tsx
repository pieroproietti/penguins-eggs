/**
 * ./src/components/keyboard.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React from 'react'
import Title from './title.js'
import Steps from './steps.js'
import { render, Text, Box, Newline } from 'ink'
import yaml from 'js-yaml'
import fs from 'fs'
import { ISettings, IBranding } from '../../interfaces/index.js'

// pjson
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');


type keyboardProps = {
    keyboardModel?: string,
    keyboardLayout?: string,
    keyboardVariant?: string,
    keyboardOptions?: string,
}

export default function Keyboard({ keyboardModel = '', keyboardLayout = '', keyboardVariant = '', keyboardOptions = '' }: keyboardProps) {
    let productName = ""
    let version = ""
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

    return (
        <>
            <Title />
            <Box width={75} height={11} borderStyle="round" flexDirection="column">
                <Box flexDirection="column">
                    <Box flexDirection="row">
                        <Steps step={3} />
                        <Box flexDirection="column">
                            <Box><Text>Model: </Text><Text color="cyan">{keyboardModel}</Text></Box>
                            <Box><Text>Layout: </Text><Text color="cyan">{keyboardLayout}</Text></Box>
                            <Box><Text>Variant: </Text><Text color="cyan">{keyboardVariant}</Text></Box>
                            <Box><Text>Options: </Text><Text color="cyan">{keyboardOptions}</Text></Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    )
}
