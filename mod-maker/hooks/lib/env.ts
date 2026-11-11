// 「이 기계에 있는 것」에서 갈 길을 정한다 — 순수 함수만(`$` 를 쓰지 않는다).
// 재는 일(프로그램을 불러 보는 것)은 부르는 쪽이 하고, 여기는 잰 값으로 길만 고른다.

/** mod 가 되는 가장 낮은 Claude Code 판. */
export const MIN_VERSION = '2.1.287'

/** 잰 값. claudeVersion 이 없으면 Claude Code 를 못 찾은 것이다. */
export type Probe = {
  claudeVersion: string | undefined
  modsOn: boolean
  node: boolean
  npm: boolean
  tsc: boolean
  /** Playwright 가 Claude Code 에 이미 붙어 있는가 */
  playwright: boolean
}

export type Plan = {
  /** 설치를 멈추는 까닭. 없으면 진행 */
  stop: 'no-claude' | 'old-claude' | undefined
  /** mod 기능이 꺼져 있다 — 복사는 하되 알린다 */
  modsOff: boolean
  /** 타입 검사를 돌릴 수 있는가(tsc 또는 npx) */
  typeCheck: boolean
  /** Claude 가 그림을 스스로 찍어 볼 수 있는가 */
  selfCheck: boolean
  /** ready 이미 있음 · offer 설치를 권함 · needs-node Node.js 가 없어 지금은 못 함 */
  playwright: 'ready' | 'offer' | 'needs-node'
}

/** `claude --version` 출력에서 판 번호만. 못 찾으면 undefined. */
export function parseVersion(output: string): string | undefined {
  return /^\s*(\d+(?:\.\d+)+)/.exec(output)?.[1]
}

/** version 이 least 이상인가 — 자리마다 수로 견준다. */
export function isAtLeast(version: string, least: string): boolean {
  const a = version.split('.').map(Number)
  const b = least.split('.').map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x > y
  }
  return true
}

export function decide(p: Probe): Plan {
  const stop = p.claudeVersion === undefined ? 'no-claude' : isAtLeast(p.claudeVersion, MIN_VERSION) ? undefined : 'old-claude'
  const playwright = p.playwright ? 'ready' : p.node && p.npm ? 'offer' : 'needs-node'
  return {
    stop,
    modsOff: !p.modsOn,
    typeCheck: p.tsc || (p.node && p.npm),
    selfCheck: p.playwright,
    playwright,
  }
}
