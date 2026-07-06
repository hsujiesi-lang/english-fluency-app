// 寫作模組 — 三個獨立 section：Paraphrase 改寫 / 冠詞區分 / 詞性使用
// 全部主動產出（打字），沒有選擇題。答錯自動進錯誤庫。

import React, { useEffect, useMemo, useState } from 'react'
import { Screen, Spinner, pick, shuffle, onDoubleEnter, useDoubleEnterNext, WrongList } from '../lib/ui.jsx'
import { ARTICLE_CLOZE, POS_CLOZE, PARAPHRASE_TASKS } from '../data/writingSeed.js'
import { ARTICLE_EXTRA, USAGE_CLOZE, PREP_CLOZE, PV_NOTES } from '../data/notionSeed.js'
import GrammarNotes from './GrammarNotes.jsx'
import * as banks from '../lib/banks.js'
import * as claude from '../lib/claude.js'
import * as store from '../lib/storage.js'

const ROUND = 5

export default function Writing({ nav }) {
  const [section, setSection] = useState(null)

  if (section === 'articles') {
    return (
      <ClozeSession key="articles" title="冠詞區分" onBack={() => setSection(null)}
        intro="把 a / an / the 填進空格；不需要冠詞就填 ×"
        pool={[...ARTICLE_CLOZE, ...ARTICLE_EXTRA]} mode="article" />
    )
  }
  if (section === 'pos') {
    return (
      <ClozeSession key="pos" title="詞性使用" onBack={() => setSection(null)}
        intro="把字根改成句子裡該用的正確詞形"
        pool={POS_CLOZE} mode="pos" />
    )
  }
  if (section === 'prep') {
    return (
      <ClozeSession key="prep" title="介係詞 IN / ON / AT" onBack={() => setSection(null)}
        intro="自己打 in / on / at，不給選項"
        pool={PREP_CLOZE} mode="prep" />
    )
  }
  if (section === 'usage') {
    return (
      <ClozeSession key="usage" title="用法辨析" onBack={() => setSection(null)}
        intro="妳 Notion 筆記裡的易錯用法 — 打出正確的字"
        pool={USAGE_CLOZE} mode="usage" />
    )
  }
  if (section === 'phrasal') {
    return <PhrasalSession onBack={() => setSection(null)} />
  }
  if (section === 'paraphrase') {
    return <ParaphraseSession onBack={() => setSection(null)} />
  }
  if (section === 'notes') {
    return <GrammarNotes onBack={() => setSection(null)} />
  }

  return (
    <Screen title="寫作練習" sub="動手寫，不是用看的 — 每個 section 各練一種弱點">
      <div className="card" onClick={() => setSection('paraphrase')} style={{ cursor: 'pointer' }}>
        <h3>🔄 Paraphrase 改寫</h3>
        <p>主動↔被動、名詞化、學術語氣改寫 — 整句打出來</p>
      </div>
      <div className="card" onClick={() => setSection('articles')} style={{ cursor: 'pointer' }}>
        <h3>📰 冠詞區分</h3>
        <p>a / an / the / 不加 — 自己填，不給選項</p>
      </div>
      <div className="card" onClick={() => setSection('pos')} style={{ cursor: 'pointer' }}>
        <h3>🔤 詞性使用</h3>
        <p>給字根，寫出句子裡該用的正確詞形</p>
      </div>
      <div className="card" onClick={() => setSection('prep')} style={{ cursor: 'pointer' }}>
        <h3>📍 介係詞 IN / ON / AT</h3>
        <p>時間與地點的三大介係詞 — 25 題情境挖空</p>
      </div>
      <div className="card" onClick={() => setSection('usage')} style={{ cursor: 'pointer' }}>
        <h3>⚖️ 用法辨析</h3>
        <p>near/nearby、for vs to have、six hundred… — 妳 Notion 的易錯用法</p>
      </div>
      <div className="card" onClick={() => setSection('phrasal')} style={{ cursor: 'pointer' }}>
        <h3>🧩 Phrasal Verbs</h3>
        <p>妳 Notion 整理的 118 個 — 看中文回想、打出來</p>
      </div>
      <div className="card" onClick={() => setSection('notes')} style={{ cursor: 'pointer', border: '1.5px dashed var(--brand)' }}>
        <h3>📚 文法筆記（查閱）</h3>
        <p>冠詞規則表、量詞、用法、phrasal verb 全表 — 妳的 Notion 原始整理</p>
      </div>
      {!claude.hasApiKey() && (
        <div className="notice">未設定 API 金鑰：冠詞與詞性照常全功能；Paraphrase 會用參考答案比對＋自我核對（設定金鑰後有 AI 逐句回饋）。</div>
      )}
    </Screen>
  )
}

// ---- 克漏字打字 session（冠詞 & 詞性共用）----

function ClozeSession({ title, intro, pool, mode, onBack }) {
  const [items] = useState(() => pick(pool, ROUND))
  const [i, setI] = useState(0)
  const [values, setValues] = useState([])
  const [checked, setChecked] = useState(null) // per-blank boolean[]
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [done, setDone] = useState(false)
  const [wrongs, setWrongs] = useState([])

  const item = items[i]
  const parts = useMemo(() => item.text.split('___'), [item])
  const blanks = mode === 'pos' ? [{ answer: item.answer, why: item.why }] : item.blanks

  const norm = (s) => (s || '').trim().toLowerCase().replace(/^x$|^沒有$|^無$|^-$/, '×')

  useDoubleEnterNext(!!checked && !done, () => next())

  const check = () => {
    const results = blanks.map((b, k) => b.answer.map((a) => a.toLowerCase()).includes(norm(values[k])))
    setChecked(results)
    const right = results.filter(Boolean).length
    setScore((s) => ({ right: s.right + right, total: s.total + results.length }))
    setWrongs((w) => [
      ...w,
      ...results.map((ok, k) => ok ? null : {
        q: item.text.replace(/___/g, '＿＿'),
        your: values[k],
        right: blanks[k].answer.join(' / '),
        why: blanks[k].why,
      }).filter(Boolean),
    ])
    store.logActivity('writing')
    // 答錯 → 錯誤庫
    results.forEach((ok, k) => {
      if (ok) return
      const b = blanks[k]
      const fillSentence = (vals) => {
        let out = ''
        parts.forEach((p, idx) => {
          out += p
          if (idx < blanks.length) out += vals[idx] === '×' ? '(×)' : (vals[idx] || '___')
        })
        return out
      }
      banks.addError({
        type: mode === 'article' ? 'article' : mode === 'prep' ? 'prep' : 'posError',
        originalText: fillSentence(blanks.map((bb, idx) => (idx === k ? (norm(values[k]) || '？') : bb.answer[0]))),
        correction: fillSentence(blanks.map((bb) => bb.answer[0])),
        sourceModule: 'writing',
        note: b.why,
      })
    })
  }

  const next = () => {
    setValues([])
    setChecked(null)
    if (i + 1 >= items.length) setDone(true)
    else setI(i + 1)
  }

  if (done) {
    return (
      <Screen title={title} onBack={onBack}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>本回合完成 🎉</h3>
          <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand)', margin: 8 }}>{score.right} / {score.total}</p>
          <WrongList items={wrongs} />
        </div>
        <button className="btn big" onClick={onBack}>返回寫作選單</button>
      </Screen>
    )
  }

  return (
    <Screen title={title} sub={`${i + 1} / ${items.length} 題　·　${intro}`} onBack={onBack}>
      <div className="card">
        {mode === 'pos' && <p style={{ color: 'var(--muted)' }}>字根：<b style={{ color: 'var(--brand)', fontSize: 18 }}>{item.root}</b></p>}
        <p className="passage" style={{ fontSize: 18 }}>
          {parts.map((p, k) => (
            <React.Fragment key={k}>
              {p}
              {k < blanks.length && (
                <input
                  value={values[k] || ''}
                  disabled={!!checked}
                  onChange={(e) => setValues((v) => { const nv = [...v]; nv[k] = e.target.value; return nv })}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !blanks.some((_, j) => !(values[j] || '').trim())) check() }}
                  autoCapitalize="off" autoCorrect="off"
                  style={{
                    width: mode === 'article' || mode === 'prep' ? 64 : 150,
                    margin: '0 4px', padding: '6px 8px', fontSize: 17, fontFamily: 'inherit',
                    border: '2px solid ' + (checked ? (checked[k] ? 'var(--good)' : 'var(--bad)') : 'var(--brand)'),
                    borderRadius: 8, textAlign: 'center',
                    background: checked ? (checked[k] ? 'var(--good-soft)' : 'var(--bad-soft)') : 'white',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </p>
        {!checked ? (
          <button className="btn big" onClick={check} disabled={blanks.some((_, k) => !(values[k] || '').trim())}>
            檢查
          </button>
        ) : (
          <>
            {blanks.map((b, k) => (
              <div key={k} className={'feedback-block ' + (checked[k] ? 'good' : 'bad')}>
                <b>空格 {k + 1}：</b>{checked[k] ? '✅' : <>❌ 正解 <b>{b.answer.join(' / ')}</b></>}
                <span style={{ display: 'block', fontSize: 14 }}>{b.why}</span>
              </div>
            ))}
            <button className="btn big" onClick={next}>下一題 →</button>
          </>
        )}
      </div>
    </Screen>
  )
}

// ---- Phrasal Verbs（Notion 匯入的 118 個，主動回想打字）----

const PV_ROUND = 8

function PhrasalSession({ onBack }) {
  const [all, setAll] = useState(null)
  const [items, setItems] = useState(null)
  const [i, setI] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [browse, setBrowse] = useState(false)
  const [q, setQ] = useState('')
  const [wrongs, setWrongs] = useState([])

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/phrasal-verbs.json')
      .then((r) => r.json())
      .then((data) => {
        setAll(data)
        // 每回合：優先放「一直忘」的（最多 3 個），其餘隨機
        const prio = pick(data.filter((d) => d.priority), 3)
        const rest = pick(data.filter((d) => !prio.includes(d)), PV_ROUND - prio.length)
        setItems(shuffle([...prio, ...rest]))
      })
      .catch(() => setAll([]))
  }, [])

  useDoubleEnterNext(!!result && !done && !browse, () => next())

  if (!items) return <Screen title="Phrasal Verbs" onBack={onBack}><Spinner label="載入題庫…" /></Screen>

  // 正規化：去括號內容、小寫、只留 + 之前的主體
  const normVerb = (s) => s.toLowerCase().split('+')[0].replace(/\(.*?\)/g, '').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const acceptable = (item) => {
    const base = normVerb(item.verb)
    const withParen = item.verb.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, ' ').trim().split('+')[0].trim()
    return [base, withParen]
  }

  const item = items[i]
  // 找一個包含原形的例句來挖空；找不到就用純回想模式
  const maskInfo = (() => {
    const base = normVerb(item.verb)
    for (const ex of item.examples || []) {
      const idx = ex.toLowerCase().indexOf(base)
      if (idx >= 0) return { masked: ex.slice(0, idx) + '＿'.repeat(4) + ex.slice(idx + base.length), found: true }
    }
    return { masked: null, found: false }
  })()

  const submit = () => {
    if (result) return
    const ans = normVerb(input)
    const ok = acceptable(item).some((a) => a === ans || normVerb(a) === ans)
    setResult({ ok })
    if (ok) setScore((s) => s + 1)
    else {
      banks.addError({
        type: 'posError',
        originalText: `${item.zhMeaning} → ${input || '（沒作答）'}`,
        correction: item.verb,
        sourceModule: 'writing',
        note: PV_NOTES[item.verb] || `${item.verb}＝${item.zhMeaning}`,
      })
      setWrongs((w) => [...w, {
        q: item.zhMeaning,
        your: input,
        right: item.verb,
        why: PV_NOTES[item.verb] || (item.examples || [])[0],
      }])
    }
    store.logActivity('writing')
  }

  const next = () => {
    setInput('')
    setResult(null)
    if (i + 1 >= items.length) setDone(true)
    else setI(i + 1)
  }

  if (browse) {
    const query = q.trim().toLowerCase()
    const list = (all || []).filter((d) => !query || d.verb.toLowerCase().includes(query) || d.zhMeaning.toLowerCase().includes(query))
    return (
      <Screen title="Phrasal Verbs 清單" onBack={() => setBrowse(false)}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 搜尋…" style={{ marginBottom: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {list.map((d) => (
            <div className="list-item" key={d.verb} style={{ padding: '8px 10px', marginBottom: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ color: 'var(--brand)', fontSize: 14 }}>{d.verb}</b>{d.priority && <span className="tag warn" style={{ marginLeft: 4 }}>一直忘</span>}
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{d.zhMeaning}</div>
                {d.examples?.[0] && <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--muted)' }}>{d.examples[0]}</div>}
              </div>
            </div>
          ))}
        </div>
      </Screen>
    )
  }

  if (done) {
    return (
      <Screen title="Phrasal Verbs" onBack={onBack}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>本回合完成 🎉</h3>
          <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand)', margin: 8 }}>{score} / {items.length}</p>
          <WrongList items={wrongs} />
        </div>
        <button className="btn big" onClick={onBack}>返回寫作選單</button>
      </Screen>
    )
  }

  return (
    <Screen title="Phrasal Verbs" sub={`${i + 1} / ${items.length} 題`} onBack={onBack}>
      <div className="card">
        {item.priority && <span className="tag warn">一直忘 ⚠️</span>}
        <p className="big-question">{item.zhMeaning}</p>
        {maskInfo.found && <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{maskInfo.masked}</p>}
        {!result ? (
          <>
            <input className="input" autoFocus autoCapitalize="off" autoCorrect="off" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && input.trim() && submit()}
              placeholder="打出對應的 phrasal verb…" />
            <div className="btn-row">
              <button className="btn" onClick={submit} disabled={!input.trim()}>提交</button>
            </div>
          </>
        ) : (
          <>
            <div className={'feedback-block ' + (result.ok ? 'good' : 'bad')}>
              <b>{result.ok ? '✅ 正確！' : '❌ 答案：'}</b> <b>{item.verb}</b>
              {PV_NOTES[item.verb] && <p style={{ margin: '6px 0 0' }}>💡 {PV_NOTES[item.verb]}</p>}
              {(item.examples || []).slice(0, 2).map((ex, k) => (
                <p key={k} style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: 14 }}>{ex}</p>
              ))}
            </div>
            <button className="btn big" onClick={next}>下一題 →</button>
          </>
        )}
        <button className="btn ghost small" style={{ marginTop: 8 }} onClick={() => setBrowse(true)}>📖 看全部清單</button>
      </div>
    </Screen>
  )
}

// ---- Paraphrase session ----

const KIND_LABEL = { passive: '主動→被動', active: '被動→主動', nominal: '名詞化', academic: '學術改寫' }

function ParaphraseSession({ onBack }) {
  const [items] = useState(() => pick(PARAPHRASE_TASKS, ROUND))
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [verdict, setVerdict] = useState(null) // {ok, feedback, betterVersion, refs?, selfGrade?}
  const [judging, setJudging] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [wrongs, setWrongs] = useState([])

  const item = items[i]
  const recordWrong = (attempt, why) =>
    setWrongs((w) => [...w, { q: item.source, your: attempt, right: item.refs[0], why }])

  useDoubleEnterNext(!!verdict && !verdict.selfGrade && !done, () => next())

  const localMatch = (attempt) => {
    const n = (s) => s.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim()
    const a = n(attempt)
    if (item.refs.some((r) => n(r) === a)) return true
    // key structural words present + high overlap with any ref
    const hasKeys = item.keyWords.every((k) => a.includes(n(k)))
    if (!hasKeys) return false
    return item.refs.some((r) => {
      const rt = n(r).split(' ')
      const at = new Set(a.split(' '))
      return rt.filter((w) => at.has(w)).length / rt.length >= 0.75
    })
  }

  async function submit() {
    const attempt = text.trim()
    if (!attempt) return
    store.logActivity('writing')

    if (localMatch(attempt)) {
      setVerdict({ ok: true, feedback: '結構與語意都符合，漂亮！', refs: item.refs })
      setScore((s) => s + 1)
      return
    }
    if (claude.hasApiKey()) {
      setJudging(true)
      try {
        const v = await claude.judgeParaphrase(item.instruction, item.source, attempt)
        setVerdict({ ...v, refs: item.refs })
        if (v.ok) setScore((s) => s + 1)
        else recordWrong(attempt, v.feedback)
        // 文法錯誤寫入錯誤庫
        for (const g of v.grammarErrors || []) {
          banks.addError({
            type: g.category,
            originalText: g.span,
            correction: g.correction,
            sourceModule: 'writing',
            note: `Paraphrase 練習（${KIND_LABEL[item.kind]}）中出現`,
          })
        }
      } catch (e) {
        setVerdict({ selfGrade: true, refs: item.refs, feedback: 'AI 評分失敗（' + e.message.slice(0, 60) + '），自己對照參考答案：' })
      }
      setJudging(false)
    } else {
      setVerdict({ selfGrade: true, refs: item.refs, feedback: '對照參考答案，自己核對：語意一樣嗎？要求的結構做到了嗎？' })
    }
  }

  const selfMark = (ok) => {
    setVerdict((v) => ({ ...v, selfGrade: false, ok, feedback: ok ? '很好，繼續！' : '把參考答案唸一次再往下' }))
    if (ok) setScore((s) => s + 1)
    else recordWrong(text.trim(), `${KIND_LABEL[item.kind]}練習`)
  }

  const next = () => {
    setText('')
    setVerdict(null)
    setShowHint(false)
    if (i + 1 >= items.length) setDone(true)
    else setI(i + 1)
  }

  if (done) {
    return (
      <Screen title="Paraphrase 改寫" onBack={onBack}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>本回合完成 🎉</h3>
          <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand)', margin: 8 }}>{score} / {items.length}</p>
          <WrongList items={wrongs} />
        </div>
        <button className="btn big" onClick={onBack}>返回寫作選單</button>
      </Screen>
    )
  }

  return (
    <Screen title="Paraphrase 改寫" sub={`${i + 1} / ${items.length} 題`} onBack={onBack}>
      <div className="card">
        <span className="tag">{KIND_LABEL[item.kind]}</span>
        <p style={{ color: 'var(--muted)', margin: '10px 0 4px' }}>{item.instruction}</p>
        <p className="big-question" style={{ fontSize: 18 }}>{item.source}</p>

        {!verdict && (
          <>
            <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={onDoubleEnter(submit)}
              placeholder="把改寫後的句子完整打出來…（連按兩次 Enter 提交）" autoCapitalize="sentences" />
            <div className="btn-row">
              <button className="btn secondary" onClick={() => setShowHint(true)} disabled={showHint}>💡 提示</button>
              <button className="btn" onClick={submit} disabled={!text.trim() || judging}>
                {judging ? '評分中…' : '提交'}
              </button>
            </div>
            {showHint && <div className="feedback-block">{item.hint}</div>}
            {judging && <Spinner label="AI 檢查語意與結構…" />}
          </>
        )}

        {verdict && (
          <>
            <div className="transcript">{text}</div>
            {verdict.selfGrade ? (
              <>
                <div className="feedback-block">{verdict.feedback}</div>
                <RefList refs={verdict.refs} />
                <div className="btn-row">
                  <button className="btn good" onClick={() => selfMark(true)}>意思和結構都對 ✅</button>
                  <button className="btn bad" onClick={() => selfMark(false)}>還差一點 ❌</button>
                </div>
              </>
            ) : (
              <>
                <div className={'feedback-block ' + (verdict.ok ? 'good' : 'bad')}>
                  <b>{verdict.ok ? '✅ 通過！' : '❌ 再修一下'}</b> {verdict.feedback}
                  {verdict.betterVersion && <p style={{ margin: '6px 0 0' }}>✔ {verdict.betterVersion}</p>}
                </div>
                {!verdict.ok && <RefList refs={verdict.refs} />}
                <button className="btn big" onClick={next}>下一題 →</button>
              </>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}

function RefList({ refs }) {
  return (
    <div className="feedback-block good">
      <b>參考答案：</b>
      {refs.map((r, k) => <p key={k} style={{ margin: '4px 0 0' }}>• {r}</p>)}
    </div>
  )
}
