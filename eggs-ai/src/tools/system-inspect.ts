import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

export interface SystemInfo {
  distro: string;
  kernel: string;
  arch: string;
  hostname: string;
  diskSpace: string;
  memoryMb: number;
  eggsInstalled: boolean;
  eggsVersion: string | null;
  eggsConfigExists: boolean;
  eggsConfig: string | null;
  calamaresInstalled: boolean;
  nodeVersion: string;
  initSystem: string;
}

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();
  } catch {
    return '';
  }
}

function detectDistro(): string {
  if (existsSync('/etc/os-release')) {
    const content = readFileSync('/etc/os-release', 'utf-8');
    const pretty = content.match(/PRETTY_NAME="(.+)"/);
    if (pretty) return pretty[1];
    const name = content.match(/^NAME="(.+)"/m);
    const version = content.match(/^VERSION_ID="(.+)"/m);
    return `${name?.[1] ?? 'Unknown'} ${version?.[1] ?? ''}`.trim();
  }
  return run('uname -o') || 'Unknown';
}

function detectInitSystem(): string {
  if (existsSync('/run/systemd/system')) return 'systemd';
  if (existsSync('/sbin/openrc')) return 'openrc';
  if (existsSync('/sbin/init')) {
    const initLink = run('readlink -f /sbin/init');
    if (initLink.includes('systemd')) return 'systemd';
    if (initLink.includes('runit')) return 'runit';
    if (initLink.includes('s6')) return 's6';
  }
  return 'unknown';
}

export function inspectSystem(): SystemInfo {
  const eggsConfigPath = '/etc/penguins-eggs.d/eggs.yaml';
  const eggsConfigExists = existsSync(eggsConfigPath);

  return {
    distro: detectDistro(),
    kernel: run('uname -r'),
    arch: run('uname -m'),
    hostname: run('hostname'),
    diskSpace: run('df -h / --output=avail | tail -1'),
    memoryMb: Math.round(parseInt(run('grep MemTotal /proc/meminfo | awk \'{print $2}\'') || '0') / 1024),
    eggsInstalled: run('which eggs') !== '',
    eggsVersion: run('eggs --version') || null,
    eggsConfigExists,
    eggsConfig: eggsConfigExists ? readFileSync(eggsConfigPath, 'utf-8') : null,
    calamaresInstalled: run('which calamares') !== '',
    nodeVersion: run('node --version'),
    initSystem: detectInitSystem(),
  };
}

export function formatSystemInfo(info: SystemInfo): string {
  const lines = [
    `Distro:      ${info.distro}`,
    `Kernel:      ${info.kernel}`,
    `Arch:        ${info.arch}`,
    `Hostname:    ${info.hostname}`,
    `Disk (root): ${info.diskSpace}`,
    `Memory:      ${info.memoryMb} MB`,
    `Init:        ${info.initSystem}`,
    `Node.js:     ${info.nodeVersion}`,
    ``,
    `Eggs installed:   ${info.eggsInstalled ? 'yes' : 'no'}`,
    `Eggs version:     ${info.eggsVersion ?? 'n/a'}`,
    `Eggs config:      ${info.eggsConfigExists ? 'found' : 'not found'}`,
    `Calamares:        ${info.calamaresInstalled ? 'installed' : 'not installed'}`,
  ];
  return lines.join('\n');
}
