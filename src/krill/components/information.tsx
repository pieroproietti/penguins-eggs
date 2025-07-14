/**
 * ./src/components/information.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React from 'react'
import Settings from '../../classes/settings.js'
import Pacman from '../../classes/pacman.js'
import Utils from '../../classes/utils.js'
import Title from './title.js'
import { render, Text, Box } from 'ink'

export default async function information(verbose = false): Promise<void> {
    const echo = Utils.setEcho(verbose)
    console.clear()

    const settings = new Settings()
    settings.load()

    const Wait = () => (
        <Box marginRight={2}>
            <Box marginRight={2}><Text> E G G S: the reproductive system of penguins</Text></Box>
        </Box>
    )
    render (<Wait/>)
    const Nest = () => (
        <Box borderStyle="round" marginRight={2}>
            <Box marginRight={2}><Text>nest: <Text color="cyan">{settings.config.snapshot_dir}</Text></Text></Box>
            <Box marginRight={2}><Text>name: <Text color="cyan">{settings.config.snapshot_prefix}{settings.config.snapshot_basename}</Text></Text></Box>
        </Box>
    )

    const Boot = () => (
        <Box borderStyle="round" marginRight={2}>
            <Box marginRight={2}><Text>kernel: <Text color="cyan">{settings.kernel_image}</Text></Text></Box>
            <Box marginRight={2}><Text>initrd.img: <Text color="cyan">{settings.initrd_image}</Text></Text></Box>
        </Box>
    )

    const Live = () => (
        <Box borderStyle="round" marginRight={2}>
            <Box marginRight={2}><Text>live user/passwd: <Text color="cyan">{settings.config.user_opt}/{settings.config.user_opt_passwd}</Text></Text></Box>
            <Box marginRight={2}><Text>root passwd: <Text color="cyan">{settings.config.root_passwd}</Text></Text></Box>
        </Box>
    )

    /**
     * getOsRelease
     */
    const osInfo = Utils.getOsRelease()
    const codenameId = osInfo.VERSION_CODENAME
    const releaseId = osInfo.VERSION_ID
    const  distroId = osInfo.ID

    const Distro = () => (
        <Box flexDirection='column'>
            <Box borderStyle="round" marginRight={2} flexDirection='row' >
                <Box marginRight={2}><Text>distro: <Text color="cyan">{distroId} {releaseId} {codenameId}</Text></Text></Box>
                <Box marginRight={2}><Text>compatible: <Text color="cyan">{settings.distro.distroLike} {settings.distro.codenameLikeId}</Text></Text></Box>
            </Box>
        </Box>
    )

    const configurations = Pacman.configurationCheck()
    let uefi = Pacman.isUefi()

    let installer = false
    if (Pacman.isInstalledGui()) {
        installer = Pacman.calamaresExists()
    }

    const Ok = () => (
        <Text backgroundColor="green">OK</Text>
    )

    const Ko = () => (
        <Text backgroundColor="red" color="white">KO</Text>
    )

    const CLI = () => (
        <Text color="cyan">krill</Text>
    )

    const GUI = () => (
        <Text color="cyan">calamares</Text>
    )

    const Host = () => (
        <Text color="cyan">host</Text>
    )

    const Container = () => (
        <Text color="cyan">container</Text>
    )

    let initType = ''
    if (Utils.isSystemd()) {
        initType = 'systemd'
    } else if (Utils.isOpenRc()) {
        initType = 'openrc'
    } else if (Utils.isSysvinit()) {
        initType = 'sysvinit'
    } 

    const RunningOn = () => (
        <Box borderStyle="round" marginRight={2} flexDirection="row">
            <Box marginRight={2}><Text>configuration: {configurations ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>uefi: {uefi ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>running on: {Utils.isContainer() ? <Container /> : <Host />}</Text></Box>
            <Box marginRight={2}><Text>init: <Text color="cyan">{initType}</Text></Text></Box>
            <Box marginRight={2}><Text>installer: {installer ? <GUI /> : <CLI />}</Text></Box>
        </Box>
    )

    const Presentation = () => (
        <>
            <Box ><Text> </Text></Box>
            <Box borderStyle="round" marginRight={2} flexDirection="column">
                <Box ><Text color="cyan">eggs install</Text><Text> install your CLI iso with TUI installer krill, on GUI prefere calamares</Text></Box>
                <Box><Text color="cyan">eggs wardrobe</Text><Text> build your personal system starting from cli</Text></Box>
                <Box ><Text> </Text></Box>
                <Box flexDirection="row">
                    <Box marginRight={1}><Text>Info: </Text></Box>
                    <Box flexDirection="column">
                        <Box marginRight={2}><Text>blog    </Text><Text color="cyan">https://penguins-eggs.net</Text></Box>
                        <Box marginRight={2}><Text>sources </Text><Text color="cyan">https://github.com/pieroproietti/penguins-eggs</Text></Box>
                        <Box marginRight={2}><Text>wardrobe </Text><Text color="cyan">https://github.com/pieroproietti/penguins-wardrobe</Text></Box>
                    </Box>
                </Box>
            </Box>
        </>
    )


    /**
     * 
     */
    const Main = () => (
        <>
            <Title />
            <Box >
                <Live />
                <Nest />
                <Boot />
            </Box>
            <Box>
                <Distro />
                <RunningOn />
            </Box>
            <Presentation />
        </>
    )
    render(<Main />)
}


