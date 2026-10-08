#!/usr/bin/env python3
"""
sync.py - Sync and convert documentation from upload/sourceforge to upload/penguins-eggs.net

Replicates the directory tree from sourceforge to penguins-eggs.net, converting *.md files
into *.html (with UTF-8 and modern styling).
Structure mapping:
  Isos       -> isos
  Packages   -> packages
  AppImages  -> packages/appimage

Also provisions .htaccess to enforce UTF-8 charset and Apache mod_autoindex integration.
"""

import html
import os
import re
import shutil
import sys
from pathlib import Path

# Mapping from sourceforge top-level folder names to penguins-eggs.net structure
DIR_MAPPING = {
    "isos": "isos",
    "packages": "packages",
    "appimages": "packages/appimage",
    "appimage": "packages/appimage",
}


def map_rel_path(rel_path: Path) -> Path:
    """Maps a relative path from sourceforge to penguins-eggs.net structure.

    Isos       -> isos
    Packages   -> packages
    AppImages  -> packages/appimage
    """
    parts = rel_path.parts
    if not parts:
        return Path(".")

    first_lower = parts[0].lower()
    mapped_first = DIR_MAPPING.get(first_lower, parts[0])

    if first_lower == "packages" and len(parts) > 1 and parts[1].lower() in ("appimage", "appimages"):
        rest = ("appimage",) + parts[2:]
        return Path("packages") / Path(*rest)

    if len(parts) > 1:
        return Path(mapped_first) / Path(*parts[1:])
    return Path(mapped_first)


def rewrite_link(text: str, url: str, src_rel_dir: Path, dst_rel_dir: Path) -> tuple[str, str]:
    """Rewrites link text and URL, adjusting paths from sourceforge to penguins-eggs.net."""
    new_text = text.replace("README.md", "README.html")
    new_url = url.replace("README.md", "README.html")

    # Keep absolute URLs, mailto and anchor-only links untouched
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url) or url.startswith("mailto:") or url.startswith("#"):
        return new_text, new_url

    url_parts = url.split("#", 1)
    url_base = url_parts[0]
    fragment = f"#{url_parts[1]}" if len(url_parts) > 1 else ""

    if not url_base:
        return new_text, new_url

    has_trailing_slash = url_base.endswith("/")

    # Resolve link relative to src_rel_dir and map to dst structure
    resolved_src = os.path.normpath(str(src_rel_dir / url_base))
    mapped_dst = map_rel_path(Path(resolved_src))

    try:
        new_rel = os.path.relpath(str(mapped_dst), str(dst_rel_dir))
    except ValueError:
        return new_text, new_url

    if has_trailing_slash and not new_rel.endswith("/"):
        new_rel += "/"

    new_url = new_rel.replace("README.md", "README.html") + fragment

    # Adapt link text references if folder names were changed
    new_text = re.sub(r"\bAppImages\b", "appimage", new_text)
    new_text = re.sub(r"\bIsos\b", "isos", new_text)
    new_text = re.sub(r"\bPackages\b", "packages", new_text)

    return new_text, new_url


def md_to_html(
    content: str,
    title: str = "Penguins' Eggs",
    src_rel_dir: Path = Path("."),
    dst_rel_dir: Path = Path("."),
) -> str:
    """Converts markdown content into clean, responsive HTML with explicit UTF-8 encoding."""
    lines = content.splitlines()
    body_lines = []
    in_code_block = False
    code_lines = []
    in_list = False
    in_table = False

    def close_blocks():
        nonlocal in_list, in_table
        res = []
        if in_list:
            res.append("</ul>")
            in_list = False
        if in_table:
            res.append("</tbody></table>")
            in_table = False
        return res

    def replace_markdown_links(text: str) -> str:
        def repl(m):
            t, u = rewrite_link(m.group(1), m.group(2), src_rel_dir, dst_rel_dir)
            return f'<a href="{u}">{t}</a>'
        return re.sub(r"\[(.*?)\]\((.*?)\)", repl, text)

    for line in lines:
        stripped = line.strip()

        # Fenced code blocks
        if stripped.startswith("```"):
            if in_code_block:
                code_text = html.escape("\n".join(code_lines))
                body_lines.append(f"<pre><code>{code_text}</code></pre>")
                code_lines = []
                in_code_block = False
            else:
                body_lines.extend(close_blocks())
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Blank line
        if not stripped:
            body_lines.extend(close_blocks())
            continue

        # Horizontal rule
        if re.match(r"^(\-{3,}|\*{3,}|_{3,})$", stripped):
            body_lines.extend(close_blocks())
            body_lines.append("<hr>")
            continue

        # Headers
        h_match = re.match(r"^(#{1,6})\s+(.+)$", line)
        if h_match:
            body_lines.extend(close_blocks())
            level = len(h_match.group(1))
            h_text = h_match.group(2).strip()
            h_text = replace_markdown_links(h_text)
            body_lines.append(f"<h{level}>{h_text}</h{level}>")
            continue

        # Tables: | col1 | col2 |
        if stripped.startswith("|") and stripped.endswith("|"):
            if re.match(r"^\|[\s\-:|]+\|$", stripped):
                continue
            cells = [c.strip() for c in stripped[1:-1].split("|")]
            if not in_table:
                body_lines.extend(close_blocks())
                in_table = True
                th_cells = "".join(f"<th>{html.escape(c)}</th>" for c in cells)
                body_lines.append(f"<table><thead><tr>{th_cells}</tr></thead><tbody>")
            else:
                td_cells = []
                for c in cells:
                    c_fmt = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", c)
                    c_fmt = re.sub(r"`([^`]+)`", r"<code>\1</code>", c_fmt)
                    c_fmt = replace_markdown_links(c_fmt)
                    td_cells.append(f"<td>{c_fmt}</td>")
                body_lines.append(f"<tr>{' '.join(td_cells)}</tr>")
            continue
        elif in_table:
            body_lines.extend(close_blocks())

        # Unordered list items: * or -
        list_match = re.match(r"^[\*\-]\s+(.+)$", stripped)
        if list_match:
            if not in_list:
                body_lines.extend(close_blocks())
                body_lines.append("<ul>")
                in_list = True
            item_text = list_match.group(1)
            item_fmt = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", item_text)
            item_fmt = re.sub(r"`([^`]+)`", r"<code>\1</code>", item_fmt)
            item_fmt = replace_markdown_links(item_fmt)
            body_lines.append(f"<li>{item_fmt}</li>")
            continue
        elif in_list:
            body_lines.extend(close_blocks())

        # Ordered list items: 1. ...
        num_match = re.match(r"^(\d+)\.\s+(.+)$", stripped)
        if num_match:
            num = num_match.group(1)
            item_text = num_match.group(2)
            item_fmt = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", item_text)
            item_fmt = re.sub(r"`([^`]+)`", r"<code>\1</code>", item_fmt)
            item_fmt = replace_markdown_links(item_fmt)
            body_lines.append(f"<p><strong>{num}.</strong> {item_fmt}</p>")
            continue

        # Regular paragraph
        p_text = line
        # Image
        p_text = re.sub(r"\!\[(.*?)\]\((.*?)\)", r'<img src="\2" alt="\1">', p_text)
        # Link
        p_text = replace_markdown_links(p_text)
        # Bold & Code
        p_text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", p_text)
        p_text = re.sub(r"`([^`]+)`", r"<code>\1</code>", p_text)

        body_lines.append(f"<p>{p_text}</p>")

    body_lines.extend(close_blocks())
    body_content = "\n".join(body_lines)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html.escape(title)}</title>
<style>
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #24292e;
    max-width: 900px;
    margin: 30px auto;
    padding: 0 20px;
    background-color: #ffffff;
  }}
  h1, h2, h3, h4 {{
    color: #1a1a1a;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3em;
  }}
  h1 {{ font-size: 2em; border-bottom: 2px solid #eaecef; }}
  h2 {{ font-size: 1.5em; margin-top: 24px; }}
  h3 {{ font-size: 1.25em; border-bottom: none; }}
  a {{ color: #0366d6; text-decoration: none; }}
  a:hover {{ text-decoration: underline; }}
  pre {{
    background-color: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 88%;
    line-height: 1.45;
  }}
  code {{
    background-color: rgba(27,31,35,0.05);
    border-radius: 3px;
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
    padding: 0.2em 0.4em;
    font-size: 85%;
  }}
  pre code {{
    background-color: transparent;
    padding: 0;
  }}
  table {{
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
  }}
  th, td {{
    border: 1px solid #dfe2e5;
    padding: 8px 14px;
    text-align: left;
  }}
  th {{
    background-color: #f6f8fa;
    font-weight: 600;
  }}
  tr:nth-child(2n) {{
    background-color: #fafbfc;
  }}
  img {{
    max-width: 100%;
    height: auto;
    border-radius: 6px;
  }}
  hr {{
    border: 0;
    border-top: 1px solid #eaecef;
    margin: 24px 0;
  }}
  ul {{
    padding-left: 20px;
  }}
  li {{
    margin-bottom: 4px;
  }}
</style>
</head>
<body>
{body_content}
</body>
</html>
"""


def extract_title(content: str, default: str = "Penguins' Eggs") -> str:
    """Extracts first H1 header title from markdown content."""
    for line in content.splitlines():
        m = re.match(r"^#\s+(.+)$", line.strip())
        if m:
            clean = re.sub(r"[\*_`#]", "", m.group(1)).strip()
            return clean
    return default


def write_htaccess(dst_dir: Path) -> None:
    """Creates a .htaccess file ensuring UTF-8 and proper Apache autoindex integration."""
    content = """# Apache configuration for penguins-eggs.net
# Force UTF-8 default charset for all text & html files
AddDefaultCharset UTF-8
AddCharset UTF-8 .html .htm .txt .md

# Use README.html for directory index descriptions (mod_autoindex)
<IfModule mod_autoindex.c>
    ReadmeName README.html
    IndexOptions +FancyIndexing +HTMLTable +VersionSort +NameWidth=* +DescriptionWidth=* +Charset=UTF-8
</IfModule>
"""
    ht = dst_dir / ".htaccess"
    ht.write_text(content, encoding="utf-8")
    print(f"  [CONFIG]  Generated .htaccess in {dst_dir.name}")


def sync_folders(src_dir: Path, dst_dir: Path) -> None:
    """Synchronizes src_dir structure into dst_dir, converting md files to html."""
    if not src_dir.exists():
        print(f"Error: Source directory {src_dir} does not exist.", file=sys.stderr)
        sys.exit(1)

    dst_dir.mkdir(parents=True, exist_ok=True)

    print(f"Syncing:\n  Source:      {src_dir}\n  Destination: {dst_dir}\n")

    # Generate .htaccess in root destination
    write_htaccess(dst_dir)

    processed_dst_files = {(dst_dir / ".htaccess").resolve()}
    processed_dst_dirs = set()

    for root, dirs, files in os.walk(src_dir):
        rel_root = Path(root).relative_to(src_dir)
        target_rel_root = map_rel_path(rel_root)
        target_root = dst_dir / target_rel_root
        target_root.mkdir(parents=True, exist_ok=True)

        # Track directory and all parent directories up to dst_dir
        curr = target_root.resolve()
        while curr != dst_dir.resolve() and curr != curr.parent:
            processed_dst_dirs.add(curr)
            curr = curr.parent

        for f in sorted(files):
            src_file = Path(root) / f
            if f.endswith(".md"):
                content = src_file.read_text(encoding="utf-8")
                doc_title = extract_title(content, default=f"Penguins' Eggs — {rel_root.name or 'Documentation'}")

                # Generate .html
                html_name = f[:-3] + ".html"
                html_file = target_root / html_name
                html_content = md_to_html(content, title=doc_title, src_rel_dir=rel_root, dst_rel_dir=target_rel_root)
                html_file.write_text(html_content, encoding="utf-8")
                print(f"  [HTML]    {rel_root / f} -> {target_rel_root / html_name}")
                processed_dst_files.add(html_file.resolve())
            else:
                dst_file = target_root / f
                shutil.copy2(src_file, dst_file)
                print(f"  [COPY]    {rel_root / f} -> {target_rel_root / f}")
                processed_dst_files.add(dst_file.resolve())

    # Clean up obsolete files/folders
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
