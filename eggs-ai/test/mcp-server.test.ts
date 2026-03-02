import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

function mcpCall(request: Record<string, unknown>): Record<string, unknown> {
  const input = JSON.stringify(request);
  const output = execSync(`echo '${input}' | npx tsx src/mcp/server.ts`, {
    encoding: 'utf-8',
    cwd: process.cwd(),
    timeout: 15000,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
  return JSON.parse(output);
}

describe('MCP Server', () => {
  it('responds to initialize', () => {
    const resp = mcpCall({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
    });
    expect(resp.result).toMatchObject({
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'eggs-ai', version: '0.1.0' },
    });
  });

  it('lists all tools', () => {
    const resp = mcpCall({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    const tools = (resp.result as { tools: Array<{ name: string }> }).tools;
    const names = tools.map((t) => t.name);

    expect(names).toContain('eggs_doctor');
    expect(names).toContain('eggs_build_plan');
    expect(names).toContain('eggs_system_status');
    expect(names).toContain('eggs_command_reference');
    expect(names).toContain('eggs_troubleshoot');
    expect(names).toContain('eggs_distro_guide');
    expect(names).toContain('eggs_workflow');
    expect(names).toContain('eggs_calamares_info');
    expect(tools.length).toBe(10);
  });

  it('eggs_system_status returns system info', () => {
    const resp = mcpCall({
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'eggs_system_status', arguments: {} },
    });
    const content = (resp.result as { content: Array<{ text: string }> }).content[0].text;
    expect(content).toContain('Distro:');
    expect(content).toContain('Kernel:');
    expect(content).toContain('Eggs installed:');
  });

  it('eggs_command_reference returns produce info', () => {
    const resp = mcpCall({
      jsonrpc: '2.0', id: 4, method: 'tools/call',
      params: { name: 'eggs_command_reference', arguments: { command: 'produce' } },
    });
    const content = (resp.result as { content: Array<{ text: string }> }).content[0].text;
    expect(content).toContain('produce');
    expect(content).toContain('compression');
  });

  it('eggs_distro_guide returns guide for debian', () => {
    const resp = mcpCall({
      jsonrpc: '2.0', id: 5, method: 'tools/call',
      params: { name: 'eggs_distro_guide', arguments: { distro: 'debian' } },
    });
    const content = (resp.result as { content: Array<{ text: string }> }).content[0].text;
    expect(content).toContain('Debian');
    expect(content).toContain('apt');
  });

  it('eggs_distro_guide returns error for unknown distro', () => {
    const resp = mcpCall({
      jsonrpc: '2.0', id: 6, method: 'tools/call',
      params: { name: 'eggs_distro_guide', arguments: { distro: 'haiku' } },
    });
    const content = (resp.result as { content: Array<{ text: string }> }).content[0].text;
    expect(content).toContain('No guide for');
    expect(content).toContain('Available:');
  });

  it('eggs_troubleshoot finds matching issues', () => {
    const resp = mcpCall({
      jsonrpc: '2.0', id: 7, method: 'tools/call',
      params: { name: 'eggs_troubleshoot', arguments: { symptom: 'calamares crashes' } },
    });
    const content = (resp.result as { content: Array<{ text: string }> }).content[0].text;
    expect(content).toContain('Calamares');
  });

  it('eggs_workflow returns clone guide', () => {
    const resp = mcpCall({
      jsonrpc: '2.0', id: 8, method: 'tools/call',
      params: { name: 'eggs_workflow', arguments: { workflow: 'clone-system' } },
    });
    const content = (resp.result as { content: Array<{ text: string }> }).content[0].text;
    expect(content).toContain('clone');
    expect(content).toContain('--cryptedclone');
  });

  it('returns error for unknown method', () => {
    const resp = mcpCall({ jsonrpc: '2.0', id: 99, method: 'unknown/method', params: {} });
    expect(resp.error).toBeDefined();
    expect((resp.error as { code: number }).code).toBe(-32601);
  });
});
