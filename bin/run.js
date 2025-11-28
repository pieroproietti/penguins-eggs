#!/usr/bin/env node

import {execute} from '@oclif/core'

if (process.env.APPIMAGE && process.env.APPIMAGE.endsWith('.AppImage')) {
  // process.argv contiene [node_path, script_path, ...argomenti_utente]
  // Se la lunghezza è 2, significa che non ci sono argomenti utente.
  if (process.argv.length === 2) {
    console.log('AppImage launched without arguments: launching setup install...');
    // We inject commands for Oclif
    process.argv.push('setup');
    process.argv.push('install');
  }
}

await execute({dir: import.meta.url})
