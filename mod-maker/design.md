# mod 화면 설계 — 토큰으로 그린다

그리는 mod 는 전부 이 문서를 따른다. 규칙의 숫자는 이 빌드의 d.ts(`<mod>/.claude-plugin/types/claude-code/index.d.ts`)에서 왔고,
모양은 Anthropic 샘플(token-weather·blast-radius·내장 /diff)과 공개 mod(flightdeck·agent-watch·whats-agent-doing·claude-deck)와
영상의 세 화면(Clean View·Session Bar·Agent Dock)에서 추렸다. 출처는 맨 끝 표.

## 0. 토큰을 쓴다 — 지어내지 않는다

mod-maker 폴더의 `templates/ui/` 파일들을 mod 의 `hooks/ui/` 로 **복사**해 쓴다(mod 는 자기 폴더 밖을 import 못 한다).

| 파일 | 담은 것 | `$` |
|---|---|---|
| `tokens.ts` | ① 원시값 — `theme`(역할→테마 키) · `glyph`/`glyphAscii` · `bars` · `space` · `width` · `time` · `limit` ② 의미 역할 — `state`(상태 = 기호+낱말 ko/en+색 한 묶음) · `identityOf` · `frameColor` ③ 셈 — `cells`(한글 2칸) · `fit` · `pad` · `bar` · `spark` · `percent` · `elapsed` · `freshness` · `ladder` · `columns` | 없음. 순수 함수 |
| `parts.ts` | 부품 — `header` · `requestLine` · `stepLine` · `checklistRow`/`checklist` · `stateCell` · `emptyState` · `identityDots` · `radioRow` · `oneLiner` · `moreRow` · `staleTag` · `frame` | 없음. `$.ui.resolve(e)` 가 준 요소 테이블 `t` 를 받는다 |

```ts
import { checklist, columns, requestLine, stepLine } from './ui/parts'
import { ladder, state, theme } from './ui/tokens'

on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
  if (e.props.hasSurvey) return next(e)
  const t = $.ui.resolve(e)                 // 요소 테이블. 다른 파일로 넘겨도 된다($ 는 안 된다)
  const width = e.props.bodyColumns         // viewport.columns 가 아니다
  const cols = columns(width, 'ko')         // 열 폭. 좁아지면 막대부터 사라진다
  return t.Box({ flexDirection: 'column', width, children: [
    requestLine(t, { text: goal, width }),
    stepLine(t, { step, total, fraction, elapsedMs, width }),
    ...checklist(t, rows, { cols, maxRows: e.props.maxRows - 2 }),
  ] })
})
```

완성된 본보기는 `examples/sample-band/`(띠 하나, 폭 사다리 넷, 빈 상태, 시험 3건)이다. 그 시험 파일은 mod-maker 자신의 시험에 섞이지 않게 `.txt` 를 붙여 두었다 — 돌려 보려면 폴더를 다른 곳에 복사하고 이름 끝의 `.txt` 를 뗀 뒤 `claude plugin validate` · `claude plugin test` 를 돌린다.

**새 낱말·새 기호·새 색이 필요하면 `tokens.ts` 에 더하고 쓴다.** 호출하는 쪽에서 `'warning'` 이나 `'◆'` 를 직접 쓰지 않는다 — 다음 mod 가 다른 낱말을 고르면 사용자가 mod 마다 어휘를 다시 배운다(토큰 없이 만들게 했을 때 실제로 그랬다: 「작업 중/답 대기/완료」·기호 ◆·경계 84열을 그 자리에서 지어냈다).

## 1. 다섯 화면이 공유하는 문법

| 자리 | 그리는 것 | 부품 |
|---|---|---|
| 1행 | 「무엇을 하는 중인가」 한 줄 — 요청 원문(`✳ …`) 또는 상태 알약(`‖ 당신 차례  Claude 가 답을 기다립니다`). 넘치면 `…` | `requestLine` · `header` |
| 2행 | `3/7 단계` + 전체 막대 + 오른쪽 끝 `21초  29%`. 막대가 비어 있어도 자리를 둔다 | `stepLine` |
| 본문 | 세 열 — 기호 · 사람 말로 쓴 할 일 · 상태 낱말(+wide 에선 행별 막대, 오른쪽에 경과). 현재 행 굵게, 끝난 행 보통, 남은 행 흐리게 | `checklist` |
| 넘침 | 상한(`limit.listRows` 4) 뒤 「… 외 N건」. 보일 행은 당신 차례 → 실패 → 진행 중 순으로 고른다 | `checklist` 가 한다 |
| 비었을 때 | 굵은 한 줄 + 흐린 설명 한 줄. 빈 Box 를 두지 않는다 | `emptyState` |
| 창 머리말 | `◆ 제목` 왼쪽, 상태 낱말 오른쪽 끝, 한 줄 | `header` |
| 고르기 | 가로 라디오 `1  3  5  [50]  100`, 고른 것만 배경 반전, 바로 밑에 「그래서 무슨 일이 일어나나」 한 문장 | `radioRow` + `Text` |
| 여럿의 정체 | 에이전트마다 색점 하나(테마 키 8색 순환), 넘치면 `+N` | `identityDots` |
| 한 줄 요약 | 왼쪽부터 중요한 순, `·` 로 잇고, 폭을 넘으면 뒤부터 버린다 — token-weather 꼴 | `oneLiner` |
| 단계 트랙 | 항목 하나가 블록 하나 `✓✓▶▶░░░`, 끝남 초록·진행 중 주황 ▶·남음 흐림. 항목이 폭을 넘으면 나눠 쓴다. 병렬은 ▶ 여럿 | `trackLine` (`tokens.track`) |
| 절 구분선 | `─ 제목 ───` 흐리게. 빈 절엔 안 그린다 | `sectionRule` |
| 현재 행 강조 | 행 전체 배경 `theme.now`, 글자 `theme.onNow`. 찾을 필요가 없게 | `checklistRow({ highlight: true })` |

## 2. 상태는 세 겹으로 — 어휘 고정

| 키 | 기호 | ko | en | 색(테마 키) | 뜻 |
|---|---|---|---|---|---|
| `needsYou` | ‖ | 당신 차례 | Needs you | `warning` | 승인·답변을 기다린다. **항상 호박색, 항상 맨 위** |
| `blocked` | ✗ | 막힘 | Blocked | `error` | 답 없는 물음에 막혀 섰다. 당신 차례 다음으로 급하다 |
| `working` | ● | 진행 중 | Working | `claude` | 지금 하는 중 |
| `done` | ✓ | 끝남 | Done | `success` | 끝났다 |
| `failed` | ✗ | 실패 | Failed | `error` | 실패 |
| `denied` | ⊘ | 거부됨 | Denied | `error`(흐림) | 거부됐다 |
| `stopped` | ■ | 중단 | Stopped | `inactive`(흐림) | 사람이 멈췄다 |
| `next` | ○ | 다음 | Next | `text`(흐림) | 바로 다음 |
| `upNext` | ○ | 대기 | Up next | `inactive`(흐림) | 그 뒤 |
| `idle` | ○ | 조용함 | Idle | `inactive`(흐림) | 턴이 끝나 기다리는 중 |

`stateCell(t, k)` 는 기호·낱말·색을 **한꺼번에** 그린다. 색만 꺼내는 길이 없는 것은 일부러다 — 색이 안 보이는 사람·단색 터미널·밝은 테마에서도 기호와 낱말로 읽힌다.

## 3. 색은 테마 키, 폭은 bodyColumns, 글자는 칸

- **색**: `theme.*` 의 테마 키(`claude`·`warning`·`success`·`error`·`inactive`·`subtle`·`text`·`promptBorder`)만. 16진수·`'red'` 같은 원색은 밝은 테마에서 안 읽힌다. 장식(정체성 색점)도 `identityOf(i)` 의 테마 키.
- **폭**: `e.props.bodyColumns`. `viewport.columns` 는 창이 옆에 붙었을 때 틀리고, 오른쪽 5칸은 엔진의 `[−]` 몫이다.
- **글자 폭**: `cells()` 로 잰다. 한글은 2칸이라 `.length` 로 열을 맞추면 한 글자마다 1칸씩 어긋난다. 자르기는 `fit()`(`…` 1칸 포함), 채우기는 `pad()`.
- **기호**: `glyph.*` 의 한 칸짜리 유니코드만. Nerd Font 를 전제하지 않는다. 모호 폭(●○✓✗)을 두 칸으로 그리는 터미널이면 `glyphAscii` 로 바꾼다.
- **높이**: 띠는 `e.props.maxRows`(터미널 절반이 상한) 안에서 `limit.bandRows`(6)를 넘지 않는다. 1행+2행+목록 4행이 전부다.

## 3-1. 테마와 고르는 줄은 다른 색 체계다 — `gradient.ts`

한 창에는 세 색 체계가 있고 서로 덮지 않는다. **테마 색은 `theme.ts` 에서 온다** — 처음 설정이나 `/mod-color <색>` 이 그 파일을 쓰고, `gradient.ts` 가 읽는다. 색 값을 다른 파일에 직접 적지 않는다.

| 체계 | 무엇 | 색 | 토큰 |
|---|---|---|---|
| 테마 | 창의 분위기 — 테두리·문양(도트 아트)·제목·머리 숫자 | 테마 색(시작 → 끝) 대각선 그라데이션, 글자 단위. 한 색 테마면 양끝이 같아 단색으로 보인다(`gradientAt(x, y, w, h, mode)`) | `ramp`·`slope`·`gradientAt`·`segments`·`frameGlyph` |
| 고르는 줄 | 사람이 누르는 것 — 메뉴 항목·목록 행·버튼 | **단색.** 단축키는 테마 끝 색 · 라벨 `text` 굵게 · 설명 `subtle` · 개수 `inactive`. 포인터가 올라가면 테마 끝 색 배경 + `inverseText` | `pick.*`·`pick.hover` |
| 상태 | 뜻이 있는 것 — 당신 차례·막힘·끝남 | `state` 그대로(호박·빨강·초록). 테마도 고르는 줄도 이 색을 덮지 않는다 | `state`(tokens.ts) |

- 보조 색은 `palette`(start·end·middle·deep·cream·warmGray) — 테마 양끝과 그 사이·둘레만. 항목이 여럿이면 `stepColor(i, n)` 으로 번호 버튼을 시작 색에서 끝 색으로 한 칸씩 옮긴다. 테마 밖 원색(파랑·초록)은 상태 색(`state`)에만 남긴다.
- 그라데이션은 16진수를 쓴다 — 테마 키로는 못 만든다. 그래서 밝은 테마용 짝(`ramp.light`)을 따로 두고 `modeOf(테마 이름)` 으로 가른다. 테마 이름은 `$.config.list()` 의 `theme` 행에서 읽는다.
- 테두리를 그라데이션으로 흘리려면 `Box` 의 `borderStyle` 대신 `frameGlyph` 로 선을 글자로 그린다(Box 테두리는 한 색뿐이다).
- 글자마다 `Text` 를 만들면 요소가 많아진다. `segments(text, 2)` 로 두 칸마다 색 하나로 줄인다.
- 24비트 색 터미널 전제다(Windows Terminal·데스크톱 앱은 된다).
- **꾸밈 부품 `decor.ts`** — 널리 쓰이는 터미널 화면들의 버릇을 테마 색으로 옮긴 것. 새 mod 는 틀·요약·키 안내를 손으로 그리지 않고 이것을 쓴다.

  | 부품 | 어디서 왔나 | 모양 |
  |---|---|---|
  | `edgeLine` | lazygit·ratatui Block — 제목이 선 안에 | `╭─ ✦ 오늘 할 일 ─────╮` · `╰──── 갱신 4초 전 ─╯` |
  | `badge` | lipgloss 상태줄 조각 | 배경색 위 어두운 글자 ` 당신 차례 1 `. 상태 색이 그대로 배경. 알약끼리 붙이면 상태줄 |
  | `keyHints` | bubbles help | `Tab 이동 · Enter 고르기` — 키는 테마 끝 색 굵게, 설명 회색 |
  | `meter` | btop 그라데이션 계기 | `▰▰▰▰▱▱▱` 채운 칸이 테마 시작 색 → 끝 색 |
  | `SPINNER`·`spinnerAt` | 점자 스피너 | `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` — 글자가 바뀌므로 「글은 같고 색만」을 지켜야 하는 자리(상태창 회전 검사)에는 쓰지 않는다 |
  | `gtext` | — | 조각(3칸)마다 그라데이션 색. 세 mod 의 같은 함수를 여기로 모았다 |

## 4. 폭 사다리 — 좁아지면 덜 보여 준다, 깨지지 않는다

`ladder(bodyColumns)` 네 단. `columns()` 가 각 단의 열 폭을 돌려준다.

| 단 | bodyColumns | 보이는 것 |
|---|---|---|
| `wide` | ≥ 100 | 기호 · 할 일 · 행별 막대 14칸 · 상태 낱말 · 경과 |
| `medium` | ≥ 80 | 행별 막대를 뺀다 |
| `narrow` | ≥ 60 | 경과까지 뺀다. 기호 · 할 일 · 상태 낱말 |
| `line` | < 60 | 한 줄 요약(`oneLiner`) — `◆ 팀 3 · ‖ 당신 차례 1 · 1/3 끝남` |

단을 가를 때는 `ladder(width) === 'line'` 처럼 **이름으로** 가른다. `width < 60` 같은 숫자를 호출하는 자리에 쓰면 경계가 한 곳(`width`)이
아니라 mod 마다 흩어진다(실제로 그렇게 흩어진 적이 있다).

창(Pane)은 엔진 규칙이 하나 더 있다 — 110열부터 옆에 붙고, mod 가 **스스로** 연 창은 144열부터만 뜬다(`$.ui.open` 의 `isPlaced`). 못 띄우면 띠나 `$.ui.toast` 로 내려간다(blast-radius·flightdeck 이 이렇게 한다).

## 5. 시간과 신선도

- 갱신은 `time.refreshMs`(5초) 또는 이벤트에서 `$.ui.invalidate`. 초당 10회(보이는 창·펼친 띠는 30회) 넘는 호출은 합쳐지므로 더 잦게 부를 이유가 없다.
- 값이 `time.staleMs`(15초)보다 오래됐으면 `staleTag()` 로 `(21초 전)` 을 붙인다. **낡은 값을 산 것처럼 두지 않는다**(hyperskills: 「움직이는 장식은 건강의 증거가 아니다」). 원천이 아예 끊겼으면 그림을 내리고 빈 상태를 그린다.
- 경과는 `elapsed()` — `1분 12초` / `1m 12s`. 비율은 `percent()` — `29%`. 없는 값과 0 을 같게 그리지 않는다(없으면 빈 문자열, 0 이면 `0%`).

## 6. 쓰기 전 체크 — 열 가지

1. 색을 테마 키로만 썼다(16진수·원색 이름 0건) → `grep -nE "'#|color: '(red|green|blue|yellow|cyan|magenta|white|gray)'" hooks/`
2. 상태는 `state`/`stateCell` 로 그렸다(기호·낱말 직접 쓰기 0건)
3. 폭은 `bodyColumns`, 글자는 `cells`/`fit`/`pad`
4. 폭 사다리 넷에서 다 읽힌다 — 테스트가 100열과 40열을 둘 다 mount 한다
5. 비었을 때 `emptyState` 가 나온다 — 테스트가 빈 자료로 mount 한다
6. 당신 차례(`needsYou`)가 있으면 맨 위에 호박색으로 온다
7. 띠는 6줄 이하, 넘침은 「외 N건」
8. 낡은 값에 `staleTag`, 원천 끊김은 빈 상태
9. 사람이 읽는 라벨은 한국어 문장(도구 이름·내부 약어·단계 번호 아님 — 알림 카드 규칙과 같다)
10. 토큰 파일을 고쳤으면 mod-maker 폴더에서 `claude plugin test .` 가 통과한다(토큰의 셈 시험이 들어 있다)

## 7. 출처

| 무엇 | 어디서 |
|---|---|
| 테마 키 23개 · `bodyColumns` · `maxRows` · 110/144열 · 초당 10/30회 | 이 빌드 d.ts(`ThemeKey`·`AbovePrompt`·`Pane`), [reference](https://code.claude.com/docs/en/plugins/mods/reference), [interface](https://code.claude.com/docs/en/plugins/mods/interface) |
| 요소마다 어떻게 보이나 | [gallery](https://code.claude.com/docs/en/plugins/mods/gallery) |
| 띠 한 줄 꼴(기호→낱말→비율→절대값→추세→변화) | [token-weather](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/token-weather) |
| 묻는 창 — 144열 창/아니면 띠, 기본 포커스 취소, 10분 무응답 거부 | [blast-radius](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods/blast-radius) |
| 고정 머리말 + 본문만 스크롤, 폭 먼저 재고 열기, 잡음 접기 | [내장 /diff](https://github.com/anthropics/claude-code/tree/main/mods/diff) |
| 카드→스윔레인 전환, 색 역할 고정, 144열 밑 띠 8줄 요약 | [claude-flightdeck](https://github.com/scasella/claude-flightdeck) |
| 상태 어휘 넷(작업 중·당신 기다림·조용함·끝남), 기다리는 것 먼저, 30초/2분 ⚠ | [claude-agent-watch](https://github.com/TheoGegout/claude-agent-watch) |
| 한 줄 띠 + `(+N more)` + 이력 기호 ✓✗⊘■, 다른 mod 밑에 쌓임 | [whats-agent-doing](https://github.com/tzafrir/whats-agent-doing) |
| 급한 것 먼저 접기, 기다리는 줄 호박색 | [claude-deck](https://github.com/nvr0x5/claude-deck) |
| 1행 요청·2행 단계·세 열 체크리스트·빈 상태·가로 라디오·색점 | 영상 「Claude Code Just Dropped MODS」(Tristen O'Brien, 2026-10-05) 의 Clean View·Session Bar·Agent Dock 화면 |
| 대시보드 네 가지(라벨·단위·신선도·자세히 보는 길), 없음≠0, 막대 30~35칸, 굵은 선=포커스, Nerd Font 금지 | [hyperskills tui-design](https://skills.sh/hyperb1iss/hyperskills/tui-design) (설치 1.2K) |
| 계획 블록(Container/Observe/Do/Lifecycle/Channels/Reach), 발자국 diff, 「실패를 본 적 없는 테스트는 테스트가 아니다」 | [mod-builder](https://github.com/karanb192/claude-code-mods) |
| 요청 네 칸 — When [계기] / [watch·change·block] [무엇] / show it in [자리] / using [자료] | [mods-starter](https://github.com/carlvellotti/mods-starter) |
