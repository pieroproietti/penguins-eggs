/**
 * penguins-eggs
 * components: users.tsx
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import React, {useState, useEffect} from 'react'
import { render, Text, Box } from 'ink'
import Title from './elements/title'
import Steps from './elements/steps'
import yaml from 'js-yaml'
import fs from 'fs'

import { ISettings, IBranding, IUser } from '../interfaces/index'

type UsersProps = {
    name: string,
    fullname: string,
    password: string,
    rootPassword: string,
    hostname: string,
    autologin: boolean,
    sameUserPassword: boolean
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
export default function Users({ name, fullname, password, rootPassword, hostname, autologin, sameUserPassword }: UsersProps) {
    let productName = 'unknown'
    let version = 'x.x.x'
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
     * totale width=74
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
            <Title title={productName} />
            <Box width={74} height={11} borderStyle="round" flexDirection="column">

                <Box flexDirection="column">
                    <Box flexDirection="row">
                        <Steps step={5} />
                        <Box flexDirection="column">
                            <Box><Text>username </Text><Text color="cyan">{name}</Text></Box>
                            <Box><Text>full username </Text><Text color="cyan">{fullname}</Text></Box>
                            <Box><Text>user password </Text><Text color="cyan">{password}</Text></Box>
                            <Box><Text>root password </Text><Text color="cyan" >{rootPassword}</Text></Box>
                            <Box><Text>hostname </Text><Text color="cyan">{hostname}</Text></Box>
                            <Box><Text> </Text><Text color="cyan">{charAutologin}</Text></Box>
                        </Box>
                    </Box>
                </Box>
            </Box >
        </>
    )
}
