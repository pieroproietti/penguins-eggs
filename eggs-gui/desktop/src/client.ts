import * as net from "net";

const SOCKET_PATH = "/tmp/eggs-gui.sock";

interface RPCRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id: number;
}

interface RPCResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: { code: number; message: string };
  id?: number;
  method?: string; // for notifications
  params?: unknown; // for notifications
}

/**
 * JSON-RPC client that connects to the eggs-gui daemon via Unix socket.
 * Used by the NodeGUI desktop frontend.
 */
export class DaemonClient {
  private socket: net.Socket | null = null;
  private nextId = 0;
  private pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (err: Error) => void }
  >();
  private buffer = "";

  onNotification?: (method: string, params: unknown) => void;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(SOCKET_PATH, () => resolve());
      this.socket.on("error", reject);
      this.socket.on("data", (data) => this.handleData(data.toString()));
      this.socket.on("close", () => {
        this.socket = null;
      });
    });
  }

  disconnect(): void {
    this.socket?.destroy();
    this.socket = null;
  }

  async call(method: string, params?: unknown): Promise<unknown> {
    if (!this.socket) throw new Error("Not connected to daemon");

    const id = ++this.nextId;
    const request: RPCRequest = { jsonrpc: "2.0", method, params, id };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket!.write(JSON.stringify(request) + "\n");
    });
  }

  /**
   * Call a method that streams output via notifications.
   * onLine is called for each output line.
   */
  async callStream(
    method: string,
    params: unknown,
    onLine: (line: string) => void
  ): Promise<unknown> {
    const prevHandler = this.onNotification;
    this.onNotification = (notifMethod, notifParams) => {
      if (notifMethod === "stream.output") {
        const p = notifParams as { line?: string };
        if (p.line !== undefined) onLine(p.line);
      }
      prevHandler?.(notifMethod, notifParams);
    };

    try {
      return await this.call(method, params);
    } finally {
      this.onNotification = prevHandler;
    }
  }

  private handleData(data: string): void {
    this.buffer += data;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const resp: RPCResponse = JSON.parse(line);
        this.handleResponse(resp);
      } catch {
        // skip malformed JSON
      }
    }
  }

  private handleResponse(resp: RPCResponse): void {
    // Notification (no id)
    if (resp.id === undefined && resp.method) {
      this.onNotification?.(resp.method, resp.params);
      return;
    }

    // Response to a call
    if (resp.id !== undefined) {
      const pending = this.pending.get(resp.id);
      if (pending) {
        this.pending.delete(resp.id);
        if (resp.error) {
          pending.reject(new Error(resp.error.message));
        } else {
          pending.resolve(resp.result);
        }
      }
    }
  }
}
