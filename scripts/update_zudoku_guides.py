#!/usr/bin/env python3
"""
Rewrite the example apps list in zudoku.config.tsx based on the MDX files in pages/guides/.

It replaces everything between two sentinel comments in zudoku.config.tsx:

    // AUTO-GENERATED:GUIDES-START
    ...
    // AUTO-GENERATED:GUIDES-END

For each MDX file (except overview.mdx) the title is read from the YAML front-matter.
Entries are sorted alphabetically by title.

Usage: update_zudoku_guides.py GUIDES_DIR ZUDOKU_CONFIG
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


FRONT_MATTER_TITLE = re.compile(r'^title:\s*["\']?(.+?)["\']?\s*$', re.MULTILINE)

SENTINEL_PATTERN = re.compile(
    r'([ \t]*)// AUTO-GENERATED:GUIDES-START\n'
    r'.*?'
    r'([ \t]*)// AUTO-GENERATED:GUIDES-END',
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

    lines = [f'{indent}"/guides/{slug}", // {title}' for title, slug in entries]
    return "\n".join(lines)


def update_config(guides_dir: Path, config_path: Path) -> None:
    content = config_path.read_text(encoding="utf-8")

    match = SENTINEL_PATTERN.search(content)
    if not match:
        print(
            "❌  Could not locate AUTO-GENERATED:GUIDES-START/END sentinels "
            f"in {config_path}",
            file=sys.stderr,
        )
        sys.exit(1)

    indent = match.group(1)
    new_block = build_items_block(guides_dir, indent)

    new_content = (
        content[: match.start()]
        + f'{indent}// AUTO-GENERATED:GUIDES-START\n'
        + new_block + "\n"
        + f'{indent}// AUTO-GENERATED:GUIDES-END'
        + content[match.end():]
    )

    config_path.write_text(new_content, encoding="utf-8")
    print(f"  ✅ Updated guides list in {config_path.name} "
          f"({len(new_block.splitlines())} guide entries)")


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
