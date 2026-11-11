// 색 읽기 시험 — claude plugin test . (Claude Code 만으로 돈다)
import { expect, test } from 'claude-code/testing'

import { DEFAULT_THEME, parseColor, parseTheme, toHex, type Rgb, type Theme } from '../hooks/lib/color'

const rgbOf = (s: string): Rgb => { const r = parseColor(s); if (!r.ok) throw new Error(`${s}: ${r.reason}`); return r.rgb }
const whyNot = (s: string): string => { const r = parseColor(s); if (r.ok) throw new Error(`${s} 는 거절돼야 한다`); return r.reason }
const themeOf = (s: string): Theme => { const t = parseTheme(s); if (!t.ok) throw new Error(`${s}: ${t.reason}`); return t }
const lightness = (c: Rgb): number => (Math.max(...c) + Math.min(...c)) / 510

test('색 이름 — 대소문자와 앞뒤 빈칸을 가리지 않는다', async () => {
  expect(rgbOf('teal')).toEqual([0, 128, 128])
  expect(rgbOf('  Teal ')).toEqual([0, 128, 128])
  expect(rgbOf('rebeccapurple')).toEqual([102, 51, 153])
  expect(rgbOf('grey')).toEqual(rgbOf('gray'))
})

test('hex — 6자리와 3자리, # 없이도', async () => {
  expect(rgbOf('#3b82f6')).toEqual([59, 130, 246])
  expect(rgbOf('#38f')).toEqual([51, 136, 255])
  expect(rgbOf('#3B82F6')).toEqual([59, 130, 246])
  expect(rgbOf('3b82f6')).toEqual([59, 130, 246])
})

test('rgb — 쉼표, 빈칸, 괄호 없는 세 수', async () => {
  expect(rgbOf('rgb(234, 88, 12)')).toEqual([234, 88, 12])
  expect(rgbOf('rgb(234 88 12)')).toEqual([234, 88, 12])
  expect(rgbOf('RGB( 234,88,12 )')).toEqual([234, 88, 12])
  expect(rgbOf('234, 88, 12')).toEqual([234, 88, 12])
})

test('hsl — % 와 deg 는 있어도 없어도, 색상은 360 을 넘으면 돈다', async () => {
  expect(rgbOf('hsl(0, 100%, 50%)')).toEqual([255, 0, 0])
  expect(rgbOf('hsl(120, 100, 50)')).toEqual([0, 255, 0])
  expect(rgbOf('hsl(240deg 100% 50%)')).toEqual([0, 0, 255])
  expect(rgbOf('hsl(480, 100%, 50%)')).toEqual([0, 255, 0])
  expect(rgbOf('hsl(280, 70%, 60%)')).toEqual([177, 82, 224])
})

test('틀린 값은 이유를 말한다', async () => {
  expect(whyNot('rgb(300, 0, 0)')).toMatch(/0 에서 255.*300/)
  expect(whyNot('#12345')).toMatch(/3자리나 6자리.*5자리/)
  expect(whyNot('#12345g')).toMatch(/0~9.*a~f/)
  expect(whyNot('hsl(280, 170%, 60%)')).toMatch(/0 에서 100/)
  expect(whyNot('bleu')).toMatch(/아는 색 이름이 아닙니다.*blue/)
  expect(whyNot('zzzzqqqq')).toMatch(/아는 색 이름이 아닙니다/)
  expect(whyNot('zzzzqqqq')).not.toMatch(/말씀하신/)
  expect(whyNot('rgb(1, 2)')).toMatch(/세 개/)
  expect(whyNot('')).toMatch(/비어/)
})

test('경계 — rgb 는 0 과 255 까지, hsl 은 0 과 100 까지 받는다', async () => {
  expect(rgbOf('rgb(0, 0, 0)')).toEqual([0, 0, 0])
  expect(rgbOf('rgb(255, 255, 255)')).toEqual([255, 255, 255])
  expect(whyNot('rgb(256, 0, 0)')).toMatch(/256/)
  expect(whyNot('rgb(-1, 0, 0)')).toMatch(/-1/)
  expect(rgbOf('hsl(0, 0%, 100%)')).toEqual([255, 255, 255])
  expect(whyNot('hsl(0, 101%, 50%)')).toMatch(/0 에서 100/)
})

test('테마 — 빈 입력은 기본값', async () => {
  const t = themeOf('')
  expect(toHex(t.from)).toBe(DEFAULT_THEME.from)
  expect(toHex(t.to)).toBe(DEFAULT_THEME.to)
  expect(t.isDefault).toBe(true)
})

test('테마 — 색 하나면 끝 색을 색상환 60도 옆으로 정하고 auto 로 알린다', async () => {
  const t = themeOf('hsl(280, 70%, 60%)')
  expect(t.auto).toBe(true)
  expect(toHex(t.from)).toBe('#b152e0')
  expect(t.to).toEqual(rgbOf('hsl(220, 70%, 60%)'))
})

test('테마 — 색 둘은 그대로, 괄호 안 빈칸에서 끊지 않는다', async () => {
  const t = themeOf('rgb(59, 130, 246)  hsl(280, 70%, 60%)')
  expect(t.auto).toBe(false)
  expect(toHex(t.from)).toBe('#3b82f6')
  expect(toHex(t.to)).toBe('#b152e0')
  const u = themeOf('#3b82f6 #a855f7')
  expect([toHex(u.from), toHex(u.to)]).toEqual(['#3b82f6', '#a855f7'])
})

test('테마 — 셋 이상이거나 둘째가 틀리면 거절', async () => {
  expect(parseTheme('red green blue').ok).toBe(false)
  const t = parseTheme('teal bleu')
  expect(t.ok).toBe(false)
  if (!t.ok) expect(t.reason).toMatch(/bleu/)
})

test('테마 — 너무 어두운 색은 보이는 밝기의 대안을 같이 준다', async () => {
  const t = themeOf('#111111')
  expect(t.tooDark).toBe(true)
  expect(t.visible).toBeDefined()
  expect(lightness(t.visible!.from)).toBeGreaterThanOrEqual(0.41)
  expect(themeOf('#3b82f6').tooDark).toBe(false)
  expect(themeOf('teal').tooDark).toBe(false)
  expect(themeOf('navy').tooDark).toBe(true)
})

test('테마 — 밝은 화면용 짝은 밝기 40% 이하', async () => {
  const t = themeOf('#e6b44c #e05a8c')
  for (const c of [t.light.from, t.light.to]) expect(lightness(c)).toBeLessThan(0.405)
  const grey = themeOf('#808080').light.from
  expect(grey[0] === grey[1] && grey[1] === grey[2]).toBe(true)
})
