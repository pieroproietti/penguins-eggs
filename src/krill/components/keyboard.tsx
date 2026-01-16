/**
 * ./src/components/keyboard.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import { Box, Newline, render, Text } from 'ink'
import yaml from 'js-yaml'
// pjson
import { createRequire } from 'module';
import React from 'react'

import { IBranding, ISettings } from '../../interfaces/index.js'
import Steps from './steps.js'
import Title from './title.js'
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');


type keyboardProps = {
    keyboardLayout?: string,
    keyboardModel?: string,
    keyboardOptions?: string,
    keyboardVariant?: string,
}

export default function Keyboard({ keyboardLayout = '', keyboardModel = '', keyboardOptions = '', keyboardVariant = '' }: keyboardProps) {
    let productName = ""
    let version = ""
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
