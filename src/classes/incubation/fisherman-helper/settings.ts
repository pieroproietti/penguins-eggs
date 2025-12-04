/**
 * ./src/classes/incubation/fisherman-helper/settings.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 *
 * @param theme
 * @param isClone
 */

import yaml from 'js-yaml'
import fs from 'node:fs'
import {shx} from '../../../lib/utils.js'

import { ISettings } from '../../../interfaces/i-settings.js'
import Utils from '../../utils.js'
import { installer } from '../installer.js'



interface SequenceItem {
  show?: string[];
  exec?: string[];
}

// Definisce la struttura dell'intero file di configurazione
interface CalamaresConfig {
  'modules-search': string[];
  'oem-setup': boolean;
  'disable-cancel': boolean;
  'disable-cancel-during-exec': boolean;
  'quit-at-end': boolean;
  sequence: SequenceItem[];
  branding: string;
  'prompt-install': boolean;
  'dont-chroot': boolean;
}


/**
 *
 * @param src
 * @param dest
 * @param theme
 * @param isClone
 */
export async function settings(src: string, dest: string, theme = 'eggs', isClone = false) {
  let branding = theme
  const settingsSrc = src + 'settings.yml'
  if (theme.includes('/')) {
    branding = theme.slice(Math.max(0, theme.lastIndexOf('/') + 1))
  }

  const settingsDest = dest + 'settings.conf'
  const contentSrc = fs.readFileSync(settingsSrc, "utf-8")
  const yamlDest = yaml.load(contentSrc) as CalamaresConfig

  // Trova gli elementi in modo sicuro
  const showSequenceItem = yamlDest.sequence.find(item => item.show);
  const execSequenceItem = yamlDest.sequence.find(item => item.exec);

  if (!showSequenceItem || !execSequenceItem) {
    throw new Error("Impossibile trovare le sezioni 'show' o 'exec' nel file settings.yml");
  }
  
  // Il '!' dice a TS: "sono sicuro che non è undefined"
  let showModules = showSequenceItem.show!; 
  let execModules = execSequenceItem.exec!;

  // Filtra la lista (ora con type safety)
  if (!Utils.isSystemd()) {
    execModules = execModules.filter(module => module !== 'machineid' && module !== 'services-systemd')
  }

  // if (displaymanager()) {
  //   execModules = execModules.filter(module => module !== 'displaymanager')
  // }

  if (isClone) {
    execModules = execModules.filter(module => module !== 'users')
    showModules = showModules.filter(module => module !== 'users')
  }

  // Riassegna gli array
  showSequenceItem.show = showModules
  execSequenceItem.exec = execModules
  yamlDest.branding = branding

  const contentDeest = yaml.dump(yamlDest);
  fs.writeFileSync(settingsDest, contentDeest)


  /*
  shx.cp(settingsSrc, settingsDest)
  let hasSystemd = '# '
  if (Utils.isSystemd()) {
    hasSystemd = '- '
  }

  let createUsers = '- '
  if (isClone) {
    createUsers = '# '
  }

  let hasDisplaymanager = '# '
  if (displaymanager().length > 0) {
    hasDisplaymanager = '- '
  }

  shx.sed('-i', '{{hasSystemd}}', hasSystemd, settingsDest)
  shx.sed('-i', '{{hasDisplaymanager}}', hasDisplaymanager, settingsDest)
  shx.sed('-i', '{{branding}}', branding, settingsDest)
  shx.sed('-i', '{{createUsers}}', createUsers, settingsDest)

  */
  /**
   * cfsAppend
   */
  const cfsPath = `${theme}/theme/calamares/cfs.yml`
  if (fs.existsSync(cfsPath)) {
    cfsAppend(cfsPath)
  }
}

/**
 *
 */
function cfsAppend(cfs: string) {
  const configRoot = installer().configRoot + 'settings.conf'

  const soContent = fs.readFileSync(configRoot, 'utf8')
  const so = yaml.load(soContent) as ISettings

  const cfsContent: string = fs.readFileSync(cfs, 'utf8')
  const cfsSteps = yaml.load(cfsContent) as []

  const execSteps = so.sequence[1].exec
  for (const execStep of execSteps) {
    if (execStep.includes('umount')) {
      so.sequence[1].exec.pop() // OK remove umount

      /**
       * insert cfsStep
       */
      for (const cfsStep of cfsSteps) {
        so.sequence[1].exec.push(cfsStep)
      }

      so.sequence[1].exec.push('end-cfs') // we will replace with umount
    }
  }

  // ***
  fs.writeFileSync(configRoot, yaml.dump(so), 'utf-8')
  shx.sed('-i', 'end-cfs', 'umount', configRoot)
}
