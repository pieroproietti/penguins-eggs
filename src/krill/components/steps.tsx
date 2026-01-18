/**
 * ./src/components/steps.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Box, render, Text } from 'ink'
import React from 'react'


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

    switch (step) {
        case 1: {
            activeWelcome = true

            break;
        }

        case 2: {
            activeLocation = true

            break;
        }

        case 3: {
            activeKeyboard = true

            break;
        }

        case 4: {
            activePartitions = true

            break;
        }

        case 5: {
            activeUsers = true

            break;
        }

        case 6: {
            activeNetwork = true

            break;
        }

        case 7: {
            activeSummary = true

            break;
        }

        case 8: {
            activeInstall = true

            break;
        }

        case 9: {
            activeFinish = true

            break;
        }
        // No default
    }

    return (
        <>
            <Box flexDirection="column" height={9} width={13}>
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

function WelcomeTab({ active = false }): React.JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active) {
        backgroundColor = 'black'
        color = 'white'
    }

    return <Box><Text backgroundColor={backgroundColor} color={color}> Welcome    </Text></Box>
}

function LocationTab({ active = false }): React.JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active) {
        backgroundColor = 'black'
        color = 'white'
    }

    return <Box><Text backgroundColor={backgroundColor} color={color}> Location   </Text></Box>
}

function KeyboardTab({ active = false }): React.JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active) {
        backgroundColor = 'black'
        color = 'white'
    }

    return <Box><Text backgroundColor={backgroundColor} color={color}> Keyboard   </Text></Box>
}


function PartitionTab({ active = false }): React.JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active) {
        backgroundColor = 'black'
        color = 'white'
    }

    return <Box><Text backgroundColor={backgroundColor} color={color}> Partitions </Text></Box>
}

function UsersTab({ active = false }): React.JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active) {
        backgroundColor = 'black'
        color = 'white'
    }

    return <Box><Text backgroundColor={backgroundColor} color={color}> Users      </Text></Box>
}

function NetworkTab({ active = false }): React.JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active) {
        backgroundColor = 'black'
        color = 'white'
    }

    return <Box><Text backgroundColor={backgroundColor} color={color}> Network    </Text></Box>
}

function SummaryTab({ active = false }): React.JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active) {
        backgroundColor = 'black'
        color = 'white'
    }

    return <Box><Text backgroundColor={backgroundColor} color={color}> Summary    </Text></Box>
}

function InstallTab({ active = false }): React.JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active) {
        backgroundColor = 'black'
        color = 'white'
    }

    return <Box><Text backgroundColor={backgroundColor} color={color}> Install    </Text></Box>
}

function FinishTab({ active = false }): React.JSX.Element {
    let backgroundColor = 'white'
    let color = 'black'
    if (active) {
        backgroundColor = 'black'
        color = 'white'
    }

    return <Box><Text backgroundColor={backgroundColor} color={color}> Finish     </Text></Box>
}
