import { spawn, spawnSync, StdioOptions, SpawnSyncOptions } from 'child_process';
import { IExec } from '../interfaces/index.js'; 

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

interface ExecSyncParams {
  echo?: boolean;
  ignore?: boolean;
  stdio?: StdioOptions;
}

/**
 * ESEGUE UN COMANDO IN MODO SINCRONO (Bloccante)
 */
export function execSync(command: string, { echo = false, ignore = false, stdio = undefined }: ExecSyncParams = {}): string | null {
  if (echo) console.log(command);

  const finalStdio: StdioOptions = stdio || (ignore ? 'ignore' : 'pipe');

  const options: SpawnSyncOptions = {
    stdio: finalStdio,
    env: getCleanEnv(),
    shell: '/bin/bash',
    encoding: 'utf-8'
  };

  const result = spawnSync(command, [], options);

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderrMsg = result.stderr ? result.stderr.toString().trim() : 'Nessun output di errore';
    throw new Error(`Command failed: "${command}"\nExit Code: ${result.status}\nStderr: ${stderrMsg}`);
  }
  
  return result.stdout ? result.stdout.toString().trim() : null;
}

/**
 * ESEGUE UN COMANDO IN MODO ASINCRONO (Promise)
 * @returns Promise con codice uscita e dati stdout
 */
export async function exec(command: string, { echo = false, ignore = false, capture = false } = {}): Promise<IExec> {
  return new Promise((resolve, reject) => {
    if (echo) console.log(command);

    const spawnOptions: any = {
      stdio: ignore ? 'ignore' : capture ? 'pipe' : 'inherit',
      env: getCleanEnv(),
      shell: '/bin/bash'
    };

    const child = spawn(command, [], spawnOptions);

    let stdout = '';
    if (capture && child.stdout) {
      child.stdout.on('data', (data: any) => {
        stdout += data.toString();
      });
    }

    child.on('error', (error: any) => {
      reject({ code: 1, error });
    });

    child.on('exit', (code: number) => {
      resolve({ code: code || 0, data: stdout.trim() });
    });
  });
}