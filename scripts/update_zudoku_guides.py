#!/usr/bin/env python3
"""
Rewrite the guides list in zudoku.config.tsx based on the MDX files in pages/guides/.

For each MDX file (except overview.mdx) the title is read from the YAML front-matter.
Entries are sorted alphabetically by title.  The overview entry is always first.

Usage: update_zudoku_guides.py GUIDES_DIR ZUDOKU_CONFIG
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


FRONT_MATTER_TITLE = re.compile(r'^title:\s*["\']?(.+?)["\']?\s*$', re.MULTILINE)

# Matches the entire items array inside the "Guides" navigation category.
# Captures the indentation of the first item so we can reproduce it.
GUIDES_ITEMS_PATTERN = re.compile(
    r'(label:\s*"Guides"[^[]*items:\s*\[)'  # up to and including "items: ["
    r'(.*?)'                                  # the current list content (group 2)
    r'(\s*\])',                               # closing "]" with optional whitespace
    re.DOTALL,
)


def extract_title(mdx_path: Path) -> str:
    text = mdx_path.read_text(encoding="utf-8")
    m = FRONT_MATTER_TITLE.search(text)
    if m:
        return m.group(1).strip()
    # Fall back to the stem if no front-matter title is found
    return mdx_path.stem


def build_items_block(guides_dir: Path, indent: str) -> str:
    entries: list[tuple[str, str]] = []  # (title, slug)

    for mdx in guides_dir.glob("*.mdx"):
        if mdx.stem == "overview":
            continue
        title = extract_title(mdx)
        entries.append((title, mdx.stem))

    entries.sort(key=lambda t: t[0].casefold())

    lines: list[str] = []
    lines.append(f'{indent}//TODO: Please keep this list sorted by titles, not filenames !!')
    lines.append(f'{indent}"/guides/overview", // Guides Overview')
    for title, slug in entries:
        lines.append(f'{indent}"/guides/{slug}", // {title}')

    return "\n".join(lines) + "\n"


def update_config(guides_dir: Path, config_path: Path) -> None:
    content = config_path.read_text(encoding="utf-8")

    match = GUIDES_ITEMS_PATTERN.search(content)
    if not match:
        print("❌  Could not locate the Guides items list in zudoku.config.tsx", file=sys.stderr)
        sys.exit(1)

    # Detect indentation from the first non-empty line inside the current block
    current_block = match.group(2)
    indent_match = re.search(r'\n(\s+)"/', current_block)
    indent = indent_match.group(1) if indent_match else "        "

    new_block = build_items_block(guides_dir, indent)

    new_content = (
        content[: match.start(2)]
        + "\n"
        + new_block
        + "      ]"  # closing "]" with fixed indentation, replacing the captured \s*\]
        + content[match.end(3):]
    )

    config_path.write_text(new_content, encoding="utf-8")
    print(f"  ✅ Updated guides list in {config_path.name} "
          f"({len(new_block.splitlines()) - 2} guide entries)")


def main() -> None:
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} GUIDES_DIR ZUDOKU_CONFIG", file=sys.stderr)
        sys.exit(1)

    guides_dir = Path(sys.argv[1])
    config_path = Path(sys.argv[2])

    if not guides_dir.is_dir():
        print(f"❌  Guides directory not found: {guides_dir}", file=sys.stderr)
        sys.exit(1)

    if not config_path.is_file():
        print(f"❌  Config file not found: {config_path}", file=sys.stderr)
        sys.exit(1)

    update_config(guides_dir, config_path)


if __name__ == "__main__":
    main()
