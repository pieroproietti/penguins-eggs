/**
 * MCP (Model Context Protocol) server for eggs-ai.
 *
 * Exposes eggs-ai capabilities as tools that other AI agents
 * (opencode, Cursor, Claude Desktop, etc.) can call.
 *
 * Protocol: JSON-RPC 2.0 over stdio
 * Spec: https://modelcontextprotocol.io
 *
 * Usage in MCP client config:
 *   {
 *     "mcpServers": {
 *       "eggs-ai": {
 *         "command": "npx",
 *         "args": ["tsx", "/path/to/eggs-ai/src/mcp/server.ts"]
 *       }
 *     }
 *   }
 *
 * Or after build:
 *   {
 *     "mcpServers": {
 *       "eggs-ai": {
 *         "command": "node",
 *         "args": ["/path/to/eggs-ai/dist/mcp/server.js"]
 *       }
 *     }
 *   }
 */

import { createInterface } from 'node:readline';
import { inspectSystem, formatSystemInfo } from '../tools/system-inspect.js';
import {
  EGGS_COMMANDS,
  EGGS_CONFIG_REFERENCE,
  EGGS_COMMON_ISSUES,
  SUPPORTED_DISTROS,
  CALAMARES_MODULES,
  WARDROBE_COSTUMES,
} from '../knowledge/eggs-reference.js';
import {
  DISTRO_INSTALL_GUIDES,
  ADVANCED_WORKFLOWS,
  TROUBLESHOOTING_ADVANCED,
} from '../knowledge/distro-guides.js';

// ─── MCP Protocol Types ──────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ─── Tool Definitions ────────────────────────────────────

const TOOLS = [
  {
    name: 'eggs_doctor',
    description: 'Diagnose system issues related to penguins-eggs. Inspects the running Linux system and returns a diagnostic report with detected issues, causes, and fix commands.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        complaint: {
          type: 'string',
          description: 'Optional description of the problem (e.g., "ISO boots to black screen")',
        },
      },
    },
  },
  {
    name: 'eggs_build_plan',
    description: 'Generate an AI-guided build plan for creating a live Linux ISO with penguins-eggs. Returns pre-build checklist, config changes, the exact produce command, and verification steps.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        desktop: { type: 'string', description: 'Desktop environment: xfce, gnome, kde, none' },
        compression: { type: 'string', description: 'Compression level: fast, standard, max' },
        description: { type: 'string', description: 'Plain English description of what you want' },
        clone: { type: 'boolean', description: 'Clone mode (include user data)' },
        release: { type: 'boolean', description: 'Release mode (strip eggs/calamares from ISO)' },
      },
    },
  },
  {
    name: 'eggs_config_explain',
    description: 'Explain the current penguins-eggs configuration (/etc/penguins-eggs.d/eggs.yaml) in plain English. Returns what each setting does and whether values are reasonable.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'eggs_config_generate',
    description: 'Generate a penguins-eggs configuration file (eggs.yaml) for a specific purpose.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        purpose: {
          type: 'string',
          description: 'What the ISO is for (e.g., "minimal rescue USB", "classroom lab machines")',
        },
      },
      required: ['purpose'],
    },
  },
  {
    name: 'eggs_system_status',
    description: 'Get the current system status for penguins-eggs: distro, kernel, disk space, memory, whether eggs is installed, config status, and calamares status.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'eggs_command_reference',
    description: 'Look up a penguins-eggs command and its flags, usage, and examples.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        command: {
          type: 'string',
          description: 'Command name (e.g., "produce", "config", "wardrobe", "calamares", "install", "cuckoo")',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'eggs_troubleshoot',
    description: 'Search the penguins-eggs troubleshooting database for a symptom and get causes and fixes.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        symptom: {
          type: 'string',
          description: 'Describe the problem (e.g., "ISO too large", "calamares crashes", "network not working")',
        },
      },
      required: ['symptom'],
    },
  },
  {
    name: 'eggs_distro_guide',
    description: 'Get the installation and usage guide for penguins-eggs on a specific Linux distribution.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        distro: {
          type: 'string',
          description: 'Distribution name: debian, ubuntu, arch, fedora, opensuse, alpine, void',
        },
      },
      required: ['distro'],
    },
  },
  {
    name: 'eggs_workflow',
    description: 'Get a step-by-step guide for an advanced penguins-eggs workflow.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workflow: {
          type: 'string',
          description: 'Workflow name: clone-system, pxe-network-boot, wardrobe-custom-costume, unattended-install, release-mode, compression-guide',
        },
      },
      required: ['workflow'],
    },
  },
  {
    name: 'eggs_calamares_info',
    description: 'Get information about Calamares installer modules and configuration for penguins-eggs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        module: {
          type: 'string',
          description: 'Optional specific module name (e.g., "partition", "bootloader", "users")',
        },
      },
    },
  },
];

// ─── Tool Handlers ───────────────────────────────────────

function handleTool(name: string, args: Record<string, unknown>): { content: Array<{ type: string; text: string }> } {
  const text = (s: string) => ({ content: [{ type: 'text', text: s }] });

  switch (name) {
    case 'eggs_doctor': {
      const info = inspectSystem();
      const formatted = formatSystemInfo(info);
      const complaint = args.complaint as string | undefined;

      const allIssues = [
        ...EGGS_COMMON_ISSUES,
        ...TROUBLESHOOTING_ADVANCED.map((t) => ({
          symptom: t.symptom,
          causes: [t.diagnosis],
          fixes: [t.fix],
        })),
      ];

      // Find matching issues
      const matches = complaint
        ? allIssues.filter((i) =>
            i.symptom.toLowerCase().includes(complaint.toLowerCase()) ||
            complaint.toLowerCase().includes(i.symptom.toLowerCase().split(' ').slice(0, 3).join(' ')),
          )
        : [];

      let report = `## System Diagnostic Report\n\n${formatted}\n\n`;

      if (!info.eggsInstalled) {
        report += `⚠️ penguins-eggs is NOT installed.\nInstall with: sudo npm i -g penguins-eggs\nOr see distro-specific guide with eggs_distro_guide tool.\n\n`;
      }
      if (!info.eggsConfigExists) {
        report += `⚠️ eggs configuration not found. Run: sudo eggs dad -d\n\n`;
      }

      if (matches.length > 0) {
        report += `## Matching Known Issues\n\n`;
        for (const m of matches) {
          report += `### ${m.symptom}\n`;
          report += `Causes: ${m.causes.join(', ')}\n`;
          report += `Fixes: ${m.fixes.join('; ')}\n\n`;
        }
      } else if (complaint) {
        report += `No exact match found for "${complaint}" in the known issues database. The system info above should help diagnose the problem.\n\n`;
        report += `## All Known Issues\n${allIssues.map((i) => `- ${i.symptom}`).join('\n')}\n`;
      }

      return text(report);
    }

    case 'eggs_build_plan': {
      const info = inspectSystem();
      const produce = EGGS_COMMANDS.produce;
      let plan = `## Build Plan\n\n`;
      plan += `System: ${info.distro} (${info.arch}), ${info.diskSpace} available, ${info.memoryMb}MB RAM\n\n`;

      if (!info.eggsInstalled) {
        plan += `### Step 0: Install penguins-eggs\nsudo npm i -g penguins-eggs\n\n`;
      }
      if (!info.eggsConfigExists) {
        plan += `### Step 1: Configure\nsudo eggs dad -d\n\n`;
      }

      const flags: string[] = [];
      if (args.compression) flags.push(`--compression ${args.compression}`);
      if (args.clone) flags.push('--clone');
      if (args.release) flags.push('--release');

      plan += `### Produce Command\n\`\`\`\nsudo eggs produce ${flags.join(' ')}\n\`\`\`\n\n`;
      plan += `### Available Flags\n${Object.entries(produce.flags).map(([f, d]) => `- \`${f}\`: ${d}`).join('\n')}\n\n`;

      if (args.description) {
        plan += `### Notes for: "${args.description}"\n`;
        plan += `Adjust flags and config based on your specific needs. Use --verbose for detailed output.\n`;
      }

      return text(plan);
    }

    case 'eggs_config_explain': {
      const info = inspectSystem();
      if (!info.eggsConfig) {
        return text(`No eggs configuration found at ${EGGS_CONFIG_REFERENCE.configPath}.\n\nRun \`sudo eggs dad\` or \`sudo eggs config\` to create one.\n\n## Config Fields Reference\n${Object.entries(EGGS_CONFIG_REFERENCE.fields).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}`);
      }
      return text(`## Current eggs.yaml\n\n\`\`\`yaml\n${info.eggsConfig}\`\`\`\n\n## Field Reference\n${Object.entries(EGGS_CONFIG_REFERENCE.fields).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}`);
    }

    case 'eggs_config_generate': {
      const purpose = args.purpose as string;
      const info = inspectSystem();
      return text(`## Config Generation for: "${purpose}"\n\nSystem: ${info.distro} (${info.arch}), ${info.diskSpace} available\n\n## Available Fields\n${Object.entries(EGGS_CONFIG_REFERENCE.fields).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}\n\nGenerate the YAML based on the purpose and system specs above. Config path: ${EGGS_CONFIG_REFERENCE.configPath}`);
    }

    case 'eggs_system_status': {
      const info = inspectSystem();
      return text(formatSystemInfo(info));
    }

    case 'eggs_command_reference': {
      const cmd = args.command as string;
      const ref = (EGGS_COMMANDS as Record<string, unknown>)[cmd];
      if (!ref) {
        const available = Object.keys(EGGS_COMMANDS).join(', ');
        return text(`Unknown command "${cmd}". Available: ${available}`);
      }
      return text(`## eggs ${cmd}\n\n\`\`\`json\n${JSON.stringify(ref, null, 2)}\n\`\`\``);
    }

    case 'eggs_troubleshoot': {
      const symptom = (args.symptom as string).toLowerCase();
      const allIssues = [
        ...EGGS_COMMON_ISSUES.map((i) => ({ ...i, source: 'common' })),
        ...TROUBLESHOOTING_ADVANCED.map((t) => ({
          symptom: t.symptom,
          causes: [t.diagnosis],
          fixes: [t.fix],
          source: 'advanced',
        })),
      ];

      const matches = allIssues.filter((i) =>
        i.symptom.toLowerCase().includes(symptom) ||
        symptom.split(' ').some((w) => w.length > 3 && i.symptom.toLowerCase().includes(w)),
      );

      if (matches.length === 0) {
        return text(`No matches for "${args.symptom}".\n\n## All Known Issues\n${allIssues.map((i) => `- ${i.symptom}`).join('\n')}`);
      }

      let result = '';
      for (const m of matches) {
        result += `### ${m.symptom}\n`;
        result += `**Causes:** ${m.causes.join(', ')}\n`;
        result += `**Fixes:** ${m.fixes.join('; ')}\n\n`;
      }
      return text(result);
    }

    case 'eggs_distro_guide': {
      const distro = (args.distro as string).toLowerCase();
      const guide = DISTRO_INSTALL_GUIDES[distro];
      if (!guide) {
        const available = Object.keys(DISTRO_INSTALL_GUIDES).join(', ');
        return text(`No guide for "${distro}". Available: ${available}`);
      }
      return text(guide.trim());
    }

    case 'eggs_workflow': {
      const workflow = args.workflow as string;
      const guide = ADVANCED_WORKFLOWS[workflow as keyof typeof ADVANCED_WORKFLOWS];
      if (!guide) {
        const available = Object.keys(ADVANCED_WORKFLOWS).join(', ');
        return text(`No workflow "${workflow}". Available: ${available}`);
      }
      return text(guide.trim());
    }

    case 'eggs_calamares_info': {
      const module = args.module as string | undefined;
      if (module) {
        const info = CALAMARES_MODULES[module as keyof typeof CALAMARES_MODULES];
        if (!info) {
          const available = Object.keys(CALAMARES_MODULES).join(', ');
          return text(`Unknown module "${module}". Available: ${available}`);
        }
        return text(`## Calamares module: ${module}\n\n${info}`);
      }
      return text(`## Calamares Modules\n\n${Object.entries(CALAMARES_MODULES).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}`);
    }

    default:
      return text(`Unknown tool: ${name}`);
  }
}

// ─── MCP Protocol Handler ────────────────────────────────

function handleMessage(request: JsonRpcRequest): JsonRpcResponse {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'eggs-ai',
            version: '0.1.0',
          },
        },
      };

    case 'notifications/initialized':
      // No response needed for notifications
      return null as unknown as JsonRpcResponse;

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      };

    case 'tools/call': {
      const toolName = (params as { name: string }).name;
      const toolArgs = ((params as { arguments?: Record<string, unknown> }).arguments) || {};

      try {
        const result = handleTool(toolName, toolArgs);
        return { jsonrpc: '2.0', id, result };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : err}` }],
            isError: true,
          },
        };
      }
    }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

// ─── Stdio Transport ─────────────────────────────────────

function startMcpServer(): void {
  const rl = createInterface({
    input: process.stdin,
    terminal: false,
  });

  rl.on('line', (line) => {
    if (!line.trim()) return;

    try {
      const request = JSON.parse(line) as JsonRpcRequest;
      const response = handleMessage(request);

      // Don't send response for notifications
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (err) {
      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

// Start if run directly
startMcpServer();
