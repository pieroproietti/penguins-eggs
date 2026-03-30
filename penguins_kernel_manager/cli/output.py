"""CLI output helpers: colour, tables, JSON mode."""
from __future__ import annotations

import json
import os
import sys
from typing import Any, NoReturn

_NO_COLOR = not sys.stdout.isatty() or os.environ.get("NO_COLOR")

_RESET  = "" if _NO_COLOR else "\033[0m"
_BOLD   = "" if _NO_COLOR else "\033[1m"
_RED    = "" if _NO_COLOR else "\033[31m"
_GREEN  = "" if _NO_COLOR else "\033[32m"
_YELLOW = "" if _NO_COLOR else "\033[33m"
_CYAN   = "" if _NO_COLOR else "\033[36m"
_DIM    = "" if _NO_COLOR else "\033[2m"


def ok(msg: str) -> None:
    print(f"{_GREEN}✓{_RESET} {msg}")


def warn(msg: str) -> None:
    print(f"{_YELLOW}⚠{_RESET} {msg}", file=sys.stderr)


def err(msg: str) -> None:
    print(f"{_RED}✗{_RESET} {msg}", file=sys.stderr)


def die(msg: str, code: int = 1) -> NoReturn:
    err(msg)
    sys.exit(code)


def header(msg: str) -> None:
    print(f"\n{_BOLD}{_CYAN}{msg}{_RESET}")


def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, default=str))


def print_table(rows: list[list[str]], headers: list[str]) -> None:
    """Print a simple fixed-width table."""
    all_rows = [headers] + rows
    widths   = [max(len(r[i]) for r in all_rows) for i in range(len(headers))]
    sep      = "  "

    # Header
    header_line = sep.join(f"{_BOLD}{h:<{widths[i]}}{_RESET}" for i, h in enumerate(headers))
    print(header_line)
    print(_DIM + sep.join("-" * w for w in widths) + _RESET)

    for row in rows:
        print(sep.join(f"{cell:<{widths[i]}}" for i, cell in enumerate(row)))
