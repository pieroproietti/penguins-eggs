/**
 * ./src/classes/ovary.d/luks-helpers.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import { spawn, StdioOptions } from 'node:child_process'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import { exec } from '../../lib/utils.js'

import {
  interactiveCryptoConfig,
  type CryptoConfig,
  type ArgonCryptoConfig,
  type Pbkdf2CryptoConfig
} from './luks-interactive-crypto-config.js'; // Assicurati che il percorso sia corretto

const noop = () => { };
type ConditionalLoggers = {
  log: (...args: any[]) => void;
  warning: (msg: string) => void;
  success: (msg: string) => void;
  info: (msg: string) => void;
}


/**
 * Funzione helper per eseguire comandi esterni in modo asincrono,
 * gestendo lo standard input per passare le password.
 * Restituisce una Promise che si risolve al successo o si rigetta in caso di errore.
 */
export function luksExecuteCommand(
  this: Ovary,
  command: string,
  args: string[],
  stdinData?: string): Promise<void> {

  if (!this.hidden) {
    Utils.info(`${command} ${args.join(' ')}`)
  }


  return new Promise((resolve, reject) => {
    // Se passiamo dati a stdin, dobbiamo usare 'pipe'. Altrimenti, 'inherit'.
    const stdioConfig: StdioOptions = stdinData ? ['pipe', 'inherit', 'inherit'] : 'inherit';

    const process = spawn(command, args, { stdio: stdioConfig });

    // Se fornito, scriviamo i dati (es. la password) nello stdin del processo.
    if (stdinData && process.stdin) {
      process.stdin.write(stdinData);
      process.stdin.end();
    }

    process.on('error', (err) => {
      reject(new Error(`Error starting command "${command}": ${err.message}`));
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(); // Success
      } else {
        reject(new Error(`Command "${command} ${args.join(' ')}" ended with error code ${code}`));
      }
    });
  });
}


/**
 * buildLuksFormatArgs
 */
export function buildLuksFormatArgs(
  this: Ovary,
  config: CryptoConfig, 
  luksFile: string): string[] {

  const args: string[] = [
    '--batch-mode', // Per saltare la conferma "YES"
    'luksFormat',
    '--type', 'luks2',

    // Parametri base
    '--cipher', config.cipher,
    '--key-size', config['key-size'].toString(),
    '--hash', config.hash,
    '--sector-size', config['sector-size'].toString(),
    '--pbkdf', config.pbkdf,
  ];

  // Aggiungi i parametri condizionali del PBKDF
  switch (config.pbkdf) {
    case 'argon2id':
    case 'argon2i':
      const argonConfig = config as ArgonCryptoConfig;
      args.push('--pbkdf-memory', argonConfig['pbkdf-memory (KiB)'].toString());
      args.push('--pbkdf-parallel', argonConfig['pbkdf-parallel (threads)'].toString());
      break;
    case 'pbkdf2':
      const pbkdf2Config = config as Pbkdf2CryptoConfig;
      args.push('--iter-time', pbkdf2Config['iter-time (ms)'].toString());
      break;
  }

  // Aggiungi il file di destinazione
  args.push(luksFile);
  return args;
}


