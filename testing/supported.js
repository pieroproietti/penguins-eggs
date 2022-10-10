#!/usr/bin/pnpx ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
start();
async function start() {
    let supporteds = [];
    const supportedsSource = fs_1.default.readFileSync('/etc/locale.gen', 'utf-8').split('\n');
    // Original Format: #en_US.UTF-8 UTF-8  
    for (let line of supportedsSource) {
        if (line.substring(0, 2) !== "# ") { // se non è un commento
            line = line.substring(1); // Rimuove #
        }
        supporteds.push(line);
    }
    console.log(supporteds);
}
