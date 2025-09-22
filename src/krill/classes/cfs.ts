/**
 * ./src/classes/families/cfs.ts (custom final steps)
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import yaml from 'js-yaml'
import fs from 'node:fs'
import { ISettings } from '../../interfaces/i-settings.js'
import Pacman from '../../classes/pacman.js'


export default class CFS {
  /**
   * Cerca i passaggi 'cfs-' nella sequenza exec di Calamares.
   * @returns Un array di stringhe contenente i passaggi trovati.
   */
  async steps(): Promise<string[]> {
    let configRoot = '/etc/penguins-eggs.d/krill/';
    return []
    /*

    if (Pacman.calamaresExists()) { // Assumiamo che questo metodo esista
      configRoot = '/etc/calamares/';
    }
    
    const settingsPath = `${configRoot}settings.conf`;

    if (!fs.existsSync(settingsPath)) {
      return []; // Ritorna un array vuoto se il file non esiste
    }


    try {
      const settingsVar: string = fs.readFileSync(settingsPath, 'utf8');
      const settingsYaml = yaml.load(settingsVar) as ISettings;

      const execSequence = settingsYaml.sequence?.find(seq => seq.hasOwnProperty('exec'));

      if (execSequence && 'exec' in execSequence) {
        // Usa filter per un codice più pulito e sicuro
        return execSequence.exec.filter((step): step is string => 
          typeof step === 'string' && step.includes('cfs-')
        );
      }
    } catch (error) {
      console.error(`Errore durante la lettura o il parsing di ${settingsPath}:`, error);
      // In caso di errore, ritorna un array vuoto per non bloccare l'esecuzione
      return [];
    }

    return []; // Ritorna un array vuoto se il blocco 'exec' non viene trovato
    */
  }
}