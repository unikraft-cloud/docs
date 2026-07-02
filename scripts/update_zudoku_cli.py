#!/usr/bin/env python3
"""
Rebuild the 'unikraft' CLI items list in zudoku.config.tsx from the MDX files
generated at build time into pages/cli/unikraft/.

The script is run after the CLI docs are copied into the tree (see Dockerfile).
It replaces everything between two sentinel comments in zudoku.config.tsx:

    // AUTO-GENERATED:UNIKRAFT-CLI-START
    ...
    // AUTO-GENERATED:UNIKRAFT-CLI-END

Usage: update_zudoku_cli.py CLI_DIR ZUDOKU_CONFIG
  CLI_DIR      path to pages/cli/unikraft/ (the generated MDX directory)
  ZUDOKU_CONFIG  path to zudoku.config.tsx
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


# Maps a subcommand group name to a Lucide icon used in the sidebar.
# Unmapped names fall back to DEFAULT_ICON.
ICON_MAP: dict[str, str] = {
    "api":          "webhook",
    "certificates": "shield-check",
    "config":       "settings",
    "images":       "package",
    "instances":    "rocket",
    "metros":       "earth",
    "profile":      "user-circle",
    "services":     "split",
    "volumes":      "cylinder",
}

DEFAULT_ICON = "terminal"

SENTINEL_PATTERN = re.compile(
    r'([ \t]*)// AUTO-GENERATED:UNIKRAFT-CLI-START\n'
    r'.*?'
    r'([ \t]*)// AUTO-GENERATED:UNIKRAFT-CLI-END',
    re.DOTALL,
)


def render_category(name: str, url_prefix: str, directory: Path, indent: str, label_prefix: str = "unikraft") -> str:
    """Return a rendered TypeScript category block for *directory*."""
    icon = ICON_MAP.get(name, DEFAULT_ICON)
    sub_url = f"{url_prefix}/{name}"
    label = f"{label_prefix} {name}"
    item_indent = indent + "    "  # two extra levels: one for the object, one for items[]

    inner_lines: list[str] = [f'{item_indent}"{sub_url}",']

    mdx_files = {p.stem: p for p in directory.glob("*.mdx")}
    sub_dirs = {p.name: p for p in directory.iterdir() if p.is_dir()}

    group_names = sorted(set(mdx_files) & set(sub_dirs))
    flat_stems = sorted(set(mdx_files) - set(sub_dirs))

    for stem in flat_stems:
        inner_lines.append(f'{item_indent}"{sub_url}/{stem}",')

    for sub_name in group_names:
        inner_lines.append(
            render_category(sub_name, sub_url, sub_dirs[sub_name], item_indent, label_prefix=label)
        )

    inner_str = "\n".join(inner_lines)
    return (
        f'{indent}{{\n'
        f'{indent}  type: "category",\n'
        f'{indent}  label: "{label}",\n'
        f'{indent}  icon: "{icon}",\n'
        f'{indent}  collapsed: false,\n'
        f'{indent}  items: [\n'
        f'{inner_str}\n'
        f'{indent}  ],\n'
        f'{indent}}},'
    )


def build_block(cli_dir: Path, indent: str) -> str:
    """Generate the full items block to be placed between the sentinels."""
    url_prefix = "/cli/unikraft"

    lines: list[str] = [f'{indent}"{url_prefix}",']

    mdx_files = {p.stem: p for p in cli_dir.glob("*.mdx")}
    sub_dirs = {p.name: p for p in cli_dir.iterdir() if p.is_dir()}

    # Names that have both an MDX file and a subdirectory → category groups
    group_names = sorted(set(mdx_files) & set(sub_dirs))
    # Names that only have an MDX file → flat entries
    flat_stems = sorted(set(mdx_files) - set(sub_dirs))

    for stem in flat_stems:
        lines.append(f'{indent}"{url_prefix}/{stem}",')

    for name in group_names:
        lines.append(render_category(name, url_prefix, sub_dirs[name], indent))

    return "\n".join(lines)


def update_config(cli_dir: Path, config_path: Path) -> None:
    content = config_path.read_text(encoding="utf-8")

    match = SENTINEL_PATTERN.search(content)
    if not match:
        print(
            "❌  Could not locate AUTO-GENERATED:UNIKRAFT-CLI-START/END sentinels "
            f"in {config_path}",
            file=sys.stderr,
        )
        sys.exit(1)

    indent = match.group(1)
    new_block = build_block(cli_dir, indent)

    new_content = (
        content[: match.start()]
        + f'{indent}// AUTO-GENERATED:UNIKRAFT-CLI-START\n'
        + new_block + "\n"
        + f'{indent}// AUTO-GENERATED:UNIKRAFT-CLI-END'
        + content[match.end():]
    )

    config_path.write_text(new_content, encoding="utf-8")

    n_entries = new_block.count('"/')
    print(f"  ✅ Updated unikraft CLI items in {config_path.name} ({n_entries} entries)")


def main() -> None:
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} CLI_DIR ZUDOKU_CONFIG", file=sys.stderr)
        sys.exit(1)

    cli_dir = Path(sys.argv[1])
    config_path = Path(sys.argv[2])

    if not cli_dir.is_dir():
        print(f"❌  CLI directory not found: {cli_dir}", file=sys.stderr)
        sys.exit(1)

    if not config_path.is_file():
        print(f"❌  Config file not found: {config_path}", file=sys.stderr)
        sys.exit(1)

    update_config(cli_dir, config_path)


if __name__ == "__main__":
    main()
