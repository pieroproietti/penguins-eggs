import re


DEFINE_START_RE = re.compile(r"{{\s*define\s*\"([^\"]+)\"\s*}}", re.S)
DEFINE_TOKEN_RE = re.compile(r"{{\s*(?:define\s*\"[^\"]+\"|if\s+\.[A-Za-z_][A-Za-z0-9_]*|end\s*)\s*}}", re.S)
INCLUDE_RE = re.compile(r"(^[ \t]*)?{{\s*(?:include|template)\s*\"([^\"]+)\"\s*\.\s*(?:\|\s*indent\s+(\d+))?\s*}}", re.S | re.M)
IF_RE = re.compile(r"{{\s*if\s+\.([A-Za-z_][A-Za-z0-9_]*)\s*}}(.*?)((?:{{\s*else\s*}})(.*?))?{{\s*end\s*}}", re.S)


class TemplateRenderer:
    def __init__(self):
        self.templates = {}

    def add_definitions(self, content: str) -> None:
        offset = 0
        while True:
            match = DEFINE_START_RE.search(content, offset)
            if not match:
                break
            name = match.group(1)
            body_start = match.end()
            depth = 1
            cursor = body_start
            while depth > 0:
                token = DEFINE_TOKEN_RE.search(content, cursor)
                if not token:
                    raise ValueError(f"Unterminated definition for {name}")
                token_text = token.group(0)
                if token_text.startswith("{{") and token_text.endswith("}}"):
                    if token_text.strip().startswith("{{ if"):
                        depth += 1
                    elif token_text.strip().startswith("{{ define"):
                        depth += 1
                    elif token_text.strip().startswith("{{ end"):
                        depth -= 1
                cursor = token.end()
            body = content[body_start:token.start()].strip("\n")
            self.templates[name] = body
            offset = cursor

    def strip_definitions(self, content: str) -> str:
        output = []
        offset = 0
        while True:
            match = DEFINE_START_RE.search(content, offset)
            if not match:
                output.append(content[offset:])
                break
            output.append(content[offset:match.start()])
            depth = 1
            cursor = match.end()
            while depth > 0:
                token = DEFINE_TOKEN_RE.search(content, cursor)
                if not token:
                    raise ValueError("Unterminated template definition")
                token_text = token.group(0)
                if token_text.strip().startswith("{{ if") or token_text.strip().startswith("{{ define"):
                    depth += 1
                elif token_text.strip().startswith("{{ end"):
                    depth -= 1
                cursor = token.end()
            offset = cursor
        return "".join(output)

    def render(self, content: str, context: dict | None = None) -> str:
        if context is None:
            context = {}
        self.context = context
        text = self.strip_definitions(content)
        previous = None
        while previous != text:
            previous = text
            text = self._render_once(text)
        return text

    def _render_once(self, text: str) -> str:
        def replace_if(match):
            variable = match.group(1)
            true_body = match.group(2)
            else_body = match.group(4) or ""
            value = bool(self.context.get(variable))
            return true_body if value else else_body

        text = IF_RE.sub(replace_if, text)

        def replace(match):
            prefix = match.group(1) or ""
            name = match.group(2)
            explicit_indent = match.group(3)
            body = self.templates.get(name)
            if body is None:
                return match.group(0)
            rendered = body
            indent = int(explicit_indent) if explicit_indent else len(prefix)
            if indent:
                rendered = self.indent(rendered, indent)
            return rendered

        return INCLUDE_RE.sub(replace, text)

    @staticmethod
    def indent(text: str, spaces: int) -> str:
        prefix = " " * spaces
        lines = text.splitlines()
        if not lines:
            return ""
        return "\n".join(prefix + line if line.strip() else line for line in lines)
