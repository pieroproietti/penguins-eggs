/**
 * ./src/components/steps.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import React from 'react'
import { render, Text, Box } from 'ink'


type stepsPros = {
    step?: number,
}

export default function Steps({ step = 1 }: stepsPros) {

    let activeWelcome = false
    let activeLocation = false
    let activeKeyboard = false
    let activePartitions = false
    let activeUsers = false
    let activeNetwork = false
    let activeSummary = false
    let activeInstall = false
    let activeFinish = false

    if (step === 1) {
        activeWelcome = true
    } else if (step === 2) {
        activeLocation = true
    } else if (step === 3) {
        activeKeyboard = true
    } else if (step === 4) {
        activePartitions = true
    } else if (step === 5) {
        activeUsers = true
    } else if (step === 6) {
        activeNetwork = true
    } else if (step === 7) {
        activeSummary = true
    } else if (step === 8) {
        activeInstall = true
    } else if (step === 9) {
        activeFinish = true
    }

    return (
        <>
            <Box width={13} height={9} flexDirection="column">
                <WelcomeTab active={activeWelcome} />
                <LocationTab active={activeLocation} />
                <KeyboardTab active={activeKeyboard} />
                <PartitionTab active={activePartitions} />
                <UsersTab active={activeUsers} />
                <NetworkTab active={activeNetwork} />
                <SummaryTab active={activeSummary} />
                <InstallTab active={activeInstall} />
                <FinishTab active={activeFinish} />
            </Box>
        </>
    )
}


type elementType = {
    active?: boolean
}

function WelcomeTab({ active = false }): JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active){
        backgroundColor = 'black'
        color = 'white'
    }
    return <Box><Text color={color} backgroundColor={backgroundColor}> Welcome    </Text></Box>
}

function LocationTab({ active = false }): JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active){
        backgroundColor = 'black'
        color = 'white'
    }
    return <Box><Text color={color} backgroundColor={backgroundColor}> Location   </Text></Box>
}

function KeyboardTab({ active = false }): JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active){
        backgroundColor = 'black'
        color = 'white'
    }
    return <Box><Text color={color} backgroundColor={backgroundColor}> Keyboard   </Text></Box>
}


function PartitionTab({ active = false }): JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active){
        backgroundColor = 'black'
        color = 'white'
    }
    return <Box><Text color={color} backgroundColor={backgroundColor}> Partitions </Text></Box>
}

function UsersTab({ active = false }): JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active){
        backgroundColor = 'black'
        color = 'white'
    }
    return <Box><Text color={color} backgroundColor={backgroundColor}> Users      </Text></Box>
}

function NetworkTab({ active = false }): JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active){
        backgroundColor = 'black'
        color = 'white'
    }
    return <Box><Text color={color} backgroundColor={backgroundColor}> Network    </Text></Box>
}

function SummaryTab({ active = false }): JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active){
        backgroundColor = 'black'
        color = 'white'
    }
    return <Box><Text color={color} backgroundColor={backgroundColor}> Summary    </Text></Box>
}

function InstallTab({ active = false }): JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active){
        backgroundColor = 'black'
        color = 'white'
    }
    return <Box><Text color={color} backgroundColor={backgroundColor}> Install    </Text></Box>
}

function FinishTab({ active = false }): JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active){
        backgroundColor = 'black'
        color = 'white'
    }
    return <Box><Text color={color} backgroundColor={backgroundColor}> Finish     </Text></Box>
}
