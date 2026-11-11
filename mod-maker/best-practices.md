# mod 모범 사례 — 공식 문서·샘플·공개 mod 에서 추린 것

출처 표기: [공식] = code.claude.com/docs 의 mods 문서(overview·create·events·api·interface·troubleshoot),
[내장] = 내장 `plugin-authoring` 스킬의 reference.md, [안내서] = ruvnet 「Claude Code Mods: a field guide」,
[모음] = OneWave-AI/claude-code-mods README. 공식과 커뮤니티가 어긋나면 공식이 이긴다. 그래도 **이 빌드의 d.ts 가 문서보다 먼저다.**

## 1. 만들기 전에

- **mod 가 맞는 도구인지 가른다.** 설정 훅·스킬·MCP 로 되는 일은 그쪽으로. mod 는 화면을 그리거나, 턴 없이 즉시 도는 `/명령` 을
  만들거나, 도구 호출·프롬프트를 **재작성**할 때 쓴다. [공식]
- **고정 명령·경로 차단은 권한 규칙으로.** `Bash(npm test)` 같은 규칙은 코드가 없다. `tool.check` 훅은 「지금 브랜치가 main 인가」처럼
  그 순간의 상태에 따라 갈릴 때만 쓴다. [공식]
- **발자국을 읽는다.** `claude plugin validate --strict <폴더>` 의 `hooks:`·`calls:` 줄을 사람이 읽는다. `$.fs.write`·`$.process.run`·
  `$.http.fetch`·`$.env`·`$.settings.read`·`$.mcp.call` 이 있으면 왜 필요한지 따진다. mod 는 샌드박스 밖에서 사용자 권한으로 돈다. [공식][안내서]
- **`CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` 는 지운다.** 얼리 액세스 변수다. 2.1.287 부터 무시하므로 커뮤니티 글의 「켜라」는 낡은 안내다. [공식]

## 2. 훅 작성

- **셋 중 하나만 한다.** 관찰 `return next(e)` · 재작성 `next({ ...e, text })` · 직접 응답은 `next` 없이 결과 반환. `e` 는 얼어 있어
  필드 대입은 던진다. [공식]
- **`deny` 사유는 Claude 가 따를 지시문으로.** 「강제 푸시 금지. 새 브랜치로 푸시하라」처럼 쓴다. Claude 는 그 문장을 도구 결과로 읽는다. [공식]
- **막는 훅은 `.catch` 로 닫힌 쪽으로 실패시킨다.** 훅이 던지거나 시간을 넘기면 엔진은 그 훅을 건너뛰고 명령을 돌린다.
  `on(...).catch(($, e, next) => next.called ? next(e) : { deny: '...' })`. `next.error.kind` 가 `throw`·`timeout` 을 말해 준다. [공식][내장]
- **사용자에게 묻는 대기는 `$.ui.ask` 안에.** mods API 호출 안에서 기다리는 시간은 훅 시간 한도에 안 들어가지만 내 promise 를 await 하는
  시간은 들어간다. 시간을 넘기면 보류한 명령이 돈다. 답이 없을 때 기본값은 「거부」. 질문은 물음표로 끝, 선택지 2~4개, `header` 12자 이하. [공식]
- **`claude -p` 에서는 물을 사람이 없다.** `$.ui.ask` 가 reject 하므로 catch 에서 거부로 간다. headless 작업자에는 묻는 가드를 싣지 않는다. [공식]
- **같은 이벤트를 matcher 없이 두 번 등록하지 않는다.** `on("session.start") is registered twice` 로 모듈이 안 뜬다. 세션 시작 일은 훅 하나에. [공식]
- **명령 등록은 `session.start` 훅의 맨 끝에, 또는 try 로.** 내장 명령과 이름이 겹치면 던지고, 던진 훅은 건너뛰어 나머지 등록도 안 된다. [공식]
- **서브에이전트 호출도 잡힌다.** `tool.call`·`turn.step` 은 서브에이전트에서도 불린다. 메인 대화만 보려면 `e.agentId` 를 본다. [공식]
- **`turn.step` 은 async generator.** 응답이 스트리밍되므로 `yield* next(e)` 로 넘긴다. [공식]
- **프롬프트 섹션을 요청마다 바꾸지 않는다.** `prompt.section`·`prompt.context` 에서 바뀌는 문장은 프롬프트 캐시를 깨뜨린다. [공식]
- **정적 분석이 읽을 수 있게.** `$`·이름공간·메서드를 한 줄에(`const ui = $.ui` 는 실패), 이벤트명은 문자열 리터럴, `import` 만
  (`require`·동적 `import()` 금지), 플러그인 폴더 안 상대 경로만, bare import 는 `claude-code` 뿐. [공식]
- **`node:*`·`Buffer`·`setTimeout` 이 없다.** 파일은 `$.fs`, 프로세스는 `$.process`, 타이머는 `$.clock.every/after`. `$.process.run` 은
  셸이 없으니 인자 배열로 넘기고 try 로 감싼다(기본 30초 뒤 reject). [공식][안내서]
- **순서를 안다.** 조직 관리 설정의 `PreToolUse` → 내장 가드 → 설치한 mod(의존하는 mod 가 뒤) → 그 밖. 설정 파일의 `PreToolUse` 는 마지막
  mod 가 `next` 를 부른 뒤 돈다. 이미 걸린 설정 훅과 겹치면 두 번 묻거나 뒤에서 막힌다. [공식]

## 3. 상태

| 자리 | 살아 있는 기간 | 쓰임 |
|---|---|---|
| 모듈 변수 | 모듈 리로드까지(개발 중엔 저장할 때마다) | 잃어도 되는 값 |
| `$.state` | 세션 끝까지. `/clear`·`/resume`·`/branch` 에 초기화 | 그림이 읽는 값. 쓰면 자동으로 다시 그려지고 리로드에 남는다 |
| `$.store` | mod 가 지우거나 `cleanupPeriodDays` 동안 아무 세션도 안 읽을 때까지 | 설정·이력. `~/.claude/plugins/store/` 의 JSON |

- **`$.state` 값은 `types/index.d.ts` 에 선언**하고 매니페스트 `types` 로 가리켜 `validate` 가 대조하게 한다. `plugin`·`key` 는 문자열
  리터럴. `ui.render` 안에서는 읽기만, 쓰기는 콜백이나 다른 이벤트에서. [공식]
- **`/clear` 뒤 저장값을 다시 불러온다.** `classic.SessionStart` 를 `{ source: ['clear','resume','fork'] }` 로 걸어 `$.store` → `$.state`
  로 다시 복사한다. 안 하면 기본값이 저장값을 덮어쓴다. [공식]
- **`$.store` 는 세션끼리 공유된다.** `get` 뒤 `set` 은 원자적이지 않다. 항목마다 키를 따로, 쓰기 직전에 다시 읽는다. [공식]
- **타이머는 리로드에 사라진다.** `session.start` 에서 다시 시작하거나 렌더 훅에서 재개한다. `ui.close`·`session.end` 에서 정지한다. [공식][안내서]

## 4. 화면

- **묻지 않고 연 창은 좁은 터미널에 뜨지 않는다.** 명령·버튼에서 연 창은 어느 폭이든, 타이머·`turn.start` 에서 연 창은 144열 이상에서만.
  `$.ui.open` 의 `isPlaced` 를 보고 못 띄우면 `$.ui.toast` 로 알린다. [공식]
- **표면을 확인한다.** `Raster`·`Image` 는 터미널 전용, `Svg` 는 데스크톱 전용. `e.surface` 로 갈라 없는 쪽엔 텍스트를 그린다. [공식]
- **지원하지 않는 prop 하나가 트리 전체를 거부시킨다.** 엔진이 자기 그림을 그리고 transcript 에 `refused:` 줄이 뜬다. 그 줄을 바로 읽는다.
  prop 은 d.ts 를 grep 해서 확인한다. [공식][안내서]
- **격자는 셀마다 `Box` 가 아니라 `Raster` 하나로.** 애니메이션은 `$.ui.blit` 로 같은 크기만 다시 칠한다. [공식]
- **포커스는 요청이지 보장이 아니다.** 단축키는 창이 포커스를 가질 때만 먹는다. 명령에서 `focus: true` 로 열고, 중요한 동작은
  `/명령 부속어` 로도 되게 한다. [안내서]
- **다시 그리기는 `$.ui.invalidate('ui.render')`.** 엔진은 모듈 변수 변화를 모른다. 호출이 잦아도 스로틀돼 합쳐진다. [공식]
- **`Markdown` 은 `text` prop.** 제어 요소마다 `key` 를 준다. 테스트가 그 키로 누른다. [공식]

## 5. 검사·배포

- **`validate` → `tsc` → `plugin test` → 눈으로.** `claude plugin test` 는 세션·로그인·네트워크 없이 엔진에 대고 돈다. 테스트의 `on` 이
  엔진 자리라 도구 실행을 대신한다. 같은 테스트를 `['terminal','desktop']` 둘 다에 돌린다. [공식][안내서]
- **`$` 를 건드리는 코드와 순수 로직을 파일로 나눈다.** 모델·배치·그래픽은 `$` 없는 순수 모듈로 두고 plain Node 로 시험한다. [안내서]
- **개발은 `--plugin-dir`, 설치본으로 하지 않는다.** 설치본은 버전별로 캐시돼 편집이 안 닿는다. 폴더 마켓플레이스의 상대 경로 항목만
  폴더를 직접 읽는다(`/reload-plugins`). [공식][내장]
- **버전을 올리고 README 에 시험한 Claude Code 버전을 적는다.** 이벤트·메서드가 릴리스마다 바뀐다. 이름이 `claude-` 로 시작하면
  `validate` 가 거부한다. [공식]
- **데모 부속 명령을 둔다.** `/명령 demo` 로 기다림 없이 미리 보게 한다. [모음]
- **모델 호출은 최소로.** `$.model.complete` 는 사용자 요금으로 돈다. `maxTokens`·`timeoutMs` 를 주고 `r.isAnswered` 를 본다. [공식][모음]
- **가드는 과속 방지턱이지 보안 경계가 아니다.** 철자 목록은 Bash 문자열만 보고 스크립트 안은 못 본다. 진짜 차단은 Git 호스트의
  브랜치 보호처럼 바깥에서. [공식][모음]

## 6. 화면 설계 — `design.md` 가 정본

색·기호·상태 어휘·폭 사다리·빈 상태·신선도는 `design.md` 와 `templates/ui/`(`tokens.ts`·`parts.ts`)에 있다. 여기엔 요지만.

- **토큰으로 그린다.** 상태 하나 = 기호+낱말(ko/en)+색 한 묶음(`state`·`stateCell`). 색은 테마 키만(`theme.*`), 글자 폭은 `cells`(한글 2칸),
  폭은 `e.props.bodyColumns`, 폭이 좁아지면 `ladder` 네 단(wide→medium→narrow→line)으로 **덜 보여 주되 깨지지 않는다**.
- **다섯 화면 문법.** 1행 「무엇을 하는 중인가」 · 2행 「N/M 단계 + 막대 + 경과·비율」 · 본문 「기호 · 할 일 · 상태 낱말」 세 열 ·
  비면 「빈 상태 두 줄」 · 당신 차례는 맨 위 호박색. [영상 Clean View·Session Bar·Agent Dock][flightdeck][agent-watch][whats-agent-doing]
- **낡은 값은 낡았다고.** `time.staleMs` 를 넘으면 `staleTag`, 원천이 끊기면 그림을 내린다. 없음과 0 을 같게 그리지 않는다. [hyperskills tui-design]
- **본보기와 검사.** `examples/sample-band/` 를 읽고, 만든 mod 는 `claude plugin validate` → (tsc 가 있으면) `tsc -p` → `claude plugin test` 순으로 잰다.
- 출처 전체 표는 `design.md` §7. 만드는 과정의 참고는 mod-builder(계획 블록·발자국 diff)와 mods-starter(요청 네 칸).
