/**
 * ./src/components/title.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Box, Newline, render, Text } from 'ink'
// pjson
import { createRequire } from 'module';
import React from 'react'

import Utils from '../../classes/utils.js';
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json')

type TitleProps = {
   title?: string
   version?: string
}

export default function Title({ title="", version=""}) : JSX.Element {
   let arch = "-"
   if (Utils.isAppImage()) {
      arch+="AppImage"
   } else switch (process.arch) {
 case "arm64": {
         arch += "arm64"
      
 break;
 }

 case "ia32": {
         arch+="i386"
      
 break;
 }

 case "riscv64": {
         arch+="riscv64"
      
 break;
 }

 case "x64": {
         arch+="x86_64"
      
 break;
 }
 // No default
 }

   if (title==="") 
      title=`${pjson.name}`

   const green = ` ${title}`.padEnd(25," ")
   const white = ` Perri's brewery edition `.padEnd(25," ")
   const red = ` v${pjson.version}${arch} `.padStart(25," ")

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