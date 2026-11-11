// 색 읽기 — 색 이름 · hex · rgb() · hsl() 를 [r, g, b] 로. 순수 함수만(`$` 를 쓰지 않는다).
// 틀린 값은 던지지 않고 { ok: false, reason } 으로 이유를 돌려준다(이유는 사람이 읽는 한 줄).

/** 기본 테마 — 금색에서 장미색으로. */
export const DEFAULT_THEME = { from: '#e6b44c', to: '#e05a8c' }

/** 색 하나만 받았을 때 끝 색까지의 색상 차(도). 기본 테마의 금→장미와 같은 방향. */
export const AUTO_HUE_SHIFT = -60

// CSS 색 이름 148개
const NAMES: Record<string, string> = Object.fromEntries(
  ('aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 ' +
    'blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 ' +
    'chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b ' +
    'darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b ' +
    'darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 darksalmon e9967a ' +
    'darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f darkturquoise 00ced1 ' +
    'darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 dodgerblue 1e90ff ' +
    'firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff ' +
    'gold ffd700 goldenrod daa520 gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 ' +
    'hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa lavenderblush fff0f5 ' +
    'lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff ' +
    'lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 ' +
    'lightsalmon ffa07a lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 lightslategrey 778899 ' +
    'lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff ' +
    'maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd mediumorchid ba55d3 mediumpurple 9370db ' +
    'mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a mediumturquoise 48d1cc ' +
    'mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 ' +
    'navajowhite ffdead navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 ' +
    'orchid da70d6 palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee palevioletred db7093 ' +
    'papayawhip ffefd5 peachpuff ffdab9 peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 ' +
    'rebeccapurple 663399 red ff0000 rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 ' +
    'sandybrown f4a460 seagreen 2e8b57 seashell fff5ee sienna a0522d silver c0c0c0 skyblue 87ceeb ' +
    'slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa springgreen 00ff7f steelblue 4682b4 ' +
    'tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 violet ee82ee wheat f5deb3 ' +
    'white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32')
    .split(' ')
    .reduce<[string, string][]>((pairs, word, i, all) => (i % 2 === 0 ? [...pairs, [word, all[i + 1]!]] : pairs), []),
)
export const COLOR_NAMES = Object.keys(NAMES)

export type Rgb = readonly [number, number, number]
export type Refused = { ok: false; reason: string }
export type Color = { ok: true; rgb: Rgb }
export type Theme = {
  ok: true
  from: Rgb
  to: Rgb
  auto: boolean
  isDefault: boolean
  tooDark: boolean
  visible: { from: Rgb; to: Rgb } | undefined
  light: { from: Rgb; to: Rgb }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const hexToRgb = (h: string): Rgb => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]

/** [r, g, b] → '#rrggbb' */
export const toHex = (rgb: Rgb): string => '#' + rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')

/** h 도 · s % · l % → [r, g, b] */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  h = ((h % 360) + 360) % 360
  s = clamp(s, 0, 100) / 100
  l = clamp(l, 0, 100) / 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

/** [r, g, b] → [h 도, s %, l %] */
export function rgbToHsl(rgb: Rgb): [number, number, number] {
  const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
  if (mx === mn) return [0, 0, l * 100]
  const d = mx - mn
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s * 100, l * 100]
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const keep = row[j]!
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = keep
    }
  }
  return row[b.length]!
}

/** 철자가 가장 가까운 색 이름(두 글자 차이까지). 없으면 undefined. */
export function nearestName(word: string): string | undefined {
  let best: string | undefined
  let bestD = 3
  for (const n of COLOR_NAMES) {
    if (Math.abs(n.length - word.length) >= bestD) continue
    const d = distance(word, n)
    if (d < bestD) { best = n; bestD = d }
  }
  return best
}

const no = (reason: string): Refused => ({ ok: false, reason })
const yes = (rgb: Rgb): Color => ({ ok: true, rgb })
const numbers = (s: string) => s.split(/[\s,/]+/).filter(Boolean)

/** 색 하나를 읽는다. */
export function parseColor(input: string): Color | Refused {
  const s = String(input ?? '').trim().toLowerCase()
  if (s === '') return no('값이 비어 있습니다.')

  if (s.startsWith('#') || /^[0-9a-f]{6}$/.test(s)) {
    const d = s.replace(/^#/, '')
    if (!/^[0-9a-f]*$/.test(d)) return no('hex 는 # 뒤에 0~9 와 a~f 만 씁니다.')
    if (d.length !== 3 && d.length !== 6) return no(`hex 는 # 뒤에 3자리나 6자리입니다. ${d.length}자리가 들어왔습니다.`)
    return yes(hexToRgb(d.length === 3 ? d.split('').map(c => c + c).join('') : d))
  }

  let m: (string | undefined)[] | null = s.match(/^rgba?\((.*)\)$/) ?? (/^[\d\s,.-]+$/.test(s) ? [s, s] : null)
  if (m) {
    const parts = numbers(m[1] ?? '')
    if (parts.length !== 3) return no(`rgb 는 수 세 개입니다. ${parts.length}개가 들어왔습니다. 예: rgb(234, 88, 12)`)
    const v = parts.map(Number)
    if (v.some(Number.isNaN)) return no('rgb 의 값은 수여야 합니다. 예: rgb(234, 88, 12)')
    const bad = v.find(x => x < 0 || x > 255)
    if (bad !== undefined) return no(`rgb 의 값은 0 에서 255 사이입니다. ${bad} 이 벗어났습니다.`)
    return yes([Math.round(v[0]!), Math.round(v[1]!), Math.round(v[2]!)])
  }

  m = s.match(/^hsla?\((.*)\)$/)
  if (m) {
    const parts = numbers(m[1] ?? '')
    if (parts.length !== 3) return no(`hsl 은 수 세 개입니다. ${parts.length}개가 들어왔습니다. 예: hsl(280, 70%, 60%)`)
    const h = Number(parts[0]!.replace(/deg$/, '')), sat = Number(parts[1]!.replace(/%$/, '')), l = Number(parts[2]!.replace(/%$/, ''))
    if ([h, sat, l].some(Number.isNaN)) return no('hsl 의 값은 수여야 합니다. 예: hsl(280, 70%, 60%)')
    if (sat < 0 || sat > 100 || l < 0 || l > 100) return no('hsl 의 둘째 · 셋째 값은 0 에서 100 사이입니다.')
    return yes(hslToRgb(h, sat, l))
  }

  if (/^[a-z]+$/.test(s)) {
    const known = NAMES[s]
    if (known) return yes(hexToRgb(known))
    const near = nearestName(s)
    return no(`「${s}」는 아는 색 이름이 아닙니다.` + (near ? ` ${near} 를 말씀하신 건가요?` : ''))
  }
  return no(`「${s}」를 색으로 읽을 수 없습니다.`)
}

/** 괄호 밖 빈칸에서만 끊는다 — `rgb(1, 2, 3) hsl(4, 5%, 6%)` 는 둘. */
function splitColors(s: string): string[] {
  const out: string[] = []
  let depth = 0, cur = ''
  for (const ch of s.trim()) {
    if (ch === '(') depth++
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (/\s/.test(ch) && depth === 0) { if (cur) out.push(cur); cur = '' } else cur += ch
  }
  if (cur) out.push(cur)
  // 괄호 없이 적은 `234, 88, 12` 는 색 하나다
  if (out.length > 1 && out.every(p => /^[\d.,-]+$/.test(p))) return [out.join(' ')]
  return out
}

/** 어두운 화면에서 보이는 가장 낮은 밝기(%)와 밝은 화면에서 쓰는 가장 높은 밝기(%). */
export const LIGHTNESS = { minOnDark: 42, maxOnLight: 40 }

/** 눈에 보이는 밝기(0~1) — 같은 HSL 밝기라도 파랑은 어둡고 초록은 밝다. */
export function luminance(rgb: Rgb): number {
  const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
}

/** 이보다 어두우면 어두운 화면에서 안 보인다고 본다(navy 0.015 는 걸리고 teal 0.17 은 안 걸린다). */
export const DARK_LUMINANCE = 0.04

const lightPair = (rgb: Rgb): Rgb => { const [h, s, l] = rgbToHsl(rgb); return hslToRgb(h, s === 0 ? 0 : Math.min(100, s + 5), Math.min(l, LIGHTNESS.maxOnLight)) }
const lifted = (rgb: Rgb): Rgb => { const [h, s, l] = rgbToHsl(rgb); return hslToRgb(h, s, Math.max(l, LIGHTNESS.minOnDark)) }

/**
 * 테마 색을 읽는다 — 빈 값은 기본값, 색 하나면 끝 색을 정해 주고, 둘이면 그대로.
 * 돌려주는 것: from · to(어두운 화면) · light.from · light.to(밝은 화면) · auto · isDefault · tooDark · visible(밝기를 올린 대안)
 */
export function parseTheme(input: string): Theme | Refused {
  const parts = splitColors(String(input ?? ''))
  if (parts.length === 0) return { ...(parseTheme(`${DEFAULT_THEME.from} ${DEFAULT_THEME.to}`) as Theme), isDefault: true }
  if (parts.length > 2) return no(`색은 하나나 둘만 적습니다. ${parts.length}개가 들어왔습니다.`)
  const a = parseColor(parts[0]!)
  if (!a.ok) return a
  let to: Rgb
  let auto = false
  if (parts[1] !== undefined) {
    const b = parseColor(parts[1])
    if (!b.ok) return b
    to = b.rgb
  } else {
    const [h, s, l] = rgbToHsl(a.rgb)
    to = hslToRgb(h + AUTO_HUE_SHIFT, s, l)
    auto = true
  }
  const from = a.rgb
  const tooDark = luminance(from) < DARK_LUMINANCE
  return {
    ok: true, from, to, auto, isDefault: false, tooDark,
    visible: tooDark ? { from: lifted(from), to: lifted(to) } : undefined,
    light: { from: lightPair(from), to: lightPair(to) },
  }
}
