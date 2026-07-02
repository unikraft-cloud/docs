#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Capture command output while preserving ANSI color codes.

Usage:
  capture_ansi.sh [--docs-bars] [--tui] [--tui-wait <seconds>] <output-file> -- <command> [args...]

Examples:
  capture_ansi.sh build.ansi.log -- ls --color=always
  capture_ansi.sh test.ansi.log -- bash -lc 'kraft cloud quotas'
  capture_ansi.sh quotas.ansi.log -- kraft cloud quotas
  capture_ansi.sh --docs-bars quotas.ansi.log -- kraft cloud quotas
  capture_ansi.sh --tui quotas.ansi.log -- unikraft quotas

Notes:
  - This script prefers the "script" utility so commands run in a pseudo-TTY.
    That keeps tools that only colorize on TTY from dropping colors.
  - If "script" is unavailable, it falls back to plain execution; in that
    case you may need command flags like --color=always.
  - --docs-bars converts background-only bar tails into visible block glyphs,
    so empty bar segments remain visible in MDX ANSI renderers.
  - --tui captures the rendered screen for full-screen TUIs (requires tmux).
    This avoids raw cursor-control escape sequences in the output.
  - --tui-wait controls how long to wait before taking a screen snapshot.
EOF
}

docs_bars=0
tui_mode=0
tui_wait="1.2"
tui_quit_key="q"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --docs-bars)
      docs_bars=1
      shift
      ;;
    --tui)
      tui_mode=1
      shift
      ;;
    --tui-wait)
      if [[ $# -lt 2 ]]; then
        echo "error: --tui-wait requires a value in seconds" >&2
        exit 1
      fi
      tui_wait=$2
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

if [[ $# -lt 3 ]]; then
  usage
  exit 1
fi

out_file=$1
shift

if [[ ${1:-} != "--" ]]; then
  echo "error: missing '--' before command" >&2
  usage
  exit 1
fi
shift

mkdir -p "$(dirname "$out_file")"

sanitize_stream() {
  # Keep color/style SGR codes (CSI ... m), but drop terminal query/control noise
  # that leaks into captured logs (OSC, DSR/CPR) and normalize line endings.
  perl -CSDA -pe '
    s/\r$//;
    s/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)//g;
    s/\x1b\[[0-9;?]*n//g;
    s/\x1b\[[0-9;]*R//g;
    # Remove redundant foreground reset after full reset
    s/(\x1b\[0m)\x1b\[39m/$1/g;
  '
}

render_docs_bars() {
  # Render background-only bar tails as visible glyphs while preserving width.
  # This intentionally targets only multi-space runs to avoid tab/header padding.
  perl -CSDA -pe '
    s/\x1b\[[0-9;]*48;5;([0-9]+)[0-9;]*m( {2,})\x1b\[(?:0|49)?m/
      "\x1b[38;5;".$1."m" . ("\x{2588}" x length($2)) . "\x1b[0m"
    /ge;
  '
}

apply_filters() {
  if [[ $docs_bars -eq 1 ]]; then
    sanitize_stream | render_docs_bars
  else
    sanitize_stream
  fi
}

capture_tui_screen() {
  if ! command -v tmux >/dev/null 2>&1; then
    echo "error: --tui requires tmux" >&2
    exit 1
  fi

  local session="capture_ansi_${RANDOM}_$$"
  local cols
  local lines
  cols=$(tput cols 2>/dev/null || echo 120)
  lines=$(tput lines 2>/dev/null || echo 40)

  local cmd
  cmd=$(printf ' %q' "$@")
  local quoted_cmd
  quoted_cmd=$(printf '%q' "${cmd:1}")

  tmux new-session -d -x "$cols" -y "$lines" -s "$session" "bash -lc ${quoted_cmd}"
  sleep "$tui_wait"
  tmux capture-pane -p -e -t "${session}:0.0" | apply_filters >"$out_file"

  # Try to leave the app cleanly if it is still running.
  tmux send-keys -t "${session}:0.0" "$tui_quit_key" || true
  sleep 0.15
  tmux kill-session -t "$session" >/dev/null 2>&1 || true
}

if [[ $tui_mode -eq 1 ]]; then
  capture_tui_screen "$@"
elif command -v script >/dev/null 2>&1; then
  # Run in a PTY so tools keep colors, then persist output.
  cmd=$(printf ' %q' "$@")
  script -qec "${cmd:1}" /dev/null | apply_filters >"$out_file"
else
  "$@" 2>&1 | apply_filters >"$out_file"
fi

echo "wrote: $out_file"
