// mod-maker 설계 토큰 — 순수 자료와 순수 함수만. `$` 를 쓰지 않고, claude-code 에서는 타입만 가져온다.
// 쓰는 법: 이 폴더(templates/ui/)를 mod 의 hooks/ui/ 로 복사하고 `import { state, fit, bar } from './ui/tokens'`.
// 세 층 — ① 원시값(기호·테마 키·막대 글자·폭 경계) ② 의미 역할(상태 = 기호+낱말+색 한 묶음) ③ 셈(폭 재기·자르기·막대).
// 부품(머리말·단계줄·체크리스트 행·빈 상태)은 옆의 parts.ts 가 이 토큰으로 그린다.
import type { ThemeKey } from 'claude-code'

// ───────────────────────── ① 원시값 ─────────────────────────

/** 색은 테마 키로만 — 사용자의 밝은/어두운/색약 테마를 따라간다. 16진수를 박으면 밝은 테마에서 안 읽힌다(공식 d.ts ThemeKey). */
export const theme = {
  /** 제목·현재 행·강조 — Claude 주황 */
  accent: 'claude',
  /** 지금 하는 일 */
  now: 'claude',
  /** 사용자 차례(승인·답변 대기) — 반드시 호박색 */
  needsYou: 'warning',
  /** 끝난 것 */
  done: 'success',
  /** 실패·거부 */
  failed: 'error',
  /** 아직 안 한 것·조용함 */
  pending: 'inactive',
  /** 설명·단위·시각 같은 보조 글 */
  muted: 'subtle',
  /** 본문 */
  text: 'text',
  /** 전체 진척 막대 */
  progress: 'claude',
  /** 창 테두리 — 기본 */
  frame: 'promptBorder',
  /** 배경을 칠한 행(진행 중) 위의 글자 */
  onNow: 'inverseText',
} as const satisfies Record<string, ThemeKey>

/** 상태 기호. 터미널 한 칸짜리 유니코드만 쓴다(Nerd Font 전제 금지). 동아시아 모호 폭 글자(●○✓✗)는 한국어 터미널에서 두 칸이 될 수 있어 `glyphAscii` 로 바꿀 수 있게 둔다. */
export const glyph = {
  now: '●',
  pending: '○',
  done: '✓',
  failed: '✗',
  denied: '⊘',
  stopped: '■',
  needsYou: '‖',
  title: '◆',
  request: '✳',
  sep: '·',
  more: '…',
  up: '▲',
  down: '▼',
  trackNow: '▶',
  trackLeft: '░',
} as const

/** 같은 뜻의 ASCII 판. 폭이 의심스러운 터미널(모호 폭을 2칸으로 그리는 설정)에서 바꿔 쓴다. */
export const glyphAscii: Record<keyof typeof glyph, string> = {
  now: '*',
  pending: 'o',
  done: 'v',
  failed: 'x',
  denied: '-',
  stopped: '#',
  needsYou: '!',
  title: '#',
  request: '>',
  sep: '|',
  more: '~',
  up: '^',
  down: 'v',
  trackNow: '>',
  trackLeft: '.',
}

/** 막대 글자. 채움/빈칸 한 쌍과 1/8 칸 조각, 스파크라인 8단. */
export const bars = {
  fill: '█',
  empty: '░',
  thinFill: '━',
  thinEmpty: '╌',
  rule: '─',
  eighths: ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'],
  spark: '▁▂▃▄▅▆▇█',
} as const

/** 간격. 열 사이 2칸, 절 사이 빈 줄 1, 창 안 좌우 여백 1. 더 쪼개지 않는다. */
export const space = { col: 2, cell: 1, section: 1, padX: 1 } as const

/**
 * 폭 경계(bodyColumns 기준 — viewport.columns 가 아니다).
 * dock·unaskedPane 은 엔진의 규칙(창이 옆에 붙는 폭, mod 가 스스로 연 창이 뜨는 폭)이고 나머지는 우리 사다리다.
 */
export const width = { unaskedPane: 144, dock: 110, wide: 100, medium: 80, narrow: 60 } as const

/** 시간. 갱신 주기와 「낡음」 판정. 값이 이보다 오래됐으면 산 것처럼 그리지 않는다. */
export const time = { refreshMs: 5000, staleMs: 15000 } as const

/** 개수 상한. 띠는 6줄, 목록은 4행 뒤 「외 N건」, 행별 막대 14칸, 전체 막대 30칸. */
export const limit = { bandRows: 6, listRows: 4, barCells: 14, stepBarCells: 30 } as const

// ───────────────────────── ② 의미 역할 ─────────────────────────

export type Locale = 'ko' | 'en'
export type StateKey = 'needsYou' | 'blocked' | 'working' | 'done' | 'failed' | 'denied' | 'stopped' | 'next' | 'upNext' | 'idle'

/** 상태 하나의 표시 — 기호·낱말·색을 한 묶음으로. 색만 떼어 쓰는 길을 두지 않는다(색이 안 보여도 기호와 낱말로 읽힌다). */
export type StateStyle = {
  glyph: keyof typeof glyph
  word: Record<Locale, string>
  color: ThemeKey
  dim: boolean
  bold: boolean
  /** 현재 행인가 — 체크리스트에서 굵게·테두리 색을 정한다 */
  current: boolean
}

/** 상태 어휘. 다섯 화면이 같은 낱말을 쓰게 고정한다. 새 낱말을 지어내지 말고 여기에 더한다. */
export const state: Record<StateKey, StateStyle> = {
  needsYou: { glyph: 'needsYou', word: { ko: '당신 차례', en: 'Needs you' }, color: theme.needsYou, dim: false, bold: true, current: true },
  blocked: { glyph: 'failed', word: { ko: '막힘', en: 'Blocked' }, color: theme.failed, dim: false, bold: true, current: true },
  working: { glyph: 'now', word: { ko: '진행 중', en: 'Working' }, color: theme.now, dim: false, bold: true, current: true },
  done: { glyph: 'done', word: { ko: '끝남', en: 'Done' }, color: theme.done, dim: false, bold: false, current: false },
  failed: { glyph: 'failed', word: { ko: '실패', en: 'Failed' }, color: theme.failed, dim: false, bold: true, current: false },
  denied: { glyph: 'denied', word: { ko: '거부됨', en: 'Denied' }, color: theme.failed, dim: true, bold: false, current: false },
  stopped: { glyph: 'stopped', word: { ko: '중단', en: 'Stopped' }, color: theme.pending, dim: true, bold: false, current: false },
  next: { glyph: 'pending', word: { ko: '다음', en: 'Next' }, color: theme.text, dim: true, bold: false, current: false },
  upNext: { glyph: 'pending', word: { ko: '대기', en: 'Up next' }, color: theme.pending, dim: true, bold: false, current: false },
  idle: { glyph: 'pending', word: { ko: '조용함', en: 'Idle' }, color: theme.pending, dim: true, bold: false, current: false },
}

/** 상태 낱말 한 벌 중 가장 넓은 것의 칸 수 — 상태 열 폭은 여기서 나온다. */
export function stateColumnCells(locale: Locale): number {
  let w = 0
  for (const k of Object.keys(state) as StateKey[]) w = Math.max(w, cells(state[k].word[locale]))
  return w
}

/** 에이전트 정체성 색 — 테마 키 8개를 돌려쓴다. 장식이라도 16진수는 쓰지 않는다. */
export const identity: readonly ThemeKey[] = ['claude', 'permission', 'planMode', 'autoAccept', 'ide', 'suggestion', 'remember', 'merged']
export const identityOf = (i: number): ThemeKey => identity[((i % identity.length) + identity.length) % identity.length]!

/** 창 테두리 색 — 안의 가장 급한 상태를 따른다. */
export function frameColor(keys: readonly StateKey[]): ThemeKey {
  if (keys.includes('needsYou')) return theme.needsYou
  if (keys.includes('blocked') || keys.includes('failed')) return theme.failed
  if (keys.includes('working')) return theme.now
  if (keys.length > 0 && keys.every(k => k === 'done')) return theme.done
  return theme.frame
}

/** 단계 트랙의 블록 하나 — 기호·색·흐림·굵기. 끝남 ✓초록, 진행 중 ▶주황(그 밖 current 상태도 제 색), 남음 ░흐림. */
export type TrackCell = { glyph: string; color: ThemeKey; dim: boolean; bold: boolean }

/** 급한 순 — 트랙 블록 하나를 여러 항목이 나눠 쓸 때 블록의 상태를 고른다. */
const urgency: readonly StateKey[] = ['needsYou', 'blocked', 'failed', 'working', 'next', 'upNext', 'idle', 'stopped', 'denied', 'done']
function mostUrgent(keys: readonly StateKey[]): StateKey {
  let best = keys[0] ?? 'upNext'
  for (const k of keys) if (urgency.indexOf(k) < urgency.indexOf(best)) best = k
  return best
}
function trackCell(k: StateKey): TrackCell {
  const s = state[k]
  if (k === 'done') return { glyph: glyph.done, color: theme.done, dim: false, bold: false }
  if (s.current) return { glyph: glyph.trackNow, color: s.color, dim: false, bold: true }
  return { glyph: glyph.trackLeft, color: theme.pending, dim: true, bold: false }
}

/**
 * 단계 트랙 — 항목 하나가 블록 하나(`✓✓▶▶░░░`). 항목이 `cellsWide` 를 넘으면 여러 항목이 블록 하나를 나눠 쓰고,
 * 그 블록은 구간의 가장 급한 상태를 띤다. 병렬(진행 중 여럿)은 ▶ 가 여럿으로 보인다.
 */
export function track(states: readonly StateKey[], cellsWide: number): TrackCell[] {
  const w = Math.max(0, Math.floor(cellsWide))
  if (w === 0 || states.length === 0) return []
  const per = Math.ceil(states.length / w)
  const out: TrackCell[] = []
  for (let i = 0; i < states.length; i += per) out.push(trackCell(mostUrgent(states.slice(i, i + per))))
  return out
}

// ───────────────────────── ③ 셈 ─────────────────────────

/** 한 코드포인트가 차지하는 터미널 칸 수 — 한글·한자·전각은 2, 결합 문자·폭 0 문자는 0, 그 밖은 1. */
export function cellsOfCodePoint(cp: number): number {
  if (cp === 0) return 0
  if ((cp >= 0x0300 && cp <= 0x036f) || (cp >= 0x200b && cp <= 0x200f) || cp === 0xfeff || (cp >= 0xfe00 && cp <= 0xfe0f)) return 0
  if (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f64f) ||
    (cp >= 0x1f900 && cp <= 0x1f9ff) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  )
    return 2
  return 1
}

/** 문자열이 차지하는 칸 수. `bodyColumns` 와 같은 단위라 한글 라벨의 열 폭을 이걸로 잰다(`.length` 는 틀린다). */
export function cells(s: string): number {
  let n = 0
  for (const ch of s) n += cellsOfCodePoint(ch.codePointAt(0) ?? 0)
  return n
}

/** `max` 칸에 맞게 자르고 `…`(1칸) 을 붙인다. 한글이 반 칸 걸치면 한 글자 덜 넣는다. */
export function fit(s: string, max: number, mode: 'end' | 'start' | 'middle' = 'end'): string {
  if (max <= 0) return ''
  if (cells(s) <= max) return s
  if (max === 1) return glyph.more
  const take = (str: string, budget: number, fromEnd: boolean): string => {
    const chars = Array.from(str)
    if (fromEnd) chars.reverse()
    const out: string[] = []
    let used = 0
    for (const ch of chars) {
      const w = cellsOfCodePoint(ch.codePointAt(0) ?? 0)
      if (used + w > budget) break
      out.push(ch)
      used += w
    }
    if (fromEnd) out.reverse()
    return out.join('')
  }
  if (mode === 'end') return take(s, max - 1, false) + glyph.more
  if (mode === 'start') return glyph.more + take(s, max - 1, true)
  const left = Math.ceil((max - 1) / 2)
  return take(s, left, false) + glyph.more + take(s, max - 1 - left, true)
}

/** `w` 칸으로 채운다(빈칸). 넘치면 자르지 않는다 — 자르기는 fit 이 한다. */
export function pad(s: string, w: number, align: 'left' | 'right' = 'left'): string {
  const gap = Math.max(0, w - cells(s))
  return align === 'left' ? s + ' '.repeat(gap) : ' '.repeat(gap) + s
}

/** 0~1 비율을 `cellsWide` 칸 막대로. block 은 █░ 에 1/8 조각, thin 은 ━╌ 한 줄짜리. */
export function bar(fraction: number, cellsWide: number, style: 'block' | 'thin' = 'block'): string {
  const w = Math.max(0, Math.floor(cellsWide))
  if (w === 0) return ''
  const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0))
  if (style === 'thin') {
    const full = Math.round(f * w)
    return bars.thinFill.repeat(full) + bars.thinEmpty.repeat(w - full)
  }
  const exact = f * w
  const full = Math.floor(exact)
  const eighth = Math.floor((exact - full) * 8)
  const partial = full < w ? bars.eighths[eighth]! : ''
  const rest = w - full - (partial ? 1 : 0)
  return bars.fill.repeat(full) + partial + bars.empty.repeat(Math.max(0, rest))
}

/** 값 열을 ▁▂▃▄▅▆▇█ 스파크라인으로. 비교 기준은 최댓값. 숫자 요약을 옆에 꼭 붙인다(점자·블록만으로는 읽을 수 없는 사람이 있다). */
export function spark(values: readonly number[], cellsWide = values.length): string {
  if (values.length === 0 || cellsWide <= 0) return ''
  const tail = values.slice(-cellsWide)
  const max = Math.max(...tail, 0)
  if (max <= 0) return bars.spark[0]!.repeat(tail.length)
  return tail.map(v => bars.spark[Math.min(7, Math.max(0, Math.round((v / max) * 7)))]!).join('')
}

/** 비율 표기 — `29%`. 1 미만 소수는 반올림. */
export function percent(fraction: number): string {
  const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0))
  return `${Math.round(f * 100)}%`
}

/** 경과 시간 — ko `1분 12초`, en `1m 12s`. 한 시간을 넘으면 시간 단위를 앞에. */
export function elapsed(ms: number, locale: Locale = 'ko'): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (locale === 'ko') {
    if (h > 0) return `${h}시간 ${m}분`
    if (m > 0) return `${m}분 ${sec}초`
    return `${sec}초`
  }
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

/** 값의 신선도. `staleMs` 를 넘으면 stale=true 와 「N초 전」 꼬리표 — 낡은 값을 산 것처럼 그리지 않기 위한 것. */
export function freshness(ageMs: number, locale: Locale = 'ko', staleMs: number = time.staleMs): { text: string; stale: boolean } {
  const stale = ageMs > staleMs
  if (!stale) return { text: '', stale }
  const ago = elapsed(ageMs, locale)
  return { text: locale === 'ko' ? `${ago} 전` : `${ago} ago`, stale }
}

/** 「… 외 N건」 / 「… +N more」 */
export function moreText(n: number, locale: Locale = 'ko'): string {
  return locale === 'ko' ? `${glyph.more} 외 ${n}건` : `${glyph.more} +${n} more`
}

/** 「3/7 단계」 / 「Step 3 of 7」 */
export function stepText(n: number, total: number, locale: Locale = 'ko'): string {
  return locale === 'ko' ? `${n}/${total} 단계` : `Step ${n} of ${total}`
}

/** 자간을 넓힌 제목 — `A G E N T  D O C K`. wide 폭에서만 쓴다(칸을 두 배로 먹는다). */
export function spaced(s: string): string {
  return Array.from(s)
    .map(ch => (ch === ' ' ? ' ' : ch))
    .join(' ')
}

// ───────────────────────── 폭 사다리 ─────────────────────────

/** 폭에 따라 보여 주는 것을 줄이는 네 단. wide 세 열+막대 → medium 막대 뺌 → narrow 상태 낱말만 → line 한 줄 요약. */
export type Ladder = 'wide' | 'medium' | 'narrow' | 'line'
export function ladder(bodyColumns: number): Ladder {
  if (bodyColumns >= width.wide) return 'wide'
  if (bodyColumns >= width.medium) return 'medium'
  if (bodyColumns >= width.narrow) return 'narrow'
  return 'line'
}

/** 체크리스트 한 행의 열 폭(칸). glyph · label · bar · status · meta. 0 이면 그 열을 그리지 않는다. */
export type Columns = { glyph: number; label: number; bar: number; status: number; meta: number; ladder: Ladder }
export function columns(bodyColumns: number, locale: Locale = 'ko', opts: { meta?: boolean } = {}): Columns {
  const l = ladder(bodyColumns)
  const glyphW = 1
  const statusW = stateColumnCells(locale)
  const metaW = opts.meta === false ? 0 : l === 'line' ? 0 : locale === 'ko' ? 9 : 7
  const barW = l === 'wide' ? limit.barCells : 0
  const gaps = space.cell + (barW ? space.col : 0) + space.col + (metaW ? space.col : 0)
  const label = Math.max(8, bodyColumns - glyphW - barW - statusW - metaW - gaps)
  return { glyph: glyphW, label, bar: barW, status: statusW, meta: metaW, ladder: l }
}
