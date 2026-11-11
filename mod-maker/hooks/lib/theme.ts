// /mod-color 가 받은 글에서 테마를 정한다 — 순수 함수만(`$` 를 쓰지 않는다).
// 파일을 쓰고 사람에게 묻는 일은 register.ts 가 하고, 여기는 「무엇을 할지」만 돌려준다.
import { DEFAULT_THEME, nearestName, parseTheme, toHex } from './color'

/** 저장되는 테마 — 어두운 화면용과 밝은 화면용 한 쌍씩. flat 이면 from 과 to 가 같다. */
export type Saved = {
  /** 사람이 적은 색 글 그대로(깃발은 뺀다) */
  input: string
  flat: boolean
  dark: { from: string; to: string }
  light: { from: string; to: string }
}

export type Args = {
  colors: string
  gradient: 'unset' | 'gradient' | 'flat'
  brightness: 'unset' | 'lift' | 'keep'
  /** 읽지 못한 깃발 */
  unknown: string[]
}

export type Outcome =
  | { kind: 'show' }
  | { kind: 'save'; theme: Saved; auto: boolean }
  | { kind: 'apply'; mod: string }
  | { kind: 'need-gradient'; color: string; preview: Saved }
  | { kind: 'need-brightness'; color: string; lifted: string }
  | { kind: 'refused'; reason: string; suggestion?: string }

/** 깃발(`--flat` 등)과 색 글을 가른다. 괄호 안은 건드리지 않는다. */
export function readArgs(args: string): Args {
  const out: Args = { colors: '', gradient: 'unset', brightness: 'unset', unknown: [] }
  const conflicts: string[] = []
  const rest = args.replace(/(^|\s)--([a-z-]+)(?=\s|$)/g, (_m, lead: string, flag: string) => {
    if (flag === 'gradient' || flag === 'flat') {
      if (out.gradient !== 'unset' && out.gradient !== flag) conflicts.push('--gradient 와 --flat 은 함께 쓸 수 없습니다.')
      out.gradient = flag
    } else if (flag === 'lift' || flag === 'keep') {
      if (out.brightness !== 'unset' && out.brightness !== flag) conflicts.push('--lift 와 --keep 은 함께 쓸 수 없습니다.')
      out.brightness = flag
    } else out.unknown.push(`--${flag}`)
    return lead
  })
  out.colors = rest.trim().replace(/\s+/g, ' ')
  out.unknown.push(...conflicts)
  return out
}

const refused = (reason: string, suggestion?: string): Outcome => (suggestion === undefined ? { kind: 'refused', reason } : { kind: 'refused', reason, suggestion })

/** 인자에서 할 일을 정한다. */
export function resolve(a: Args): Outcome {
  const conflict = a.unknown.find(u => !u.startsWith('--'))
  if (conflict !== undefined) return refused(conflict)
  if (a.unknown.length > 0) return refused(`모르는 깃발입니다: ${a.unknown.join(' ')}. 쓸 수 있는 것: --gradient · --flat · --lift · --keep`)
  if (a.colors === '') return { kind: 'show' }

  const word = a.colors.split(' ')
  if (word[0] === 'apply') {
    const mod = word[1]
    if (mod === undefined || word.length > 2) return refused('apply 뒤에는 mod 이름 하나를 적습니다. 예: /mod-color apply my-band')
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(mod)) return refused(`「${mod}」는 mod 이름으로 쓸 수 없습니다. 폴더 이름만 적습니다(경로가 아니라).`)
    return { kind: 'apply', mod }
  }

  const isDefault = a.colors === 'default' || a.colors === '기본값'
  const parsed = parseTheme(isDefault ? `${DEFAULT_THEME.from} ${DEFAULT_THEME.to}` : a.colors)
  if (!parsed.ok) {
    const lone = /^[a-z]+$/i.test(a.colors) ? nearestName(a.colors.toLowerCase()) : undefined
    const inPair = lone === undefined ? a.colors.split(' ').map(w => (/^[a-z]+$/i.test(w) ? nearestName(w.toLowerCase()) : undefined)).find(n => n !== undefined && parsed.reason.includes(n)) : lone
    return refused(parsed.reason, inPair)
  }

  let from = parsed.from
  let to = parsed.to
  let lightFrom = parsed.light.from
  let lightTo = parsed.light.to
  if (parsed.tooDark && parsed.visible !== undefined) {
    if (a.brightness === 'unset') return { kind: 'need-brightness', color: toHex(from), lifted: toHex(parsed.visible.from) }
    if (a.brightness === 'lift') {
      from = parsed.visible.from
      to = parsed.visible.to
    }
  }
  const single = parsed.auto
  const flat = single && a.gradient === 'flat'
  if (flat) {
    to = from
    lightTo = lightFrom
  }
  const theme: Saved = {
    input: a.colors,
    flat,
    dark: { from: toHex(from), to: toHex(to) },
    light: { from: toHex(lightFrom), to: toHex(lightTo) },
  }
  if (single && a.gradient === 'unset') return { kind: 'need-gradient', color: toHex(from), preview: theme }
  return { kind: 'save', theme, auto: single && !flat }
}

const quote = (s: string): string => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** `templates/ui/theme.ts` 의 내용 — gradient.ts 가 이 값을 읽는다. */
export function renderThemeFile(t: Saved): string {
  return [
    '// 테마 색 — /mod-color 가 쓰는 파일이다. 손으로 고치지 말고 `/mod-color <색>` 으로 바꾼다.',
    '// dark 는 어두운 화면, light 는 밝은 화면에서 쓰는 한 쌍(from → to). flat 이면 둘이 같다.',
    'export const themeColor = {',
    `  input: ${quote(t.input)},`,
    `  flat: ${t.flat ? 'true' : 'false'},`,
    `  dark: { from: '${t.dark.from}', to: '${t.dark.to}' },`,
    `  light: { from: '${t.light.from}', to: '${t.light.to}' },`,
    '} as const',
    '',
  ].join('\n')
}

/** 저장된 파일에서 값을 다시 읽는다. 못 읽으면 undefined. */
export function readThemeFile(src: string): Saved | undefined {
  const pair = (name: string) => new RegExp(`${name}: \\{ from: '(#[0-9a-f]{6})', to: '(#[0-9a-f]{6})' \\}`).exec(src)
  const dark = pair('dark')
  const light = pair('light')
  const input = /input: '((?:[^'\\]|\\.)*)'/.exec(src)
  if (!dark || !light || !input) return undefined
  return {
    input: input[1]!.replace(/\\(.)/g, '$1'),
    flat: /flat: true/.test(src),
    dark: { from: dark[1]!, to: dark[2]! },
    light: { from: light[1]!, to: light[2]! },
  }
}
