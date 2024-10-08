/**
 * ./src/components/partitions.tsx
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
import { ISettings, IBranding, IPartitions } from '../interfaces/index.js'
import { render, Text, Box, Newline } from 'ink'

type partitionsProps = {
    installationDevice?: string,
    installationMode?: string,
    filesystemType?: string,
    userSwapChoice?: string
}


export default function Partitions({ installationDevice, installationMode, filesystemType, userSwapChoice }: partitionsProps) {
    let installer = 'krill'
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

    let bios = 'standard'
    if (fs.existsSync('/sys/firmware/efi/efivars')) {
        bios = 'UEFI'
    }
    let partitions = {} as IPartitions
    if (fs.existsSync(configRoot + 'modules/partition.conf')) {
        partitions = yaml.load(fs.readFileSync(configRoot + 'modules/partition.conf', 'utf-8')) as unknown as IPartitions
    } else {
        partitions.initialSwapChoice = 'small'
    }

    return (
        <>
            <Title />
            <Box width={75} height={11} borderStyle="round" flexDirection="column">

                <Box flexDirection="column">
                    <Box flexDirection="row">
                        <Steps step={4} />
                        <Box flexDirection="column">
                        </Box>
                        <Box flexDirection="column">
                        <Box flexDirection="row">
                                <Text underline={false}>Note: </Text>
                                <Box flexDirection="column">
                                    <Text backgroundColor="red" color="white">this will erase all data currently present on the</Text>
                                    <Text backgroundColor="red" color="white">installation device: {installationDevice}</Text>
                                </Box>
                            </Box>
                            <Box><Text>BIOS: </Text><Text color="cyan">{bios}</Text></Box>
                            <Box><Text>Installation device: </Text><Text color="cyan">{installationDevice}</Text></Box>
                            <Box><Text>Installation mode: </Text><Text color="cyan">{installationMode}</Text></Box>
                            <Box><Text>Filesystem: </Text><Text color="cyan">{filesystemType}</Text></Box>
                            <Box><Text>User swap choice: : </Text><Text color="cyan">{userSwapChoice}</Text></Box>
                        </Box>
                    </Box>
                </Box>
            </Box >
        </>
    )
}


