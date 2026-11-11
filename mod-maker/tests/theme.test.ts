// /mod-color 가 받은 글에서 테마를 정하는 규칙 시험
import { expect, test } from 'claude-code/testing'

import { readArgs, readThemeFile, renderThemeFile, resolve, type Saved } from '../hooks/lib/theme'

const saved = (args: string): Saved => {
  const r = resolve(readArgs(args))
  if (r.kind !== 'save') throw new Error(`${args}: ${r.kind} ${'reason' in r ? r.reason : ''}`)
  return r.theme
}
const hexes = (t: Saved) => [t.dark.from, t.dark.to]

test('인자 없음은 「지금 색 보기」, default 는 기본값 저장', async () => {
  expect(resolve(readArgs('')).kind).toBe('show')
  expect(resolve(readArgs('   ')).kind).toBe('show')
  const t = saved('default')
  expect(hexes(t)).toEqual(['#e6b44c', '#e05a8c'])
  expect(t.flat).toBe(false)
})

test('색 둘은 묻지 않고 그라데이션으로 저장', async () => {
  const t = saved('#3b82f6 #a855f7')
  expect(hexes(t)).toEqual(['#3b82f6', '#a855f7'])
  expect(t.flat).toBe(false)
  expect(t.input).toBe('#3b82f6 #a855f7')
})

test('색 하나는 그라데이션을 정해야 저장한다', async () => {
  const r = resolve(readArgs('teal'))
  expect(r.kind).toBe('need-gradient')
  expect(hexes(saved('teal --gradient'))).toEqual(['#008080', '#008000'])
  const flat = saved('teal --flat')
  expect(hexes(flat)).toEqual(['#008080', '#008080'])
  expect(flat.flat).toBe(true)
})

test('괄호 안에 빈칸이 있어도 깃발과 섞이지 않는다', async () => {
  const t = saved('hsl(280, 70%, 60%) --flat')
  expect(hexes(t)).toEqual(['#b152e0', '#b152e0'])
  expect(saved('--gradient rgb(59, 130, 246)').dark.from).toBe('#3b82f6')
})

test('틀린 값은 이유와 함께 거절하고, 비슷한 이름이 있으면 알려 준다', async () => {
  const r = resolve(readArgs('bleu --flat'))
  expect(r.kind).toBe('refused')
  if (r.kind === 'refused') {
    expect(r.reason).toMatch(/bleu/)
    expect(r.suggestion).toBe('blue')
  }
  const v = resolve(readArgs('rgb(300, 0, 0) --flat'))
  expect(v.kind).toBe('refused')
  if (v.kind === 'refused') expect(v.suggestion).toBeUndefined()
})

test('너무 어두운 색은 올릴지 그대로 둘지 정해야 저장한다', async () => {
  const r = resolve(readArgs('#111111 --flat'))
  expect(r.kind).toBe('need-brightness')
  if (r.kind === 'need-brightness') expect(r.lifted).toMatch(/^#[0-9a-f]{6}$/)
  expect(saved('#111111 --flat --keep').dark.from).toBe('#111111')
  const lifted = saved('#111111 --flat --lift')
  expect(lifted.dark.from).not.toBe('#111111')
  expect(lifted.dark.from).toBe(lifted.dark.to)
})

test('밝은 화면용 짝이 함께 정해진다', async () => {
  const t = saved('#e6b44c #e05a8c')
  expect(t.light.from).toMatch(/^#[0-9a-f]{6}$/)
  expect(t.light.from).not.toBe(t.dark.from)
})

test('apply 는 mod 이름 하나를 받는다', async () => {
  const r = resolve(readArgs('apply my-band'))
  expect(r.kind).toBe('apply')
  if (r.kind === 'apply') expect(r.mod).toBe('my-band')
  expect(resolve(readArgs('apply')).kind).toBe('refused')
  expect(resolve(readArgs('apply ../x')).kind).toBe('refused')
})

test('모르는 깃발과 서로 어긋나는 깃발은 거절', async () => {
  expect(resolve(readArgs('teal --shiny')).kind).toBe('refused')
  expect(resolve(readArgs('teal --flat --gradient')).kind).toBe('refused')
})

test('테마 파일 — 저장한 값이 그대로 들어가고, 다시 읽을 수 있는 꼴이다', async () => {
  const t = saved('hsl(280, 70%, 60%) --gradient')
  const src = renderThemeFile(t)
  expect(src).toContain(`from: '${t.dark.from}'`)
  expect(src).toContain(`to: '${t.dark.to}'`)
  expect(src).toContain(`from: '${t.light.from}'`)
  expect(src).toContain("input: 'hsl(280, 70%, 60%)'")
  expect(src).toContain('flat: false')
  expect(src).toMatch(/^\/\/ /)
  expect(src).toMatch(/export const themeColor = \{/)
})

test('테마 파일 — 입력에 따옴표나 역슬래시가 있어도 깨지지 않는다', async () => {
  const src = renderThemeFile({ ...saved('default'), input: "it's \\ odd" })
  expect(src).toContain("input: 'it\\'s \\\\ odd'")
})

test('테마 파일 — 쓴 것을 다시 읽으면 같은 값이다', async () => {
  for (const args of ['default', 'teal --flat', "hsl(280, 70%, 60%) --gradient", '#3b82f6 #a855f7']) {
    const t = saved(args)
    expect(readThemeFile(renderThemeFile(t))).toEqual(t)
  }
  const odd = { ...saved('default'), input: "it's \\ odd" }
  expect(readThemeFile(renderThemeFile(odd))).toEqual(odd)
  expect(readThemeFile('export const x = 1')).toBeUndefined()
})
