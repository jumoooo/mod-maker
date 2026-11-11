// mod-maker 설계 토큰 — 「테마」와 「고르는 줄」을 가른다.
//   테마   = 창의 분위기. 테두리·문양·제목·보조 글에 테마 색(from → to)을 글자 단위로 흘린다. 뜻은 없다.
//   고르는 줄 = 사람이 누르는 것(메뉴 항목·목록 행·버튼). 그라데이션을 타지 않고 단색이며, 포인터가 올라가면 뒤집힌다.
//   상태     = 뜻이 있는 색(당신 차례·막힘·끝남)은 tokens.ts 의 state 가 그대로 쥔다. 테마도 고르는 줄도 이 색을 덮지 않는다.
// 테마 색은 옆의 theme.ts 에서 온다 — `/mod-color <색>` 이 그 파일을 쓴다. 여기에 색 값을 직접 적지 않는다.
// 쓰는 법: `import { ramp, pick, gradientAt } from './ui/gradient'` — 테두리는 Box 의 borderColor 가 한 색뿐이라 글자(╭─╮│)로 직접 그린다.
import type { Color, ThemeKey } from 'claude-code'

import { themeColor } from './theme'

export type Rgb = readonly [number, number, number]

const rgb = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

/** 그라데이션 양끝. 어두운 테마용과, 흰 바탕에 묻히지 않게 한 단 짙은 밝은 테마용 짝. 한 색 테마면 양끝이 같다. */
export const ramp = {
  dark: { from: rgb(themeColor.dark.from), to: rgb(themeColor.dark.to) },
  light: { from: rgb(themeColor.light.from), to: rgb(themeColor.light.to) },
} as const

/** 대각선 비율 — 가로 0.65 : 세로 0.35. 한 줄 안에서도 색이 조금 바뀌고, 아래로 갈수록 끝 색에 가깝다. */
export const slope = { x: 0.65, y: 0.35 } as const

/** 고르는 줄 — 단색. 단축키 `[1]` 은 테마 끝 색, 라벨은 본문색 굵게, 설명은 보조색, 괄호 수는 흐리게. 포인터가 올라가면 테마 끝 색 배경에 반전 글자. */
export const pick = {
  hotkey: themeColor.dark.to as string,
  label: 'text' satisfies ThemeKey,
  hint: 'subtle' satisfies ThemeKey,
  count: 'inactive' satisfies ThemeKey,
  hover: { background: themeColor.dark.to as string, text: 'inverseText' satisfies ThemeKey },
  /** 여러 개 고르기(체크)에서 켜진 표시 — 뜻이 「끝남」이 아니라 「골랐다」라서 state.done 을 빌리지 않는다 */
  checked: themeColor.dark.to as string,
  unchecked: 'inactive' satisfies ThemeKey,
} as const

export type Mode = keyof typeof ramp

/** 사용자 테마 이름(`$.config.list()` 의 `theme` 행 값)에서 밝은/어두운을 가른다. 모르면 어두운 쪽. */
export function modeOf(themeName: string | undefined): Mode {
  return themeName !== undefined && /light/i.test(themeName) ? 'light' : 'dark'
}

const hex = (c: Rgb): string => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')

/** 두 색 사이 t(0~1) 지점. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const k = Math.max(0, Math.min(1, t))
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

/** 창 안 (x, y) 칸의 그라데이션 색 — 왼쪽 위가 from, 오른쪽 아래가 to. width·height 는 창 전체 칸 수. */
export function gradientAt(x: number, y: number, width: number, height: number, mode: Mode = 'dark'): Color {
  const t = (width > 0 ? x / width : 0) * slope.x + (height > 0 ? y / height : 0) * slope.y
  return hex(mix(ramp[mode].from, ramp[mode].to, t))
}

/** 한 줄을 글자(또는 조각) 단위로 색을 바꿔 가며 칠할 때의 조각 나누기 — `every` 칸마다 색 하나(1 이면 글자마다). Text 요소 수를 줄이려고 둔다. */
export function segments(text: string, every = 2): string[] {
  const out: string[] = []
  const chars = Array.from(text)
  for (let i = 0; i < chars.length; i += every) out.push(chars.slice(i, i + every).join(''))
  return out
}

/** 테두리 글자 — 둥근 모서리. 한 창을 글자로 그릴 때 쓴다. */
export const frameGlyph = { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' } as const

/** 테마에 어울리는 보조 색 — 테마 양끝과 그 사이·둘레. 화면을 알록달록하지 않고 골고루 칠할 때 쓴다. 이름은 자리 이름이다(start·end). */
export const palette = {
  /** 그라데이션 양끝 */
  start: themeColor.dark.from as string,
  end: themeColor.dark.to as string,
  /** 둘 사이 — 번호·보조 강조 */
  middle: hex(mix(rgb(themeColor.dark.from), rgb(themeColor.dark.to), 0.5)),
  /** 끝 색보다 깊은 — 바닥 보조 버튼·눌리지 않는 것 */
  deep: hex(mix(rgb(themeColor.dark.to), [0, 0, 0], 0.3)),
  /** 본문 글 — 테마 색 위에서 읽히는 따뜻한 흰색 */
  cream: '#f2e9df',
  /** 보조 글 — 설명·경로·쓰는 법 */
  warmGray: '#9a938c',
} as const

/** 테마 양끝 사이 n 단계 중 i 번째 색 — 항목이 여럿일 때 번호 버튼을 한 칸씩 다른 색으로 */
export function stepColor(i: number, n: number, mode: Mode = 'dark'): string {
  const t = n <= 1 ? 0 : i / (n - 1)
  const r = ramp[mode]
  const c = mix(r.from, r.to, t)
  return '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}
