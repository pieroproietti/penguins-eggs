import pjson from 'pjson'

import React from 'react'
import { render, Text, Box } from 'ink'
import Gradient from 'ink-gradient'
import BigText from 'ink-big-text'


type TitleProps = {
   title?: string
}

export default function Title({ title = "krill" }) {
   return (
      // font="slick"
      <>
         <Box flexDirection="row">
            <Box>
               <Gradient name="fruit">
                  <BigText text={pjson.shortName} font="simple"/>
               </Gradient>
            </Box>

            <Box margin={0} justifyContent="center" flexDirection="column">
               <Box >
                  <Text>The penguin's reproductive system</Text>
                  </Box>
               <Box>
                  <Text> </Text>
               </Box>
               <Box>
                  <Text>  (C) 2020-2021 Piero Proietti</Text>
               </Box>
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
