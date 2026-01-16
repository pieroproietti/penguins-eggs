// src/classes/constants.ts
import path from 'node:path'
export class Constants {
  /**
   * 🐙 CALAMARES: La directory di configurazione dell'installer GUI
   */
  static readonly CALAMARES_DIR = 'etc/calamares' // Relativo quando siamo in chroot
  /**
   * ⚙️ CONFIG_DIR: La cartella principale di configurazione
   * Solitamente: /etc/penguins-eggs.d
   */
  static readonly CONFIG_DIR = '/etc/penguins-eggs.d'
  /**
   * 🚫 EXCLUDE LISTS DIRECTORY
   * Dove si trovano i partials (homes.list, var.list, etc)
   */
  static readonly EXCLUDES_DIR = path.join(Constants.CONFIG_DIR, 'exclude.list.d')
  /**
   * 📄 FILE DI CONFIGURAZIONE
   */
  static readonly FILES = {
    // Configurazioni derivate
    DERIVATIVES: path.join(Constants.CONFIG_DIR, 'derivatives.yaml'),

    // File di esclusione principale
    EXCLUDE_LIST: path.join(Constants.CONFIG_DIR, 'exclude.list'),

    // Configurazione installer TUI (Krill)
    KRILL: path.join(Constants.CONFIG_DIR, 'krill.yaml'),
    // Configurazione principale (eggs.yaml)
    MAIN: path.join(Constants.CONFIG_DIR, 'eggs.yaml')
  }
  /**
   * 📜 LOG_DIR: Dove scriviamo i log
   */
  static readonly LOG_DIR = '/var/log/penguins-eggs'
  /**
   * 🏠 NEST: Il nido dove avviene la magia (Work Directory)
   * Solitamente: /home/eggs
   */
  static readonly NEST = '/home/eggs'

  /**
   * Helper per ottenere il path completo di una lista di esclusione specifica
   */
  static getExcludePath(filename: string): string {
    return path.join(this.EXCLUDES_DIR, filename)
  }
}
