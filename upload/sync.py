#!/usr/bin/env python3
"""
sync.py - Sync and convert documentation from upload/sourceforge to upload/penguins-eggs.net

Replicates the directory tree from sourceforge to penguins-eggs.net,
converting *.md files (like README.md) into cleanly formatted *.txt files (like README.txt).
"""

import os
import re
import shutil
import sys
from pathlib import Path


def md_to_txt(content: str) -> str:
    """Converts markdown content into clean, readable plain text."""
    lines = content.splitlines()
    out = []
    in_code_block = False

    for line in lines:
        stripped = line.strip()

        # Handle fenced code blocks (``` ... ```)
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            out.append("")
            continue

        if in_code_block:
            # Preserve exact spacing inside code blocks / diagrams
            out.append(line)
            continue

        # Headers
        h1 = re.match(r"^#\s+(.+)$", line)
        h2 = re.match(r"^##\s+(.+)$", line)
        h3 = re.match(r"^###\s+(.+)$", line)
        h4 = re.match(r"^####+\s+(.+)$", line)

        if h1:
            title = h1.group(1).strip()
            title = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1 (\2)", title)
            title = re.sub(r"[\*_`]{1,3}", "", title)
            sep = "=" * max(len(title) + 4, 50)
            out.append("")
            out.append(sep)
            out.append(title)
            out.append(sep)
            out.append("")
            continue
        elif h2:
            title = h2.group(1).strip()
            title = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1 (\2)", title)
            title = re.sub(r"[\*_`]{1,3}", "", title)
            sep = "-" * max(len(title) + 4, 50)
            out.append("")
            out.append(title)
            out.append(sep)
            continue
        elif h3:
            title = h3.group(1).strip()
            title = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1 (\2)", title)
            title = re.sub(r"[\*_`]{1,3}", "", title)
            out.append("")
            out.append(f"-- {title} --")
            continue
        elif h4:
            title = h4.group(1).strip()
            title = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1 (\2)", title)
            title = re.sub(r"[\*_`]{1,3}", "", title)
            out.append("")
            out.append(f"  * {title}:")
            continue

        # Horizontal rules
        if re.match(r"^(\-{3,}|\*{3,}|_{3,})$", stripped):
            out.append("----------------------------------------------------------------------")
            continue

        cur = line

        # Images: ![alt](url) -> [Image: alt]
        def repl_img(m):
            alt, url = m.group(1).strip(), m.group(2).strip()
            if alt:
                return f"[Image: {alt}]"
            return f"[Image: {url}]"

        cur = re.sub(r"\!\[(.*?)\]\((.*?)\)", repl_img, cur)

        # Links: [text](url) -> text (url)
        def repl_link(m):
            text, url = m.group(1).strip(), m.group(2).strip()
            url = url.replace("README.md", "README.txt")
            if text == url:
                return url
            return f"{text} ({url})"

        cur = re.sub(r"\[(.*?)\]\((.*?)\)", repl_link, cur)

        # Update any leftover references to README.md in plain text
        cur = cur.replace("README.md", "README.txt")

        # Inline code: ```code``` or `code`
        cur = re.sub(r"`+([^`\n]+)`+", r"\1", cur)

        # Bold & Italic: **bold**, __bold__, *italic*, _italic_
        cur = re.sub(r"\*\*(.*?)\*\*", r"\1", cur)
        cur = re.sub(r"__(.*?)__", r"\1", cur)
        cur = re.sub(r"(?<!\*)\*(?!\*)([^\n\*]+)\*", r"\1", cur)

        out.append(cur)

    # Normalize multiple consecutive blank lines to max 2
    res = "\n".join(out)
    res = re.sub(r"\n{3,}", "\n\n", res)
    return res.strip() + "\n"


def sync_folders(src_dir: Path, dst_dir: Path) -> None:
    """Synchronizes src_dir structure into dst_dir, converting md files to txt."""
    if not src_dir.exists():
        print(f"Error: Source directory {src_dir} does not exist.", file=sys.stderr)
        sys.exit(1)

    dst_dir.mkdir(parents=True, exist_ok=True)

    print(f"Syncing:\n  Source:      {src_dir}\n  Destination: {dst_dir}\n")

    # 1. Walk src_dir to replicate directories and convert/copy files
    processed_dst_files = set()
    processed_dst_dirs = set()

    for root, dirs, files in os.walk(src_dir):
        rel_root = Path(root).relative_to(src_dir)
        target_root = dst_dir / rel_root
        target_root.mkdir(parents=True, exist_ok=True)
        processed_dst_dirs.add(target_root.resolve())

        for f in sorted(files):
            src_file = Path(root) / f
            if f.endswith(".md"):
                # Convert .md to .txt
                dst_name = f[:-3] + ".txt"
                dst_file = target_root / dst_name
                content = src_file.read_text(encoding="utf-8")
                converted = md_to_txt(content)
                dst_file.write_text(converted, encoding="utf-8")
                print(f"  [CONVERT] {rel_root / f} -> {rel_root / dst_name}")
            else:
                # Copy regular files as-is
                dst_file = target_root / f
                shutil.copy2(src_file, dst_file)
                print(f"  [COPY]    {rel_root / f} -> {rel_root / f}")

            processed_dst_files.add(dst_file.resolve())

    # 2. Clean up files and folders in dst_dir that no longer exist in src_dir
    for root, dirs, files in os.walk(dst_dir, topdown=False):
        for f in files:
            p = (Path(root) / f).resolve()
            if p not in processed_dst_files:
                p.unlink()
                print(f"  [CLEAN]   Removed obsolete file: {p.relative_to(dst_dir)}")
        for d in dirs:
            p = (Path(root) / d).resolve()
            if p not in processed_dst_dirs and not any(p.iterdir()):
                p.rmdir()
                print(f"  [CLEAN]   Removed obsolete dir:  {p.relative_to(dst_dir)}")

    print("\nSynchronization completed successfully!")


def main():
    script_dir = Path(__file__).resolve().parent
    src = script_dir / "sourceforge"
    dst = script_dir / "penguins-eggs.net"

    if len(sys.argv) > 1:
        src = Path(sys.argv[1]).resolve()
    if len(sys.argv) > 2:
        dst = Path(sys.argv[2]).resolve()

    sync_folders(src, dst)


if __name__ == "__main__":
    main()
