---
name: mod-maker
description: Claude Code 안에서 도는 mod(Claude Mods, 2.1.287 추가)를 만들거나 고칠 때 쓴다. 사용자가 "모드 만들어줘", "mod 추가", "/명령 하나 만들어", "프롬프트 위에 띠(창·패널·상태줄) 띄워줘", "도구 호출 전에 막아줘(가로채줘)", "mod 화면을 예쁘게", "mod 테마 색 바꿔줘", "mod-maker 처음 설정"이라고 하거나, 설정 훅·스킬·MCP 로는 안 되는 화면·명령·가로채기를 요구할 때. 내장 plugin-authoring 스킬 앞뒤를 맡는다.
allowed-tools: Read Bash Write Edit Skill AskUserQuestion
---

# mod-maker — mod 를 만들고, 켜지게 하고, 남긴다

**이름부터 맞춘다.** 사용자가 「모드」「슬래시 명령 기능」이라고 부르는 것은 Claude Code **mod** 다(공식 이름 Claude Mods, v2.1.287 에 추가).
JavaScript·TypeScript 로 쓴 이벤트 처리 함수(훅)를 Claude Code 가 자기 프로세스 안에서 부른다. `/diff` 도 mod 다.
**뜻을 되묻지 않는다** — 사용자에게 확인할 것은 「무엇을 하게 할지」뿐이다.

mod 하나는 파일 셋이다 — `.claude-plugin/plugin.json`(매니페스트) · `hooks/hooks.json`(`"modules": ["./register.ts"]`) ·
`hooks/register.ts`(훅 모듈, `export const register`. JSX 로 그리면 `.tsx`).
**코드를 어떻게 쓰는지는 내장 스킬 `plugin-authoring` 이 정본이다.** 이벤트·메서드·요소는 그 스킬이 이 빌드에서 뽑아 주는 타입 파일
(`claude-code.d.ts`)을 찾아서 본다. 문서보다 그 파일이 맞다. 이 스킬은 그 앞(맞는 도구인가·켜져 있나·어디에 둘까·어떻게 보일까)과 뒤(검사·보고)를 맡는다.

이 폴더에 함께 든 것 — 필요한 절만 읽는다.

| 파일 | 언제 읽나 |
|---|---|
| `preview.md` | 화면이 있는 mod 를 만들기 전. 그림을 먼저 보이고 승인받는 절차 |
| `design.md` · `templates/ui/` | 그리는 mod. 색·기호·상태 낱말·폭 경계의 정본(설계 토큰과 부품) |
| `best-practices.md` | 만드는 mod 가 건드리는 절만 — 도구 호출을 막으면 §2, 값을 기억하면 §3, 그리면 §4 |
| `examples/sample-band/` | 토큰으로 그린 띠 하나의 본보기 |

이 폴더 자체도 mod 다. 명령 셋과 도구 하나를 낸다 — `/mod-maker-init`(처음 설정) · `/mod-maker-check`(이 기계에 있는 것) ·
`/mod-color`(테마 색) · 도구 `mcp__mod-maker__theme`(Claude 가 테마 색을 저장할 때 부른다).

## 0. 이 기계에 있는 것부터 — 매번

사용자의 기계에는 Claude Code 만 있을 수 있다. Node.js·tsc·Playwright 가 있다고 치지 않는다. **mod 를 만들기 시작할 때마다** 한 번 잰다 —
설치한 날과 쓰는 날의 기계 상태가 다를 수 있다.

- 이 세션에 `/mod-maker-check` 명령이 있으면 그 결과를 쓴다(사용자에게 치게 하지 말고, 아래 터미널 한 줄로 직접 돌린다).
- 터미널 한 줄 — 이 스킬 폴더 경로를 `<mod-maker>` 자리에 넣는다. Windows(PowerShell)와 Mac·Linux·WSL 에서 같은 꼴이다.

```bash
claude -p "/mod-maker-check" --plugin-dir "<mod-maker>"
```

| 잰 것 | 있으면 | 없으면 |
|---|---|---|
| Claude Code 2.1.287 이상 | 진행 | 멈춘다. `claude update` 를 안내한다 |
| mod 기능이 켜짐(1절) | 진행 | 왜 꺼졌는지와 켜는 길을 알린다 |
| Node.js · npm | 타입 검사(`tsc`)와 Playwright 설치를 쓸 수 있다 | 둘만 건너뛴다. **나머지는 그대로 한다** |
| Playwright(이 세션에 `mcp__playwright__*` 도구가 보이는가) | 그림과 결과 화면을 직접 찍어 보고 고친다 | 그림을 띄우기만 하고 사람에게 봐 달라고 한다. **멈추지 않는다** |

없는 것을 깔아 달라고 조르지 않는다. 한 줄로 알리고 넘어간다. **건너뛴 검사는 「통과」가 아니라 「건너뜀」으로 보고한다.**

## 처음 설정 — `/mod-maker-init` 또는 「mod-maker 처음 설정 해 줘」

고르는 자리는 **전부 `AskUserQuestion` 도구(물음 칸)로** 묻는다. 한 번에 질문 하나, 한국어로, 선택지 2~4개. 사람이 글로 답을 치게 하지 않는다
(색을 직접 적는 것만 예외 — 물음 칸의 「직접 적기(Other)」 줄에 적는다). 사람 대신 고르지 않는다.

**1단계 — 테마 색.** 앞으로 만드는 mod 의 테두리·제목·단축키 색이다. 「당신 차례」「실패」 같은 상태 색은 안 바뀐다고 한 줄 덧붙인다.

- 질문: 「앞으로 만드는 mod 의 테두리 · 제목 · 단축키 색을 무엇으로 할까요?」
- 선택지: `기본값 (금색에서 장미색으로)` · `파랑 (#3b82f6)` · `청록 (teal)` · 직접 적기는 물음 칸의 Other.
- 질문 글이나 선택지 설명에 받을 수 있는 꼴의 예를 적는다 — 색 이름 `teal` · hex `#3b82f6`(짧게 `#38f`) · rgb `rgb(234, 88, 12)` ·
  hsl `hsl(280, 70%, 60%)` · 두 색 `#3b82f6 #a855f7` · 「진한 남색」 같은 말도 된다.

**2단계 — 저장.** 고른 값을 도구로 저장한다. 색 읽기는 도구가 하므로 hex 로 바꿔 넘기지 않는다 — 사람이 적은 글 그대로 넘긴다.

| 사람이 고른 것 | 하는 일 |
|---|---|
| 기본값 | `color: "default"` |
| 색 둘(`#3b82f6 #a855f7`) | `color` 에 그대로. 이미 그라데이션이라 묻지 않는다 |
| 색 하나 | 도구가 `needs: "gradient"` 를 돌려준다 → **그라데이션 물음**: 「창에 그라데이션을 넣을까요?」 `넣기 (끝 색은 알아서)` · `한 색으로만` · `끝 색을 직접 적기`. 답에 따라 `gradient: "auto"` · `"flat"` · 사람이 적은 끝 색 |
| 너무 어두운 색 | 도구가 `needs: "brightness"` 를 돌려준다 → 「보이는 밝기로 올려 쓰기」 · 「그대로 쓰기」 · 「다시 적기」. `brightness: "lift"` · `"keep"` |
| 틀린 값(범위·자릿수) | 도구가 이유를 돌려준다 → 이유를 그대로 보이고 물음 칸: `다시 적기` · `기본값으로` · `지금 색 그대로 두기` |
| 철자가 조금 틀린 색 이름 | 도구가 비슷한 이름을 돌려준다 → `예, <그 이름>` · `다시 적기` · `기본값으로` |
| 말로 한 색 | 아래 「색을 말로 받았을 때」 |

도구가 이 세션에 없으면(방금 설치해서 아직 안 붙었을 때) 같은 일을 터미널 한 줄로 한다. 깃발 뜻은 도구와 같다 —
`--gradient`(끝 색 알아서) · `--flat`(한 색) · `--lift` · `--keep`. 종료 0 은 저장됨, 2 는 정할 것이 남았거나 값이 틀림(출력에 이유가 있다).

```bash
claude -p "/mod-color hsl(280, 70%, 60%) --gradient" --plugin-dir "<mod-maker>"
```

저장한 뒤에는 저장된 색(도구가 돌려준 `#시작 → #끝`)을 한 줄로 알리고, 나중에 바꾸는 법 `/mod-color <색>` 을 덧붙인다.

**3단계 — Playwright(선택, 권장은 설치).** 0절에서 잰 값으로 가른다.

| 잰 값 | 하는 일 |
|---|---|
| 이미 붙어 있음 | 「Playwright 는 이미 있습니다」 한 줄. 건드리지 않는다 |
| Node.js·npm 없음 | **묻지 않는다.** 「Playwright 는 건너뜁니다(Node.js 가 없습니다). mod 만들기는 그대로 됩니다. 나중에 Node.js 를 깔았다면 `/mod-maker-init playwright`」 한 줄. Node.js 를 대신 깔아 주지 않는다 — 까는 명령만 보인다(Windows `winget install OpenJS.NodeJS.LTS` · Mac `brew install node` · Linux 는 배포판의 꾸러미 관리자) |
| Node.js·npm 있음 | 물음 칸: 「Playwright 를 설치할까요? 있으면 Claude 가 그림을 보여 드리기 전에 직접 찍어 보고 어긋난 곳을 고칩니다. 없어도 mod 만들기는 그대로 됩니다.」 `설치 (권장)` · `건너뛰기`. 설치를 고르면 아래 순서 |

Playwright 설치 순서 — 한 단계씩 돌리고 결과를 `✓ 1/4 …` 꼴로 알린다. 실패해도 처음 설정은 끝까지 간다(색은 이미 저장됐다).

1. 도구 받아 두기 — `npx -y @playwright/mcp@0.0.81 --version` 이 판 번호를 찍는가. 전역 설치(`npm install -g`)는 하지 않는다 — 관리자 권한을 요구하는 기계가 있다. `sudo` 를 쓰지 않는다.
2. 브라우저 받기 — `npx -y playwright@1.64.0-alpha-2026-09-14 install chromium` (위 도구가 쓰는 판과 맞춘 것이다). 받지 못하면(회사 망에서 막힘, Mac 13 이하 등) 물음 칸:
   「Chromium 을 받지 못했습니다. 이 기계의 브라우저를 대신 쓸까요?」 `<있는 브라우저> 를 쓰기` · `건너뛰기`. 대신 쓸 브라우저는 Windows 는 Edge(`msedge`), Mac·Linux 는 Chrome(`chrome`) — 깔려 있을 때만 선택지에 넣는다.
   Linux·WSL 에서 시스템 꾸러미가 모자란다고 나오면 `sudo npx playwright install-deps chromium` 을 **보여 주기만** 한다. 대신 돌리지 않는다. Mac 과 Windows 에는 이 단계가 없다.
3. Claude Code 에 등록 — 그 사람의 모든 프로젝트에서 쓰도록(user 범위). 브라우저 이름은 2번에서 정한 것(`chromium` · `msedge` · `chrome`).
   - Mac·Linux·WSL: `claude mcp add playwright -s user -- npx -y @playwright/mcp@0.0.81 --browser chromium`
   - Windows: `claude mcp add playwright -s user -- cmd /c npx -y @playwright/mcp@0.0.81 --browser chromium`
4. 확인 — `claude mcp get playwright` 가 종료 0 이고 연결됨으로 나오는가. 「Claude Code 를 새로 열면 쓸 수 있습니다. 지우려면 `claude mcp remove playwright -s user`」.

끝나면 한 일을 세 줄로 정리한다 — 테마 색 · Playwright(설치함/건너뜀/이미 있음) · 다음에 할 말의 예(「오늘 할 일을 띠로 보여 주는 mod 만들어 줘」).

### 색을 말로 받았을 때

정해진 꼴(색 이름·hex·rgb·hsl)이 아닌 글 — 「진한 남색」「시원한 색」「#38f 에서 보라 쪽으로」 — 은 뜻을 읽어 **제안하고, 사람이 고른 것만 저장한다.**

- 뜻이 또렷하면: 읽은 색을 hex 와 함께 보이고 물음 칸 `이대로` · `더 밝게` · `더 어둡게` · `다시 말하기`.
- 여러 가지로 읽히면: 후보 셋을 hex 와 함께 보이고 물음 칸 `<후보 1>` · `<후보 2>` · `<후보 3>` · 다시 말하기(Other).
- 정해진 꼴이 섞여 있으면 그 값은 바꾸지 않고 그대로 쓴다(`#38f` 는 `#38f`).
- 색이 아닌 말(「지난번 그거」)이면 지어내지 않는다. 지금 색을 알려 주고 다시 묻는다.
- 고르기 전에는 아무것도 저장하지 않는다. 저장은 고른 hex 를 도구에 넘겨서 한다.

### 테마 색을 나중에 바꿀 때

사람이 「테마 색 바꿔 줘」라고 하면 위 1~2단계만 한다. 사람이 직접 `/mod-color <색>` 을 쳐도 된다 — 정할 것이 남으면 명령이 이 스킬에 넘겨 주고, 그때 물음 칸으로 묻는다.
이미 만든 mod 에 입히려면 `apply_to: "<mod 폴더 이름>"`(또는 `/mod-color apply <mod 폴더 이름>`). 그 mod 의 `hooks/ui/theme.ts` 한 파일만 바뀐다.

## 1. mod 가 맞는 도구인가

**화면이 있는 mod(창·띠·상태줄·토스트)는 코드를 쓰기 전에 `preview.md` 의 절차를 따른다** — 실제 자료로 그린 그림을 사람이 승인한 버전이 만들 것의 기준이다.

| 요구 | 쓰는 것 |
|---|---|
| 이미 있는 스크립트로 도구 호출을 막거나 기록 | 설정 훅(`settings.json` 의 `PreToolUse` 등) |
| 같은 지시를 매번 붙여 넣고 있다 | 스킬(`SKILL.md`) |
| 외부 시스템에 접근해야 한다 | MCP 서버 |
| 화면에 그린다(창·띠·상태줄·버튼), `/명령` 을 Claude 턴 없이 즉시 실행, 도구 호출·프롬프트를 **재작성**, 사용자에게 대화상자로 묻고 거부 | **mod** |

**위 표는 출발점일 뿐 금지 목록이 아니다.** 「설정 훅으로 된다」는 사실만으로 mod 를 빼지 않는다. 후보마다 아래 성질을 따져 더 나은 쪽을 고르고, 고른 이유를 성질로 말한다.

- 요구를 실제로 해내는가(계기·시점까지 — 예: 설정 훅은 프롬프트를 보낼 때만, mod 는 턴이 끝날 때도 돈다)
- 단순한가(파일 수, 움직이는 부품 수)
- 무엇에 기대는가(꺼질 수 있는 기능 — mod 는 원격·정책으로 꺼질 수 있다, 설정 파일 등록, 권한)
- 실패하면 어떻게 보이는가(조용히 지나가는가, 알리는가)
- 사용자 손이 얼마나 드는가

참고: 같은 일을 할 수 있으면 대개 설정 훅이 더 가볍다(`PreToolUse` 가 `permissionDecision: "ask"` 를 돌려주면 확인 창도 띄운다 — 문구·선택지를 못 고를 뿐).
대개일 뿐이니 위 성질로 확인한다. mod 는 샌드박스 밖에서 사용자 권한으로 돈다.

**요구는 네 칸으로 받는다** — **When** [계기] · **[watch / change / block]** [무엇] · **show it in** [자리: 띠·창·status·toast·transcript] · **using** [자료].
사용자가 「무엇을 하게 할지」만 말했으면 비는 칸을 한 번에 되묻는다. 네 칸이 차면 코드를 쓰기 전에 **계획 한 블록**을 보인다 —
보는 것(이벤트+matcher) · 하는 것(`$` 호출) · 그리는 자리 · 갱신 시점 · 실패하면 어떻게 보이나 · 지우면 남는 것.
도구 호출을 건드리는 mod 면 **이미 걸린 `PreToolUse` 설정 훅**(`~/.claude/settings.json`·프로젝트 `.claude/settings.json`)과 겹치는지 먼저 본다 —
겹치면 두 번 묻거나, mod 가 통과시킨 것을 뒤에서 막는다.

## 2. 켜져 있는지 먼저 잰다

빈 폴더에서 `claude plugin test` 를 돌려 메시지를 본다. 빈 폴더는 Mac·Linux·WSL 은 `cd "$(mktemp -d)"`, Windows(PowerShell)는
`$d = Join-Path $env:TEMP ("mm-" + [guid]::NewGuid()); New-Item -ItemType Directory $d | Out-Null; Set-Location $d`.

```bash
claude --version
claude plugin test
```

| `claude plugin test` 메시지 | 뜻 |
|---|---|
| `no hooks module to load` | 켜져 있다. 진행 — **종료 코드는 1 이어도** 이 메시지면 켜진 것이다(빈 폴더라 시험할 mod 가 없다는 뜻) |
| `hooks modules are turned off here` | 내 설정(`disableAllHooks`)이나 조직 정책이 막는다 |
| `turned off in this process … rollout switch was saved off` | 이전 세션이 꺼진 스위치를 저장해 둔 것. 네트워크 되는 터미널에서 `claude` 를 한 번 띄운 뒤 다시 잰다 |
| `turned off in this process` (그 밖) | 원격으로 꺼져 있다. 로컬 설정으로 못 켠다 → 설정 훅으로 대체 |

이 세션이 `claude -p`·`dontAsk`·`--safe-mode`·`--bare` 면 hot reloading 질문을 띄울 수 없어 **이 세션에서 만든 mod 가 이 세션에 뜨지 않는다**
(설치된 mod 의 훅 자체는 `-p` 에서도 돈다). 그때는 파일만 쓰고 적재는 새 터미널(`claude --plugin-dir <폴더>`)로 넘긴다. 서브에이전트 안에서도 같다 —
질문과 다음 턴 알림은 부모 세션에 가므로 `Skill(plugin-authoring)` 호출과 파일 쓰기는 **부모 세션이** 한다.

## 3. 자리를 정한다 — 쓰기 전에

| 쓰임 | 자리 | 적재 |
|---|---|---|
| 이 세션에서 한 번 써 보고 버린다 | `plugin-authoring` 이 가리키는 세션 mods 폴더 | 첫 파일을 쓰면 엔진이 사용자에게 「Enable hot reloading for this session?」을 묻는다. **사용자만 답한다.** 턴이 끝날 때 뜬다. `cleanupPeriodDays` 뒤 폴더가 지워진다 |
| 계속 쓴다 | `~/.claude/skills/<이름>/` (`claude plugin init <이름>` 뼈대, 또는 직접) | 다음 세션부터 `<이름>@skills-dir` 로 자동 적재. 편집하면 그 세션이 다시 읽는다 |
| 다른 사람에게 준다 | 저장소 하나 = 마켓플레이스 | `/plugin install <이름> --marketplace <owner>/<repo>` |

**「계속 쓴다」가 기본이다.** 사용자가 「한 번 보자」고 하지 않았으면 세션 폴더에 두고 끝내지 않는다. 처음부터 `~/.claude/skills/<이름>/` 에 쓰면
이 세션에 hot reload 가 안 걸리므로 새 터미널에서 `claude --plugin-dir ~/.claude/skills/<이름>` 으로 본다.
`~/.claude` 는 보호 경로라 `default`·`acceptEdits` 모드에서는 파일마다 승인이 뜬다. Windows 에서 `~` 는 `%USERPROFILE%` 이다.

## 4. 쓴다

1. `Skill(plugin-authoring)` 을 **먼저** 부른다 — 이 빌드의 타입 파일을 만들고 세션 폴더 감시를 켠다.
2. 막는 훅(`tool.call`·`prompt.submit`·`command.run` 에서 거부할 수 있는 것)은 **막는 쪽으로 실패**하게 쓴다 —
   `.catch(($, e, next) => next.called ? next(e) : { deny: '...' })`. 없으면 훅이 던질 때 도구가 그냥 돈다.
   `deny` 사유는 Claude 가 따를 **지시문**으로 쓴다(「막혔다」가 아니라 「새 브랜치로 푸시하라」). 사용자에게 묻는 대기는 `$.ui.ask` 안에 둔다 —
   내 promise 를 기다리는 시간은 훅 시간 한도에 들어가고, 넘기면 보류한 명령이 돈다.
3. 정적 분석이 읽을 수 있게 쓴다 — `$.ui.toast(...)` 처럼 **`$`·이름공간·메서드를 한 줄에**(`const ui = $.ui` 금지), 이벤트 이름은 문자열 리터럴,
   `import` 만(`require`·동적 `import()` 금지), 플러그인 폴더 안 상대 경로만, `claude-code` 가 유일한 bare import.
4. 사람이 보는 라벨·대화상자는 사용자의 말(한국어 사용자면 한국어), 모델이 읽는 `deny` 사유는 영문. `$.ui.ask` 는 질문이 물음표로 끝나야 하고
   선택지 2~4개, `header` 12자 이하다(정확한 제약은 타입 파일의 `AskOptions`). 같은 이벤트를 matcher 없이 두 번 `on` 하면 모듈이 안 뜬다 —
   세션 시작 일은 훅 하나에 모으고, `$.command.register` 는 그 훅의 **맨 끝**(이름이 겹치면 던지고, 던진 뒤의 등록은 안 된다).
   그림이 읽는 값은 모듈 변수가 아니라 `$.state`(리로드에 남고 자동 재그리기), 세션을 넘길 값은 `$.store` — `/clear` 뒤엔 `classic.SessionStart` 에서 다시 불러온다.
   자세한 것은 `best-practices.md` §3·§4.
5. **묻는 훅은 사람이 없으면 거부가 된다.** `$.ui.ask` 는 `claude -p` 에서 reject 하므로, 막는 쪽으로 실패하게 쓴 가드는 사람 없이 도는 실행에서
   해당 명령을 전부 막는다. 그런 실행에는 그 mod 를 싣지 않거나(`--plugin-dir` 를 안 줌·`claude plugin disable`) `e.agentId`·surface 로 가른다.
6. **그리는 mod(`ui.render`·`$.ui.open`·띠·status)면 `design.md` 를 먼저 읽고** 이 폴더의 `templates/ui/`(`tokens.ts`·`parts.ts`·`gradient.ts`·`decor.ts`·`theme.ts`)를
   mod 의 `hooks/ui/` 로 복사해 **토큰과 부품으로** 그린다. 색(테마 키)·기호·상태 낱말·폭 경계·막대를 호출하는 자리에서 직접 쓰지 않는다 —
   필요한 것이 없으면 `tokens.ts` 에 더한다. **테마 색은 `theme.ts` 에서만 온다** — 색 값을 다른 파일에 적지 않는다.
   글자 폭은 `cells`/`fit`/`pad`(한글 2칸), 폭은 `e.props.bodyColumns`, 좁아지면 `ladder` 네 단으로 내려간다. 본보기는 `examples/sample-band/`.
7. `tests/<이름>.test.ts` 를 같이 쓴다 — `claude-code/testing` 의 `test`·`expect`, 본문은 `($, on)`. 테스트의 `on` 이 엔진 자리(모든 플러그인 아래)에 서므로
   `on('tool.call', { tool: 'Bash' }, () => ({ result: ... }))` 로 도구 실행을 대신하고, `$.tool.call({ tool: 'Bash', command })` 로 호출을 일으킨다.
   `$.ui.ask` 는 속으로 `AskUserQuestion` 의 `tool.call` 이라 같은 꼴로 답을 흉내 낸다. 시계는 `mock.clock(on)` 으로 대역을 세운다
   (없으면 「no implementation for clock.now」로 훅이 건너뛰어진다). 그리는 mod 의 테스트는 **100열·40열·빈 자료** 세 번 mount 해 폭 사다리와 빈 상태를 잰다.

## 5. 검사 — 돌린 것만 「통과」다

`<mod>` 자리에 mod 폴더를 넣는다. 세 명령은 Windows(PowerShell)와 Mac·Linux·WSL 에서 같다.

```bash
claude plugin validate "<mod>"
claude plugin test "<mod>"
```

- `validate` — `hooks:`/`calls:` 줄에 의도한 이벤트가 다 있는가. 막는 훅은 "gating hook with .catch". **Claude Code 만으로 돈다.**
- `test` — 시험 수와 실패 수를 읽는다. **Claude Code 만으로 돈다.**
- 타입 검사 — **Node.js 가 있을 때만.** `tsc -p "<mod>"`(PATH 에 tsc 가 없으면 `npx -y -p typescript tsc -p "<mod>"`). 한 번 적재된 뒤 `.claude-plugin/types/` 가 깔려야 뜻이 있다.
  Node.js 가 없으면 돌리지 않고 **「타입 검사는 건너뜀(tsc 없음)」**이라고 보고한다. 통과라고 하지 않는다.

그 다음 **실제 세션에서 눈으로** 본다 — `/plugin` 의 Installed 탭 또는 transcript 의 재적재 줄에 이름이 떠야 「켜졌다」고 말한다.
안 뜨면 `claude --debug-file ./mod.log --plugin-dir "<mod>"` 로 띄우고 그 로그에서 mod 이름을 찾아 `not loaded:`·`hook skipped:`·`refused:` 뒤의 이유를 읽는다.

그리는 mod 는 그 전에 `design.md` §6 의 열 가지를 훑는다. Playwright 가 있으면 결과 화면을 찍어 승인받은 그림과 나란히 본다. 없으면 사람에게 봐 달라고 한다.

## 6. 보고 — 사용자에게

순서대로 여섯. ① mod 이름과 폴더 전체 경로 ② 무엇을 하는지(이벤트·조건·결과를 말로) ③ 켜는 법 — 이 세션(질문에 답했는지)·새 터미널(`--plugin-dir`)·상시
(`~/.claude/skills/`) 중 지금 어느 상태인지 ④ 검사 결과 — 돌린 명령과 종료 코드, **못 돌렸거나 건너뛴 것은 그렇다고** ⑤ 화면 — 어디에(띠·창·status) 무엇을 몇 줄로 그리고,
좁아지면 어떻게 줄고, 비면 무엇이 보이는지. 승인받은 그림과 달라진 곳이 있으면 그 까닭 ⑥ 한계(철자 목록·서브에이전트·권한 창 중복 등).

## 자주 새는 자리

| 하기 쉬운 것 | 실제 |
|---|---|
| 「모드가 뭔지 확인받고 시작」 | mod 다. 하게 할 일만 묻는다 |
| Node.js·Playwright 가 있다고 치고 시작 | Claude Code 만 있는 기계가 있다. 0절부터. 없으면 건너뛰고 그렇다고 말한다 |
| 화면이 있는 mod 를 그림 없이 바로 만듦 | `preview.md` — 사람이 「그림 없이」라고 했을 때만 건너뛴다 |
| 처음 설정에서 「색을 입력해 주세요」라고 글로 물음 | 물음 칸(`AskUserQuestion`)으로. 사람은 고르기만 한다 |
| 사람이 말한 색을 바로 저장 | 읽은 색을 보이고 고르게 한 뒤에 저장한다 |
| 세션 폴더에 만들고 끝 | `cleanupPeriodDays` 뒤 사라진다. 계속 쓸 것은 `~/.claude/skills/<이름>/` |
| 켜져 있는지 안 재고 씀 | 스위치가 꺼진 채 저장돼 있을 수 있다. 2절부터 |
| `plugin test` 못 돌렸는데 「검증 완료」 | 못 돌린 검사는 통과가 아니다. 못 돌린 이유와 함께 보고 |
| 막는 훅에 `.catch` 없음 | 훅이 실패하면 열린 채로 지나간다 |
| `deny: '막혔습니다'` | Claude 는 그 문장을 도구 결과로 읽는다. 대신 무엇을 하라는지 적는다 |
| 창이 안 뜨는데 코드는 맞음 | 묻지 않고 연 창은 144열 미만에서 기다린다(`isPlaced`). 트리 prop 하나가 틀려도 전체가 거부돼 `refused:` 줄이 뜬다 |
| 커뮤니티 글대로 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` | 2.1.287 부터 무시하는 얼리 액세스 변수다. 지운다 |
| 상태 낱말·기호·색을 그 자리에서 지어냄(「작업 중」「답 대기」「◆」) | mod 마다 어휘가 달라져 사용자가 다시 배운다. `tokens.ts` 의 `state` 만 쓴다 |
| `color: '#7FD1A6'`·`'red'` 를 그리는 자리에 적음 | 밝은 테마에서 안 읽힌다. 상태는 테마 키(`theme.*`), 분위기 색은 `gradient.ts` 가 `theme.ts` 에서 읽은 것만 |
| `.length` 로 한글 열 맞춤 · `viewport.columns` 로 폭 | 한글은 2칸, 띠 폭은 `bodyColumns`(오른쪽 5칸은 엔진 몫). `cells`/`fit`/`pad` |
| 자료가 비면 빈 Box | 「비어 있습니다 + 채우는 법」 두 줄(`emptyState`). 빈칸은 고장처럼 보인다 |
| `if (width < 60)` | 경계 숫자가 mod 마다 흩어진다. `ladder(width) === 'line'` 처럼 이름으로 가른다 |
| 「hot reloading 켜 두었습니다」 | 사용자만 답한다. 답을 받았는지는 다음 턴 머리의 알림으로 안다 |
