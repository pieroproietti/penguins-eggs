/**
 * Tool definitions for the agentic execution loop.
 * Combines myclaw's filesystem/shell tools with eggs-ai domain tools.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

export const READ_FILE: ToolDefinition = {
  name: 'read_file', description: 'Read a UTF-8 text file by path.',
  inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'File path to read' } }, required: ['path'] },
};

export const WRITE_FILE: ToolDefinition = {
  name: 'write_file', description: 'Write or create a UTF-8 text file.',
  inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
};

export const LIST_FILES: ToolDefinition = {
  name: 'list_files', description: 'List files in a directory.',
  inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Directory path (default: .)' } } },
};

export const RUN_SHELL: ToolDefinition = {
  name: 'run_shell', description: 'Run a shell command. Destructive commands require approval.',
  inputSchema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
};

export const EGGS_RUN: ToolDefinition = {
  name: 'eggs_run', description: 'Execute a penguins-eggs CLI command (auto-prepends sudo). Destructive commands require check-gate approval.',
  inputSchema: { type: 'object', properties: { args: { type: 'string', description: 'Arguments for eggs CLI' } }, required: ['args'] },
};

export const EGGS_INSPECT: ToolDefinition = {
  name: 'eggs_inspect', description: 'Inspect the system for penguins-eggs status: distro, kernel, eggs version, config, disk, memory, init system, Calamares.',
  inputSchema: { type: 'object', properties: {} },
};

export const EGGS_KNOWLEDGE: ToolDefinition = {
  name: 'eggs_knowledge', description: 'Query the penguins-eggs knowledge base. Topics: "commands", "distro:<name>", "issues", "wardrobe", "calamares", "workflows", "distros", or free-text.',
  inputSchema: { type: 'object', properties: { topic: { type: 'string' } }, required: ['topic'] },
};

export const EGGS_CONFIG_READ: ToolDefinition = {
  name: 'eggs_config_read', description: 'Read /etc/penguins-eggs.d/eggs.yaml.',
  inputSchema: { type: 'object', properties: {} },
};

export const EGGS_CONFIG_WRITE: ToolDefinition = {
  name: 'eggs_config_write', description: 'Write eggs.yaml configuration. Requires check-gate approval.',
  inputSchema: { type: 'object', properties: { content: { type: 'string', description: 'YAML content' } }, required: ['content'] },
};

export const ALL_TOOLS: ToolDefinition[] = [
  READ_FILE, WRITE_FILE, LIST_FILES, RUN_SHELL,
  EGGS_RUN, EGGS_INSPECT, EGGS_KNOWLEDGE, EGGS_CONFIG_READ, EGGS_CONFIG_WRITE,
];
