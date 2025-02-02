/**
 * ./src/components/lvmoptions.tsx
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React, { useState } from 'react'

import Title from './title.js'
import Steps from './steps.js'
import { Text, Box, Newline } from 'ink'
import { ILvmOptions } from '../interfaces/i-krill.js'

// pjson
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

type LvmOptionsProps = {
    lvmPreset?: string,
    lvmOptions: ILvmOptions
}


export default function LvmOptions({ lvmPreset, lvmOptions }: LvmOptionsProps) {

    return (
        <>
            <Title />
            <Box width={75} height={11} borderStyle="round" flexDirection="column">

                <Box flexDirection="column">
                    <Box flexDirection="row">
                        <Steps step={4} />
                        <Box flexDirection="column">
                            <Box><Text>LVM Preset: </Text><Text color='yellow'>{lvmPreset}</Text></Box>
                            <Box><Text>Volume group name: </Text><Text color='cyan'>{lvmOptions.vgName}</Text></Box>
                            <Box><Text>Logical volume root name: </Text><Text color='cyan'>{lvmOptions.lvRootName}</Text></Box>
                            <Box><Text>Logical volume root filesystem: </Text><Text color='cyan'>{lvmOptions.lvRootFSType}</Text></Box>
                            <Box><Text>Logical volume root size: </Text><Text color='cyan'>{lvmOptions.lvRootSize}</Text></Box>
                            <Box><Text>Logical volume data name: </Text><Text color='cyan'>{lvmOptions.lvDataName}</Text></Box>
                            <Box><Text>Logical volume data filesystem: </Text><Text color='cyan'>{lvmOptions.lvDataFSType}</Text></Box>
                            <Box><Text>Logical volume data mount point: </Text><Text color='cyan'>{lvmOptions.lvDataMountPoint}</Text></Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    )
}
