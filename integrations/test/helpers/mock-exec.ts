/**
 * test/helpers/mock-exec.ts
 * Mock exec function for testing plugins without running real shell commands.
 *
 * Records all commands and returns configurable responses.
 */

export interface ExecCall {
  command: string
  opts?: { capture?: boolean; echo?: boolean }
}

export interface ExecResult {
  code: number
  data: string
  error?: string
}

export type ExecResponse = ExecResult | ((cmd: string) => ExecResult)

/**
 * Creates a mock exec function that records calls and returns preset responses.
 */
export function createMockExec(responses?: Map<string | RegExp, ExecResponse>) {
  const calls: ExecCall[] = []
  const responseMap = responses || new Map()

  const mockExec = async (
    command: string,
    opts?: { capture?: boolean; echo?: boolean }
  ): Promise<ExecResult> => {
    calls.push({ command, opts })

    // Check for matching response
    for (const [pattern, response] of responseMap) {
      const matches = typeof pattern === 'string'
        ? command.includes(pattern)
        : pattern.test(command)

      if (matches) {
        return typeof response === 'function' ? response(command) : response
      }
    }

    // Default: success with empty output
    return { code: 0, data: '' }
  }

  return {
    exec: mockExec,
    calls,
    /**
     * Get all commands that were called.
     */
    getCommands(): string[] {
      return calls.map(c => c.command)
    },
    /**
     * Check if a command matching the pattern was called.
     */
    wasCalled(pattern: string | RegExp): boolean {
      return calls.some(c =>
        typeof pattern === 'string'
          ? c.command.includes(pattern)
          : pattern.test(c.command)
      )
    },
    /**
     * Get the number of times a command matching the pattern was called.
     */
    callCount(pattern: string | RegExp): number {
      return calls.filter(c =>
        typeof pattern === 'string'
          ? c.command.includes(pattern)
          : pattern.test(c.command)
      ).length
    },
    /**
     * Reset recorded calls.
     */
    reset(): void {
      calls.length = 0
    },
  }
}

/**
 * Preset responses for common commands.
 */
export const COMMON_RESPONSES = {
  gitLfsInstalled: new Map<string | RegExp, ExecResponse>([
    ['command -v git-lfs', { code: 0, data: '/usr/bin/git-lfs' }],
  ]),

  gitLfsNotInstalled: new Map<string | RegExp, ExecResponse>([
    ['command -v git-lfs', { code: 1, data: '', error: 'not found' }],
  ]),

  brigAvailable: new Map<string | RegExp, ExecResponse>([
    ['command -v brig', { code: 0, data: '/usr/bin/brig' }],
    ['brig whoami', { code: 0, data: 'eggs@local' }],
  ]),

  brigNotAvailable: new Map<string | RegExp, ExecResponse>([
    ['command -v brig', { code: 1, data: '' }],
  ]),

  ipfsRunning: new Map<string | RegExp, ExecResponse>([
    ['ipfs id', { code: 0, data: '{"ID":"QmTest"}' }],
  ]),

  btrfsRoot: new Map<string | RegExp, ExecResponse>([
    [/stat -f -c %T/, { code: 0, data: 'btrfs' }],
    ['command -v btrfs', { code: 0, data: '/usr/sbin/btrfs' }],
  ]),

  nonBtrfsRoot: new Map<string | RegExp, ExecResponse>([
    [/stat -f -c %T/, { code: 0, data: 'ext2/ext3' }],
  ]),

  gitfsInstalled: new Map<string | RegExp, ExecResponse>([
    ['command -v gitfs', { code: 0, data: '/usr/bin/gitfs' }],
    ['command -v fusermount', { code: 0, data: '/usr/bin/fusermount' }],
  ]),
}
