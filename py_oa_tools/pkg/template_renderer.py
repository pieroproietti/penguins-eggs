import re


DEFINE_RE = re.compile(r"{{\s*define\s*\"([^\"]+)\"\s*}}(.*?){{\s*end\s*}}", re.S)
INCLUDE_RE = re.compile(r"(^[ \t]*){{\s*(?:include|template)\s*\"([^\"]+)\"\s*\.\s*(?:\|\s*indent\s+(\d+))?\s*}}", re.S | re.M)


class TemplateRenderer:
    def __init__(self):
        self.templates = {}

    def add_definitions(self, content: str) -> None:
        for match in DEFINE_RE.findall(content):
            name, body = match
            self.templates[name] = body.strip("\n")

    def strip_definitions(self, content: str) -> str:
        return DEFINE_RE.sub("", content)

    def render(self, content: str) -> str:
        text = self.strip_definitions(content)
        previous = None
        while previous != text:
            previous = text
            text = self._render_once(text)
        return text

    def _render_once(self, text: str) -> str:
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
