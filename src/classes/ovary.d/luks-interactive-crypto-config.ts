/**
 * ./src/classe/ovary.d/luks-interactive-crypto-config.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer, { Answers, DistinctQuestion } from 'inquirer'

import Ovary from '../ovary.js'
import Utils from '../utils.js'

// --- 1. CONSTANT VALUES ---
const CIPHER_OPTIONS = ['aes-xts-plain64', 'serpent-xts-plain64', 'twofish-xts-plain64'] as const
const KEY_SIZE_OPTIONS = [512, 256] as const
const HASH_OPTIONS = ['sha512', 'sha256'] as const
const SECTOR_SIZE_OPTIONS = [4096, 512] as const
const ARGON_MEMORY_OPTIONS = [524_288, 1_048_576, 2_097_152] as const
const ARGON_PARALLEL_OPTIONS = [1, 2, 4, 8] as const
const PBKDF2_ITER_TIME_OPTIONS = [2000, 5000, 10_000] as const

// --- 2. DERIVED TYPES ---
// (We keep these internal, as we only need to export the final interfaces)
type Cipher = (typeof CIPHER_OPTIONS)[number]
type KeySize = (typeof KEY_SIZE_OPTIONS)[number]
type Hash = (typeof HASH_OPTIONS)[number]
type SectorSize = (typeof SECTOR_SIZE_OPTIONS)[number]
type ArgonPbkdf = 'argon2i' | 'argon2id'
type Pbkdf2Pbkdf = 'pbkdf2'
type ArgonMemory = (typeof ARGON_MEMORY_OPTIONS)[number]
type ArgonParallel = (typeof ARGON_PARALLEL_OPTIONS)[number]
type Pbkdf2IterTime = (typeof PBKDF2_ITER_TIME_OPTIONS)[number]

// --- 3. EXPORTED CONFIGURATION INTERFACES ---
// We export these so other modules (like luks-root.ts) can use them.
export interface BaseCryptoConfig {
  cipher: Cipher
  hash: Hash
  'key-size': KeySize
  pbkdf: ArgonPbkdf | Pbkdf2Pbkdf // Added pbkdf here for the build helper
  'sector-size': SectorSize
}
export interface ArgonCryptoConfig extends BaseCryptoConfig {
  pbkdf: ArgonPbkdf
  'pbkdf-memory (KiB)': ArgonMemory
  'pbkdf-parallel (threads)': ArgonParallel
}
export interface Pbkdf2CryptoConfig extends BaseCryptoConfig {
  'iter-time (ms)': Pbkdf2IterTime
  pbkdf: Pbkdf2Pbkdf
}
export type CryptoConfig = ArgonCryptoConfig | Pbkdf2CryptoConfig

// --- 4. INTERACTIVE QUESTIONS (Internal) ---
// This array is not exported.
const questions: ReadonlyArray<DistinctQuestion> = [
  {
    choices: CIPHER_OPTIONS,
    default: 'aes-xts-plain64',
    message: 'Choose the cipher algorithm:',
    name: 'cipher',
    type: 'list'
  },
  {
    choices: KEY_SIZE_OPTIONS.map((size) => ({
      name: `${size} bits ${size === 512 ? '(Standard for AES-256/XTS)' : '(Standard for AES-128/XTS)'}`,
      value: size
    })),
    default: 512,
    message: 'Choose the key size:',
    name: 'key-size',
    type: 'list'
  },
  {
    choices: HASH_OPTIONS,
    default: 'sha256',
    message: 'Choose the hash algorithm:',
    name: 'hash',
    type: 'list'
  },
  {
    choices: SECTOR_SIZE_OPTIONS.map((size) => ({
      name: `${size} bytes ${size === 4096 ? '(Modern SSDs/NVMe)' : '(Legacy default/Loop devices'}`,
      value: size
    })),
    default: 512,
    message: 'Choose the sector size:',
    name: 'sector-size',
    type: 'list'
  },
  {
    choices: [
      { name: 'argon2id (Recommended, LUKS2 default)', value: 'argon2id' },
      { name: 'argon2i', value: 'argon2i' },
      { name: 'pbkdf2 (LUKS1 standard)', value: 'pbkdf2' }
    ],
    default: 'argon2id',
    message: 'Choose the key derivation function (PBKDF):',
    name: 'pbkdf',
    type: 'list'
  },
  {
    choices: ARGON_MEMORY_OPTIONS.map((mem) => ({
      name: `${mem / 1024 / 1024} GiB (${mem} KiB)`,
      value: mem
    })),
    default: 524_288,
    message: 'Choose the memory cost for Argon2 (KiB):',
    name: 'pbkdf-memory (KiB)',
    type: 'list',
    when: (answers: Answers) => answers.pbkdf === 'argon2id' || answers.pbkdf === 'argon2i'
  },
  {
    choices: ARGON_PARALLEL_OPTIONS.map((threads) => ({
      name: `${threads} threads`,
      value: threads
    })),
    default: 4,
    message: 'Choose parallel threads for Argon2:',
    name: 'pbkdf-parallel (threads)',
    type: 'list',
    when: (answers: Answers) => answers.pbkdf === 'argon2id' || answers.pbkdf === 'argon2i'
  },
  {
    choices: PBKDF2_ITER_TIME_OPTIONS.map((time) => ({
      name: `${time / 1000} seconds (${time} ms)`,
      value: time
    })),
    default: 2000,
    message: 'Choose the iteration time for PBKDF2 (ms):',
    name: 'iter-time (ms)',
    type: 'list',
    when: (answers: Answers) => answers.pbkdf === 'pbkdf2'
  }
]

// --- 5. EXPORTED MAIN FUNCTION ---

/**
 * Runs the interactive prompt to configure LUKS encryption settings.
 * @returns A Promise that resolves to the CryptoConfig object.
 */
export async function interactiveCryptoConfig(this: Ovary): Promise<CryptoConfig> {
  // Default luksConfig
  const defaultLuksConfig = {
    cipher: 'aes-xts-plain64',
    hash: 'sha256',
    'key-size': 512,
    pbkdf: 'argon2id',
    'pbkdf-memory (KiB)': 524_288,
    'pbkdf-parallel (threads)': 4,
    'sector-size': 512
  } as CryptoConfig

  const inquirer = (await import('inquirer')).default

  // Chiedi se usare la configurazione LUKS di default
  const useDefault = await inquirer.prompt([
    {
      default: true,
      message: `Use default LUKS configuration`,
      name: 'useDefault',
      type: 'confirm'
    }
  ])

  if (useDefault.useDefault) {
    Utils.warning(`Using default LUKS configuration`)
    return defaultLuksConfig
  }

  const answers = await inquirer.prompt(questions)

  // Use the double-cast fix to satisfy TypeScript
  const finalConfig = answers as unknown as CryptoConfig
  if (finalConfig['sector-size'] === 4096) {
    Utils.warning(`in a loop device - regardless of the hardware - the sector_size will be set to 512`)
    finalConfig['sector-size'] = 512
  }

  return finalConfig
}
