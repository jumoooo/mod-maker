# mod-maker 1.0.0 — Claude Code 에 내 화면과 명령을 더하는 mod 를, 말로 시켜서 만들기

## 1. 내 기계에서 할 것

가장 쉬운 길은 **Claude 에게 맡기는 것**입니다. 이 파일이 있는 폴더에서 Claude Code 를 열고 이렇게 칩니다.

```copy
설명.md 읽고 그대로 셋업해줘
```

(압축을 이미 풀어 그 안의 `README.md` 를 보고 있다면 「README.md 읽고 그대로 셋업해줘」.)
Claude 가 기계를 확인하고, 설치하고, 테마 색을 물음 칸으로 물어봅니다. 고르기만 하면 됩니다.

직접 하려면 압축(`mod-maker-v1.0.0.zip`)을 풀고 기계에 맞는 것 하나를 합니다. 폴더는 하나이고, 어느 기계에서나 같은 것을 씁니다.

| 내 기계 | 할 것 |
|---|---|
| Windows | 푼 폴더의 `install-windows.cmd` 를 두 번 누릅니다 |
| Mac · Linux · WSL | 터미널에서 푼 폴더로 가서 `sh install-mac-linux.sh` |

그 다음 Claude Code 를 새로 열고 `/mod-maker-init` 을 칩니다(4절).

## 2. 무엇인가

- **mod** 는 Claude Code 화면에 창·띠·상태줄을 더하거나, `/명령` 을 새로 만들거나, Claude 가 도구를 쓰기 전에 끼어드는 작은 프로그램입니다. Claude Code 2.1.287 에 들어온 기능입니다.
- **mod-maker** 는 Claude 가 그 mod 를 만들 때 따르는 지시 묶음(스킬)입니다. 깔아 두면 「오늘 할 일을 프롬프트 위에 띠로 보여 주는 mod 만들어 줘」처럼 말로 시킬 수 있습니다.
- 해 주는 일
  - mod 가 맞는 도구인지 따지고, 이 기계에서 mod 기능이 켜져 있는지 먼저 잽니다.
  - 화면이 있는 mod 는 **만들기 전에 그림(HTML)을 먼저 보여 주고**, 「좋아」라고 한 뒤에 만듭니다.
  - 내가 고른 **테마 색**으로 그립니다. 색·기호·상태 낱말을 mod 마다 새로 짓지 않고 한 벌을 씁니다.
  - 만든 뒤 검사를 돌리고, 돌린 것과 못 돌린 것을 갈라 보고합니다.

## 3. 필요한 것

| 것 | 꼭 필요한가 | 없으면 |
|---|---|---|
| Claude Code 2.1.287 이상 (`claude --version`) | 예 | 설치가 멈추고 올리는 법을 알려 줍니다 |
| Node.js | 아니요 | 타입 검사와 Playwright 설치만 건너뜁니다. mod 만들기·색 고르기·검사는 그대로 됩니다 |
| Playwright | 아니요 (있으면 좋음) | Claude 가 그림을 미리 찍어 보지 못합니다. 그림은 띄워 주고, 사람이 보고 말해 줍니다 |

**Claude Code 만 깔린 기계에서도 됩니다.** 설치와 mod-maker 가 그때그때 기계에 있는 것을 확인하고 그에 맞게 갑니다.

시험한 환경은 맨 아래 12절에 적었습니다. Mac 은 문서를 보고 준비했고 실제 Mac 에서 돌려 보지는 못했습니다.

## 4. 설치와 처음 설정

### 4-1. 설치 — 아무것도 묻지 않습니다

Windows 는 `install-windows.cmd` 를 두 번 누르면 창이 뜹니다. Mac · Linux · WSL 은 터미널에서:

```bash
cd mod-maker-v1.0.0
sh install-mac-linux.sh
```

이런 화면이 나옵니다. 아래는 Claude 만 깔린 **Windows** 기계의 예입니다. Mac · Linux · WSL 에서는 셋째 줄이 「(Mac 으로 알아봤습니다)」처럼 그 기계 이름으로 나오고, 복사한 자리가 `/Users/<이름>/.claude/skills/mod-maker`(Mac) · `/home/<이름>/.claude/skills/mod-maker`(Linux · WSL) 로 나옵니다. 나머지 줄은 같습니다.

```text
mod-maker 1.0.0 — 설치

이 기계에 있는 것을 먼저 봅니다.  (Windows 로 알아봤습니다)

  ✓ Claude Code   2.1.322     2.1.287 이상이면 됩니다
  ✓ mod 기능      켜져 있음
  – Node.js       없음        없어도 됩니다
  – Playwright    없음        없어도 됩니다

  이 기계에서는 이렇게 갑니다
    · mod 만들기 · 색 고르기 · 검사   전부 됩니다
    · 타입 검사(tsc)                  건너뜁니다
    · Claude 가 그림을 찍어 보기       건너뜁니다
      (그림은 사람이 보고 말해 줍니다)

  ✓ 복사했습니다
    C:\Users\<이름>\.claude\skills\mod-maker

다음  Claude Code 를 새로 열고 이렇게 칩니다
      /mod-maker-init
```

- 설치가 하는 일은 「있는 것 확인」과 `mod-maker` 폴더 복사 둘뿐입니다. 손으로 해도 됩니다 — 푼 폴더의 `mod-maker` 폴더를 `~/.claude/skills/` 아래로 복사합니다(Windows 는 `%USERPROFILE%\.claude\skills\`).
- 잘못된 쪽을 돌리면 아무것도 바꾸지 않고 맞는 파일 이름을 알려 줍니다.
- 다시 돌려도 됩니다. 앞서 고른 테마 색은 지킵니다.
- Mac 에서는 파일을 두 번 눌러 실행하지 말고 터미널에서 위 한 줄로 돌립니다. 내려받은 파일을 Mac 이 막는 일이 있습니다.

### 4-2. 처음 설정 — 테마 색 고르기

Claude Code 를 새로 열고 칩니다.

```copy
/mod-maker-init
```

고르는 것은 전부 **물음 칸**으로 나옵니다. 화살표로 고르고 Enter 를 누르면 됩니다.

1. **테마 색** — 앞으로 만드는 mod 의 테두리·제목·단축키 색입니다. (「당신 차례」「실패」 같은 상태 색은 바뀌지 않습니다.)

   | 고르는 것 | 뜻 |
   |---|---|
   | 기본값 | 금색에서 장미색으로 흐르는 색 (`#e6b44c` → `#e05a8c`) |
   | 파랑 · 청록 | 미리 넣어 둔 예 |
   | 직접 적기 | 물음 칸의 글 입력 줄에 아래 꼴 중 하나로 적습니다 |

   | 꼴 | 예 |
   |---|---|
   | 색 이름 | `teal` |
   | hex | `#3b82f6` (짧게 `#38f` 도) |
   | rgb | `rgb(234, 88, 12)` |
   | hsl | `hsl(280, 70%, 60%)` (`%` 는 빼도 됩니다) |
   | 두 색 | `#3b82f6 #a855f7` (왼쪽 위에서 오른쪽 아래로 흐릅니다) |
   | 말로 | 「진한 남색」「시원한 색」 — Claude 가 뜻을 읽어 색을 보여 주고, 애매하면 후보를 내놓고 되묻습니다 |

2. **그라데이션** — 색을 하나만 줬을 때 묻습니다: `넣기 (끝 색은 알아서)` · `한 색으로만` · `끝 색을 직접 적기`.
3. 값이 틀렸으면 이유를 알려 주고 `다시 적기` · `기본값으로` · `지금 색 그대로 두기` 를 고르게 합니다. 너무 어두운 색은 `보이는 밝기로 올려 쓰기` · `그대로 쓰기` 를 묻습니다.
4. **Playwright (선택, 권장은 설치)** — Node.js 가 있는 기계에서만 묻습니다. 5절.

고르기 전에는 아무것도 저장하지 않습니다.

## 5. Playwright — 선택입니다

Playwright 는 Claude 가 브라우저를 띄워 화면을 찍어 볼 수 있게 하는 도구입니다.

| | 없이 | 있으면 |
|---|---|---|
| 설치 · 테마 색 · mod 만들기 · 검사 | 됨 | 됨 |
| 만들기 전 그림을 브라우저에 띄우기 | 됨 | 됨 |
| Claude 가 그림을 먼저 찍어 보고 어긋난 곳 고치기 | 안 됨 — 사람이 보고 말해 줌 | 됨 |

- Node.js 가 없으면 묻지 않고 한 줄로 알리고 넘어갑니다. Node.js 를 대신 깔아 주지 않습니다 — 까는 명령만 보여 줍니다(Windows `winget install OpenJS.NodeJS.LTS`, Mac `brew install node`).
- 「설치」를 고르면 하는 일 넷: 도구 받아 두기 → 전용 브라우저(Chromium, 약 170MB) 받기 → Claude Code 에 등록(내 모든 프로젝트에서 쓰도록) → 붙었는지 확인.
- 브라우저를 못 받으면(회사 망 등) 그 기계의 Edge · Chrome 을 대신 쓸지 물음 칸으로 묻습니다.
- 이미 Playwright 가 등록돼 있으면 건드리지 않습니다.
- 실패해도 처음 설정은 끝까지 갑니다.
- Mac 은 macOS 14 이상에서 Playwright 가 됩니다. 13 에서는 이 단계만 실패할 수 있고, mod-maker 는 그대로 쓸 수 있습니다.

나중에 설치하려면 `/mod-maker-init playwright`, 지우려면:

```bash
claude mcp remove playwright -s user
```

## 6. 첫 mod 만들어 보기

Claude Code 에서 말로 시킵니다.

```copy
오늘 할 일을 프롬프트 위에 띠로 보여 주는 mod 만들어 줘
```

1. Claude 가 이 기계에 있는 것을 확인하고, 무엇을 언제 어디에 보일지 빈 곳을 한 번에 묻습니다.
2. **그림을 먼저 띄웁니다** — `mod-previews/<이름>_v1.html`. 「이 모양으로 만들까요?」
3. 고칠 곳을 말하면 `_v2.html` 을 새로 띄웁니다. 앞 그림은 그대로 둡니다.
4. 「좋아」라고 하면 그 버전대로 만들고, 검사를 돌리고, 켜는 법을 알려 줍니다.

본보기 mod 가 `~/.claude/skills/mod-maker/examples/sample-band/` 에 들어 있습니다. 화면에 띄워 보려면:

```bash
claude --plugin-dir ~/.claude/skills/mod-maker/examples/sample-band
```

## 7. 만들기 전에 그림부터

- 화면이 있는 mod 는 만들기 전에 그림을 보이고, 승인한 버전대로 만듭니다. 사람은 그림을 몇 초 만에 읽고, 본 것만 승인할 수 있기 때문입니다.
- 그림은 지금 테마 색으로, 어두운 화면과 밝은 화면 두 벌로 그립니다.
- 고쳐 달라는 말마다 새 버전 파일이 생깁니다.
- 건너뛰려면 「그림 없이 바로 만들어」라고 하면 됩니다. 화면이 없는 mod(도구 호출 막기 등)에는 그림이 없습니다.

## 8. 색 바꾸기

Claude 에게 「mod 테마 색 바꿔 줘」라고 하거나, 직접 칩니다.

```copy
/mod-color teal
```

| 치는 것 | 하는 일 |
|---|---|
| `/mod-color` | 지금 색 보기 |
| `/mod-color <색>` | 바꾸기. 색 하나면 그라데이션을 물음 칸으로 묻습니다 |
| `/mod-color #3b82f6 #a855f7` | 두 색으로 바꾸기 |
| `/mod-color default` | 기본값으로 |
| `/mod-color apply <mod 이름>` | 이미 만든 mod 에 지금 색 입히기 (그 mod 의 색 파일 하나만 바뀝니다) |

바꾼 색은 새로 만드는 mod 부터 쓰입니다. 열려 있는 Claude Code 에서는 `/reload-plugins` 뒤에 보입니다.

## 9. 잘 들어갔는지 확인

Windows(PowerShell)와 Mac · Linux · WSL 에서 같은 명령입니다. Windows 는 `~` 대신 `$env:USERPROFILE` 을 씁니다.

```bash
claude plugin validate ~/.claude/skills/mod-maker
claude plugin test ~/.claude/skills/mod-maker
```

`Validation passed` 와 `43 pass` · `0 fail` 이 나오면 됩니다. 두 명령 모두 Claude Code 만으로 돕니다.

## 10. 지우기

`mod-maker` 폴더 하나를 지우면 됩니다. 만든 mod 들은 각자 폴더에 있어 그대로 남습니다.

```bash
rm -rf ~/.claude/skills/mod-maker
```

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\skills\mod-maker"
```

Playwright 를 설치했다면 5절의 지우는 명령도 돌립니다.

## 11. 안 될 때

| 증상 | 할 것 |
|---|---|
| 설치가 「Claude Code 못 찾음」 | Claude Code 를 깔거나, 새 터미널을 엽니다. Mac 은 `~/.zshrc`, Linux 는 `~/.bashrc` 에 `export PATH="$HOME/.local/bin:$PATH"` |
| 설치가 「mod 기능 꺼져 있음」 | 조직 설정이면 관리자에게 Claude Code 의 mod(hooks modules)를 켜 달라고 요청합니다. 복사는 돼 있으니 켜지면 바로 됩니다 |
| `/mod-maker-init` 이 없는 명령이라고 나옴 | Claude Code 를 새로 열었는지 확인합니다. 열려 있던 창이면 `/reload-plugins` |
| 색이 안 바뀐 것 같음 | `/mod-color` 로 지금 색을 봅니다. 이미 만든 mod 는 `/mod-color apply <mod 이름>` 뒤 `/reload-plugins` |
| Claude 에게 셋업을 맡겼는데 「막혔다」며 명령 한 줄을 보여 줌 | 자동 권한 검사가 압축에서 나온 설치 파일을 막은 것입니다. 보여 준 한 줄을 프롬프트에 `!` 를 앞에 붙여 그대로 치고, 끝나면 「계속」이라고 합니다 |
| 그림이 브라우저에 안 뜸 | Claude 가 알려 준 파일 경로를 직접 엽니다 |
| Playwright 브라우저를 못 받음 | 물음 칸에서 그 기계의 Edge · Chrome 을 고르거나 건너뜁니다. mod-maker 는 그대로 됩니다 |
| mod 창이 안 뜸 | 터미널 폭이 좁으면 옆 창이 기다립니다(144칸 미만). 창을 넓히거나 Claude 에게 「띠로 바꿔 줘」 |
| Mac 터미널에서 색이 층져 보임 | macOS 26 앞의 기본 터미널은 색 수가 적습니다. iTerm2 같은 터미널에서는 매끄럽습니다. 「한 색으로만」 테마가 무난합니다 |
| Mac 에서 폴더 접근을 묻는 창 | 받은 폴더가 다운로드·문서·데스크탑 아래에 있으면 터미널이나 Claude Code 가 그 폴더를 읽을 때 뜹니다. 허용하면 됩니다. Claude 에게 셋업을 맡겼는데 「파일을 읽지 못했다」고 하면, 받은 폴더를 홈 바로 아래(예: `~/mod-maker_v1.0.0`)로 옮긴 뒤 거기서 Claude Code 를 다시 엽니다 |

## 12. 시험한 환경과 못 한 것

| 환경 | 상태 |
|---|---|
| Windows 11 (PowerShell 5.1, Claude Code 2.1.310) | 잼 — Node.js 등을 가린 채 설치 · 검사 · 색 바꾸기 |
| WSL2 Ubuntu (Claude Code 2.1.322) | 잼 — 같은 항목, 그리고 새 Claude 세션에 「설명.md 읽고 그대로 셋업해줘」 한 줄만 주고 끝까지 |
| Linux (WSL 이 아닌) | 재지 않음 — WSL 과 같은 설치 파일, 같은 길 |
| Mac | **재지 않음.** 문서를 보고 준비했습니다 — 설치 파일은 Mac 의 기본 셸(bash 3.2)에서 도는 문법만 쓰고, Mac 에 없는 도구를 쓰지 않습니다 |

Mac 에서 처음 써 보는 분은 설치 전에 아래를 터미널에 붙여 넣고(푼 폴더 안에서) 결과를 공유해 주시면 도움이 됩니다. 읽기만 하고 아무것도 바꾸지 않습니다.

```bash
echo "== system"; sw_vers; uname -sm
echo "== shell"; echo "SHELL=$SHELL"; /bin/bash --version | head -1; echo "TERM_PROGRAM=$TERM_PROGRAM COLORTERM=$COLORTERM"
echo "== tools"; for c in claude node npm npx unzip; do printf '%-8s ' "$c"; command -v "$c" || echo "(없음)"; done
echo "== versions"; claude --version 2>&1; node -v 2>&1
echo "== files"; ls -l; xattr install-mac-linux.sh 2>&1; grep -c "$(printf '\r')" install-mac-linux.sh
echo "== plugin check"; claude plugin validate ./mod-maker 2>&1 | tail -3
echo "== colour (매끄러운 띠로 보여야 합니다)"; i=0; while [ $i -lt 256 ]; do printf '\033[48;2;%d;80;%dm \033[0m' "$i" "$((255-i))"; i=$((i+4)); done; echo
```

---

## Claude 에게 — 「이 파일 읽고 그대로 셋업해줘」를 받았을 때

사람이 이 파일을 읽고 셋업해 달라고 했다면 아래를 순서대로 한다. 설치 파일을 사람이 직접 돌린 것과 같은 결과가 되어야 한다.
**고르는 것은 전부 `AskUserQuestion` 도구(물음 칸)로 묻는다.** 사람 대신 고르지 않는다. 명령은 이 기계의 셸에 맞는 것만 쓴다 — Windows 를 전제하지 않는다.

1. **기계를 알아본다.** Windows 인지(PowerShell: `$env:OS` 가 `Windows_NT`), 그 밖인지(`uname -s` — `Darwin` 은 Mac, `Linux` 는 Linux 또는 WSL). 알아본 것을 한 줄로 말한다.
   Mac 이고 이 폴더가 다운로드·문서·데스크탑 아래에 있으면, 폴더 접근을 묻는 창이 뜰 수 있으니 허용해 달라고 먼저 한 줄로 알린다. 압축이나 이 파일을 읽지 못하면(권한 오류) 우회하지 말고, 받은 폴더를 홈 바로 아래로 옮긴 뒤 거기서 다시 열어 달라고 한다.
2. **묶음 폴더를 찾는다.** 이 파일 옆에 `install-mac-linux.sh` 가 있으면 여기가 묶음 폴더다. 없고 `mod-maker-v1.0.0.zip` 이 있으면 임시 폴더에 푼다 —
   Windows `Expand-Archive -LiteralPath <zip> -DestinationPath <임시 폴더> -Force`, 그 밖 `unzip -q -o <zip> -d <임시 폴더>`(`unzip` 이 없으면 `python3 -m zipfile -e <zip> <임시 폴더>`, 그것도 없으면 사람에게 풀어 달라고 한다).
   묶음 폴더는 `<임시 폴더>/mod-maker-v1.0.0` 이다.
3. **설치 파일을 돌린다.** 아무것도 묻지 않는 파일이다. 출력은 사람에게 그대로 보인다.
   - Windows: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "<묶음 폴더>\mod-maker\scripts\install.ps1"`
   - Mac · Linux · WSL: `sh "<묶음 폴더>/install-mac-linux.sh"`
   - 종료 0 이 아니면 출력의 안내(Claude Code 를 올려라 등)를 사람에게 전하고 **멈춘다.** 우회하지 않는다.
   - 권한 검사가 이 실행을 막으면(자동 권한 모드가 압축에서 나온 파일을 「외부에서 온 코드」로 막는 일이 있다) 우회하지 않는다 — 손으로 복사해 같은 결과를 내지도 않는다.
     그 명령 한 줄을 사람에게 보이고, 프롬프트에 `! <그 명령>` 으로 직접 돌려 달라고 한다. 사람이 돌렸다고 하면 4단계부터 잇는다.
4. **들어갔는지 잰다.** `<스킬>` 은 Windows `$env:USERPROFILE\.claude\skills\mod-maker`, 그 밖 `~/.claude/skills/mod-maker`.
   `claude plugin validate "<스킬>"` 은 `Validation passed`, `claude plugin test "<스킬>"` 은 `43 pass` · `0 fail` 이어야 한다. 아니면 출력을 보이고 멈춘다.
5. **처음 설정을 한다.** `<스킬>/SKILL.md` 의 「처음 설정」 절을 읽고 그대로 따른다(테마 색 → 그라데이션 → Playwright). 방금 설치했으므로 이 세션에는 mod-maker 의 도구가 아직 없다 —
   그 절이 적어 둔 터미널 한 줄(`claude -p "/mod-color … " --plugin-dir "<스킬>"`)로 저장한다. 종료 0 은 저장됨, 2 는 정할 것이 남았거나 값이 틀림.
   Playwright 는 `claude -p "/mod-maker-check" --plugin-dir "<스킬>"` 의 출력으로 가른다 — Node.js 가 없으면 묻지 않고 한 줄만 말한다.
6. **마무리를 알린다.** 한 일을 짧게 — 설치한 자리, 고른 테마 색, Playwright(설치함·건너뜀·이미 있음), 검사 결과(돌린 명령과 통과 수), 건너뛴 것.
   그리고 「Claude Code 를 새로 열면 `/mod-maker-init` · `/mod-color` 명령이 보이고, 『…하는 mod 만들어 줘』라고 하면 됩니다」.

하지 않는 것: 관리자 권한(`sudo`)·시스템 프로그램 설치·사람이 고르지 않은 색 저장·`~/.claude/skills/mod-maker` 밖의 설정 파일 고치기(Playwright 를 고른 경우의 `claude mcp add` 는 예외).
