/**
 * plugins/dev-workflow/ts-ci/workflows.ts
 * TypeScript-defined GitHub Actions workflows for penguins-eggs.
 *
 * Uses emmanuelnk/github-actions-workflow-ts to define CI/CD pipelines
 * in TypeScript instead of YAML. Compile with: npx ts-node workflows.ts
 *
 * Benefits:
 * - Type checking catches workflow errors at compile time
 * - Reusable step/job definitions
 * - Consistent with eggs' TypeScript codebase
 *
 * Also compatible with:
 * - tsirysndr/fluent-github-actions (Deno)
 * - ForbesLindesay/github-actions-workflow-builder
 */

// This file generates YAML workflows. In a real setup, you'd import from
// github-actions-workflow-ts. Here we define the structure as typed objects
// that can be serialized to YAML.

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

// --- Type definitions matching GitHub Actions schema ---

interface Step {
  name: string
  uses?: string
  run?: string
  with?: Record<string, string | boolean | number>
  env?: Record<string, string>
  if?: string
}

interface Job {
  name: string
  'runs-on': string
  needs?: string[]
  strategy?: {
    matrix: Record<string, string[]>
    'fail-fast'?: boolean
  }
  steps: Step[]
}

interface Workflow {
  name: string
  on: Record<string, any>
  permissions?: Record<string, string>
  jobs: Record<string, Job>
}

// --- Reusable step builders ---

const checkoutStep: Step = {
  name: 'Checkout',
  uses: 'actions/checkout@v4',
}

const setupNodeStep = (version = '22'): Step => ({
  name: 'Setup Node.js',
  uses: 'actions/setup-node@v4',
  with: { 'node-version': version },
})

const installPnpmStep: Step = {
  name: 'Install pnpm',
  run: 'npm install -g pnpm',
}

const installDepsStep: Step = {
  name: 'Install dependencies',
  run: 'pnpm install --frozen-lockfile',
}

const buildStep: Step = {
  name: 'Build',
  run: 'pnpm run build',
}

const lintStep: Step = {
  name: 'Lint',
  run: 'pnpm run lint',
}

const testStep: Step = {
  name: 'Test',
  run: 'pnpm test',
}

// --- Workflow definitions ---

const ciWorkflow: Workflow = {
  name: 'CI',
  on: {
    push: { branches: ['master'] },
    pull_request: { branches: ['master'] },
  },
  permissions: {
    contents: 'read',
  },
  jobs: {
    build: {
      name: 'Build & Test',
      'runs-on': 'ubuntu-latest',
      steps: [
        checkoutStep,
        setupNodeStep(),
        installPnpmStep,
        installDepsStep,
        buildStep,
        lintStep,
        testStep,
      ],
    },
    'build-matrix': {
      name: 'Build on ${{ matrix.os }} / Node ${{ matrix.node }}',
      'runs-on': '${{ matrix.os }}',
      strategy: {
        matrix: {
          os: ['ubuntu-latest', 'ubuntu-22.04'],
          node: ['22'],
        },
        'fail-fast': false,
      },
      steps: [
        checkoutStep,
        {
          name: 'Setup Node.js ${{ matrix.node }}',
          uses: 'actions/setup-node@v4',
          with: { 'node-version': '${{ matrix.node }}' },
        },
        installPnpmStep,
        installDepsStep,
        buildStep,
      ],
    },
  },
}

const releaseWorkflow: Workflow = {
  name: 'Release',
  on: {
    push: { tags: ['v*'] },
  },
  permissions: {
    contents: 'write',
  },
  jobs: {
    release: {
      name: 'Build & Release',
      'runs-on': 'ubuntu-latest',
      steps: [
        checkoutStep,
        setupNodeStep(),
        installPnpmStep,
        installDepsStep,
        buildStep,
        {
          name: 'Build Debian package',
          run: 'pnpm run deb',
        },
        {
          name: 'Build AppImage',
          run: 'bash appimage.sh',
        },
        {
          name: 'Create GitHub Release',
          uses: 'softprops/action-gh-release@v2',
          with: {
            files: 'dist/*\nperrisbrewery/*.deb',
            generate_release_notes: true,
          },
        },
      ],
    },
  },
}

const isoTestWorkflow: Workflow = {
  name: 'ISO Test',
  on: {
    workflow_dispatch: {},
    schedule: [{ cron: '0 2 * * 0' }],  // Weekly Sunday 2am
  },
  permissions: {
    contents: 'read',
  },
  jobs: {
    'produce-iso': {
      name: 'Produce ISO on ${{ matrix.distro }}',
      'runs-on': 'ubuntu-latest',
      strategy: {
        matrix: {
          distro: ['debian-bookworm', 'ubuntu-noble'],
        },
        'fail-fast': false,
      },
      steps: [
        checkoutStep,
        {
          name: 'Setup container',
          run: [
            'sudo apt-get update',
            'sudo apt-get install -y debootstrap squashfs-tools xorriso',
          ].join('\n'),
        },
        setupNodeStep(),
        installPnpmStep,
        installDepsStep,
        buildStep,
        {
          name: 'Configure eggs',
          run: 'sudo ./bin/run.js config --nointeractive',
        },
        {
          name: 'Produce ISO',
          run: 'sudo ./bin/run.js produce --nointeractive --basename test-${{ matrix.distro }}',
        },
        {
          name: 'Verify ISO',
          run: [
            'ls -la /home/eggs/*.iso',
            'file /home/eggs/*.iso',
          ].join('\n'),
        },
      ],
    },
  },
}

// --- Generator ---

function generateWorkflows(outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true })

  const workflows: Record<string, Workflow> = {
    'ci.yml': ciWorkflow,
    'release.yml': releaseWorkflow,
    'iso-test.yml': isoTestWorkflow,
  }

  for (const [filename, workflow] of Object.entries(workflows)) {
    const yamlContent = yaml.dump(workflow, {
      lineWidth: 120,
      noRefs: true,
      quotingType: '"',
    })

    const header = `# Auto-generated from plugins/dev-workflow/ts-ci/workflows.ts\n# Do not edit directly — modify the TypeScript source and regenerate.\n\n`
    fs.writeFileSync(path.join(outputDir, filename), header + yamlContent)
    console.log(`Generated: ${filename}`)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const outputDir = process.argv[2] || '.github/workflows'
  generateWorkflows(outputDir)
}

export { generateWorkflows, ciWorkflow, releaseWorkflow, isoTestWorkflow }
