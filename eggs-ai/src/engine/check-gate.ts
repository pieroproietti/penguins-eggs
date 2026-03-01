/**
 * Safety check-gate for destructive eggs commands.
 * Adapted from myclaw's check-gate, specialized for penguins-eggs operations.
 */

export interface CheckFailure {
  sessionId: string;
  checker: string;
  command: string;
  reason: string;
  createdAt: string;
}

export type ApprovalCallback = (request: { command: string; reason: string }) => Promise<boolean> | boolean;

const DESTRUCTIVE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\beggs\s+produce\b/, reason: 'ISO production modifies the filesystem and creates large files' },
  { pattern: /\beggs\s+kill\b/, reason: 'Kills running eggs processes and cleans up work directories' },
  { pattern: /\beggs\s+config\s+--clean\b/, reason: 'Removes existing eggs configuration' },
  { pattern: /\brm\s+-rf?\b/, reason: 'Recursive file deletion' },
  { pattern: /\bmkfs\b/, reason: 'Filesystem formatting' },
  { pattern: /\bdd\s+/, reason: 'Direct disk write' },
  { pattern: /\bfdisk\b|\bparted\b/, reason: 'Disk partitioning' },
  { pattern: /\bsystemctl\s+(stop|disable|mask)\b/, reason: 'Service management' },
  { pattern: /\bapt\s+(remove|purge|autoremove)\b/, reason: 'Package removal' },
  { pattern: /\bdnf\s+(remove|erase)\b/, reason: 'Package removal' },
  { pattern: /\bpacman\s+-R/, reason: 'Package removal' },
];

const SAFE_PATTERNS: RegExp[] = [
  /\beggs\s+(status|info|version|--version|--help)\b/,
  /\bcat\b/, /\bls\b/, /\bdf\b/, /\bfree\b/, /\buname\b/,
  /\bwhich\b/, /\bwhoami\b/, /\bpwd\b/, /\bhead\b/, /\btail\b/, /\bgrep\b/, /\bfind\b/,
];

class CheckGateImpl {
  private readonly failures: CheckFailure[] = [];
  private approvalCallback: ApprovalCallback | null = null;

  setApprovalCallback(cb: ApprovalCallback): void { this.approvalCallback = cb; }

  async validate(command: string, sessionId = 'default'): Promise<{ allowed: true } | { allowed: false; reason: string }> {
    const trimmed = command.trim();
    if (SAFE_PATTERNS.some((p) => p.test(trimmed))) return { allowed: true };

    for (const { pattern, reason } of DESTRUCTIVE_PATTERNS) {
      if (pattern.test(trimmed)) {
        if (this.approvalCallback) {
          const approved = await this.approvalCallback({ command: trimmed, reason });
          if (approved) return { allowed: true };
        }
        this.failures.push({ sessionId, checker: 'eggs-safety', command: trimmed, reason, createdAt: new Date().toISOString() });
        if (this.failures.length > 50) this.failures.splice(0, this.failures.length - 50);
        return { allowed: false, reason: `Blocked: ${reason}. Command: ${trimmed}` };
      }
    }
    return { allowed: true };
  }

  getFailures(sessionId: string): CheckFailure[] { return this.failures.filter((f) => f.sessionId === sessionId); }
  clearFailures(sessionId: string): void {
    for (let i = this.failures.length - 1; i >= 0; i--) {
      if (this.failures[i].sessionId === sessionId) this.failures.splice(i, 1);
    }
  }
}

export const checkGate = new CheckGateImpl();
