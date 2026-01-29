/**
 * ./src/components/users.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import { Box, render, Text } from 'ink'
import yaml from 'js-yaml'
// pjson
import { createRequire } from 'module';
import React, {useEffect, useState} from 'react'

import Steps from './steps.js'
import Title from './title.js'
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');
import { IBranding, ISettings, IUser } from '../../interfaces/index.js'

type UsersProps = {
    autologin?: boolean,
    fullname?: string,
    hostname?: string,
    password?: string,
    rootPassword?: string,
    sameUserPassword?: boolean
    username?: string,
}


// create your forceUpdate hook
function useForceUpdate(){
    const [value, setValue] = useState(0); // integer state
    return () => setValue((value:number) => value + 1); // update the state to force render
}

/**
 * 
 * @param param0 
 * @returns 
 */
export default function Users({ autologin, fullname, hostname, password, rootPassword, sameUserPassword, username }: UsersProps) {
    let productName = 'unknown'
    let version = 'x.x.x'
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

    let charAutologin = "[x] "
    if (autologin) {
        charAutologin = "[ ]"
    }

    charAutologin = "" // Hidden

    if (sameUserPassword) {
        rootPassword = password
    }
    

    const forceUpdate = useForceUpdate();

    return (
        <>
            <Title />
            <Box borderStyle="round" flexDirection="column" height={11} width={75}>

                <Box flexDirection="column">
                    <Box flexDirection="row">
                        <Steps step={5} />
                        <Box flexDirection="column">
                            <Box><Text>fullname     : </Text><Text color="cyan">{fullname}</Text></Box>
                            <Box><Text>login        : </Text><Text color="cyan">{username}</Text></Box>
                            <Box><Text>user password: </Text><Text color="cyan">{password}</Text></Box>
                            <Box></Box>
                            <Box><Text>root password: </Text><Text color="cyan" >{rootPassword}</Text></Box>
                            <Box><Text>hostname     : </Text><Text color="cyan">{hostname}</Text></Box>
                            <Box><Text> </Text><Text color="cyan">{charAutologin}</Text></Box>
                        </Box>
                    </Box>
                </Box>
            </Box >
        </>
    )
}
