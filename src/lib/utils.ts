import fs from 'fs';
import path from 'path';
import { spawn, spawnSync, SpawnSyncOptions } from 'child_process';
import { IExec } from '../interfaces/index.js';

// --- CONFIGURAZIONE APPIMAGE ---
const APPIMAGE_ENV_BLACKLIST = [
  'LD_LIBRARY_PATH', 'LD_PRELOAD', 'PYTHONPATH', 'PERLLIB',
  'GSETTINGS_SCHEMA_DIR', 'QT_PLUGIN_PATH', 'XDG_DATA_DIRS', 'LIBRARY_PATH'
];

function getCleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (process.env.APPIMAGE) {
    APPIMAGE_ENV_BLACKLIST.forEach((key) => delete env[key]);
  }
  return env;
}

// --- INTERFACCE ---
interface ShellExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * OGGETTO SHX (EMULATORE SHELLJS)
 * Sostituto drop-in per shelljs che usa API native e ambiente pulito.
 */
export const shx = {


  /**
   * SED: Sostituzione stringhe in file (simile a sed -i)
   * shx.sed('-i', 'old', 'new', file)
   */
  sed: (flag: string, regex: string | RegExp, replacement: string, file: string): void => {
    // Ignoriamo il flag '-i' (in-place è default qui)
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');
    // Crea una RegExp globale se viene passata una stringa
    const searchRegex = typeof regex === 'string' ? new RegExp(regex, 'g') : regex;
    const newContent = content.replace(searchRegex, replacement);

    fs.writeFileSync(file, newContent, 'utf8');
  },

  /**
   * TOUCH: Aggiorna timestamp o crea file vuoto
   */
  touch: (file: string): void => {
    const time = new Date();
    try {
      fs.utimesSync(file, time, time);
    } catch (err) {
      fs.closeSync(fs.openSync(file, 'w'));
    }
  },

  /**
     * CP: Copia file o cartelle
     * Supporta wildcard '*' finale per copiare il contenuto
     */
  cp: (arg1: string, arg2: string, arg3?: string): void => {
    // Gestione argomenti variabili (se c'è il flag '-r')
    let src = arg3 ? arg2 : arg1;
    const dest = arg3 ? arg3 : arg2;

    // --- FIX WILDCARD (*) ---
    // Se il path finisce con '*', Node non lo capisce. Dobbiamo farlo noi.
    if (src.endsWith('*')) {
      const srcDir = path.dirname(src); // Rimuove l'asterisco

      if (!fs.existsSync(srcDir)) return; // Se la cartella sorgente non esiste, usciamo

      // Assicuriamoci che la destinazione esista
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      // Leggiamo il contenuto e copiamo uno per uno
      const items = fs.readdirSync(srcDir);
      items.forEach(item => {
        const s = path.join(srcDir, item);
        const d = path.join(dest, item);
        fs.cpSync(s, d, { recursive: true, force: true });
      });
      return; // Abbiamo finito
    }
    // ------------------------

    // Logica standard (senza asterisco)
    let finalDest = dest;
    // Se la destinazione è una cartella esistente, copiamo DENTRO
    if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) {
      finalDest = path.join(dest, path.basename(src));
    }

    // Esegue copia
    if (fs.existsSync(src)) {
      fs.cpSync(src, finalDest, { recursive: true, force: true });
    } else {
      // Opzionale: loggare che il file sorgente non esiste, ma shelljs -f di solito ignora
    }
  },

  /**
   * RM: Rimuove file o cartelle
   * Supporta: shx.rm('-rf', path) oppure shx.rm(path)
   */
  rm: (arg1: string, arg2?: string): void => {
    const target = arg2 ? arg2 : arg1;
    // force: true non lancia errore se il file non esiste
    fs.rmSync(target, { recursive: true, force: true });
  },

  /**
   * MKDIR: Crea directory
   * Supporta: shx.mkdir('-p', path) oppure shx.mkdir(path)
   */
  mkdir: (arg1: string, arg2?: string): void => {
    const dir = arg2 ? arg2 : arg1;
    fs.mkdirSync(dir, { recursive: true });
  },

  /**
   * MV: Sposta file
   */
  mv: (src: string, dest: string): void => {
    fs.renameSync(src, dest);
  },

  /**
   * CHMOD: Cambia permessi
   * Supporta: shx.chmod('+x', file) o ottale
   */
  chmod: (mode: string | number, file: string): void => {
    let finalMode = mode;
    if (mode === '+x') finalMode = 0o755;
    if (mode === '755') finalMode = 0o755;
    if (mode === '644') finalMode = 0o644;

    fs.chmodSync(file, finalMode as fs.Mode);
  },

  /**
   * TEST: Verifica esistenza
   * shx.test('-e', path)
   */
  test: (flag: string, pathToCheck: string): boolean => {
    try {
      const stats = fs.statSync(pathToCheck);
      if (flag === '-f') return stats.isFile();
      if (flag === '-d') return stats.isDirectory();
      return true; // -e
    } catch (e) {
      return false;
    }
  },

  /**
   * LN: Link simbolici
   * shx.ln('-s', target, link)
   */
  ln: (flag: string, target: string, link: string): void => {
    // Ignoriamo il flag '-s' perché fs.symlink lo fa di default su Linux
    // Se il link esiste, lo rimuoviamo prima per evitare errori
    if (fs.existsSync(link)) {
      fs.rmSync(link, { force: true });
    }
    fs.symlinkSync(target, link);
  },

  /**
   * EXEC: Esegue comandi shell (SANITIZZATO)
   * Ritorna un oggetto { code, stdout, stderr } come ShellJS.
   * NON lancia eccezioni, ma popola 'code'.
   */
  exec: (command: string, options: { silent?: boolean, async?: boolean } = {}): ShellExecResult => {
    const env = getCleanEnv();

    // Mappatura opzioni
    const stdioMode = options.silent ? 'ignore' : 'inherit';

    // Opzioni spawn
    const spawnOpts: SpawnSyncOptions = {
      stdio: options.silent ? 'pipe' : 'inherit', // Se silent=true, catturiamo per ritornare stdout
      env: env,
      shell: '/bin/bash',
      encoding: 'utf-8'
    };

    const result = spawnSync(command, [], spawnOpts);

    return {
      code: result.status ?? 1,
      stdout: result.stdout ? result.stdout.toString() : '',
      stderr: result.stderr ? result.stderr.toString() : ''
    };
  }

};


// --- EXPORT DELLE TUE VECCHIE FUNZIONI (PER COMPATIBILITA') ---

// Manteniamo questa per chi usa execSync aspettandosi stringa o throw error
export function execSync(command: string, { echo = false, ignore = false, stdio = undefined }: any = {}): string | null {
  if (echo) console.log(command);
  const result = shx.exec(command, { silent: ignore || stdio === 'ignore' });

  if (result.code !== 0) {
    throw new Error(`Command failed: ${command}\nStderr: ${result.stderr}`);
  }
  return result.stdout.trim();
}

// Manteniamo exec async
export async function exec(command: string, { echo = false, ignore = false, capture = false } = {}): Promise<IExec> {
  return new Promise((resolve, reject) => {
    if (echo) console.log(command);
    const env = getCleanEnv();
    const child = spawn(command, [], {
      stdio: ignore ? 'ignore' : capture ? 'pipe' : 'inherit',
      env: env,
      shell: '/bin/bash'
    });

    let stdout = '';
    if (capture && child.stdout) child.stdout.on('data', d => stdout += d);

    child.on('error', (error) => reject({ code: 1, error }));
    child.on('exit', (code) => resolve({ code: code || 0, data: stdout.trim() }));
  });
}

