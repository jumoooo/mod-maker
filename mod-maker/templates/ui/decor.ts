// mod-maker 꾸밈 부품 — 널리 쓰이는 터미널 화면들의 버릇을 테마 색으로 옮긴 것.
//   틀 제목   lazygit·ratatui Block — 제목이 위쪽 선 안에 앉는다 `╭─ ✦ 오늘 할 일 ─────╮`, 보조 글은 아래쪽 선 오른쪽 `╰──── 갱신 4초 전 ─╯`
//   알약      lipgloss 상태줄 조각 — 배경색 위 어두운 글자 ` 당신 차례 1 `. 상태 색은 그대로 배경이 된다
//   키 안내   bubbles help — 키는 테마 끝 색 굵게, 설명은 회색 `Tab 이동 · Enter 고르기`
//   계기      btop 그라데이션 미터 — 채운 칸이 테마 시작 색에서 끝 색으로 `▰▰▰▰▱▱▱`
//   회전      점자 스피너 ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏ — 진행 중 줄의 기호. 글자가 바뀌므로 「글은 같고 색만 바뀐다」를 지켜야 하는 자리에는 쓰지 않는다
// $ 는 받지 않는다. 요소 테이블 t 와 자료만(parts.ts 와 같은 규칙).
import type { RenderElement, ThemeKey } from 'claude-code'

import { frameGlyph, gradientAt, palette, segments, stepColor, type Mode } from './gradient'
import type { T } from './parts'
import { cells, fit } from './tokens'

export const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const
/** i 번째 스피너 글자 — 음수·큰 수도 돈다 */
export const spinnerAt = (i: number): string => SPINNER[((i % SPINNER.length) + SPINNER.length) % SPINNER.length]!

/** 계기 글자 — 채움 ▰ 빈칸 ▱(둘 다 한 칸) */
export const METER = { fill: '▰', empty: '▱' } as const

const txt = (t: T, s: string, p: { color?: ThemeKey | string; dim?: boolean; bold?: boolean; bg?: ThemeKey | string } = {}): RenderElement =>
  t.Text({ color: p.color, dimColor: p.dim, bold: p.bold, backgroundColor: p.bg, children: [s] })

/** 글자 단위 그라데이션 — 조각(3칸)마다 색 하나. x 는 창 안 시작 칸, y 는 줄, W·H 는 창 전체 */
export function gtext(t: T, s: string, x: number, y: number, W: number, H: number, mode: Mode, o: { bold?: boolean; dim?: boolean } = {}): RenderElement[] {
  const out: RenderElement[] = []
  let at = x
  for (const seg of segments(s, 3)) {
    out.push(txt(t, seg, { color: gradientAt(at, y, W, H, mode), bold: o.bold, dim: o.dim }))
    at += cells(seg)
  }
  return out
}

/**
 * 틀의 위·아래 선 — 제목(위)과 보조 글(아래 오른쪽)이 선 안에 앉는다.
 *   위   `╭─ ✦ 오늘 할 일 › 3건 ───────────╮`
 *   아래 `╰──────────────────────── 갱신 4초 전 ─╯`
 * 제목은 테마 그라데이션 굵게, 보조 글은 준 색(없으면 따뜻한 회색). 폭이 모자라면 제목부터 줄인다.
 */
export function edgeLine(t: T, o: { top: boolean; title?: string; right?: string; rightColor?: ThemeKey | string; rightBold?: boolean; W: number; H: number; mode: Mode }): RenderElement {
  const y = o.top ? 0 : o.H - 1
  const l = o.top ? frameGlyph.tl : frameGlyph.bl
  const r = o.top ? frameGlyph.tr : frameGlyph.br
  const right = o.right ? ` ${o.right} ` : ''
  const room = o.W - 2 - 2 - cells(right)              // 모서리 2 + 양끝 ─ 2
  const title = o.title ? ` ${fit(o.title, Math.max(0, room))} ` : ''
  const fill = Math.max(0, o.W - 4 - cells(title) - cells(right))
  const els: RenderElement[] = []
  let x = 0
  const push = (s: string, p: { bold?: boolean } = {}) => { els.push(...gtext(t, s, x, y, o.W, o.H, o.mode, p)); x += cells(s) }
  push(l + frameGlyph.h)
  if (title) push(title, { bold: true })
  push(frameGlyph.h.repeat(fill))
  if (right) { els.push(txt(t, right, { color: o.rightColor ?? palette.warmGray, bold: o.rightBold })); x += cells(right) }
  push(frameGlyph.h + r)
  return t.Box({ flexDirection: 'row', width: o.W, children: els })
}

/** 알약 — 배경색 위 어두운 글자 ` 글 `. 차지하는 칸은 글 + 2 */
export function badge(t: T, text: string, o: { bg: ThemeKey | string; fg?: ThemeKey | string; bold?: boolean; dim?: boolean }): { el: RenderElement; cells: number } {
  return { el: txt(t, ` ${text} `, { color: o.fg ?? 'inverseText', bg: o.bg, bold: o.bold ?? true, dim: o.dim }), cells: cells(text) + 2 }
}

/** 계기 — fraction(0~1) 만큼 채운 w 칸. 채운 칸은 테마 양끝 사이를 한 칸씩, 빈 칸은 흐린 회색 */
export function meter(t: T, fraction: number, w: number, mode: Mode): RenderElement[] {
  const n = Math.max(0, Math.min(w, Math.round(Math.max(0, Math.min(1, fraction)) * w)))
  const out: RenderElement[] = []
  for (let i = 0; i < n; i++) out.push(txt(t, METER.fill, { color: stepColor(i, Math.max(2, w), mode) }))
  if (n < w) out.push(txt(t, METER.empty.repeat(w - n), { color: palette.warmGray, dim: true }))
  return out
}

/** 키 안내 — `Tab 이동 · Enter 고르기`. 키는 테마 끝 색 굵게, 설명과 점은 회색. 차지하는 칸을 같이 돌려준다 */
export function keyHints(t: T, pairs: readonly (readonly [key: string, desc: string])[]): { els: RenderElement[]; cells: number } {
  const els: RenderElement[] = []
  let used = 0
  pairs.forEach(([k, d], i) => {
    if (i) { els.push(txt(t, '  ·  ', { color: palette.warmGray, dim: true })); used += 5 }
    els.push(txt(t, k, { color: palette.end, bold: true }), txt(t, ` ${d}`, { color: palette.warmGray }))
    used += cells(k) + 1 + cells(d)
  })
  return { els, cells: used }
}
