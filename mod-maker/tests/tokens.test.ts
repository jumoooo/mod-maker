// 설계 토큰(templates/ui/tokens.ts)의 셈 시험 — 폭 재기 · 자르기 · 막대 · 폭 사다리. claude plugin test . 으로 돈다.
import { expect, test } from 'claude-code/testing'

import { bar, cells, columns, elapsed, fit, frameColor, freshness, ladder, pad, percent, spark, stateColumnCells, state, track } from '../templates/ui/tokens'

const assert = {
  equal: (a: unknown, b: unknown, _msg?: string) => expect(a).toBe(b),
  deepEqual: (a: unknown, b: unknown, _msg?: string) => expect(a).toEqual(b),
  ok: (v: unknown, msg?: string) => { if (!v) throw new Error(msg ?? '참이어야 한다') },
}

test('한글은 2칸, 기호는 1칸, 결합 문자는 0칸', async () => {
  assert.equal(cells('당신 차례'), 9)
  assert.equal(cells('Needs you'), 9)
  assert.equal(cells('● ✓ ✗'), 5)
  assert.equal(cells('é'), 1)
})

test('fit 은 칸 기준으로 자르고 …(1칸) 을 붙인다 — 한글이 반 칸 걸치면 덜 넣는다', async () => {
  assert.equal(fit('정확도 실험 4종', 100), '정확도 실험 4종')
  const cut = fit('정확도 실험 4종을 돌려 결과표를 만든다', 10)
  assert.ok(cells(cut) <= 10, `cells=${cells(cut)} '${cut}'`)
  assert.ok(cut.endsWith('…'))
  assert.equal(fit('abcdef', 1), '…')
  assert.equal(fit('', 5), '')
  const mid = fit('abcdefghijklmnop', 9, 'middle')
  assert.equal(cells(mid), 9); assert.ok(mid.includes('…'))
  const start = fit('abcdefghij', 5, 'start')
  assert.equal(start, '…ghij')
})

test('pad 는 칸을 채우고 자르지 않는다', async () => {
  assert.equal(pad('끝남', 6), '끝남  ')
  assert.equal(pad('ok', 4, 'right'), '  ok')
  assert.equal(pad('너무긴라벨', 2), '너무긴라벨')
})

test('bar 는 정확한 폭을 지키고 0·1·범위 밖을 견딘다', async () => {
  for (const f of [0, 0.29, 0.5, 0.999, 1, -1, 2, NaN]) {
    const b = bar(f, 14)
    assert.equal(cells(b), 14, `f=${f} '${b}'`)
  }
  assert.equal(bar(1, 4), '████')
  assert.equal(bar(0, 4), '░░░░')
  assert.equal(bar(0.5, 4, 'thin'), '━━╌╌')
  assert.equal(bar(0.5, 0), '')
})

test('spark 는 최댓값 기준 8단', async () => {
  assert.equal(spark([0, 1, 2, 4]), '▁▃▅█')
  assert.equal(spark([]), '')
  assert.equal(spark([0, 0]), '▁▁')
  assert.equal(spark([1, 2, 3, 4, 5], 2), '▇█')
})

test('percent · elapsed · freshness', async () => {
  assert.equal(percent(0.29), '29%'); assert.equal(percent(2), '100%'); assert.equal(percent(NaN), '0%')
  assert.equal(elapsed(21000), '21초'); assert.equal(elapsed(72000), '1분 12초'); assert.equal(elapsed(3_700_000), '1시간 1분')
  assert.equal(elapsed(72000, 'en'), '1m 12s')
  assert.deepEqual(freshness(3000), { text: '', stale: false })
  assert.deepEqual(freshness(21000), { text: '21초 전', stale: true })
})

test('폭 사다리와 열 폭 — 합이 폭을 넘지 않고, 좁아지면 막대부터 사라진다', async () => {
  assert.equal(ladder(120), 'wide'); assert.equal(ladder(100), 'wide'); assert.equal(ladder(99), 'medium')
  assert.equal(ladder(80), 'medium'); assert.equal(ladder(60), 'narrow'); assert.equal(ladder(59), 'line')
  for (const w of [60, 80, 100, 140]) {
    const c = columns(w, 'ko')
    const gaps = 1 + (c.bar ? 2 : 0) + 2 + (c.meta ? 2 : 0)
    assert.ok(c.glyph + c.label + c.bar + c.status + c.meta + gaps <= w, `w=${w} 합=${JSON.stringify(c)}`)
  }
  assert.equal(columns(100, 'ko').bar, 14)
  assert.equal(columns(80, 'ko').bar, 0)
  assert.equal(columns(100, 'ko').status, stateColumnCells('ko'))
  assert.equal(stateColumnCells('ko'), 9)
})

test('상태 어휘 — 모든 상태가 기호·낱말(ko/en)·색을 다 가진다, 색만 떼어 쓸 길이 없다', async () => {
  for (const [k, s] of Object.entries(state)) {
    assert.ok(s.glyph && s.word.ko && s.word.en && s.color, k)
  }
  assert.equal(state.needsYou.color, 'warning')
  assert.equal(state.blocked.color, 'error')
  assert.equal(state.done.color, 'success')
  assert.equal(frameColor(['done', 'needsYou', 'working']), 'warning')
  assert.equal(frameColor(['done', 'blocked', 'working']), 'error')
  assert.equal(frameColor(['done', 'working']), 'claude')
  assert.equal(frameColor(['done', 'done']), 'success')
  assert.equal(frameColor([]), 'promptBorder')
})


test('track 은 항목마다 블록 하나, 폭을 넘으면 나눠 쓰되 블록 수 ≤ 폭', async () => {
  const t = track(['done', 'done', 'working', 'next', 'upNext'], 30)
  assert.equal(t.length, 5)
  assert.deepEqual(t.map(c => c.glyph), ['✓', '✓', '▶', '░', '░'])
  assert.equal(t[2]!.color, 'claude'); assert.equal(t[0]!.color, 'success'); assert.equal(t[4]!.dim, true)
  const many = track(Array.from({ length: 70 }, (_, i) => (i === 40 ? 'working' : i < 40 ? 'done' : 'upNext')), 30)
  assert.ok(many.length <= 30, `blocks=${many.length}`)
  assert.ok(many.some(c => c.glyph === '▶'), '진행 중이 든 구간은 ▶ 로 남는다')
  assert.deepEqual(track([], 30), [])
  assert.deepEqual(track(['done'], 0), [])
})
