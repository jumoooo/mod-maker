// mod-maker 훅 모듈 — 명령 셋을 낸다.
//   /mod-color        테마 색을 보고, 바꾸고, 만든 mod 에 입힌다. 색 읽기는 여기서 하고(lib/color), 사람에게 묻는 일은 Claude 에게 넘긴다.
//   /mod-maker-check  이 기계에 있는 것을 재서 표로 보인다.
//   /mod-maker-init   처음 설정 — SKILL.md 의 「처음 설정」 절을 Claude 가 따르게 한다(물음 칸은 Claude 가 띄운다).
// 세 명령 모두 `claude -p "/mod-color …" --plugin-dir <이 폴더>` 처럼 터미널 한 줄로도 돈다. 그때는 묻지 못하므로 정할 것이 남으면 종료 2 로 끝난다.
import type { EngineInterface, Register } from 'claude-code'

import { MIN_VERSION, decide, parseVersion, type Plan, type Probe } from './lib/env'
import { readArgs, readThemeFile, renderThemeFile, resolve, type Saved } from './lib/theme'

let interactive = true

const NEEDS_CHOICE = 2
const EXAMPLES = '예: teal · #3b82f6 · rgb(234, 88, 12) · hsl(280, 70%, 60%) · 두 색은 띄어서 #3b82f6 #a855f7'

const themePath = (root: string) => `${root}/templates/ui/theme.ts`
const parentOf = (path: string) => path.replace(/[\\/][^\\/]+[\\/]?$/, '')

const describe = (t: Saved): string => (t.flat ? `${t.dark.from} (한 색)` : `${t.dark.from} → ${t.dark.to}`)

async function currentTheme($: EngineInterface): Promise<Saved | undefined> {
  try {
    return readThemeFile(await $.fs.read(themePath($.plugin.root)))
  } catch {
    return undefined
  }
}

/** 묻는 일을 Claude 에게 넘기는 글 — 사람은 못 보고 모델만 읽는다. */
const ask = (question: string, options: string[], then: string): string =>
  `mod-maker: the theme colour is NOT saved yet. Ask the person with the AskUserQuestion tool (one question, these options, in Korean): "${question}" — options: ${options.map(o => `"${o}"`).join(', ')}. ${then} Apply the result with the mcp__mod-maker__theme tool. Do not guess for the person.`

async function isWindows($: EngineInterface): Promise<boolean> {
  return (await $.env.get('OS')) === 'Windows_NT'
}

/** 프로그램을 불러 첫 줄을 돌려준다. 없거나 실패하면 undefined. Windows 의 npm·tsc 는 .cmd 라 cmd 를 거친다. */
async function firstLine($: EngineInterface, argv: readonly string[], viaShell: boolean): Promise<string | undefined> {
  try {
    const r = await $.process.run(viaShell ? ['cmd', '/c', ...argv] : argv, { timeoutMs: 20000 })
    if (r.exitCode !== 0) return undefined
    return (r.stdout.trim().split(/\r?\n/)[0] ?? '').trim()
  } catch {
    return undefined
  }
}

async function probe($: EngineInterface): Promise<{ probe: Probe; nodeVersion: string | undefined }> {
  const win = await isWindows($)
  const claude = await firstLine($, ['claude', '--version'], false)
  const node = await firstLine($, ['node', '--version'], false)
  const npm = await firstLine($, ['npm', '--version'], win)
  const tsc = await firstLine($, ['tsc', '--version'], win)
  const playwright = await firstLine($, ['claude', 'mcp', 'get', 'playwright'], false)
  return {
    nodeVersion: node,
    probe: {
      claudeVersion: claude === undefined ? undefined : parseVersion(claude),
      // 이 명령이 돌고 있다는 것이 mod 기능이 켜져 있다는 뜻이다
      modsOn: true,
      node: node !== undefined,
      npm: npm !== undefined,
      tsc: tsc !== undefined,
      playwright: playwright !== undefined,
    },
  }
}

function checkText(p: Probe, nodeVersion: string | undefined, plan: Plan): string {
  // 한글은 두 칸을 차지한다 — 글자 수가 아니라 칸 수로 맞춘다
  const cellsOf = (s: string) => Array.from(s).reduce((n, ch) => n + (/[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7a3\uff00-\uff60]/.test(ch) ? 2 : 1), 0)
  const padTo = (s: string, w: number) => s + ' '.repeat(Math.max(1, w - cellsOf(s)))
  const row = (ok: boolean, name: string, value: string, note: string) => `  ${ok ? '✓' : '–'} ${padTo(name, 14)}${padTo(value, 12)}${note}`.trimEnd()
  const lines = [
    '이 기계에 있는 것',
    row(p.claudeVersion !== undefined, 'Claude Code', p.claudeVersion ?? '못 찾음', `${MIN_VERSION} 이상이면 됩니다`),
    row(true, 'mod 기능', '켜져 있음', ''),
    row(p.node, 'Node.js', nodeVersion ?? '없음', p.node ? '' : '없어도 됩니다'),
    row(p.playwright, 'Playwright', p.playwright ? '붙어 있음' : '없음', p.playwright ? '' : '없어도 됩니다'),
    '',
    '이 기계에서는 이렇게 갑니다',
    '  · mod 만들기 · 색 고르기 · 검사   전부 됩니다',
    `  · 타입 검사(tsc)                  ${plan.typeCheck ? '합니다' : '건너뜁니다'}`,
    `  · Claude 가 그림을 찍어 보기       ${plan.selfCheck ? '합니다' : '건너뜁니다 (그림은 사람이 보고 말해 줍니다)'}`,
  ]
  if (plan.playwright === 'offer') lines.push('', 'Playwright 를 설치할 수 있습니다:  /mod-maker-init playwright')
  if (plan.playwright === 'needs-node') lines.push('', 'Node.js 를 나중에 깔면 Playwright 도 설치할 수 있습니다.')
  return lines.join('\n')
}

/** 테마를 저장한다. 사람이 볼 한 줄을 돌려준다. */
async function save($: EngineInterface, theme: Saved, auto: boolean): Promise<string> {
  await $.fs.write(themePath($.plugin.root), renderThemeFile(theme))
  const tail = auto ? '\n  끝 색은 알아서 정했습니다. 직접 정하려면 색 두 개를 띄어 적습니다.' : ''
  return `✓ 테마 색을 저장했습니다   ${describe(theme)}${tail}\n  이미 만든 mod 에 입히려면:  /mod-color apply <mod 이름>`
}

/** 만든 mod 의 hooks/ui/theme.ts 를 지금 테마로 바꾼다. */
async function applyTo($: EngineInterface, mod: string): Promise<{ text: string; exitCode: number }> {
  const dir = `${parentOf($.plugin.root)}/${mod}/hooks/ui`
  if (!(await $.fs.exists(`${dir}/gradient.ts`))) {
    return { text: `✗ 「${mod}」에서 색 파일을 찾지 못했습니다 (${dir}/gradient.ts).\n  mod-maker 로 만든, 화면이 있는 mod 의 폴더 이름을 적어 주세요.`, exitCode: 1 }
  }
  const src = await $.fs.read(themePath($.plugin.root))
  await $.fs.write(`${dir}/theme.ts`, src)
  const t = readThemeFile(src)
  return { text: `✓ 「${mod}」에 테마 색을 입혔습니다   ${t ? describe(t) : ''}\n  열려 있는 Claude Code 에서는 /reload-plugins 뒤에 보입니다.`, exitCode: 0 }
}

type ColorAnswer = { text: string; exitCode: number; context?: string[] }

async function color($: EngineInterface, args: string, canAsk: boolean): Promise<ColorAnswer> {
  const outcome = resolve(readArgs(args))
  switch (outcome.kind) {
    case 'show': {
      const t = await currentTheme($)
      return { text: t ? `지금 테마 색   ${describe(t)}   (적은 값: ${t.input})\n  바꾸려면:  /mod-color <색>   ${EXAMPLES}` : '테마 색 파일을 읽지 못했습니다. /mod-color default 로 기본값을 다시 씁니다.', exitCode: t ? 0 : 1 }
    }
    case 'save':
      return { text: await save($, outcome.theme, outcome.auto), exitCode: 0 }
    case 'apply':
      return applyTo($, outcome.mod)
    case 'need-gradient': {
      const text = `${outcome.color} 한 색을 받았습니다. 그라데이션을 넣을지 정해 주세요.`
      if (!canAsk) return { text: `${text}\n  넣기:  /mod-color ${args.trim()} --gradient\n  한 색으로만:  /mod-color ${args.trim()} --flat\n  끝 색을 직접:  색 두 개를 띄어 적습니다`, exitCode: NEEDS_CHOICE }
      return {
        text,
        exitCode: 0,
        context: [ask(`${outcome.color} 한 색을 받았습니다. 창에 그라데이션을 넣을까요?`, [`넣기 (끝 색은 알아서 ${outcome.preview.dark.to})`, '한 색으로만', '끝 색을 직접 적기'], `Then call the tool with color "${args.trim()}" and gradient "auto" (넣기), "flat" (한 색으로만), or the end colour the person typed.`)],
      }
    }
    case 'need-brightness': {
      const text = `${outcome.color} 은 너무 어두워 어두운 화면에서 안 보입니다.`
      if (!canAsk) return { text: `${text}\n  보이는 밝기(${outcome.lifted})로 올려 쓰기:  --lift 를 붙입니다\n  그대로 쓰기:  --keep 을 붙입니다`, exitCode: NEEDS_CHOICE }
      return {
        text,
        exitCode: 0,
        context: [ask(`${outcome.color} 은 너무 어두워 어두운 화면에서 안 보입니다. 어떻게 할까요?`, [`보이는 밝기로 올려 쓰기 (${outcome.lifted})`, '그대로 쓰기', '다시 적기'], `Then call the tool with color "${args.trim()}" and brightness "lift" or "keep"; for 다시 적기 take the new colour the person gives.`)],
      }
    }
    case 'refused': {
      const hint = outcome.suggestion === undefined ? '' : ` ${outcome.suggestion} 를 말씀하신 건가요?`
      const text = `✗ ${outcome.reason}${outcome.reason.includes('말씀하신') ? '' : hint}\n  ${EXAMPLES}\n  색은 그대로 둡니다.`
      if (!canAsk) return { text, exitCode: NEEDS_CHOICE }
      const options = outcome.suggestion === undefined ? ['다시 적기', '기본값으로', '지금 색 그대로 두기'] : [`예, ${outcome.suggestion}`, '다시 적기', '기본값으로']
      return {
        text,
        exitCode: 0,
        context: [
          `mod-maker: the colour input "${args.trim()}" was refused (${outcome.reason}). If the text is a colour described in words rather than a mistyped value (for example "진한 남색", "시원한 색"), interpret it yourself as the SKILL.md section 「색을 말로 받았을 때」 says: propose a hex colour, or candidates when it is ambiguous, with AskUserQuestion, and save only what the person picks. Otherwise ask with AskUserQuestion (in Korean): options ${options.map(o => `"${o}"`).join(', ')}. Apply the result with the mcp__mod-maker__theme tool; "기본값으로" is color "default".`,
        ],
      }
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    interactive = e.isInteractive
    await $.tool.register({
      name: 'theme',
      description:
        'mod-maker theme colour. Reads a colour exactly (CSS colour name, #hex, rgb(), hsl(), or two colours separated by a space) and saves it as the theme new mods are drawn with. Call it only after the person has chosen — never guess a colour or a gradient for them. Input: color (required; "default" for the built-in gold-to-rose; "" to only show the current theme), gradient ("auto" = end colour 60 degrees along the hue wheel, "flat" = single colour, or an end colour; required when color is a single colour), brightness ("lift" or "keep"; only when the tool says the colour is too dark), apply_to (optional mod folder name: copy the saved theme into that mod instead of changing it). Result: { ok, text, needs? } where needs is "gradient" or "brightness" when a choice is still missing.',
      inputSchema: {
        type: 'object',
        properties: {
          color: { type: 'string' },
          gradient: { type: 'string' },
          brightness: { type: 'string', enum: ['lift', 'keep'] },
          apply_to: { type: 'string' },
        },
        required: ['color'],
        additionalProperties: false,
      },
    })
    // 명령 등록은 맨 끝 — 이름이 겹쳐 던지면 그 뒤 등록이 안 된다
    await $.command.register({ name: 'mod-color', description: '테마 색 보기 · 바꾸기 · 만든 mod 에 입히기', argumentHint: '[색 | 색 색 | default | apply <mod 이름>] [--gradient|--flat]' })
    await $.command.register({ name: 'mod-maker-check', description: '이 기계에 있는 것(Claude Code · Node.js · Playwright)을 재서 보인다' })
    await $.command.register({ name: 'mod-maker-init', description: 'mod-maker 처음 설정 — 테마 색 고르기와 Playwright(선택)', argumentHint: '[playwright]' })
    return next(e)
  })

  on('command.run', { command: 'mod-color' }, async ($, e) => {
    const r = await color($, e.args, interactive)
    return r.context === undefined ? { text: r.text, exitCode: r.exitCode } : { text: r.text, context: r.context, exitCode: r.exitCode }
  })

  on('command.run', { command: 'mod-maker-check' }, async $ => {
    const { probe: p, nodeVersion } = await probe($)
    return { text: checkText(p, nodeVersion, decide(p)), exitCode: 0 }
  })

  on('command.run', { command: 'mod-maker-init' }, async ($, e) => {
    const { probe: p, nodeVersion } = await probe($)
    const plan = decide(p)
    const only = e.args.trim() === 'playwright'
    const text = `mod-maker 처음 설정\n\n${checkText(p, nodeVersion, plan)}`
    if (!interactive) return { text: `${text}\n\n처음 설정은 물음에 답해야 해서 Claude Code 안에서 /mod-maker-init 으로 합니다.`, exitCode: NEEDS_CHOICE }
    return {
      text,
      context: [
        `mod-maker: run the initial setup now by following the section 「처음 설정」 of ${$.plugin.root}/SKILL.md step by step${only ? ' — ONLY its Playwright part (step 3); skip the colour steps' : ''}. Every choice goes to the person through the AskUserQuestion tool, in Korean, one question at a time. Measured on this machine just now: playwright=${plan.playwright} (ready = already attached, offer = Node.js present so installation can be offered, needs-node = no Node.js so do not offer, say one line and move on), typeCheck=${plan.typeCheck}, windows=${await isWindows($)}.`,
      ],
    }
  })

  on('tool.call', { tool: 'mcp__mod-maker__theme' }, async ($, e) => {
    const input = e.input as { color?: string; gradient?: string; brightness?: string; apply_to?: string }
    if (typeof input.apply_to === 'string' && input.apply_to !== '') {
      const r = await applyTo($, input.apply_to)
      return { result: { ok: r.exitCode === 0, text: r.text } }
    }
    const colorText = (input.color ?? '').trim()
    const g = (input.gradient ?? '').trim()
    const flags = [g === 'auto' ? '--gradient' : g === 'flat' ? '--flat' : '', input.brightness === 'lift' ? '--lift' : input.brightness === 'keep' ? '--keep' : ''].filter(Boolean)
    const endColor = g !== '' && g !== 'auto' && g !== 'flat' ? g : ''
    const outcome = resolve(readArgs([colorText, endColor, ...flags].filter(Boolean).join(' ')))
    const r = await color($, [colorText, endColor, ...flags].filter(Boolean).join(' '), false)
    const needs = outcome.kind === 'need-gradient' ? 'gradient' : outcome.kind === 'need-brightness' ? 'brightness' : undefined
    return { result: needs === undefined ? { ok: r.exitCode === 0, text: r.text } : { ok: false, text: r.text, needs } }
  })
}
