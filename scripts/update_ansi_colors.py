#!/usr/bin/env python3
"""Bulk-update ANSI colors in non-guide MDX docs pages.

Updates ANSI fenced blocks under docs/pages, excluding docs/pages/guides:
- Applies CLI-specific state colors for running/standby/stopped/starting.
- Normalizes kraft box-output gray tone from 90 to 38;5;245.

Usage:
  update_ansi_colors.py [--root docs/pages] [--write]

Without --write, runs in dry-run mode and prints files that would change.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ANSI_RESET = "\x1b[0m"
ANSI_BOLD = "\x1b[1m"
ANSI_BOLD_OFF = "\x1b[22m"
ANSI_ITALIC = "\x1b[3m"
ANSI_ITALIC_OFF = "\x1b[23m"
ANSI_KRAFT_HEADER = "\x1b[0;1;39m"
ANSI_KRAFT_STARTING = "\x1b[92m"
ANSI_GRAY_245 = "\x1b[38;5;245m"

STATE_COLORS_BY_SOURCE: dict[str, dict[str, str]] = {
    "unikraft": {
        "running": "\x1b[38;2;0;188;125m",
        "standby": "\x1b[38;2;43;127;255m",
        "stopped": "\x1b[38;2;236;0;63m",
        "starting": "\x1b[38;2;144;161;185m",
        "template": "\x1b[38;2;43;127;255m",
    },
    "kraft": {
        "running": "\x1b[0;32m",
        "standby": "\x1b[0;36m",
        "stopped": "\x1b[0;31m",
        "starting": ANSI_KRAFT_STARTING,
        "template": "\x1b[0;36m",
    },
    "default": {
        "running": "\x1b[92m",
        "standby": "\x1b[94m",
        "stopped": "\x1b[91m",
        "starting": "\x1b[92m",
        "template": "\x1b[94m",
    },
}

FENCE_PATTERN = re.compile(r"(^```ansi([^\n]*)\n)(.*?)(\n```)$", flags=re.M | re.S)
TITLE_VALUE_PATTERN = re.compile(r'title\s*=\s*"([^"]*)"', flags=re.I)
ANSI_PATTERN = re.compile(r"\x1b\[[0-9;]*m")
STATE_TOKEN_PATTERN = re.compile(
    r"(?<![A-Za-z])(?:\x1b\[[0-9;]*m)*(running|standby|stopped|starting|template)(?:\x1b\[[0-9;]*m)*(?![A-Za-z])(?!\s*:)",
    flags=re.I,
)
STATE_KEY_LABEL_PATTERN = re.compile(
    r"(?:\x1b\[[0-9;]*m)+(running|standby|stopped|starting|template)(?:\x1b\[[0-9;]*m)+(\s*:)",
    flags=re.I,
)
STATE_WORD_WITH_ANSI_PATTERN = re.compile(
    r"(?:\x1b\[[0-9;]*m)+(running|standby|stopped|starting|template)(?:\x1b\[[0-9;]*m)+",
    flags=re.I,
)


def detect_cli_source(fence_info: str, body: str) -> str:
    info = (fence_info or "").lower()
    if 'title="unikraft"' in info:
        return "unikraft"
    if 'title="kraft"' in info:
        return "kraft"

    # Heuristics for unnamed blocks.
    lower_body = body.lower()
    if "deployed successfully" in lower_body or any(ch in body for ch in ["│", "├", "└"]):
        return "kraft"
    if "metro:" in lower_body and "resources:" in lower_body:
        return "unikraft"
    return "default"


def recolor_state_tokens(body: str, source: str) -> str:
    state_colors = STATE_COLORS_BY_SOURCE.get(source, STATE_COLORS_BY_SOURCE["default"])

    # Keep key labels like "stopped:" uncolored; only color state values.
    body = STATE_KEY_LABEL_PATTERN.sub(lambda m: f"{m.group(1)}{m.group(2)}", body)

    def repl(match: re.Match[str]) -> str:
        token = match.group(1)
        color = state_colors.get(token.lower(), STATE_COLORS_BY_SOURCE["default"]["running"])
        return f"{color}{token}{ANSI_RESET}"

    return STATE_TOKEN_PATTERN.sub(repl, body)


def recolor_kraft_gray(body: str, source: str) -> str:
    if source != "kraft":
        return body
    body = body.replace("\x1b[90m", ANSI_GRAY_245)
    body = body.replace("\x1b[0;90m", ANSI_GRAY_245)
    return body


def strip_ansi(text: str) -> str:
    return ANSI_PATTERN.sub("", text)


def color_box_runs(text: str) -> str:
    """Wrap contiguous box-drawing character runs with one ANSI sequence."""
    return re.sub(r"[│├└─]+", lambda m: f"{ANSI_GRAY_245}{m.group(0)}{ANSI_RESET}", text)


def style_kraft_deploy_tree(body: str, source: str) -> str:
    """Normalize kraft deploy-tree output to the captured ANSI style."""
    if source != "kraft" or "deployed successfully!" not in body.lower():
        return body

    state_colors = STATE_COLORS_BY_SOURCE["kraft"]
    out: list[str] = []

    for line in body.splitlines():
        raw = strip_ansi(line)

        # Canonical deployed marker: gray brackets + green bullet.
        marker = re.match(r"^(\s*)\[\s*●\s*\]\s*(.*deployed successfully!.*)$", raw, flags=re.I)
        if marker:
            indent, msg = marker.groups()
            out.append(f"{indent}{ANSI_GRAY_245}[{ANSI_RESET}{ANSI_KRAFT_STARTING}●{ANSI_RESET}{ANSI_GRAY_245}]{ANSI_RESET} {msg}")
            continue

        # Box line with label/value like:  ├──────── state: starting
        colon = re.match(r"^(\s*)((?:│|├|└))((?:─*)\s*)([^:]+)(:)(.*)$", raw)
        if colon:
            indent, box, dashes, label, colon_char, value = colon.groups()
            box_part = color_box_runs(box)
            dash_part = color_box_runs(dashes)
            label_part = f"{ANSI_GRAY_245}{label}{ANSI_RESET}{colon_char}"

            if label.strip().lower() == "state":
                vm = re.match(r"^(\s*)(\S+)(.*)$", value)
                if vm:
                    spaces, state_word, tail = vm.groups()
                    color = state_colors.get(state_word.lower(), ANSI_KRAFT_STARTING)
                    value = f"{spaces}{color}{state_word}{ANSI_RESET}{tail}"

            out.append(indent + box_part + dash_part + label_part + value)
            continue

        # Box-only line (e.g., " │").
        if any(ch in raw for ch in ("│", "├", "└", "─")):
            normalized = color_box_runs(raw)
            out.append(normalized)
            continue

        out.append(line)

    return "\n".join(out)


def format_header_token(token: str, source: str) -> str:
    if source == "kraft":
        return f"{ANSI_KRAFT_HEADER}{token}{ANSI_RESET}"
    if source == "unikraft":
        return f"{ANSI_BOLD}{token}{ANSI_BOLD_OFF}"
    return f"{ANSI_BOLD}{token}{ANSI_RESET}"


def looks_like_listing_header(line: str) -> bool:
    """Detect uppercase table headers like NAME/FQDN/SERVICES/CREATED AT."""
    if "\x1b[" in line:
        return False

    cols = [c.strip() for c in re.split(r"\s{2,}", line.strip()) if c.strip()]
    if len(cols) < 2:
        return False

    upper_like = 0
    for col in cols:
        if re.fullmatch(r"[A-Z0-9][A-Z0-9\- ]*", col):
            upper_like += 1

    return upper_like >= 2


def find_state_column_index(header_line: str) -> int | None:
    cols = [c.strip() for c in re.split(r"\s{2,}", header_line.strip()) if c.strip()]
    for idx, col in enumerate(cols):
        if col.upper() == "STATE":
            return idx
    return None


def is_volume_listing_header(header_line: str) -> bool:
    cols = [c.strip().upper() for c in re.split(r"\s{2,}", header_line.strip()) if c.strip()]
    if "STATE" not in cols or "SIZE" not in cols or "NAME" not in cols:
        return False
    return any(c == "CREATED" or c == "CREATED AT" for c in cols)


def clean_state_word_ansi(cell: str) -> str:
    return STATE_WORD_WITH_ANSI_PATTERN.sub(lambda m: m.group(1), cell)


def clean_listing_row_emphasis(cell: str) -> str:
    """Remove accidental bold wrappers from listing row values."""
    cell = re.sub(r"\x1b\[1m([^\x1b]+?)\x1b\[22m", r"\1", cell)
    cell = re.sub(r"\x1b\[0;1;39m([^\x1b]+?)\x1b\[0m", r"\1", cell)
    return cell


def color_standalone_template_token(text: str, color: str | None) -> str:
    if not color:
        return text
    return re.sub(r"(?<![A-Za-z])template(?![A-Za-z])", lambda m: f"{color}{m.group(0)}{ANSI_RESET}", text, flags=re.I)


def color_state_in_listing_rows(body: str, source: str) -> tuple[str, bool]:
    """Normalize listing rows: de-bold values; color only STATE column when present."""
    lines = body.splitlines()
    header_idx = None
    for i, line in enumerate(lines):
        plain = strip_ansi(line)
        cols = [c.strip() for c in re.split(r"\s{2,}", plain.strip()) if c.strip()]
        if len(cols) >= 2:
            upper_like = sum(1 for c in cols if re.fullmatch(r"[A-Z0-9][A-Z0-9\- ]*", c))
            if upper_like >= 2:
                header_idx = i
                break

    if header_idx is None:
        return body, False

    state_col = find_state_column_index(strip_ansi(lines[header_idx]))
    volume_listing = is_volume_listing_header(strip_ansi(lines[header_idx]))

    state_colors = STATE_COLORS_BY_SOURCE.get(source, STATE_COLORS_BY_SOURCE["default"])
    out = lines[:]
    i = header_idx + 1

    while i < len(out) and out[i].strip() != "":
        row = out[i]
        parts = re.split(r"(\s{2,})", row)
        cols = parts[0::2]
        seps = parts[1::2]

        for idx, col in enumerate(cols):
            col = clean_listing_row_emphasis(col)
            token = col.strip()
            if not token:
                cols[idx] = col
                continue

            if state_col is not None and idx == state_col:
                token_clean = strip_ansi(token)
                if volume_listing and source != "unikraft":
                    # Keep kraft/default volume states plain.
                    color = None
                elif volume_listing:
                    error_words = {"error", "failed", "faulted", "corrupted", "unavailable"}
                    if token_clean.lower() == "template":
                        color = state_colors.get("template", "\x1b[94m")
                    elif token_clean.lower() in error_words:
                        color = state_colors.get("stopped", "\x1b[91m")
                    else:
                        color = state_colors.get("running", "\x1b[92m")
                else:
                    color = state_colors.get(token_clean.lower())
                if color:
                    cols[idx] = col.replace(token, f"{color}{token_clean}{ANSI_RESET}", 1)
                else:
                    cols[idx] = col.replace(token, token_clean, 1)
            else:
                cleaned = clean_state_word_ansi(col)
                cols[idx] = cleaned

        rebuilt = ""
        for idx, col in enumerate(cols):
            rebuilt += col
            if idx < len(seps):
                rebuilt += seps[idx]

        # No fallback coloring for kraft/default volume listing rows.

        out[i] = rebuilt
        i += 1

    return "\n".join(out), True


def style_listing_header(body: str, source: str) -> str:
    lines = body.splitlines()
    header_idx = None
    for i, line in enumerate(lines):
        if looks_like_listing_header(line):
            header_idx = i
            break

    if header_idx is None:
        return body

    header = lines[header_idx]
    if "\x1b[" in header:
        return body

    parts = re.split(r"(\s{2,})", header)
    cols = parts[0::2]
    seps = parts[1::2]

    for idx, col in enumerate(cols):
        token = col.strip()
        if token:
            cols[idx] = col.replace(token, format_header_token(token, source), 1)

    rebuilt = ""
    for idx, col in enumerate(cols):
        rebuilt += col
        if idx < len(seps):
            rebuilt += seps[idx]

    lines[header_idx] = rebuilt
    return "\n".join(lines)


def is_unikraft_run_output(body: str) -> bool:
    return bool(
        re.search(r"^(?:\x1b\[[0-9;]*m)*metro(?:\x1b\[[0-9;]*m)*:\s+\S", body, flags=re.M)
        and re.search(r"^(?:\x1b\[[0-9;]*m)*resources(?:\x1b\[[0-9;]*m)*:\s*$", body, flags=re.M)
    )


def is_unikraft_structured_output(body: str) -> bool:
    if any(ch in body for ch in ("│", "├", "└")):
        return False

    lines = [line for line in body.splitlines() if line.strip()]
    if not lines:
        return False

    kv_count = 0
    for line in lines:
        plain = strip_ansi(line)
        if re.match(r"^\s*-?\s*[a-z][a-z0-9-]*\s*:\s*.*$", plain):
            kv_count += 1

    return kv_count >= 3


def style_unikraft_run_fields(body: str) -> str:
    lines = body.splitlines()
    out: list[str] = []

    for line in lines:
        top = re.match(r"^([a-z][a-z0-9-]*)(:)(\s*.*)$", line)
        if top:
            key, colon, rest = top.groups()
            if line.startswith(ANSI_BOLD):
                out.append(line)
                continue
            out.append(f"{ANSI_BOLD}{key}{ANSI_BOLD_OFF}{colon}{rest}")
            continue

        list_key = re.match(r"^(-\s*[a-z][a-z0-9-]*)(:)(\s*.*)$", line)
        if list_key:
            key, colon, rest = list_key.groups()
            if line.startswith(ANSI_ITALIC):
                out.append(line)
                continue
            out.append(f"{ANSI_ITALIC}{key}{ANSI_ITALIC_OFF}{colon}{rest}")
            continue

        nested = re.match(r"^(\s+)(-?\s*[a-z][a-z0-9-]*)(:)(\s*.*)$", line)
        if nested:
            indent, key, colon, rest = nested.groups()
            if line.startswith(ANSI_ITALIC):
                out.append(line)
                continue
            out.append(f"{ANSI_ITALIC}{indent}{key}{ANSI_ITALIC_OFF}{colon}{rest}")
            continue

        out.append(line)

    return "\n".join(out)


def transform_text(text: str) -> tuple[str, int]:
    changes = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal changes
        fence_start = match.group(1)
        info = (match.group(2) or "").strip()
        body = match.group(3)
        fence_end = match.group(4)

        # Leave unnamed/empty-title ANSI blocks untouched.
        title_match = TITLE_VALUE_PATTERN.search(info)
        if not title_match or not title_match.group(1).strip():
            return match.group(0)

        source = detect_cli_source(info, body)
        new_body = recolor_kraft_gray(body, source)
        new_body = style_kraft_deploy_tree(new_body, source)
        new_body = style_listing_header(new_body, source)
        new_body, handled_listing_state = color_state_in_listing_rows(new_body, source)
        if source == "unikraft" and (is_unikraft_run_output(new_body) or is_unikraft_structured_output(new_body)):
            new_body = style_unikraft_run_fields(new_body)
        if not handled_listing_state:
            new_body = recolor_state_tokens(new_body, source)

        if new_body != body:
            changes += 1
        return fence_start + new_body + fence_end

    return FENCE_PATTERN.sub(repl, text), changes


def iter_target_files(root: Path) -> list[Path]:
    files = []
    for path in root.rglob("*.mdx"):
        rel = path.as_posix()
        if "/guides/" in rel:
            continue
        files.append(path)
    return sorted(files)


def main() -> int:
    parser = argparse.ArgumentParser(description="Bulk-update ANSI colors in non-guide MDX files")
    parser.add_argument("--root", default="pages", help="Root directory to scan")
    parser.add_argument("--write", action="store_true", help="Write changes to disk")
    args = parser.parse_args()

    root = Path(args.root)
    if not root.exists():
        raise SystemExit(f"error: root does not exist: {root}")

    total_blocks = 0
    changed_files: list[Path] = []

    for path in iter_target_files(root):
        original = path.read_text(encoding="utf-8")
        updated, changed_blocks = transform_text(original)
        if changed_blocks == 0:
            continue

        total_blocks += changed_blocks
        changed_files.append(path)

        if args.write:
            path.write_text(updated, encoding="utf-8")

    mode = "write" if args.write else "dry-run"
    print(f"mode={mode}")
    print(f"changed_files={len(changed_files)}")
    print(f"changed_ansi_blocks={total_blocks}")
    for path in changed_files:
        print(path.as_posix())

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
