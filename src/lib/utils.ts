/**
 * ./src/lib/utils.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// Importiamo con alias per poter wrappare
import { 
  ChildProcess, 
  spawn as nodeSpawn, 
  spawnSync as nodeSpawnSync, 
  SpawnOptions, 
  SpawnSyncOptions, 
  SpawnSyncReturns 
} from 'child_process';
import fs from 'fs';
import path from 'path';

import { IExec } from '../interfaces/index.js';

/**
 * Pulizia AppImage
 * Variabili d'ambiente da rimuovere per evitare conflitti quando si eseguono
 * comandi di sistema dall'interno di una AppImage.
 */
const APPIMAGE_ENV_BLACKLIST = [
  'LD_LIBRARY_PATH', 'LD_PRELOAD', 'PYTHONPATH', 'PERLLIB',
  'GSETTINGS_SCHEMA_DIR', 'QT_PLUGIN_PATH', 'XDG_DATA_DIRS', 
  'LIBRARY_PATH', 'PKG_CONFIG_PATH', 'GIO_MODULE_DIR', 'APPIMAGE', 'APPDIR'
];

/**
 * Ottiene un ambiente pulito dalle variabili AppImage
 * @returns Oggetto process.env sanificato
 */
function getCleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (process.env.APPIMAGE) {
    for (const key of APPIMAGE_ENV_BLACKLIST) delete env[key];
  }

  return env;
}

interface ShellExecResult {
  code: number;
  stderr: string;
  stdout: string;
}

interface ExecSyncOptions {
  echo?: boolean;
  ignore?: boolean;
  stdio?: 'ignore' | 'inherit' | 'pipe';
}

/**
 * spawnSync (WRAPPER INTELLIGENTE)
 * Supporta:
 * 1. (command, args, options)
 * 2. (command, options) -> args diventa []
 * Pulisce automaticamente l'ambiente.
 */
export function spawnSync(command: string, arg2?: SpawnSyncOptions | string[], arg3?: SpawnSyncOptions): SpawnSyncReturns<Buffer | string> {
  let args: string[] = [];
  let options: SpawnSyncOptions = {};

  // Rilevamento argomenti (Polimorfismo)
  if (Array.isArray(arg2)) {
    args = arg2;
    options = arg3 || {};
  } else if (arg2 && typeof arg2 === 'object') {
    // TypeScript fix: cast esplicito per evitare errori di tipo union
    options = arg2 as SpawnSyncOptions;
  }

  const env = getCleanEnv();
  const finalEnv = { ...env, ...options.env };

  return nodeSpawnSync(command, args, {
    ...options,
    env: finalEnv
  });
}

/**
 * spawn (WRAPPER INTELLIGENTE)
 * Supporta:
 * 1. (command, args, options)
 * 2. (command, options) -> args diventa []
 * Pulisce automaticamente l'ambiente.
 */
export function spawn(command: string, arg2?: readonly string[] | SpawnOptions, arg3?: SpawnOptions): ChildProcess {
  let args: readonly string[] = [];
  let options: SpawnOptions = {};

  // Rilevamento argomenti (Polimorfismo)
  if (Array.isArray(arg2)) {
    args = arg2;
    options = arg3 || {};
  } else if (arg2 && typeof arg2 === 'object') {
    // TypeScript fix: cast esplicito
    options = arg2 as SpawnOptions;
  }

  const env = getCleanEnv();
  const finalEnv = { ...env, ...options.env };

  return nodeSpawn(command, args, {
    ...options,
    env: finalEnv
  });
}

/**
 * shx
 * Sostituto drop-in per shelljs che usa API native e ambiente pulito.
 */
export const shx = {

  chmod(mode: number | string, file: string): void {
    if (!fs.existsSync(file)) return;
    let finalMode = mode;
    if (mode === '+x') finalMode = 0o755;
    if (typeof mode === 'string' && !isNaN(Number.parseInt(mode, 8))) {
       finalMode = Number.parseInt(mode, 8);
    }

    fs.chmodSync(file, finalMode as fs.Mode);
  },

  cp(arg1: string, arg2: string, arg3?: string): void {
    const src = arg3 ? arg2 : arg1;
    const dest = arg3 ? arg3 : arg2;

    // --- GESTIONE WILDCARD (*) ---
    if (src.endsWith('*')) {
      const srcDir = path.dirname(src); 
      if (!fs.existsSync(srcDir)) return;
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

      const items = fs.readdirSync(srcDir);
      for (const item of items) {
        const s = path.join(srcDir, item);
        const d = path.join(dest, item);
        fs.cpSync(s, d, { force: true, recursive: true });
      }

      return;
    }
    // ----------------------------

    let finalDest = dest;
    if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) {
      finalDest = path.join(dest, path.basename(src));
    }

    if (fs.existsSync(src)) {
      fs.cpSync(src, finalDest, { force: true, recursive: true });
    }
  },

  exec(command: string, options: { silent?: boolean } = {}): ShellExecResult {
    const env = getCleanEnv();
    const spawnOpts: SpawnSyncOptions = {
      encoding: 'utf-8',
      env,
      shell: '/bin/bash',
      stdio: options.silent ? 'pipe' : 'inherit'
    };

    // Usiamo nodeSpawnSync perché calcoliamo l'env qui sopra
    const result = nodeSpawnSync(command, [], spawnOpts);

    return {
      code: result.status ?? 1,
      stderr: result.stderr ? result.stderr.toString() : '',
      stdout: result.stdout ? result.stdout.toString() : ''
    };
  },

  ln(flag: string, target: string, link: string): void {
    if (fs.existsSync(link) || fs.lstatSync(link, {throwIfNoEntry: false})) {
      fs.rmSync(link, { force: true });
    }

    fs.symlinkSync(target, link);
  },

  ls(arg1?: string | string[], arg2?: string | string[]): string[] {
    let options = '';
    let paths: string[] = [];

    // Rilevamento argomenti: ls('-R', path) vs ls(path)
    if (typeof arg1 === 'string' && arg1.startsWith('-')) {
      options = arg1;
      // Se c'è arg2 lo usa, altrimenti default a '.'
      paths = arg2 ? (Array.isArray(arg2) ? arg2 : [arg2]) : ['.'];
    } else {
      // Nessuna opzione, arg1 sono i path. Se null, default a '.'
      paths = arg1 ? (Array.isArray(arg1) ? arg1 : [arg1]) : ['.'];
    }

    const recursive = options.includes('R');
    let results: string[] = [];

    for (const p of paths) {
      if (!fs.existsSync(p)) continue;

      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (recursive) {
          // Funzione ricorsiva interna
          const walk = (dir: string) => {
            const files = fs.readdirSync(dir);
            for (const f of files) {
              const fullPath = path.join(dir, f);
              results.push(fullPath); // Aggiunge il path completo
              if (fs.statSync(fullPath).isDirectory()) {
                walk(fullPath);
              }
            }
          };

          walk(p);
        } else {
          // Comportamento standard: ritorna solo i nomi dei file nella cartella
          results = results.concat(fs.readdirSync(p));
        }
      } else {
        // È un file singolo
        results.push(p);
      }
    }

    return results;
  },

  mkdir(arg1: string, arg2?: string): void {
    const dir = arg2 ? arg2 : arg1;
    fs.mkdirSync(dir, { recursive: true });
  },

  mv(src: string, dest: string): void {
    if (!fs.existsSync(src)) return;
    fs.renameSync(src, dest);
  },

  rm(arg1: string, arg2?: string): void {
    const target = arg2 ? arg2 : arg1;
    fs.rmSync(target, { force: true, recursive: true });
  },

  sed(flag: string, regex: RegExp | string, replacement: string, file: string): void {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf8');
    const searchRegex = typeof regex === 'string' ? new RegExp(regex, 'g') : regex;
    const newContent = content.replace(searchRegex, replacement);

    fs.writeFileSync(file, newContent, 'utf8');
  },

  test(flag: string, pathToCheck: string): boolean {
    try {
      const stats = fs.statSync(pathToCheck);
      if (flag === '-f') return stats.isFile();
      if (flag === '-d') return stats.isDirectory();
      return true; // -e
    } catch {
      return false;
    }
  },

  touch(file: string): void {
    const time = new Date();
    try {
      fs.utimesSync(file, time, time);
    } catch {
      fs.closeSync(fs.openSync(file, 'w'));
    }
  },

  which(cmd: string): null | string {
    const result = shx.exec(`command -v ${cmd}`, { silent: true });
    return result.code === 0 ? result.stdout.trim() : null;
  }
};

/**
 * execSync
 */
export function execSync(command: string, options: ExecSyncOptions = {}): null | string {
  const { echo = false, ignore = false, stdio } = options;
  if (echo) console.log(command);
  const isSilent = ignore || stdio === 'ignore'; 
  const result = shx.exec(command, { silent: isSilent });

  if (result.code !== 0) {
    throw new Error(`Command failed: ${command}\nExit Code: ${result.code}\nStderr: ${result.stderr}`);
  }

  return result.stdout.trim();
}

/**
 * exec (Async)
 */
export async function exec(command: string, { capture = false, echo = false, ignore = false } = {}): Promise<IExec> {
  return new Promise((resolve, reject) => {
    if (echo) console.log(command);
    
    const env = getCleanEnv();
    // Usiamo nodeSpawn direttamente qui per coerenza
    const child = nodeSpawn(command, [], {
      env,
      shell: '/bin/bash',
      stdio: ignore ? 'ignore' : (capture ? 'pipe' : 'inherit')
    });

    let stdout = '';
    let stderr = '';

    if (capture && child.stdout) child.stdout.on('data', d => stdout += d.toString());
    if (capture && child.stderr) child.stderr.on('data', d => stderr += d.toString());

    child.on('error', (error) => {
      reject({ code: 1, error, stderr }); 
    });

    child.on('close', (code) => {
      resolve({ 
        code: code || 0, 
        data: stdout.trim(), 
        error: code === 0 ? undefined : stderr.trim() 
      });
    });
  });

}