#!/usr/bin/pnpx ts-node

import fs from 'fs'


start()

async function start() {
    let supporteds: string[] = []

    const supportedsSource = fs.readFileSync('/etc/locale.gen', 'utf-8').split('\n')
    // Original Format: #en_US.UTF-8 UTF-8  
    for (let line of supportedsSource) {
        if (line.substring(0, 2) !== "# ") { // se non è un commento
            line = line.substring(1) // Rimuove #
        }
        supporteds.push(line)
    }
    console.log(supporteds)
}