import shx from 'shelljs'
import React from 'react'
import { render, Text, Box } from 'ink'
import Settings from '../../classes/settings'
import Pacman from '../../classes/pacman'
import Utils from '../../classes/utils'
import Title from './title'

/**
 * 
 */
export default async function information(verbose = false): Promise<void> {

    const echo = Utils.setEcho(verbose)
    console.clear()

    const settings = new Settings()
    settings.load()

    /**
     * nest
     */
    const Nest = () => (
        <Box borderStyle="round" marginRight={2}>
            <Box marginRight={2}><Text>nest: <Text color="cyan">{settings.config.snapshot_dir}</Text></Text></Box>
            <Box marginRight={2}><Text>name: <Text color="cyan">{settings.config.snapshot_prefix}{settings.config.snapshot_basename}</Text></Text></Box>
            <Box marginRight={2}><Text>ovarium: <Text color="cyan">{settings.work_dir.path}</Text></Text></Box>
        </Box>
    )
    //render(<Nest />)


    /**
     * Boot
     * @returns 
     */
    const Boot = () => (
        <Box borderStyle="round" marginRight={2}>
            <Box marginRight={2}><Text>kernel: <Text color="cyan">{settings.kernel_image}</Text></Text></Box>
            <Box marginRight={2}><Text>initrd.img: <Text color="cyan">{settings.initrd_image}</Text></Text></Box>
        </Box>
    )
    render(<Boot />)

    /**
     * Live
     */
    const Live = () => (
        <Box borderStyle="round" marginRight={2}>
            <Box marginRight={2}><Text>live user/passwd: <Text color="cyan">{settings.config.user_opt}/{settings.config.user_opt_passwd}</Text></Text></Box>
            <Box marginRight={2}><Text>root passwd: <Text color="cyan">{settings.config.root_passwd}</Text></Text></Box>
        </Box>
    )
    render(<Live />)


    const distroId = shx.exec('lsb_release -is', { silent: true }).stdout.trim()
    const releaseId = shx.exec('lsb_release -rs', { silent: true }).stdout.trim()
    const codenameId = shx.exec('lsb_release -cs', { silent: true }).stdout.trim()
    const Distro = () => (
        <Box flexDirection='column'>
            <Box borderStyle="round" marginRight={2} flexDirection='row' >
                <Box marginRight={2}><Text>distro: <Text color="cyan">{distroId} {releaseId} {codenameId}</Text></Text></Box>
                <Box marginRight={2}><Text>compatible: <Text color="cyan">{settings.distro.distroLike}/{settings.distro.releaseLike}/{settings.distro.codenameLikeId}</Text></Text></Box>
            </Box>
        </Box>
    )
    render(<Distro />)

    const dependencies = await Pacman.prerequisitesCheck()
    const configurations = Pacman.configurationCheck()
    let uefi = Pacman.isUefi()

    let installer = false
    if (await Pacman.isInstalledGui()) {
        installer = await Pacman.calamaresCheck()
    }

    const Ok = () => (
        <Text backgroundColor="green">OK</Text>
    )
    render(<Ok />)

    const Ko = () => (
        <Text backgroundColor="red" color="white">KO</Text>
    )
    render(<Ko />)

    /** 
     * CLI va verde se naked, altrimenti giallo
     */

    const CLI = () => (
        <Text backgroundColor="green">CLI</Text>
    )
    render(<CLI />)

    const GUI = () => (
        <Text backgroundColor="green">GUI</Text>
    )
    render(<GUI />)


    let initType = ''
    if (Utils.isSysvinit()) {
        initType = 'sysvinit'
    }
    if (Utils.isSystemd()) {
        if (initType === 'sysvinit') {
            initType += '/'
        }
        initType = 'systemd'
    }
    const sysvinit = Utils.isSysvinit()
    const systemd = Utils.isSystemd()
    const Checks = () => (
        <Box borderStyle="round" marginRight={2} flexDirection="row">
            <Box marginRight={2}><Text>dependencies: {dependencies ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>configurations: {configurations ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>installer: {installer ? <GUI /> : <CLI />}</Text></Box>
            <Box marginRight={2}><Text>uefi: {uefi ? <Ok /> : <Ko />}</Text></Box>
            <Box marginRight={2}><Text>init: <Text color="cyan">{initType}</Text></Text></Box>
        </Box>
    )
    render(<Checks />)


    const Presentation = () => (
        <>
            <Box ><Text> </Text></Box>
            <Box borderStyle="round" marginRight={2} flexDirection="column">
                <Box ><Text>ISO images made with eggs can be installed with either the calamares GUI installer or the krill CLI installer. eggs includes krill installer inside.</Text></Box>
                <Box><Text>krill installer is an opportunity if you are low on RAM, working on old distros or on architectures not yet supported by calamares.</Text></Box>
                <Box><Text>Usage: sudo eggs install will allways run calamares if present, sudo eggs install --cli will force CLI installer.</Text></Box>
                <Box ><Text> </Text></Box>
                <Box flexDirection="row">
                    <Box marginRight={1}><Text>Info: </Text></Box>
                    <Box flexDirection="column">
                        <Box marginRight={2}><Text>blog    </Text><Text color="cyan">https://penguins-eggs.net</Text></Box>
                        <Box marginRight={2}><Text>sources </Text><Text color="cyan">https://github.com/pieroproietti/penguins-eggs</Text></Box>
                        <Box marginRight={2}><Text>meeting </Text><Text color="cyan">https://meet.jit.si/PenguinsEggsMeeting</Text></Box>
                    </Box>
                </Box>
            </Box>
        </>
    )
    render(<Presentation />)



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
                <Checks />
            </Box>
            <Presentation />
        </>
    )
    render(<Main />)
}


