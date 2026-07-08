// 模組 4：單字庫 — 按詞性分類；spelling / meaning / usage 三種練法

import React, { useState } from 'react'
import { Screen, Spinner, shuffle, onDoubleEnter, useDoubleEnterNext, WrongList } from '../lib/ui.jsx'
import * as banks from '../lib/banks.js'
import * as speech from '../lib/speech.js'
import * as claude from '../lib/claude.js'
import * as store from '../lib/storage.js'
import { SPELLING_IMPORT } from '../data/notionSeed.js'

const POS_LABEL = {
  noun: '名詞', verb: '動詞', adj: '形容詞', adv: '副詞', phrasalVerb: 'Phrasal V.',
}
const ERR_LABEL = { spelling: '拼寫', meaning: '語意', usage: '用法' }

// 使用者指定加入的預載單字（自動匯入一次，靠 addVocab 防重複）
const PRESET_V1 = [
  { word: 'accomplishment', partOfSpeech: 'noun', zhMeaning: '成就、成績', example: 'Finishing the essay two days early felt like a real accomplishment.', errorType: 'spelling' },
  { word: 'complement', partOfSpeech: 'verb', zhMeaning: '補足、與…相配（小心 ≠ compliment 讚美）', example: 'The scarf complements her outfit perfectly.', errorType: 'usage' },
]

export default function Vocab({ nav, embedded }) {
  const [view, setView] = useState('browse') // browse | add | practice | free
  const [posTab, setPosTab] = useState('all')
  const [, force] = useState(0)
  const refresh = () => force((n) => n + 1)

  React.useEffect(() => {
    if (!store.get('vocabPresetV1', false)) {
      PRESET_V1.forEach((w) => banks.addVocab(w))
      store.set('vocabPresetV1', true)
      refresh()
    }
  }, [])

  const all = banks.getVocab()
  const due = banks.dueVocab()
  const list = posTab === 'all' ? all : all.filter((v) => v.partOfSpeech === posTab)

  if (view === 'add') return <AddForm onDone={() => { setView('browse'); refresh() }} embedded={embedded} />
  if (view === 'practice') return <Practice due={due} onDone={() => { setView('browse'); refresh() }} embedded={embedded} />
  if (view === 'free') return <FreeSpelling all={all} onDone={() => { setView('browse'); refresh() }} />

  const body = (
    <>
      <div className="stat-grid">
        <div className="stat"><div className="num">{all.length}</div><div className="lbl">單字總數</div></div>
        <div className="stat"><div className="num">{due.length}</div><div className="lbl">今日到期</div></div>
        <div className="stat"><div className="num">{all.filter((v) => (v.srs?.streak || 0) >= 3).length}</div><div className="lbl">已熟練</div></div>
      </div>
      <div className="btn-row">
        <button className="btn secondary" onClick={() => setView('add')}>＋ 新增單字</button>
        <button className="btn" disabled={due.length === 0} onClick={() => setView('practice')}>
          練習到期單字（{due.length}）
        </button>
      </div>
      <button className="btn secondary big" style={{ marginBottom: 12 }} disabled={all.length === 0}
        onClick={() => setView('free')}>
        ⌨️ 中→英拼寫練習（全部 {all.length} 字隨機抽）
      </button>
      {!store.get('notionSpellingImported', false) && (
        <button className="btn secondary big" style={{ marginBottom: 12 }} onClick={() => {
          SPELLING_IMPORT.forEach((w) => banks.addVocab({ ...w, errorType: 'spelling' }))
          store.set('notionSpellingImported', true)
          refresh()
        }}>
          📥 匯入 Notion 拼字清單（{SPELLING_IMPORT.length} 字 → 聽音拼寫練習）
        </button>
      )}
      <div className="tabs">
        <button className={posTab === 'all' ? 'active' : ''} onClick={() => setPosTab('all')}>全部</button>
        {Object.entries(POS_LABEL).map(([k, v]) => (
          <button key={k} className={posTab === k ? 'active' : ''} onClick={() => setPosTab(k)}>{v}</button>
        ))}
      </div>
      {list.length === 0 && <div className="card"><p>這個分類還沒有單字。</p></div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {list.map((v) => (
          <div className="list-item" key={v.id} style={{ marginBottom: 0, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 16 }}>{v.word}</b>
              <div style={{ margin: '2px 0' }}>
                <span className="tag">{POS_LABEL[v.partOfSpeech]}</span>
                <span className="tag warn">{ERR_LABEL[v.errorType]}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{v.zhMeaning}</div>
              {v.example && <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>{v.example}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button className="btn ghost small" style={{ padding: '4px 6px' }} onClick={() => speech.speak(v.word)}>🔊</button>
              <button className="btn ghost small" style={{ padding: '4px 6px' }} onClick={() => { banks.deleteVocab(v.id); refresh() }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  if (embedded) return body
  return <Screen title="單字庫" sub="拼錯、誤用過的字都收在這裡">{body}</Screen>
}

// ---- 新增 ----

function AddForm({ onDone, embedded }) {
  const canAI = claude.hasApiKey()
  const [f, setF] = useState({ word: '', partOfSpeech: 'noun', zhMeaning: '', example: '', errorType: 'meaning' })
  const [manual, setManual] = useState(!canAI) // 有金鑰預設極簡模式：只填單字
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.word.trim() || !f.zhMeaning.trim()) return
    banks.addVocab({ ...f, word: f.word.trim() })
    onDone()
  }

  // 一鍵：生成意思/詞性/例句 → 直接存檔返回
  const generateAndSave = async () => {
    const w = f.word.trim()
    if (!w || generating) return
    setGenerating(true)
    setGenMsg('')
    try {
      const r = await claude.enrichVocab(w)
      banks.addVocab({
        word: r.word || w,
        partOfSpeech: POS_LABEL[r.partOfSpeech] ? r.partOfSpeech : 'noun',
        zhMeaning: r.zhMeaning || '（生成失敗，請編輯）',
        example: r.example || '',
        errorType: f.errorType,
      })
      onDone()
      return
    } catch (e) {
      setGenMsg('自動生成失敗（' + e.message.slice(0, 50) + '），請改用手動填寫')
      setManual(true)
    }
    setGenerating(false)
  }

  // 極簡模式：單字 + 練法，其他全自動
  if (!manual) {
    const body = (
      <div className="card">
        <h3>新增單字</h3>
        <label className="field">單字 / 片語（其餘欄位自動生成）</label>
        <input className="input" value={f.word} onChange={set('word')} placeholder="e.g. accomplishment"
          autoFocus autoCapitalize="off" autoCorrect="off"
          onKeyDown={(e) => { if (e.key === 'Enter') generateAndSave() }} />
        <label className="field">你常錯在哪？（決定練法）</label>
        <select className="input" value={f.errorType} onChange={set('errorType')}>
          <option value="spelling">拼寫（→ 聽音拼寫）</option>
          <option value="meaning">語意（→ 中文提示造句）</option>
          <option value="usage">用法（→ 詞性辨析）</option>
        </select>
        {genMsg && <div className="feedback-block bad">{genMsg}</div>}
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button className="btn secondary" onClick={onDone}>取消</button>
          <button className="btn" onClick={generateAndSave} disabled={!f.word.trim() || generating}>
            {generating ? '✨ 生成中…' : '✨ 生成並儲存'}
          </button>
        </div>
        <button className="btn ghost small" onClick={() => setManual(true)}>改用手動填寫</button>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>拼錯也沒關係，會自動修正拼字。按 Enter 直接送出。</p>
      </div>
    )
    if (embedded) return body
    return <Screen title="新增單字" onBack={onDone}>{body}</Screen>
  }

  const body = (
    <div className="card">
      <h3>新增單字（手動）</h3>
      <label className="field">單字 / 片語</label>
      <input className="input" value={f.word} onChange={set('word')} placeholder="e.g. implement"
        autoCapitalize="off" autoCorrect="off" />
      {canAI
        ? <button className="btn ghost small" onClick={() => setManual(false)}>↩︎ 回到自動生成模式</button>
        : <div className="notice">到「設定」貼上 API 金鑰後，就能只打單字、其餘欄位自動生成。</div>}
      {genMsg && <div className="feedback-block bad">{genMsg}</div>}
      <label className="field">詞性</label>
      <select className="input" value={f.partOfSpeech} onChange={set('partOfSpeech')}>
        {Object.entries(POS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <label className="field">中文意思</label>
      <input className="input" value={f.zhMeaning} onChange={set('zhMeaning')} placeholder="e.g. 實施、執行" />
      <label className="field">例句（可留白）</label>
      <input className="input" value={f.example} onChange={set('example')} placeholder="We implemented the new policy." />
      <label className="field">你常錯在哪？（決定練法）</label>
      <select className="input" value={f.errorType} onChange={set('errorType')}>
        <option value="spelling">拼寫（→ 聽音拼寫）</option>
        <option value="meaning">語意（→ 中文提示造句）</option>
        <option value="usage">用法（→ 詞性辨析）</option>
      </select>
      <div className="btn-row" style={{ marginTop: 14 }}>
        <button className="btn secondary" onClick={onDone}>取消</button>
        <button className="btn" onClick={save} disabled={!f.word.trim() || !f.zhMeaning.trim()}>儲存</button>
      </div>
    </div>
  )

  if (embedded) return body
  return <Screen title="新增單字" onBack={onDone}>{body}</Screen>
}

// ---- 自由練習：中文意思 → 拼寫英文（全部單字隨機抽，不限到期）----

function FreeSpelling({ all, onDone }) {
  const ROUND = Math.min(8, all.length)
  const [items, setItems] = useState(() => shuffle(all).slice(0, ROUND))
  const [i, setI] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [wrongs, setWrongs] = useState([])
  const [done, setDone] = useState(false)

  const w = items[i]
  useDoubleEnterNext(!!result && !done, () => next())

  const norm = (s) => s.toLowerCase().replace(/[^a-z\s-]/g, '').replace(/\s+/g, ' ').trim()

  const submit = () => {
    if (result || !input.trim()) return
    const ok = norm(input) === norm(w.word)
    setResult({ ok })
    store.logActivity('vocab')
    if (ok) {
      speech.speak(w.word)
    } else {
      setWrongs((ws) => [...ws, { q: w.zhMeaning, your: input, right: w.word, why: w.example }])
      banks.reviewVocab(w.id, false) // 拼錯 → 重設 SRS，明天回來考
    }
  }

  const next = () => {
    setInput('')
    setResult(null)
    if (i + 1 >= items.length) setDone(true)
    else setI(i + 1)
  }

  const restart = () => {
    setItems(shuffle(all).slice(0, ROUND))
    setI(0); setInput(''); setResult(null); setWrongs([]); setDone(false)
  }

  if (done) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>拼寫練習完成 🎉</h3>
        <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand)', margin: 8 }}>
          {items.length - wrongs.length} / {items.length}
        </p>
        <WrongList items={wrongs} />
        {wrongs.length > 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>拼錯的字已重設複習排程，明天會再考妳</p>}
        <div className="btn-row">
          <button className="btn secondary" onClick={onDone}>返回單字庫</button>
          <button className="btn" onClick={restart}>再來一回合</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <p className="screen-sub" style={{ margin: '0 0 8px' }}>{i + 1} / {items.length}　⌨️ 中→英拼寫</p>
      <p className="big-question">{w.zhMeaning}</p>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>{POS_LABEL[w.partOfSpeech]}</p>
      {!result ? (
        <>
          <input className="input" autoFocus autoCapitalize="off" autoCorrect="off" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="拼出對應的英文…" />
          <div className="btn-row">
            <button className="btn" onClick={submit} disabled={!input.trim()}>提交</button>
          </div>
        </>
      ) : (
        <>
          <div className={'feedback-block ' + (result.ok ? 'good' : 'bad')}>
            <b>{result.ok ? '✅ 正確！' : '❌ 答案：'}</b> <b>{w.word}</b>
            {w.example && <p style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: 14 }}>{w.example}</p>}
          </div>
          <div className="btn-row">
            <button className="btn secondary" onClick={() => speech.speak(w.word, { rate: 0.85 })}>🔊 聽發音</button>
            <button className="btn" onClick={next}>下一題 →</button>
          </div>
        </>
      )}
    </div>
  )
}

// ---- 練習（依 errorType 決定題型） ----

function Practice({ due, onDone, embedded }) {
  const [i, setI] = useState(0)
  const [result, setResult] = useState(null) // {correct, detail?}
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [wrongs, setWrongs] = useState([])
  const [done, setDone] = useState(false)
  const item = due[i]
  const posOptions = React.useMemo(() => shuffle(Object.keys(POS_LABEL)), [item?.id])
  useDoubleEnterNext(!!result, () => next())

  if (!item) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>沒有到期的單字 🎉</h3>
        <button className="btn" onClick={onDone}>返回</button>
      </div>
    )
  }

  const grade = (correct, detail = '') => {
    setResult({ correct, detail })
    banks.reviewVocab(item.id, correct)
    if (!correct) {
      setWrongs((w) => [...w, {
        q: `${ERR_LABEL[item.errorType]}：${item.zhMeaning}`,
        your: input,
        right: item.word,
        why: detail || item.example,
      }])
    }
    store.logActivity('vocab')
  }

  const next = () => {
    setResult(null)
    setInput('')
    if (i + 1 >= due.length) setDone(true)
    else setI(i + 1)
  }

  if (done) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>單字練習完成 🎉</h3>
        <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand)', margin: 8 }}>
          {due.length - wrongs.length} / {due.length}
        </p>
        <WrongList items={wrongs} />
        <button className="btn big" onClick={onDone}>返回單字庫</button>
      </div>
    )
  }

  const submitSpelling = () => {
    const ok = input.trim().toLowerCase() === item.word.toLowerCase()
    grade(ok, ok ? '' : `正確拼法：${item.word}`)
  }

  const submitMeaning = async () => {
    const usedWord = input.toLowerCase().includes(item.word.toLowerCase())
    if (!usedWord) {
      grade(false, `句子裡要用到「${item.word}」`)
      return
    }
    if (claude.hasApiKey()) {
      setChecking(true)
      try {
        const res = await claude.checkSentence(item.word, item.partOfSpeech, input)
        grade(res.ok, res.feedback + (res.betterVersion ? `\n✔ ${res.betterVersion}` : ''))
      } catch {
        grade(true, '（AI 檢查失敗，以有用到單字判定通過）')
      }
      setChecking(false)
    } else {
      grade(true, '有用到目標字！（設定 API 金鑰可獲得句子品質回饋）')
    }
  }

  return (
    <>
      <p className="screen-sub">練習 {i + 1} / {due.length}</p>
      <div className="card">
        <span className="tag warn">{ERR_LABEL[item.errorType]}練習</span>

        {item.errorType === 'spelling' && (
          <>
            <p style={{ color: 'var(--muted)' }}>聽發音，拼出這個字（{item.zhMeaning}）</p>
            <div className="btn-row">
              <button className="btn secondary" onClick={() => speech.speak(item.word, { rate: 0.85 })}>🔊 播放</button>
            </div>
            {!result && (
              <>
                <input className="input" autoFocus autoCapitalize="off" autoCorrect="off" value={input}
                  onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitSpelling()}
                  placeholder="輸入拼法…" />
                <div className="btn-row"><button className="btn" onClick={submitSpelling} disabled={!input.trim()}>提交</button></div>
              </>
            )}
          </>
        )}

        {item.errorType === 'meaning' && (
          <>
            <p style={{ color: 'var(--muted)' }}>用「<b>{item.zhMeaning}</b>」對應的英文字造一個句子</p>
            {!result && (
              <>
                <textarea className="input" rows={2} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onDoubleEnter(submitMeaning)} placeholder="Write a sentence…（連按兩次 Enter 提交）" />
                <div className="btn-row">
                  <button className="btn" onClick={submitMeaning} disabled={!input.trim() || checking}>
                    {checking ? '檢查中…' : '提交'}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {item.errorType === 'usage' && (
          <>
            <p style={{ color: 'var(--muted)' }}>「<b>{item.word}</b>」（{item.zhMeaning}）的詞性是？</p>
            {!result && posOptions.map((k) => (
              <button key={k} className="opt" onClick={() => grade(k === item.partOfSpeech, k === item.partOfSpeech ? '' : `正確：${POS_LABEL[item.partOfSpeech]}`)}>
                {POS_LABEL[k]}
              </button>
            ))}
          </>
        )}

        {result && (
          <>
            <div className={'feedback-block ' + (result.correct ? 'good' : 'bad')} style={{ whiteSpace: 'pre-line' }}>
              <b>{result.correct ? '✅ 正確！' : '❌ 再加油'}</b> {result.detail}
              {item.example && <p style={{ margin: '6px 0 0', fontStyle: 'italic' }}>{item.example}</p>}
            </div>
            <button className="btn big" onClick={next}>下一題 →</button>
          </>
        )}
      </div>
    </>
  )
}
