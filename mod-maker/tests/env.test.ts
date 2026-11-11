// 「이 기계에 있는 것」에서 갈 길을 정하는 규칙 시험
import { expect, test } from 'claude-code/testing'

import { MIN_VERSION, decide, isAtLeast, parseVersion, type Probe } from '../hooks/lib/env'

const full: Probe = { claudeVersion: '2.1.322', modsOn: true, node: true, npm: true, tsc: true, playwright: true }

test('판 번호 — `claude --version` 출력에서 숫자만 꺼낸다', async () => {
  expect(parseVersion('2.1.322 (Claude Code)')).toBe('2.1.322')
  expect(parseVersion('  2.1.287\n')).toBe('2.1.287')
  expect(parseVersion('command not found')).toBeUndefined()
  expect(parseVersion('')).toBeUndefined()
})

test('판 비교 — 자리마다 수로 견준다(글자 순서가 아니다)', async () => {
  expect(isAtLeast('2.1.287', MIN_VERSION)).toBe(true)
  expect(isAtLeast('2.1.286', MIN_VERSION)).toBe(false)
  expect(isAtLeast('2.1.1000', MIN_VERSION)).toBe(true)
  expect(isAtLeast('2.2.0', MIN_VERSION)).toBe(true)
  expect(isAtLeast('2.1.31', MIN_VERSION)).toBe(false)
  expect(isAtLeast('3.0', MIN_VERSION)).toBe(true)
})

test('다 있는 기계 — 멈춤 없음, 타입 검사와 스스로 찍어 보기 둘 다 켠다', async () => {
  expect(decide(full)).toEqual({ stop: undefined, modsOff: false, typeCheck: true, selfCheck: true, playwright: 'ready' })
})

test('Claude 만 있는 기계 — 멈추지 않고, 타입 검사와 찍어 보기만 끈다', async () => {
  const p = decide({ claudeVersion: '2.1.322', modsOn: true, node: false, npm: false, tsc: false, playwright: false })
  expect(p).toEqual({ stop: undefined, modsOff: false, typeCheck: false, selfCheck: false, playwright: 'needs-node' })
})

test('Node.js 는 있고 Playwright 만 없는 기계 — 설치를 권할 수 있다', async () => {
  const p = decide({ ...full, playwright: false })
  expect(p.playwright).toBe('offer')
  expect(p.selfCheck).toBe(false)
  expect(p.stop).toBeUndefined()
})

test('npm 없이 node 만 있으면 Playwright 는 못 깐다', async () => {
  expect(decide({ ...full, npm: false, playwright: false }).playwright).toBe('needs-node')
})

test('Playwright 가 이미 붙어 있으면 Node.js 가 없어도 그대로 쓴다', async () => {
  const p = decide({ ...full, node: false, npm: false, tsc: false })
  expect(p.playwright).toBe('ready')
  expect(p.selfCheck).toBe(true)
})

test('타입 검사 — tsc 가 없어도 npx 로 돌릴 수 있으면 켠다', async () => {
  expect(decide({ ...full, tsc: false }).typeCheck).toBe(true)
  expect(decide({ ...full, tsc: false, npm: false }).typeCheck).toBe(false)
})

test('Claude Code 가 없거나 옛 판이면 멈춘다', async () => {
  expect(decide({ ...full, claudeVersion: undefined }).stop).toBe('no-claude')
  expect(decide({ ...full, claudeVersion: '2.1.250' }).stop).toBe('old-claude')
  expect(decide({ ...full, claudeVersion: MIN_VERSION }).stop).toBeUndefined()
})

test('mod 기능이 꺼져 있으면 멈추지는 않고 알린다', async () => {
  const p = decide({ ...full, modsOn: false })
  expect(p.stop).toBeUndefined()
  expect(p.modsOff).toBe(true)
})
