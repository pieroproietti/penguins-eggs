import { describe, it, expect } from 'vitest';
import {
  EGGS_COMMANDS,
  EGGS_CONFIG_REFERENCE,
  EGGS_COMMON_ISSUES,
  SUPPORTED_DISTROS,
  CALAMARES_MODULES,
  WARDROBE_COSTUMES,
  SYSTEM_PROMPT,
} from '../src/knowledge/eggs-reference.js';

describe('Knowledge base', () => {
  it('EGGS_COMMANDS has core commands', () => {
    expect(EGGS_COMMANDS).toHaveProperty('produce');
    expect(EGGS_COMMANDS).toHaveProperty('config');
    expect(EGGS_COMMANDS).toHaveProperty('install');
    expect(EGGS_COMMANDS).toHaveProperty('calamares');
    expect(EGGS_COMMANDS).toHaveProperty('wardrobe');
    expect(EGGS_COMMANDS).toHaveProperty('dad');
    expect(EGGS_COMMANDS).toHaveProperty('cuckoo');
  });

  it('produce command has flags', () => {
    const produce = EGGS_COMMANDS.produce;
    expect(produce.flags).toHaveProperty('--compression <type>');
    expect(produce.flags).toHaveProperty('--clone');
    expect(produce.flags).toHaveProperty('--release');
    expect(produce.requiresRoot).toBe(true);
  });

  it('EGGS_CONFIG_REFERENCE has config path and fields', () => {
    expect(EGGS_CONFIG_REFERENCE.configPath).toBe('/etc/penguins-eggs.d/eggs.yaml');
    expect(EGGS_CONFIG_REFERENCE.fields).toHaveProperty('snapshot_dir');
    expect(EGGS_CONFIG_REFERENCE.fields).toHaveProperty('compression');
  });

  it('EGGS_COMMON_ISSUES is non-empty with proper structure', () => {
    expect(EGGS_COMMON_ISSUES.length).toBeGreaterThan(3);
    for (const issue of EGGS_COMMON_ISSUES) {
      expect(issue).toHaveProperty('symptom');
      expect(issue).toHaveProperty('causes');
      expect(issue).toHaveProperty('fixes');
      expect(issue.causes.length).toBeGreaterThan(0);
      expect(issue.fixes.length).toBeGreaterThan(0);
    }
  });

  it('SUPPORTED_DISTROS includes major distros', () => {
    const joined = SUPPORTED_DISTROS.join(' ');
    expect(joined).toContain('Debian');
    expect(joined).toContain('Ubuntu');
    expect(joined).toContain('Arch');
    expect(joined).toContain('Fedora');
  });

  it('CALAMARES_MODULES has key modules', () => {
    expect(CALAMARES_MODULES).toHaveProperty('welcome');
    expect(CALAMARES_MODULES).toHaveProperty('partition');
    expect(CALAMARES_MODULES).toHaveProperty('bootloader');
    expect(CALAMARES_MODULES).toHaveProperty('unpackfs');
  });

  it('WARDROBE_COSTUMES has examples', () => {
    expect(WARDROBE_COSTUMES.examples.length).toBeGreaterThan(0);
    expect(WARDROBE_COSTUMES.repository).toContain('github.com');
  });

  it('SYSTEM_PROMPT mentions penguins-eggs', () => {
    expect(SYSTEM_PROMPT).toContain('Penguins-Eggs');
    expect(SYSTEM_PROMPT).toContain('Eggs-AI');
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(200);
  });
});
