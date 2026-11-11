// mod-maker 화면 부품 — tokens.ts 의 토큰으로 그리는 작은 조립 함수. `$` 는 받지 않고, `$.ui.resolve(e)` 가 돌려준 요소 테이블 `t` 만 받는다.
// (정적 분석 규칙: `$` 는 다른 파일로 넘길 수 없다. 요소 테이블은 넘겨도 된다.)
// 다섯 화면이 공유하는 문법 — 1행 「무엇을 하는 중인가」, 2행 「N/M 단계 + 막대 + 경과·비율」, 본문 「기호 · 할 일 · (막대) · 상태 낱말」, 비면 「빈 상태 두 줄」.
import type { Elements, RenderElement, ThemeKey } from 'claude-code'

import {
  bar,
  bars,
  cells,
  columns,
  elapsed,
  fit,
  frameColor,
  freshness,
  glyph as G,
  identityOf,
  limit,
  moreText,
  pad,
  percent,
  space,
  state,
  stepText,
  theme,
  track,
  type Columns,
  type Locale,
  type StateKey,
} from './tokens'

/** 모든 표면이 가진 두 요소. `$.ui.resolve(e)` 의 결과를 그대로 넘기면 된다. */
export type T = Pick<Elements['terminal'], 'Box' | 'Text'>
/** Button 까지 쓰는 부품(라디오)용. */
export type TB = Pick<Elements['terminal'], 'Box' | 'Text' | 'Button'>

const txt = (t: T, s: string, p: { color?: ThemeKey; dim?: boolean; bold?: boolean; wrap?: 'truncate-end' | 'truncate-start' | 'truncate-middle' } = {}): RenderElement =>
  t.Text({ color: p.color, dimColor: p.dim, bold: p.bold, wrap: p.wrap, children: [s] })

/** 빈 줄 하나 — 절 사이 간격. */
export const gapRow = (t: T): RenderElement => t.Text({ children: [' '] })

/**
 * 머리말 한 줄, 양끝 정렬 — 왼쪽 `◆ 제목`, 오른쪽 상태 낱말.
 * 창 제목과 현재 상태를 한 줄로 끝낸다(Agent Dock 의 `◆ AGENT DOCK … STANDING BY`).
 */
export function header(t: T, o: { title: string; right?: string; color?: ThemeKey; rightColor?: ThemeKey; width: number }): RenderElement {
  const color = o.color ?? theme.accent
  const right = o.right ?? ''
  const left = fit(`${G.title} ${o.title}`, Math.max(4, o.width - cells(right) - space.col))
  return t.Box({
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: o.width,
    children: [txt(t, left, { color, bold: true }), txt(t, right, { color: o.rightColor ?? theme.muted })],
  })
}

/**
 * 요청 원문 한 줄 — `✳ Build a weather dashboard…`. 넘치면 끝을 자른다.
 */
export function requestLine(t: T, o: { text: string; width: number; color?: ThemeKey }): RenderElement {
  return txt(t, fit(`${G.request} ${o.text}`, o.width), { color: o.color ?? theme.accent, bold: true })
}

/**
 * 단계줄 — `3/7 단계 ████████░░░░ … 21초 29%`. 막대가 비어 있어도 자리를 둔다(앞으로 찰 것을 보여 준다).
 * meta 는 오른쪽 끝에 흐리게. 폭이 좁으면 막대부터 줄인다.
 */
export function stepLine(
  t: T,
  o: { step: number; total: number; fraction?: number; elapsedMs?: number; width: number; locale?: Locale; barColor?: ThemeKey },
): RenderElement {
  const locale = o.locale ?? 'ko'
  const fraction = o.fraction ?? (o.total > 0 ? Math.min(1, Math.max(0, (o.step - 1) / o.total)) : 0)
  const label = stepText(o.step, o.total, locale)
  const meta = [o.elapsedMs === undefined ? '' : elapsed(o.elapsedMs, locale), percent(fraction)].filter(Boolean).join('  ')
  const fixed = cells(label) + space.col + cells(meta) + space.col
  const barW = Math.max(0, Math.min(limit.stepBarCells, o.width - fixed))
  return t.Box({
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: o.width,
    children: [
      t.Box({
        flexDirection: 'row',
        columnGap: space.col,
        children: [txt(t, label, { color: theme.text }), txt(t, bar(fraction, barW), { color: o.barColor ?? theme.progress })],
      }),
      txt(t, meta, { color: theme.muted, bold: true }),
    ],
  })
}

/**
 * 단계 트랙 한 줄 — `✓✓▶▶░░░   3/7 단계`. 블록은 tokens.track 이 정한다(항목 하나 = 블록 하나, 폭을 넘으면 나눠 쓴다).
 * 블록마다 key `track:<i>` 를 붙여 테스트가 집는다.
 */
export function trackLine(t: T, o: { states: readonly StateKey[]; width: number; locale?: Locale }): RenderElement {
  const locale = o.locale ?? 'ko'
  const done = o.states.filter(k => k === 'done').length
  const step = Math.min(o.states.length, done + 1)
  const label = stepText(step, o.states.length, locale)
  const cellsWide = Math.max(1, Math.min(limit.stepBarCells, o.width - cells(label) - space.col))
  const blocks = track(o.states, cellsWide).map((c, i) => t.Box({ key: `track:${i}`, children: [txt(t, c.glyph, { color: c.color, dim: c.dim, bold: c.bold })] }))
  return t.Box({
    flexDirection: 'row',
    columnGap: space.col,
    width: o.width,
    children: [t.Box({ flexDirection: 'row', children: blocks }), txt(t, label, { color: theme.text })],
  })
}

/** 절 구분선 — `─ 동시에 도는 작업 3 ─────`. 흐리게. 빈 절에는 쓰지 않는다(구분선만 남으면 고장처럼 보인다). */
export function sectionRule(t: T, o: { title: string; width: number }): RenderElement {
  const head = `${bars.rule} ${o.title} `
  const rest = Math.max(0, o.width - cells(head))
  return txt(t, head + bars.rule.repeat(rest), { color: theme.muted, dim: true })
}

/** 상태 칸 — 기호+낱말+색 한 묶음. 색만 따로 꺼내는 길은 없다. */
export function stateCell(t: T, k: StateKey, o: { width?: number; locale?: Locale; withGlyph?: boolean } = {}): RenderElement {
  const s = state[k]
  const word = s.word[o.locale ?? 'ko']
  const body = o.withGlyph ? `${G[s.glyph]} ${word}` : word
  return txt(t, o.width ? pad(body, o.width) : body, { color: s.color, dim: s.dim, bold: s.bold })
}

/**
 * 체크리스트 한 행 — `● 할 일 ……… ████░░ … 진행 중 … 1분 12초`.
 * 열 폭은 tokens.columns(bodyColumns) 가 정한다. wide 에만 행별 막대, line 에서는 경과를 뺀다.
 * 현재 행(working·needsYou)은 굵게, 끝난 행은 보통, 남은 행은 흐리게 — 상태 토큰이 정한 대로.
 * `highlight` 면 행 전체를 theme.now 배경으로 칠하고 글자는 theme.onNow — 진행 중 행을 찾을 필요가 없게.
 */
export function checklistRow(
  t: T,
  o: { state: StateKey; label: string; fraction?: number; elapsedMs?: number; metaText?: string; cols: Columns; locale?: Locale; accent?: ThemeKey; highlight?: boolean; key?: string },
): RenderElement {
  const locale = o.locale ?? 'ko'
  const s = state[o.state]
  const hl = o.highlight === true
  const paint = (str: string, p: { color?: ThemeKey; dim?: boolean; bold?: boolean }): RenderElement => txt(t, str, hl ? { color: theme.onNow, bold: p.bold, dim: false } : p)
  const meta = o.metaText ?? (o.elapsedMs === undefined ? '' : elapsed(o.elapsedMs, locale))
  const kids: RenderElement[] = [
    paint(G[s.glyph], { color: s.color, bold: s.bold, dim: s.dim }),
    paint(pad(fit(o.label, o.cols.label), o.cols.label), { bold: s.current, dim: s.dim, color: s.current ? (o.accent ?? theme.text) : theme.text }),
  ]
  if (o.cols.bar > 0) {
    const f = o.fraction ?? (o.state === 'done' ? 1 : 0)
    kids.push(paint(bar(f, o.cols.bar), { color: o.state === 'done' ? theme.done : s.current ? theme.progress : theme.pending, dim: !s.current && o.state !== 'done' }))
  }
  kids.push(hl ? paint(pad(s.word[locale], o.cols.status), { bold: true }) : stateCell(t, o.state, { width: o.cols.status, locale }))
  if (o.cols.meta > 0) kids.push(paint(pad(fit(meta, o.cols.meta), o.cols.meta, 'right'), { color: theme.muted }))
  const gap = o.cols.bar > 0 ? space.col : space.cell
  const rowWidth = o.cols.glyph + gap + o.cols.label + gap + (o.cols.bar > 0 ? o.cols.bar + gap : 0) + o.cols.status + (o.cols.meta > 0 ? gap + o.cols.meta : 0)
  return t.Box({ key: o.key, flexDirection: 'row', columnGap: gap, width: rowWidth, backgroundColor: hl ? theme.now : undefined, children: kids })
}

/** 「… 외 N건」 한 줄. 목록이 limit.listRows 를 넘을 때 마지막 자리에. */
export function moreRow(t: T, n: number, locale: Locale = 'ko'): RenderElement {
  return txt(t, moreText(n, locale), { color: theme.pending, dim: true })
}

/**
 * 체크리스트 전체 — 행 상한(limit.listRows)을 넘으면 현재 행을 우선 보이고 나머지는 「외 N건」.
 * 우선순위: needsYou → working/failed → 나머지 순서대로.
 */
export function checklist(
  t: T,
  rows: readonly { state: StateKey; label: string; fraction?: number; elapsedMs?: number; metaText?: string; highlight?: boolean; key?: string }[],
  o: { cols: Columns; locale?: Locale; maxRows?: number },
): RenderElement[] {
  const max = Math.max(1, o.maxRows ?? limit.listRows)
  const rank = (k: StateKey): number => (k === 'needsYou' ? 0 : k === 'blocked' ? 1 : k === 'failed' ? 2 : k === 'working' ? 3 : 4)
  const shown = rows.length <= max ? rows : [...rows].map((r, i) => ({ r, i })).sort((a, b) => rank(a.r.state) - rank(b.r.state) || a.i - b.i).slice(0, max - 1).sort((a, b) => a.i - b.i).map(x => x.r)
  const out = shown.map(r => checklistRow(t, { ...r, cols: o.cols, locale: o.locale }))
  if (shown.length < rows.length) out.push(moreRow(t, rows.length - shown.length, o.locale))
  return out
}

/**
 * 빈 상태 — 굵은 한 줄 + 흐린 설명 한 줄. 아직 돌지 않는 것을 빈칸으로 두지 않는다(Agent Dock 의 「Your team of 50 is standing by」).
 */
export function emptyState(t: T, o: { title: string; hint?: string; width: number }): RenderElement {
  return t.Box({
    flexDirection: 'column',
    alignItems: 'center',
    width: o.width,
    children: [txt(t, fit(o.title, o.width), { bold: true }), ...(o.hint ? [txt(t, fit(o.hint, o.width), { color: theme.muted })] : [])],
  })
}

/**
 * 정체성 색점 — 에이전트마다 ● 한 점, 테마 키 8색 순환. 폭을 넘으면 「+N」.
 */
export function identityDots(t: T, n: number, o: { width: number }): RenderElement {
  const fitCount = Math.max(0, Math.floor((o.width + space.cell) / (1 + space.cell)))
  const shown = Math.min(n, n > fitCount ? Math.max(0, fitCount - 2) : fitCount)
  const kids: RenderElement[] = []
  for (let i = 0; i < shown; i++) kids.push(txt(t, G.now, { color: identityOf(i) }))
  if (shown < n) kids.push(txt(t, `+${n - shown}`, { color: theme.muted }))
  return t.Box({ flexDirection: 'row', columnGap: space.cell, justifyContent: 'center', width: o.width, children: kids })
}

/**
 * 가로 라디오 — `1  3  5  [50]  100 | Custom`. 고른 것만 배경 반전, 나머지는 평문 버튼. 선택 결과 문장은 호출자가 아래 한 줄로 쓴다.
 */
export function radioRow<V extends string>(
  t: TB,
  o: { options: readonly { value: V; label: string; hotkey?: string }[]; selected: V; onPick: (v: V) => void; keyPrefix?: string },
): RenderElement {
  const prefix = o.keyPrefix ?? 'radio'
  return t.Box({
    flexDirection: 'row',
    columnGap: space.col,
    children: o.options.map(opt => {
      const on = opt.value === o.selected
      const button = t.Button({ key: `${prefix}-${opt.value}`, label: opt.label, hotkey: opt.hotkey, plain: true, dimColor: !on, onPress: () => o.onPick(opt.value) })
      return on ? t.Box({ backgroundColor: theme.accent, paddingX: space.padX, children: [button] }) : button
    }),
  })
}

/**
 * 한 줄 요약(token-weather 꼴) — 왼쪽부터 중요한 순으로 조각을 `·` 로 잇는다. 폭을 넘으면 뒤 조각부터 버린다.
 */
export function oneLiner(t: T, parts: readonly { text: string; color?: ThemeKey; dim?: boolean; bold?: boolean }[], o: { width: number }): RenderElement {
  const sep = ` ${G.sep} `
  const kept: typeof parts[number][] = []
  let used = 0
  for (const p of parts) {
    const w = cells(p.text) + (kept.length ? cells(sep) : 0)
    if (used + w > o.width) break
    kept.push(p)
    used += w
  }
  const kids: RenderElement[] = []
  kept.forEach((p, i) => {
    if (i > 0) kids.push(txt(t, sep, { color: theme.muted }))
    kids.push(txt(t, p.text, { color: p.color, dim: p.dim, bold: p.bold }))
  })
  return t.Box({ flexDirection: 'row', children: kids })
}

/** 신선도 꼬리표 — 낡은 값이면 `(21초 전)` 을 흐리게. 산 값이면 빈 요소. */
export function staleTag(t: T, ageMs: number, locale: Locale = 'ko', staleMs?: number): RenderElement | null {
  const f = freshness(ageMs, locale, staleMs)
  return f.stale ? txt(t, `(${f.text})`, { color: theme.pending, dim: true }) : null
}

/**
 * 테두리 — 안의 가장 급한 상태 색으로 둥근 틀. 창(Pane) 본문에 쓴다. 띠에는 쓰지 않는다(엔진이 띠의 테두리를 그린다).
 */
export function frame(t: T, o: { states: readonly StateKey[]; children: RenderElement[]; width?: number }): RenderElement {
  return t.Box({ flexDirection: 'column', borderStyle: 'round', borderColor: frameColor(o.states), paddingX: space.padX, width: o.width, children: o.children })
}

/** 열 폭 계산을 다시 내보낸다 — 호출자가 tokens 를 따로 import 하지 않아도 되게. */
export { columns }
