#!/usr/bin/env python3
"""
sync.py - Sync and convert documentation from upload/sourceforge to upload/penguins-eggs.net

Replicates the directory tree from sourceforge to penguins-eggs.net, converting *.md files
into both *.html (with UTF-8 and modern styling) and *.txt (plain text).
Also provisions .htaccess to enforce UTF-8 charset and Apache mod_autoindex integration.
"""

import html
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
        cur = cur.replace("README.md", "README.txt")

        # Inline code
        cur = re.sub(r"`+([^`\n]+)`+", r"\1", cur)

        # Bold & Italic
        cur = re.sub(r"\*\*(.*?)\*\*", r"\1", cur)
        cur = re.sub(r"__(.*?)__", r"\1", cur)
        cur = re.sub(r"(?<!\*)\*(?!\*)([^\n\*]+)\*", r"\1", cur)

        out.append(cur)

    res = "\n".join(out)
    res = re.sub(r"\n{3,}", "\n\n", res)
    return res.strip() + "\n"


def md_to_html(content: str, title: str = "Penguins' Eggs") -> str:
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
            # Update links inside headers: [text](url) -> <a href="url">text</a>
            def repl_header_link(m):
                t, u = m.group(1), m.group(2)
                u = u.replace("README.md", "README.html")
                return f'<a href="{u}">{t}</a>'
            h_text = re.sub(r"\[(.*?)\]\((.*?)\)", repl_header_link, h_text)
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
                    def repl_table_link(m):
                        t, u = m.group(1), m.group(2).replace("README.md", "README.html")
                        return f'<a href="{u}">{t}</a>'
                    c_fmt = re.sub(r"\[(.*?)\]\((.*?)\)", repl_table_link, c_fmt)
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
            def repl_list_link(m):
                t, u = m.group(1), m.group(2).replace("README.md", "README.html")
                return f'<a href="{u}">{t}</a>'
            item_fmt = re.sub(r"\[(.*?)\]\((.*?)\)", repl_list_link, item_fmt)
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
            def repl_num_link(m):
                t, u = m.group(1), m.group(2).replace("README.md", "README.html")
                return f'<a href="{u}">{t}</a>'
            item_fmt = re.sub(r"\[(.*?)\]\((.*?)\)", repl_num_link, item_fmt)
            body_lines.append(f"<p><strong>{num}.</strong> {item_fmt}</p>")
            continue

        # Regular paragraph
        p_text = line
        # Image
        p_text = re.sub(r"\!\[(.*?)\]\((.*?)\)", r'<img src="\2" alt="\1">', p_text)
        # Link
        def repl_p_link(m):
            t, u = m.group(1), m.group(2).replace("README.md", "README.html")
            return f'<a href="{u}">{t}</a>'
        p_text = re.sub(r"\[(.*?)\]\((.*?)\)", repl_p_link, p_text)
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

# Use README.html or README.txt for directory index descriptions (mod_autoindex)
<IfModule mod_autoindex.c>
    ReadmeName README.html
    IndexOptions +FancyIndexing +HTMLTable +VersionSort +NameWidth=* +DescriptionWidth=* +Charset=UTF-8
</IfModule>
"""
    ht = dst_dir / ".htaccess"
    ht.write_text(content, encoding="utf-8")
    print(f"  [CONFIG]  Generated .htaccess in {dst_dir.name}")


def sync_folders(src_dir: Path, dst_dir: Path) -> None:
    """Synchronizes src_dir structure into dst_dir, converting md files to html and txt."""
    if not src_dir.exists():
        print(f"Error: Source directory {src_dir} does not exist.", file=sys.stderr)
        sys.exit(1)

    dst_dir.mkdir(parents=True, exist_ok=True)

    print(f"Syncing:\n  Source:      {src_dir}\n  Destination: {dst_dir}\n")

    # Generate .htaccess in root destination
    write_htaccess(dst_dir)

    processed_dst_files = { (dst_dir / ".htaccess").resolve() }
    processed_dst_dirs = set()

    for root, dirs, files in os.walk(src_dir):
        rel_root = Path(root).relative_to(src_dir)
        target_root = dst_dir / rel_root
        target_root.mkdir(parents=True, exist_ok=True)
        processed_dst_dirs.add(target_root.resolve())

        for f in sorted(files):
            src_file = Path(root) / f
            if f.endswith(".md"):
                content = src_file.read_text(encoding="utf-8")
                doc_title = extract_title(content, default=f"Penguins' Eggs — {rel_root.name or 'Documentation'}")

                # 1. Generate .html
                html_name = f[:-3] + ".html"
                html_file = target_root / html_name
                html_content = md_to_html(content, title=doc_title)
                html_file.write_text(html_content, encoding="utf-8")
                print(f"  [HTML]    {rel_root / f} -> {rel_root / html_name}")
                processed_dst_files.add(html_file.resolve())

                # 2. Generate .txt
                txt_name = f[:-3] + ".txt"
                txt_file = target_root / txt_name
                txt_content = md_to_txt(content)
                txt_file.write_text(txt_content, encoding="utf-8")
                print(f"  [TXT]     {rel_root / f} -> {rel_root / txt_name}")
                processed_dst_files.add(txt_file.resolve())
            else:
                dst_file = target_root / f
                shutil.copy2(src_file, dst_file)
                print(f"  [COPY]    {rel_root / f} -> {rel_root / f}")
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
