import pjson from 'pjson'

import React from 'react'
import { render, Text, Box, Newline } from 'ink'
import Gradient from 'ink-gradient'


type TitleProps = {
   title?: string
}

export default function Title({ title = "krill" }) {
   return (
      // font="slick"
      <>
         <Box flexDirection="column" >
            <Box>
            </Box>
            <Box>
               <Text> E G G S: the reproductive system of penguins</Text>
            </Box>
            <Box>
               <Newline />
            </Box>
         </Box>
         <Box flexDirection="row">
            <Text backgroundColor="green">     {pjson.name}      </Text>
            <Text backgroundColor="white" color="blue"> Perri's brewery edition </Text>
            <Text backgroundColor="red">       ver. {pjson.version}       </Text>
         </Box>
      </>
   )
}
