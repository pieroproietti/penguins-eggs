import { connect } from 'node:net';

/**
 * JSON-RPC client for the eggs-gui daemon.
 * Connects over Unix socket at /tmp/eggs-gui.sock.
 *
 * This lets eggs-ai read live system state from the daemon
 * instead of re-inspecting the system directly — giving it
 * the same data the GUI frontends see.
 */

const DEFAULT_SOCKET = '/tmp/eggs-gui.sock';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export class DaemonClient {
  private socketPath: string;
  private nextId = 1;

  constructor(socketPath = DEFAULT_SOCKET) {
    this.socketPath = socketPath;
  }

  /**
   * Send a JSON-RPC request to the daemon and return the result.
   */
  async call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: this.nextId++,
        method,
        params,
      };

      const socket = connect(this.socketPath);
      let data = '';

      socket.on('connect', () => {
        socket.write(JSON.stringify(request) + '\n');
      });

      socket.on('data', (chunk) => {
        data += chunk.toString();
        // Try to parse complete JSON-RPC responses (newline-delimited)
        const lines = data.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const response = JSON.parse(line) as JsonRpcResponse;
            if (response.id === request.id) {
              socket.end();
              if (response.error) {
                reject(new Error(`Daemon error: ${response.error.message}`));
              } else {
                resolve(response.result as T);
              }
            }
          } catch {
            // Incomplete JSON, wait for more data
          }
        }
      });

      socket.on('error', (err) => {
        reject(new Error(`Cannot connect to eggs-gui daemon at ${this.socketPath}: ${err.message}`));
      });

      socket.setTimeout(30000, () => {
        socket.destroy();
        reject(new Error('Daemon request timed out'));
      });
    });
  }

  /**
   * Check if the daemon is running and reachable.
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.call('system.versions');
      return true;
    } catch {
      return false;
    }
  }

  // ─── Typed convenience methods matching eggs-gui.json schema ───

  async getConfig(): Promise<Record<string, unknown>> {
    return this.call('config.read');
  }

  async getVersions(): Promise<{ eggs: string; calamares: string; distro: string; kernel: string }> {
    return this.call('system.versions');
  }

  async checkDeps(): Promise<{ eggsInstalled: boolean; calamaresInstalled: boolean; configExists: boolean }> {
    return this.call('system.checkDeps');
  }

  async listISOs(): Promise<Array<{ path: string; name: string; size: number; modified: string }>> {
    return this.call('iso.list');
  }

  async listWardrobe(): Promise<{ costumes: string[]; accessories: string[]; servers: string[] }> {
    return this.call('wardrobe.list');
  }

  async getStatus(): Promise<{ taskId: string }> {
    return this.call('eggs.status');
  }
}
