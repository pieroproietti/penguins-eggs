/**
 * ./src/classe/ovary.d/luks-interactive-crypto-config.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import Ovary from '../ovary.js'
import Utils from '../utils.js'
import inquirer, { Answers, DistinctQuestion } from 'inquirer';

// --- 1. CONSTANT VALUES ---
const CIPHER_OPTIONS = [
  "aes-xts-plain64",
  "serpent-xts-plain64",
  "twofish-xts-plain64",
] as const;
const KEY_SIZE_OPTIONS = [512, 256] as const;
const HASH_OPTIONS = ["sha512", "sha256"] as const;
const SECTOR_SIZE_OPTIONS = [4096, 512] as const;
const ARGON_MEMORY_OPTIONS = [524288, 1048576, 2097152] as const;
const ARGON_PARALLEL_OPTIONS = [1, 2, 4, 8] as const;
const PBKDF2_ITER_TIME_OPTIONS = [2000, 5000, 10000] as const;


// --- 2. DERIVED TYPES ---
// (We keep these internal, as we only need to export the final interfaces)
type Cipher = typeof CIPHER_OPTIONS[number];
type KeySize = typeof KEY_SIZE_OPTIONS[number];
type Hash = typeof HASH_OPTIONS[number];
type SectorSize = typeof SECTOR_SIZE_OPTIONS[number];
type ArgonPbkdf = "argon2id" | "argon2i";
type Pbkdf2Pbkdf = "pbkdf2";
type ArgonMemory = typeof ARGON_MEMORY_OPTIONS[number];
type ArgonParallel = typeof ARGON_PARALLEL_OPTIONS[number];
type Pbkdf2IterTime = typeof PBKDF2_ITER_TIME_OPTIONS[number];


// --- 3. EXPORTED CONFIGURATION INTERFACES ---
// We export these so other modules (like luks-root.ts) can use them.
export interface BaseCryptoConfig {
  cipher: Cipher;
  'key-size': KeySize;
  hash: Hash;
  'sector-size': SectorSize;
  pbkdf: ArgonPbkdf | Pbkdf2Pbkdf; // Added pbkdf here for the build helper
}
export interface ArgonCryptoConfig extends BaseCryptoConfig {
  pbkdf: ArgonPbkdf;
  'pbkdf-memory (KiB)': ArgonMemory;
  'pbkdf-parallel (threads)': ArgonParallel;
}
export interface Pbkdf2CryptoConfig extends BaseCryptoConfig {
  pbkdf: Pbkdf2Pbkdf;
  'iter-time (ms)': Pbkdf2IterTime;
}
export type CryptoConfig = ArgonCryptoConfig | Pbkdf2CryptoConfig;


// --- 4. INTERACTIVE QUESTIONS (Internal) ---
// This array is not exported.
const questions: ReadonlyArray<DistinctQuestion> = [
  {
    type: 'list',
    name: 'cipher',
    message: 'Choose the cipher algorithm:',
    choices: CIPHER_OPTIONS,
    default: 'aes-xts-plain64',
  },
  {
    type: 'list',
    name: 'key-size',
    message: 'Choose the key size:',
    choices: KEY_SIZE_OPTIONS.map(size => ({
      name: `${size} bits ${size === 512 ? '(Standard for AES-256/XTS)' : '(Standard for AES-128/XTS)'}`,
      value: size,
    })),
    default: 512,
  },
  {
    type: 'list',
    name: 'hash',
    message: 'Choose the hash algorithm:',
    choices: HASH_OPTIONS,
    default: 'sha256',
  },
  {
    type: 'list',
    name: 'sector-size',
    message: 'Choose the sector size:',
    choices: SECTOR_SIZE_OPTIONS.map(size => ({
        name: `${size} bytes ${size === 4096 ? '(Modern SSDs/NVMe)' : '(Legacy default)'}`,
        value: size,
    })),
    default: 512,
  },
  {
    type: 'list',
    name: 'pbkdf',
    message: 'Choose the key derivation function (PBKDF):',
    choices: [ 
      { name: 'argon2id (Recommended, LUKS2 default)', value: 'argon2id' },
      { name: 'argon2i', value: 'argon2i' },
      { name: 'pbkdf2 (LUKS1 standard)', value: 'pbkdf2' },
    ],
    default: 'argon2id',
  },
  {
    type: 'list',
    name: 'pbkdf-memory (KiB)',
    message: 'Choose the memory cost for Argon2 (KiB):',
    choices: ARGON_MEMORY_OPTIONS.map(mem => ({
        name: `${mem / 1024 / 1024} GiB (${mem} KiB)`,
        value: mem,
    })),
    default: 524288,
    when: (answers: Answers) => 
      answers.pbkdf === 'argon2id' || answers.pbkdf === 'argon2i',
  },
  {
    type: 'list',
    name: 'pbkdf-parallel (threads)',
    message: 'Choose parallel threads for Argon2:',
    choices: ARGON_PARALLEL_OPTIONS.map(threads => ({
        name: `${threads} threads`,
        value: threads,
    })),
    default: 4,
    when: (answers: Answers) =>
      answers.pbkdf === 'argon2id' || answers.pbkdf === 'argon2i',
  },
  {
    type: 'list',
    name: 'iter-time (ms)',
    message: 'Choose the iteration time for PBKDF2 (ms):',
    choices: PBKDF2_ITER_TIME_OPTIONS.map(time => ({
        name: `${time / 1000} seconds (${time} ms)`,
        value: time,
    })),
    default: 2000,
    when: (answers: Answers) => answers.pbkdf === 'pbkdf2',
  },
];


// --- 5. EXPORTED MAIN FUNCTION ---

/**
 * Runs the interactive prompt to configure LUKS encryption settings.
 * @returns A Promise that resolves to the CryptoConfig object.
 */
export async function interactiveCryptoConfig(this: Ovary): Promise<CryptoConfig> {
  // Default luksConfig
  const defaultLuksConfig = {
      'cipher': 'aes-xts-plain64',
      'key-size': 512,
      'hash': 'sha256',
      'sector-size': 512,
      'pbkdf': 'argon2id',
      'pbkdf-memory (KiB)': 524288,
      'pbkdf-parallel (threads)': 4
  } as CryptoConfig;

  const inquirer = (await import('inquirer')).default

  // Chiedi se usare la configurazione LUKS di default
  const useDefault = await inquirer.prompt([{
    type: 'confirm',
    name: 'useDefault',
    message: `Use default LUKS configuration`,
    default: true
  }])

  if (useDefault.useDefault) {
    Utils.warning(`Using default LUKS configuration`)
    return defaultLuksConfig
  }

  const answers = await inquirer.prompt(questions);

  // Use the double-cast fix to satisfy TypeScript
  const finalConfig = answers as unknown as CryptoConfig;

  return finalConfig;
}