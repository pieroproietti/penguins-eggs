"""JSON-RPC client for the eggs-gui daemon over Unix socket."""

import json
import socket
import threading
from typing import Any, Callable, Optional

SOCKET_PATH = "/tmp/eggs-gui.sock"


class DaemonClient:
    """Connects to the eggs-gui Go daemon via JSON-RPC over Unix socket."""

    def __init__(self):
        self._sock: Optional[socket.socket] = None
        self._next_id = 0
        self._lock = threading.Lock()

    def connect(self):
        self._sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self._sock.connect(SOCKET_PATH)

    def close(self):
        if self._sock:
            self._sock.close()
            self._sock = None

    def call(self, method: str, params: Any = None) -> Any:
        """Make a JSON-RPC call and return the result."""
        with self._lock:
            self._next_id += 1
            request = {
                "jsonrpc": "2.0",
                "method": method,
                "params": params or {},
                "id": self._next_id,
            }
            self._send(request)

            while True:
                resp = self._recv()
                # Skip notifications
                if "id" not in resp or resp.get("id") is None:
                    continue
                if resp.get("error"):
                    raise Exception(resp["error"]["message"])
                return resp.get("result")

    def call_stream(
        self,
        method: str,
        params: Any = None,
        on_line: Optional[Callable[[str], None]] = None,
    ) -> Any:
        """Make a JSON-RPC call that streams output via notifications."""
        with self._lock:
            self._next_id += 1
            request = {
                "jsonrpc": "2.0",
                "method": method,
                "params": params or {},
                "id": self._next_id,
            }
            self._send(request)

            while True:
                resp = self._recv()
                # Handle notification
                if ("id" not in resp or resp.get("id") is None) and resp.get("method") == "stream.output":
                    line = resp.get("params", {}).get("line", "")
                    if on_line:
                        on_line(line)
                    continue
                # Final response
                if resp.get("error"):
                    raise Exception(resp["error"]["message"])
                return resp.get("result")

    def _send(self, data: dict):
        raw = json.dumps(data) + "\n"
        self._sock.sendall(raw.encode())

    def _recv(self) -> dict:
        buf = b""
        while True:
            chunk = self._sock.recv(4096)
            if not chunk:
                raise ConnectionError("Daemon disconnected")
            buf += chunk
            if b"\n" in buf:
                line, _ = buf.split(b"\n", 1)
                return json.loads(line)
