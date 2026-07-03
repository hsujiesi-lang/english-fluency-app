// 寫作模組 — 三個獨立 section：Paraphrase 改寫 / 冠詞區分 / 詞性使用
// 全部主動產出（打字），沒有選擇題。答錯自動進錯誤庫。

import React, { useMemo, useState } from 'react'
import { Screen, Spinner, pick, onDoubleEnter } from '../lib/ui.jsx'
import { ARTICLE_CLOZE, POS_CLOZE, PARAPHRASE_TASKS } from '../data/writingSeed.js'
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
        pool={ARTICLE_CLOZE} mode="article" />
    )
  }
  if (section === 'pos') {
    return (
      <ClozeSession key="pos" title="詞性使用" onBack={() => setSection(null)}
        intro="把字根改成句子裡該用的正確詞形"
        pool={POS_CLOZE} mode="pos" />
    )
  }
  if (section === 'paraphrase') {
    return <ParaphraseSession onBack={() => setSection(null)} />
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

  const item = items[i]
  const parts = useMemo(() => item.text.split('___'), [item])
  const blanks = mode === 'article' ? item.blanks : [{ answer: item.answer, why: item.why }]

  const norm = (s) => (s || '').trim().toLowerCase().replace(/^x$|^沒有$|^無$|^-$/, '×')

  const check = () => {
    const results = blanks.map((b, k) => b.answer.map((a) => a.toLowerCase()).includes(norm(values[k])))
    setChecked(results)
    const right = results.filter(Boolean).length
    setScore((s) => ({ right: s.right + right, total: s.total + results.length }))
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
        type: mode === 'article' ? 'article' : 'posError',
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
          <p>答錯的空格已進錯誤庫，會回來考妳</p>
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
                    width: mode === 'article' ? 64 : 150,
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

  const item = items[i]

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
