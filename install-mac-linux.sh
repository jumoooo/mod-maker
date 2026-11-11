#!/bin/sh
# 이 파일은 Mac · Linux · WSL 용입니다.
# Windows 라면 install-windows.cmd 를 두 번 누르세요.
#
# 쓰는 법 (터미널에서, 이 폴더로 간 뒤):   sh install-mac-linux.sh
# 하는 일: 이 기계에 있는 것을 확인하고, mod-maker 폴더를 ~/.claude/skills/ 아래로 복사합니다. 아무것도 묻지 않습니다.
# 지우려면: ~/.claude/skills/mod-maker 폴더를 지웁니다.

MIN_VERSION="2.1.287"
say() { printf '%s\n' "$*"; }

HERE=$(cd "$(dirname "$0")" && pwd)
SRC="$HERE/mod-maker"
VERSION=$(cat "$SRC/VERSION" 2>/dev/null || echo "?")

say ""
say "mod-maker $VERSION — 설치"
say ""

# ── 어느 기계인가: Mac 을 먼저 가른다(/proc 은 Mac 에 없다) ──
KERNEL=$(uname -s 2>/dev/null || echo unknown)
case "$KERNEL" in
  Darwin) OS="mac"; OS_NAME="Mac 으로" ;;
  Linux)
    if [ -r /proc/version ] && grep -qi microsoft /proc/version 2>/dev/null; then OS="wsl"; OS_NAME="WSL 로"; else OS="linux"; OS_NAME="Linux 로"; fi ;;
  MINGW*|MSYS*|CYGWIN*)
    say "  이 기계는 Windows 입니다."
    say "  install-windows.cmd 를 두 번 눌러 주세요."
    say "  (아무것도 바꾸지 않았습니다)"
    exit 3 ;;
  *) OS="linux"; OS_NAME="$KERNEL (Linux 로 보고)" ;;
esac

if [ ! -f "$SRC/SKILL.md" ]; then
  say "  ✗ 이 파일 옆에 mod-maker 폴더가 없습니다: $SRC"
  say "    압축을 푼 폴더 안에서 돌려 주세요."
  exit 1
fi

say "이 기계에 있는 것을 먼저 봅니다.  ($OS_NAME 알아봤습니다)"
say ""

# ── Claude Code ──
CLAUDE=$(command -v claude 2>/dev/null || true)
if [ -z "$CLAUDE" ] && [ -x "$HOME/.local/bin/claude" ]; then CLAUDE="$HOME/.local/bin/claude"; fi
if [ -z "$CLAUDE" ]; then
  say "  ✗ Claude Code   못 찾음"
  say "    Claude Code 를 먼저 깔아 주세요:  https://code.claude.com/docs/ko/setup"
  if [ "$OS" = "mac" ]; then
    say "    이미 깔았는데 못 찾는다면, 새 터미널을 열거나 ~/.zshrc 에 이 줄을 넣습니다:"
  else
    say "    이미 깔았는데 못 찾는다면, 새 터미널을 열거나 ~/.bashrc 에 이 줄을 넣습니다:"
  fi
  say '      export PATH="$HOME/.local/bin:$PATH"'
  say "    깐 뒤 이 설치를 다시 돌리면 됩니다.  (아무것도 바꾸지 않았습니다)"
  exit 1
fi

CV=$("$CLAUDE" --version 2>/dev/null | sed -n '1s/^[^0-9]*\([0-9][0-9.]*\).*/\1/p')
[ -n "$CV" ] || CV="0"

# 판 번호를 자리마다 수로 견준다: $1 >= $2 이면 0
at_least() {
  a=$1; b=$2
  while [ -n "$a" ] || [ -n "$b" ]; do
    x=${a%%.*}; y=${b%%.*}
    case "$a" in *.*) a=${a#*.} ;; *) a="" ;; esac
    case "$b" in *.*) b=${b#*.} ;; *) b="" ;; esac
    x=${x:-0}; y=${y:-0}
    if [ "$x" -gt "$y" ] 2>/dev/null; then return 0; fi
    if [ "$x" -lt "$y" ] 2>/dev/null; then return 1; fi
  done
  return 0
}

if ! at_least "$CV" "$MIN_VERSION"; then
  say "  ✗ Claude Code   $CV"
  say "    mod 는 $MIN_VERSION 부터 됩니다. 먼저 올려 주세요."
  say "      claude update"
  say "    올린 뒤 이 설치를 다시 돌리면 됩니다.  (아무것도 바꾸지 않았습니다)"
  exit 1
fi
say "  ✓ Claude Code   $CV     $MIN_VERSION 이상이면 됩니다"

# ── mod 기능이 켜져 있나: 빈 폴더에서 시험 명령의 말을 읽는다 ──
PROBE=$(mktemp -d "${TMPDIR:-/tmp}/mod-maker.XXXXXX" 2>/dev/null || echo "")
MODS="on"; MODS_WHY=""
if [ -n "$PROBE" ] && [ -d "$PROBE" ]; then
  OUT=$(cd "$PROBE" && "$CLAUDE" plugin test 2>&1 || true)
  rmdir "$PROBE" 2>/dev/null || true
  case "$OUT" in
    *"no hooks module to load"*) MODS="on" ;;
    *"turned off here"*) MODS="off"; MODS_WHY="내 설정이나 조직 설정" ;;
    *"saved off"*) MODS="off"; MODS_WHY="꺼진 스위치가 저장돼 있음" ;;
    *"turned off in this process"*) MODS="off"; MODS_WHY="원격 설정" ;;
    *) MODS="unknown" ;;
  esac
else
  MODS="unknown"
fi
case "$MODS" in
  on) say "  ✓ mod 기능      켜져 있음" ;;
  off) say "  ! mod 기능      꺼져 있음 ($MODS_WHY)" ;;
  *) say "  ? mod 기능      확인하지 못함" ;;
esac

# ── Node.js · Playwright: 없어도 된다 ──
NODE_V=$(node --version 2>/dev/null || true)
HAS_NPM="no"; command -v npm >/dev/null 2>&1 && HAS_NPM="yes"
HAS_TSC="no"; command -v tsc >/dev/null 2>&1 && HAS_TSC="yes"
if [ -n "$NODE_V" ]; then say "  ✓ Node.js       $NODE_V"; else say "  – Node.js       없음        없어도 됩니다"; fi
if "$CLAUDE" mcp get playwright >/dev/null 2>&1; then HAS_PW="yes"; say "  ✓ Playwright    붙어 있음"; else HAS_PW="no"; say "  – Playwright    없음        없어도 됩니다"; fi

say ""
say "  이 기계에서는 이렇게 갑니다"
say "    · mod 만들기 · 색 고르기 · 검사   전부 됩니다"
if [ "$HAS_TSC" = "yes" ] || { [ -n "$NODE_V" ] && [ "$HAS_NPM" = "yes" ]; }; then
  say "    · 타입 검사(tsc)                  합니다"
else
  say "    · 타입 검사(tsc)                  건너뜁니다"
fi
if [ "$HAS_PW" = "yes" ]; then
  say "    · Claude 가 그림을 찍어 보기       합니다"
else
  say "    · Claude 가 그림을 찍어 보기       건너뜁니다"
  say "      (그림은 사람이 보고 말해 줍니다)"
  if [ -n "$NODE_V" ] && [ "$HAS_NPM" = "yes" ]; then
    say "    Playwright 는 처음 설정에서 설치할지 물어봅니다."
  else
    say "    Node.js 를 나중에 깔면 둘 다 켤 수 있습니다."
  fi
fi

# ── 복사: 앞서 고른 테마 색은 지킨다 ──
DEST="$HOME/.claude/skills/mod-maker"
KEPT_THEME=""
if [ -f "$DEST/templates/ui/theme.ts" ]; then
  KEPT_THEME=$(cat "$DEST/templates/ui/theme.ts")
fi
mkdir -p "$DEST" || { say ""; say "  ✗ 폴더를 만들지 못했습니다: $DEST"; exit 1; }
if ! cp -R "$SRC/." "$DEST/"; then
  say ""; say "  ✗ 복사하지 못했습니다: $DEST"; exit 1
fi
if [ -n "$KEPT_THEME" ]; then
  printf '%s\n' "$KEPT_THEME" > "$DEST/templates/ui/theme.ts"
  KEPT=" (앞서 고른 테마 색은 그대로 두었습니다)"
else
  KEPT=""
fi

say ""
say "  ✓ 복사했습니다$KEPT"
say "    $DEST"
if [ "$MODS" = "off" ]; then
  say ""
  say "  ! 지금은 mod 가 뜨지 않습니다 (mod 기능이 꺼져 있습니다: $MODS_WHY)."
  say "    조직 설정이면 관리자에게 「Claude Code 의 mod(hooks modules)」를 켜 달라고 요청하세요."
  say "    꺼진 스위치가 저장된 경우는 네트워크가 되는 터미널에서 claude 를 한 번 띄운 뒤 다시 확인합니다."
fi
if [ "$OS" = "mac" ]; then
  case "$HERE" in
    "$HOME/Downloads"*|"$HOME/Desktop"*|"$HOME/Documents"*)
      say ""
      say "  참고: 이 폴더는 Mac 이 접근을 묻는 자리(다운로드 · 데스크탑 · 문서)에 있습니다."
      say "        설치는 끝났으니 이 폴더는 지워도 됩니다." ;;
  esac
fi
say ""
say "다음  Claude Code 를 새로 열고 이렇게 칩니다"
say "      /mod-maker-init"
say ""
exit 0
