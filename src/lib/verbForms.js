// 產生 phrasal verb 的動詞三態（原形 – 過去式 – 過去分詞）。
// 只變化第一個動詞字，介係詞/受詞部分照抄（sit down → sat down → sat down）。

const IRREGULAR = {
  sit: ['sat', 'sat'], stand: ['stood', 'stood'], wake: ['woke', 'woken'],
  put: ['put', 'put'], take: ['took', 'taken'], break: ['broke', 'broken'],
  throw: ['threw', 'thrown'], get: ['got', 'gotten'], give: ['gave', 'given'],
  run: ['ran', 'run'], deal: ['dealt', 'dealt'], set: ['set', 'set'],
  bring: ['brought', 'brought'], catch: ['caught', 'caught'], fall: ['fell', 'fallen'],
  come: ['came', 'come'], keep: ['kept', 'kept'], show: ['showed', 'shown'],
  spend: ['spent', 'spent'], go: ['went', 'gone'], cut: ['cut', 'cut'],
  hold: ['held', 'held'], wind: ['wound', 'wound'], stick: ['stuck', 'stuck'],
  see: ['saw', 'seen'], pay: ['paid', 'paid'], make: ['made', 'made'],
  be: ['was/were', 'been'], hand: ['handed', 'handed'],
}

// 完整片語優先覆蓋（處理 lie 的兩種變化）
const PHRASE_OVERRIDE = {
  'lie (to sb)': ['lied (to sb)', 'lied (to sb)'],
  'lie down (on)': ['lay down', 'lain down'],
}

// 需要重複字尾子音的規則動詞
const DOUBLE = new Set(['step', 'drop', 'wrap', 'commit', 'stop', 'plan', 'chat'])

function regularPast(v) {
  if (v.endsWith('e')) return v + 'd'
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied'
  if (DOUBLE.has(v)) return v + v.slice(-1) + 'ed'
  return v + 'ed'
}

// 回傳 { base, past, pp }；非動詞開頭（如名詞片語）回傳 null
export function verbForms(phrase) {
  const clean = phrase.trim()
  if (PHRASE_OVERRIDE[clean]) {
    const [past, pp] = PHRASE_OVERRIDE[clean]
    return { base: clean, past, pp }
  }
  // 只取 + 號前的主體，第一個字是動詞
  const main = clean.split('+')[0].trim()
  const words = main.split(/\s+/)
  const first = words[0].toLowerCase().replace(/[^a-z]/g, '')
  if (!first) return null
  const rest = words.slice(1).join(' ')
  const tail = rest ? ' ' + rest : ''
  const irr = IRREGULAR[first]
  const past = irr ? irr[0] : regularPast(first)
  const pp = irr ? irr[1] : regularPast(first)
  return { base: main, past: past + tail, pp: pp + tail }
}
