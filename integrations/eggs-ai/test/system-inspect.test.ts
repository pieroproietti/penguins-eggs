import { describe, it, expect } from 'vitest';
import { inspectSystem, formatSystemInfo } from '../src/tools/system-inspect.js';

describe('inspectSystem', () => {
  it('returns a valid SystemInfo object', () => {
    const info = inspectSystem();

    expect(info).toHaveProperty('distro');
    expect(info).toHaveProperty('kernel');
    expect(info).toHaveProperty('arch');
    expect(info).toHaveProperty('hostname');
    expect(info).toHaveProperty('diskSpace');
    expect(info).toHaveProperty('memoryMb');
    expect(info).toHaveProperty('eggsInstalled');
    expect(info).toHaveProperty('eggsVersion');
    expect(info).toHaveProperty('eggsConfigExists');
    expect(info).toHaveProperty('calamaresInstalled');
    expect(info).toHaveProperty('nodeVersion');
    expect(info).toHaveProperty('initSystem');
  });

  it('detects kernel version', () => {
    const info = inspectSystem();
    expect(info.kernel).toMatch(/^\d+\.\d+/);
  });

  it('detects architecture', () => {
    const info = inspectSystem();
    expect(['x86_64', 'aarch64', 'armv7l', 'i686', 'riscv64']).toContain(info.arch);
  });

  it('reports memory as a positive number', () => {
    const info = inspectSystem();
    expect(info.memoryMb).toBeGreaterThan(0);
  });

  it('detects node version', () => {
    const info = inspectSystem();
    expect(info.nodeVersion).toMatch(/^v\d+/);
  });

  it('detects init system', () => {
    const info = inspectSystem();
    expect(['systemd', 'openrc', 'runit', 's6', 'unknown']).toContain(info.initSystem);
  });

  it('eggsInstalled is boolean', () => {
    const info = inspectSystem();
    expect(typeof info.eggsInstalled).toBe('boolean');
  });
});

describe('formatSystemInfo', () => {
  it('returns a multi-line string', () => {
    const info = inspectSystem();
    const formatted = formatSystemInfo(info);

    expect(typeof formatted).toBe('string');
    expect(formatted.split('\n').length).toBeGreaterThan(5);
  });

  it('includes key fields', () => {
    const info = inspectSystem();
    const formatted = formatSystemInfo(info);

    expect(formatted).toContain('Distro:');
    expect(formatted).toContain('Kernel:');
    expect(formatted).toContain('Arch:');
    expect(formatted).toContain('Memory:');
    expect(formatted).toContain('Eggs installed:');
  });
});
