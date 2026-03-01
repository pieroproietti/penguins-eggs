import { execSync, exec } from 'node:child_process';

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Run an eggs CLI command and capture output.
 */
export function runEggsCommand(args: string, sudo = true): CommandResult {
  const cmd = sudo ? `sudo eggs ${args}` : `eggs ${args}`;
  try {
    const stdout = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 300000, // 5 min for long operations like produce
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, stdout, stderr: '', exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      success: false,
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
      exitCode: e.status ?? 1,
    };
  }
}

/**
 * Run an eggs command with real-time output streaming.
 */
export function streamEggsCommand(
  args: string,
  sudo = true,
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const cmd = sudo ? `sudo eggs ${args}` : `eggs ${args}`;
    let stdout = '';
    let stderr = '';

    const child = exec(cmd, { timeout: 600000 });

    child.stdout?.on('data', (data: string) => {
      stdout += data;
      process.stdout.write(data);
    });

    child.stderr?.on('data', (data: string) => {
      stderr += data;
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });
  });
}

/**
 * Check if eggs is installed and accessible.
 */
export function isEggsAvailable(): boolean {
  try {
    execSync('which eggs', { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}
