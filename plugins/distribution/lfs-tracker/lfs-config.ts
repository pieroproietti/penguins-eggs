/**
 * plugins/distribution/lfs-tracker/lfs-config.ts
 * Configuration interface and loader for git-lfs integration.
 */

import fs from 'node:fs'
import yaml from 'js-yaml'

export interface ILfsConfig {
  enabled: boolean
  remote: string
  server: string
  auto_push: boolean
  track_patterns: string[]
}

const DEFAULT_CONFIG: ILfsConfig = {
  enabled: false,
  remote: 'origin',
  server: '',
  auto_push: true,
  track_patterns: ['*.iso', '*.img'],
}

const CONFIG_PATH = '/etc/penguins-eggs.d/lfs.yaml'

export function loadLfsConfig(): ILfsConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { ...DEFAULT_CONFIG }
  }

  const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
  const parsed = yaml.load(raw) as { lfs?: Partial<ILfsConfig> }
  if (!parsed?.lfs) {
    return { ...DEFAULT_CONFIG }
  }

  return { ...DEFAULT_CONFIG, ...parsed.lfs }
}

export function saveLfsConfig(config: ILfsConfig): void {
  const dir = '/etc/penguins-eggs.d'
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const content = yaml.dump({ lfs: config }, { lineWidth: 120 })
  fs.writeFileSync(CONFIG_PATH, content, 'utf8')
}
