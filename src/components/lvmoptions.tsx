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
import {Text, Box, Newline } from 'ink'

// pjson
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

type LvmOptionsProps = {
  preset?: string,
  vgName?: string,
  lvRootName?: string,
  lvRootFSType?: string,
  lvRootSize?: string,
  lvDataName?: string,
  lvDataFSType?: string,
  lvDataMountPoint?: string
}


export default function LvmOptions({ preset, vgName, lvRootName, lvRootFSType, lvRootSize, lvDataName, lvDataFSType, lvDataMountPoint }: LvmOptionsProps) {

  return (
    <>
      <Title />
      <Box width={75} height={11} borderStyle="round" flexDirection="column">

        <Box width={74} height={8} flexDirection="column">
          <Box flexDirection="row">
            <Steps step={6} />
            <Box flexDirection="column">
            <Box><Text>LVM Partitions</Text></Box>
            <Box><Text>Preset: </Text><Text color='green'>{preset}</Text></Box>
            <Newline />
            <Box><Text>vgName           : </Text><Text color='green'>{vgName}</Text></Box>
            <Box><Text>lvRootName       : </Text><Text color='green'>{lvRootName}</Text></Box>
            <Box><Text>lvRootFSType     : </Text><Text color='green'>{lvRootFSType}</Text></Box>
            <Box><Text>lvRootSize       : </Text><Text color='green'>{lvRootSize}</Text></Box>
            <Box><Text>lvDataName       : </Text><Text color='green'>{lvDataName}</Text></Box>
            <Box><Text>lvDataFSType     : </Text><Text color='green'>{lvDataFSType}</Text></Box>
            <Box><Text>lvDataMountPoint : </Text><Text color='green'>{lvDataMountPoint}</Text></Box>
            </Box>
          </Box>
        </Box>
      </Box >
    </>
  )
}
