#!/usr/bin/env bash
set -euo pipefail

# Symlinks every skill in this repo into ~/.claude/skills so they trigger in any
# Claude Code session. For local development only — once published, end users
# install via `npx skills@latest add dnissimi/chazarah -g`.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/.claude/skills"
COMMANDS_DEST="$HOME/.claude/commands"

if [ -L "$DEST" ]; then
  resolved="$(readlink -f "$DEST" 2>/dev/null || readlink "$DEST")"
  case "$resolved" in
    "$REPO"|"$REPO"/*)
      echo "error: $DEST is a symlink into this repo ($resolved)." >&2
      echo "Remove it (rm \"$DEST\") and re-run; the script will recreate it as a real dir." >&2
      exit 1
      ;;
  esac
fi

mkdir -p "$DEST" "$COMMANDS_DEST"

# Link each skill directory.
find "$REPO/skills" -name SKILL.md -print0 |
while IFS= read -r -d '' skill_md; do
  src="$(dirname "$skill_md")"
  name="$(basename "$src")"
  target="$DEST/$name"

  if [ -e "$target" ] && [ ! -L "$target" ]; then
    rm -rf "$target"
  fi

  ln -sfn "$src" "$target"
  echo "linked skill: $name -> $src"
done

# Link each skill's commands into ~/.claude/commands so they appear as slash
# commands. Claude Code only scans ~/.claude/commands/ — it does not scan inside
# skill directories.
find "$REPO/skills" -path "*/commands/*.md" -print0 |
while IFS= read -r -d '' cmd_file; do
  cmd_name="$(basename "$cmd_file")"
  cmd_target="$COMMANDS_DEST/$cmd_name"

  ln -sfn "$cmd_file" "$cmd_target"
  echo "linked command: $cmd_name -> $cmd_file"
done
