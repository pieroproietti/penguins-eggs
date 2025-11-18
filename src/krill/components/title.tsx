/**
 * ./src/components/title.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React from 'react'
import { render, Text, Box, Newline } from 'ink'

// pjson
import { createRequire } from 'module';
import Utils from '../../classes/utils.js';
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json')

type TitleProps = {
   title?: string
   version?: string
}

export default function Title({ title="", version=""}) : JSX.Element {
   let type = "         "
   if (Utils.isAppImage()) {
      type="(AppImage)"
   }
   if (title==="") 
      title=`${pjson.name}`

   title = ` ${title} ${type}`.padEnd(25," ")
   let ver = ` v${pjson.version} `.padStart(25," ")
   let motto = ` Perri's brewery edition `.padEnd(25," ")

   return(
      <>
         <Box flexDirection="column" >
            <Box>
            </Box>
            <Box>
               <Text>E G G S: reproductive system of penguins</Text>
            </Box>
            <Newline/>
         </Box>
         <Box flexDirection="row">
            <Text backgroundColor="green">{title}</Text>
            <Text backgroundColor="white" color="blue">{motto}</Text>
            <Text backgroundColor="red">{ver}</Text>
         </Box>
      </>
   )
}