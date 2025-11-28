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
   let type = ""
   if (!Utils.isAppImage()) {
      type="Native"
   }
   if (title==="") 
      title=`${pjson.name}`

   let green = ` ${title}`.padEnd(25," ")
   let white = ` Perri's brewery edition `.padEnd(25," ")
   let red = ` v${pjson.version} ${type} `.padStart(25," ")

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
            <Text backgroundColor="green">{green}</Text>
            <Text backgroundColor="white" color="blue">{white}</Text>
            <Text backgroundColor="red">{red}</Text>
         </Box>
      </>
   )
}