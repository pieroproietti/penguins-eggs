/**
 * plugins/decentralized/brig-publish/ipfs-config.ts
 * Configuration for IPFS-based distribution (brig, raw IPFS, etc.)
 */

import fs from 'node:fs'
import yaml from 'js-yaml'

export interface IIpfsConfig {
  enabled: boolean
  backend: 'brig' | 'raw-ipfs' | 'ipgit'
  auto_publish: boolean
  encrypt: boolean
  brig_remote: string
  pin_services: string[]
  gateway_port: number
}

const DEFAULT_CONFIG: IIpfsConfig = {
  enabled: false,
  backend: 'brig',
  auto_publish: true,
  encrypt: true,
  brig_remote: '',
  pin_services: [],
  gateway_port: 6001,
}

const CONFIG_PATH = '/etc/penguins-eggs.d/ipfs.yaml'

export function loadIpfsConfig(): IIpfsConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { ...DEFAULT_CONFIG }
  }

  const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
  const parsed = yaml.load(raw) as { ipfs?: Partial<IIpfsConfig> }
  if (!parsed?.ipfs) {
    return { ...DEFAULT_CONFIG }
  }

  return { ...DEFAULT_CONFIG, ...parsed.ipfs }
}

export function saveIpfsConfig(config: IIpfsConfig): void {
  const dir = '/etc/penguins-eggs.d'
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const content = yaml.dump({ ipfs: config }, { lineWidth: 120 })
  fs.writeFileSync(CONFIG_PATH, content, 'utf8')
}
