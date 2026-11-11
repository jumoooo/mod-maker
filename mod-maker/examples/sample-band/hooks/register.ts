// sample-band — mod-maker 본보기 mod. 할 일 몇 개의 상태를 프롬프트 위 띠에 그린다.
// 보여 주려는 것: ① 토큰·부품을 어떻게 가져다 쓰나 ② 폭 사다리(wide→medium→narrow→line) ③ 상태 어휘 고정 ④ 빈 상태 ⑤ 낡은 값 표시.
// hooks/ui/ 는 mod-maker 의 templates/ui/ 를 복사한 것이다(새 mod 도 그렇게 시작한다).
import type { Register } from 'claude-code'

import { checklist, columns, emptyState, oneLiner, requestLine, staleTag, stepLine } from './ui/parts'
import { glyph, ladder, limit, state, theme, type StateKey } from './ui/tokens'

type Row = { name: string; task: string; state: StateKey; elapsedMs: number }

/** 예제 자료 — 실제 mod 는 이벤트·파일·프로세스에서 채운다. */
let goal = '주간 보고서 마무리 — 금요일 오전까지'
let rows: Row[] = [
  { name: '초안', task: '지난주 수치를 표로 옮긴다', state: 'working', elapsedMs: 72000 },
  { name: '검토', task: '요약 문단 — 이대로 보낼지 묻는 중', state: 'needsYou', elapsedMs: 21000 },
  { name: '자료', task: '회의록 3건 모으기', state: 'done', elapsedMs: 300000 },
]
let readAt = 0

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    readAt = await $.clock.now()
    $.clock.every(5000, () => $.ui.invalidate('ui.render'))
    await $.command.register({ name: 'sample-band', description: '할 일 띠 본보기 — demo 로 표본 자료, clear 로 비움', argumentHint: '[demo|clear]' })
    return next(e)
  })

  on('command.run', { command: 'sample-band' }, async ($, e) => {
    if (e.args.trim() === 'clear') rows = []
    readAt = await $.clock.now()
    $.ui.invalidate('ui.render')
    return {}
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // 설문이 띠를 쓰는 동안은 양보한다.
    if (e.props.hasSurvey) return next(e)
    const t = $.ui.resolve(e)
    const width = e.props.bodyColumns
    const now = await $.clock.now()

    // 빈 상태 — 빈칸 대신 두 줄.
    if (rows.length === 0) {
      return emptyState(t, { title: '할 일이 비어 있습니다', hint: '/sample-band demo 로 표본을 채웁니다', width })
    }

    const done = rows.filter(r => r.state === 'done').length
    const step = Math.min(rows.length, done + 1)
    const stale = staleTag(t, now - readAt)

    // line — 한 줄 요약(token-weather 꼴). 왼쪽부터 중요한 순.
    if (ladder(width) === 'line') {
      const waiting = rows.filter(r => r.state === 'needsYou').length
      return oneLiner(
        t,
        [
          { text: `${glyph.title} 할 일 ${rows.length}`, color: theme.accent, bold: true },
          ...(waiting > 0 ? [{ text: `${glyph.needsYou} ${state.needsYou.word.ko} ${waiting}`, color: theme.needsYou, bold: true }] : []),
          { text: `${done}/${rows.length} 끝남`, color: theme.text },
          ...(stale ? [{ text: '(낡음)', color: theme.pending, dim: true }] : []),
        ],
        { width },
      )
    }

    // wide·medium·narrow — 1행 요청, 2행 단계줄, 본문 체크리스트(열 폭은 columns 가 정한다).
    const cols = columns(width, 'ko')
    const rowsFor = rows.map(r => ({ state: r.state, label: `${r.name} — ${r.task}`, elapsedMs: r.elapsedMs }))
    return t.Box({
      flexDirection: 'column',
      width,
      children: [
        requestLine(t, { text: goal, width }),
        stepLine(t, { step, total: rows.length, fraction: done / rows.length, elapsedMs: now - readAt, width }),
        ...checklist(t, rowsFor, { cols, maxRows: Math.max(1, Math.min(limit.listRows, e.props.maxRows - 2)) }),
        ...(stale ? [stale] : []),
      ],
    })
  })
}
