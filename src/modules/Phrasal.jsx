// Phrasal Verbs 專區 — 總列表（例句＋動詞三態＋📌 釘選）＋兩段式練習
// 練習：① 看中文打出 phrasal verb → ② 答對後用它造句 → AI 檢查拼字與文法

import React, { useEffect, useState } from 'react'
import { Screen, Spinner, pick, shuffle, useDoubleEnterNext, onDoubleEnter, WrongList } from '../lib/ui.jsx'
import { PV_NOTES } from '../data/notionSeed.js'
import { verbForms } from '../lib/verbForms.js'
import * as speech from '../lib/speech.js'
import * as claude from '../lib/claude.js'
import * as banks from '../lib/banks.js'
import * as store from '../lib/storage.js'

const ROUND = 6

function usePhrasalData() {
  const [all, setAll] = useState(null)
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/phrasal-verbs.json')
      .then((r) => r.json()).then(setAll).catch(() => setAll([]))
  }, [])
  return all
}

const getPinned = () => store.get('pvPinned', [])
const togglePin = (verb) => store.update('pvPinned', [], (p) =>
  p.includes(verb) ? p.filter((v) => v !== verb) : [...p, verb])

const BATCH_SIZE = 20

// 每日批次：照列表順序 20 個一批，每個新的一天自動輪到下一批
function getTodayBatch(all) {
  const today = store.todayStr()
  const saved = store.get('pvBatch', null)
  let offset
  if (saved && saved.date === today) {
    offset = saved.offset
  } else if (saved) {
    offset = saved.offset + BATCH_SIZE >= all.length ? 0 : saved.offset + BATCH_SIZE
  } else {
    offset = 0
  }
  if (!saved || saved.date !== today) store.set('pvBatch', { date: today, offset })
  return {
    offset,
    items: all.slice(offset, offset + BATCH_SIZE),
    dayNo: Math.floor(offset / BATCH_SIZE) + 1,
    totalDays: Math.ceil(all.length / BATCH_SIZE),
  }
}

export default function Phrasal({ nav, params }) {
  const [tab, setTab] = useState(params?.tab || 'today')
  const [practicePool, setPracticePool] = useState(null)
  const all = usePhrasalData()
  useEffect(() => { if (params?.tab) setTab(params.tab) }, [params])

  return (
    <Screen title="Phrasal Verbs" sub="每天 20 個 — 列表、播放、兩段式練習">
      <div className="tabs">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => { setPracticePool(null); setTab('today') }}>📅 今日 20</button>
        <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>📖 總列表</button>
        <button className={tab === 'practice' ? 'active' : ''} onClick={() => { setPracticePool(null); setTab('practice') }}>✏️ 隨機練習</button>
      </div>
      {!all ? <Spinner label="載入…" /> : (
        <>
          {tab === 'today' && (
            <TodayBatch all={all} onPractice={(items) => { setPracticePool(items); setTab('practice') }} />
          )}
          {tab === 'list' && <PvList all={all} />}
          {tab === 'practice' && <PvPractice key={practicePool ? 'batch' : 'random'} all={all} pool={practicePool} />}
        </>
      )}
    </Screen>
  )
}

// ---- 今日批次 ----

function TodayBatch({ all, onPractice }) {
  const batch = getTodayBatch(all)
  const [, force] = useState(0)
  const pinned = getPinned()
  const [playing, setPlaying] = useState(false)
  const [playIdx, setPlayIdx] = useState(-1)
  const [pausedIdx, setPausedIdx] = useState(null)
  const stopRef = React.useRef(false)
  const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms))

  async function playAll(startIdx = 0) {
    setPlaying(true); setPausedIdx(null); stopRef.current = false
    let k = startIdx
    for (; k < batch.items.length; k++) {
      if (stopRef.current) break
      setPlayIdx(k)
      document.getElementById('today-pv-' + k)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      await Promise.race([speakForms(batch.items[k]), sleepMs(15000)])
      if (stopRef.current) break
      await sleepMs(600)
    }
    setPlaying(false); setPlayIdx(-1)
    setPausedIdx(stopRef.current && k < batch.items.length ? k : null)
  }
  const pauseAll = () => { stopRef.current = true; speech.stopSpeaking() }
  useEffect(() => () => { stopRef.current = true; speech.stopSpeaking() }, [])

  return (
    <>
      <div className="card" style={{ padding: '12px 16px' }}>
        <h3 style={{ margin: 0 }}>📅 今日批次：第 {batch.offset + 1}–{batch.offset + batch.items.length} 個
          <span className="tag" style={{ marginLeft: 8 }}>Day {batch.dayNo} / {batch.totalDays}</span>
        </h3>
        <p style={{ margin: '6px 0 10px' }}>明天自動換下一批；背完點下面練習驗收</p>
        <div className="btn-row" style={{ margin: 0 }}>
          {!playing ? (
            <>
              <button className="btn good" onClick={() => playAll(pausedIdx ?? 0)}>
                {pausedIdx != null ? `▶️ 繼續（第 ${pausedIdx + 1} 個）` : '▶️ 播放三態'}
              </button>
              {pausedIdx != null && <button className="btn secondary" style={{ flex: '0 0 auto' }} onClick={() => setPausedIdx(null)}>⏮</button>}
            </>
          ) : (
            <button className="btn bad" onClick={pauseAll}>⏸ 暫停（{playIdx + 1} / {batch.items.length}）</button>
          )}
          <button className="btn" onClick={() => { pauseAll(); onPractice(batch.items) }}>✏️ 練這 {batch.items.length} 個</button>
        </div>
      </div>
      {batch.items.map((d, k) => {
        const forms = verbForms(d.verb)
        const isNow = playing && playIdx === k
        const isPinned = pinned.includes(d.verb)
        return (
          <div className="list-item" key={d.verb} id={'today-pv-' + k}
            style={{
              outline: isNow ? '2.5px solid var(--brand)' : 'none',
              background: isNow ? 'var(--brand-soft)' : isPinned ? 'var(--warn-soft)' : 'var(--card)',
            }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ color: 'var(--brand)' }}>{batch.offset + k + 1}. {d.verb}</b>
              {d.priority && <span className="tag warn" style={{ marginLeft: 4 }}>一直忘</span>}
              <span style={{ marginLeft: 8, fontSize: 14 }}>{d.zhMeaning}</span>
              {forms && forms.past !== forms.base && (
                <div style={{ fontSize: 12, color: 'var(--warn)' }}>三態:{forms.base} → {forms.past} → {forms.pp}</div>
              )}
              {d.examples?.[0] && <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--muted)' }}>{d.examples[0]}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button className="btn ghost small" style={{ padding: '4px 6px', opacity: isPinned ? 1 : 0.35 }}
                onClick={() => { togglePin(d.verb); force((n) => n + 1) }}>📌</button>
              <button className="btn ghost small" style={{ padding: '4px 6px' }} onClick={() => speakForms(d)}>🔊</button>
            </div>
          </div>
        )
      })}
    </>
  )
}

// ---- 總列表：搜尋、釘選置頂、三態、例句 ----

// 朗讀三態：turn up… turned up… turned up（無變化就只念原形）
function speakForms(d, rate = 0.95) {
  const clean = (s) => s.replace(/\(.*?\)/g, '').split('+')[0].replace(/\s+/g, ' ').trim()
  const f = verbForms(d.verb)
  const text = f && f.past !== f.base
    ? `${clean(f.base)}. ${clean(f.past)}. ${clean(f.pp).split('/')[0]}.`
    : clean(d.verb)
  return speech.speak(text, { rate })
}

function PvList({ all }) {
  const [q, setQ] = useState('')
  const [, force] = useState(0)
  const pinned = getPinned()
  // 連續播放（可暫停續播）
  const [playing, setPlaying] = useState(false)
  const [playIdx, setPlayIdx] = useState(-1)
  const [pausedIdx, setPausedIdx] = useState(null)
  const stopRef = React.useRef(false)

  const query = q.trim().toLowerCase()
  const match = (d) => !query || d.verb.toLowerCase().includes(query) || d.zhMeaning.toLowerCase().includes(query)
  const pinnedList = all.filter((d) => pinned.includes(d.verb) && match(d))
  const restList = all.filter((d) => !pinned.includes(d.verb) && match(d))
  const flatList = [...pinnedList, ...restList]

  const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms))

  async function playAll(startIdx = 0) {
    setPlaying(true)
    setPausedIdx(null)
    stopRef.current = false
    let k = startIdx
    for (; k < flatList.length; k++) {
      if (stopRef.current) break
      setPlayIdx(k)
      const d = flatList[k]
      document.getElementById('pv-' + d.verb.replace(/[^a-z]/gi, ''))?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      await Promise.race([speakForms(d), sleepMs(15000)])
      if (stopRef.current) break
      await sleepMs(600)
    }
    setPlaying(false)
    setPlayIdx(-1)
    setPausedIdx(stopRef.current && k < flatList.length ? k : null)
  }

  const pauseAll = () => { stopRef.current = true; speech.stopSpeaking() }
  useEffect(() => { pauseAll(); setPausedIdx(null); setPlaying(false); setPlayIdx(-1) }, [q])
  useEffect(() => () => { stopRef.current = true; speech.stopSpeaking() }, [])

  const Item = ({ d }) => {
    const forms = verbForms(d.verb)
    const isPinned = pinned.includes(d.verb)
    const isNow = playing && flatList[playIdx] === d
    return (
      <div className="list-item" id={'pv-' + d.verb.replace(/[^a-z]/gi, '')}
        style={{
          marginBottom: 0, alignItems: 'flex-start',
          background: isNow ? 'var(--brand-soft)' : isPinned ? 'var(--warn-soft)' : 'var(--card)',
          outline: isNow ? '2.5px solid var(--brand)' : 'none',
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ color: 'var(--brand)', fontSize: 14 }}>{d.verb}</b>
          {d.priority && <span className="tag warn" style={{ marginLeft: 4 }}>一直忘</span>}
          <div style={{ fontSize: 13 }}>{d.zhMeaning}</div>
          {forms && forms.past !== forms.base && (
            <div style={{ fontSize: 12, color: 'var(--warn)', marginTop: 2 }}>
              三態：{forms.base} → {forms.past} → {forms.pp}
            </div>
          )}
          {(d.examples || []).slice(0, 2).map((ex, k) => (
            <div key={k} style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--muted)', marginTop: 2 }}>{ex}</div>
          ))}
          {PV_NOTES[d.verb] && <div style={{ fontSize: 12, color: 'var(--bad)', marginTop: 2 }}>💡 {PV_NOTES[d.verb]}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="btn ghost small" style={{ padding: '4px 6px', opacity: isPinned ? 1 : 0.35 }}
            onClick={() => { togglePin(d.verb); force((n) => n + 1) }}>📌</button>
          <button className="btn ghost small" style={{ padding: '4px 6px' }} onClick={() => speakForms(d)}>🔊</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={`🔍 搜尋 ${all.length} 個 phrasal verbs…`} style={{ marginBottom: 10 }} />
      <div className="card" style={{ padding: '10px 14px', position: 'sticky', top: 8, zIndex: 10 }}>
        <div className="btn-row" style={{ margin: 0 }}>
          {!playing ? (
            <>
              <button className="btn good" onClick={() => playAll(pausedIdx ?? 0)} disabled={flatList.length === 0}>
                {pausedIdx != null
                  ? `▶️ 繼續（第 ${pausedIdx + 1} / ${flatList.length} 個）`
                  : `▶️ 播放全部三態（${flatList.length} 個）`}
              </button>
              {pausedIdx != null && (
                <button className="btn secondary" style={{ flex: '0 0 auto' }} onClick={() => setPausedIdx(null)}>⏮ 重頭</button>
              )}
            </>
          ) : (
            <button className="btn bad" onClick={pauseAll}>
              ⏸ 暫停（{playIdx + 1} / {flatList.length}）
            </button>
          )}
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted)' }}>每個唸：原形 → 過去式 → 過去分詞</p>
      </div>
      {pinnedList.length > 0 && (
        <>
          <h3 style={{ margin: '4px 4px 8px', fontSize: 15 }}>📌 已釘選（{pinnedList.length}）</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {pinnedList.map((d) => <Item d={d} key={d.verb} />)}
          </div>
        </>
      )}
      {Array.from({ length: Math.ceil(restList.length / 10) }, (_, g) => {
        const chunk = restList.slice(g * 10, g * 10 + 10)
        return (
          <div key={g}>
            <h3 style={{ margin: '16px 4px 8px', fontSize: 15, color: 'var(--muted)' }}>
              ── {g * 10 + 1}–{g * 10 + chunk.length} ──
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {chunk.map((d) => <Item d={d} key={d.verb} />)}
            </div>
          </div>
        )
      })}
    </>
  )
}

// ---- 兩段式練習 ----

function PvPractice({ all, pool }) {
  const [items, setItems] = useState(null)
  const [i, setI] = useState(0)
  const [stage, setStage] = useState(1) // 1: 中→英 | 2: 造句
  const [input, setInput] = useState('')
  const [sentence, setSentence] = useState('')
  const [r1, setR1] = useState(null) // stage1 result
  const [r2, setR2] = useState(null) // stage2 feedback
  const [checking, setChecking] = useState(false)
  const [score, setScore] = useState(0)
  const [wrongs, setWrongs] = useState([])
  const [done, setDone] = useState(false)

  const startRound = () => {
    let chosen
    if (pool) {
      // 指定題庫（今日批次）→ 全部都練
      chosen = [...pool]
    } else {
      // 隨機模式：釘選和「一直忘」優先，其餘隨機
      const pinned = getPinned()
      const starred = all.filter((d) => pinned.includes(d.verb) || d.priority)
      const rest = all.filter((d) => !starred.includes(d))
      chosen = [...pick(starred, 3), ...pick(rest, ROUND)].slice(0, ROUND)
    }
    setItems(shuffle(chosen))
    setI(0); setStage(1); setInput(''); setSentence('')
    setR1(null); setR2(null); setScore(0); setWrongs([]); setDone(false)
  }
  useEffect(startRound, [])

  useDoubleEnterNext((!!r1 && !r1.ok) || !!r2, () => next())

  if (!items) return <Spinner />
  const item = items[i]
  const forms = verbForms(item.verb)

  const normVerb = (s) => s.toLowerCase().split('+')[0].replace(/\(.*?\)/g, '').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()

  const submitStage1 = () => {
    if (r1 || !input.trim()) return
    const ok = normVerb(input) === normVerb(item.verb)
      || normVerb(input) === item.verb.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, ' ').trim().split('+')[0].trim()
    setR1({ ok })
    store.logActivity('phrasal')
    if (ok) {
      setStage(2) // 答對 → 進入造句
    } else {
      setWrongs((w) => [...w, { q: item.zhMeaning, your: input, right: item.verb, why: PV_NOTES[item.verb] || (item.examples || [])[0] }])
      banks.addError({ type: 'posError', originalText: `${item.zhMeaning} → ${input}`, correction: item.verb, sourceModule: 'phrasal', note: PV_NOTES[item.verb] || `${item.verb}＝${item.zhMeaning}` })
    }
  }

  const submitStage2 = async () => {
    const s = sentence.trim()
    if (!s || checking || r2) return
    // 本地基本檢查：句子必須用到這個 phrasal verb（含三態變化）
    const lower = s.toLowerCase()
    const base = normVerb(item.verb)
    const usedForm = [base, forms?.past, forms?.pp].filter(Boolean)
      .some((f) => lower.includes(f.toLowerCase().split('/')[0]))
    if (!usedForm) {
      setR2({ ok: false, feedback: `句子裡要用到「${item.verb}」（原形或過去式都可以）` })
      return
    }
    if (!claude.hasApiKey()) {
      setR2({ ok: true, feedback: '有用到目標片語！（設定 API 金鑰後可獲得拼字＋文法檢查）' })
      setScore((n) => n + 1)
      return
    }
    setChecking(true)
    try {
      const res = await claude.checkSentence(item.verb, 'phrasal verb', s)
      setR2(res)
      if (res.ok) setScore((n) => n + 1)
      else {
        setWrongs((w) => [...w, { q: `造句：${item.verb}`, your: s, right: res.betterVersion || item.examples?.[0] || '', why: res.feedback }])
        banks.addError({ type: 'posError', originalText: s, correction: res.betterVersion || '', sourceModule: 'phrasal', note: res.feedback })
      }
    } catch (e) {
      setR2({ ok: true, feedback: 'AI 檢查失敗（' + e.message.slice(0, 40) + '），以有用到片語判定通過' })
      setScore((n) => n + 1)
    }
    setChecking(false)
  }

  const next = () => {
    setInput(''); setSentence(''); setR1(null); setR2(null); setStage(1)
    if (i + 1 >= items.length) setDone(true)
    else setI(i + 1)
  }

  if (done) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>本回合完成 🎉</h3>
        <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand)', margin: 8 }}>{score} / {items.length}</p>
        <WrongList items={wrongs} />
        <button className="btn big" onClick={startRound}>再來一回合</button>
      </div>
    )
  }

  return (
    <div className="card">
      <p className="screen-sub" style={{ margin: '0 0 8px' }}>
        {i + 1} / {items.length}　{stage === 1 ? '① 中→英' : '② 造句'}
        {getPinned().includes(item.verb) && ' 📌'}{item.priority && ' ⚠️一直忘'}
      </p>
      <p className="big-question">{item.zhMeaning}</p>

      {stage === 1 && !r1 && (
        <>
          <input className="input" autoFocus autoCapitalize="off" autoCorrect="off" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitStage1()}
            placeholder="打出對應的 phrasal verb…" />
          <div className="btn-row"><button className="btn" onClick={submitStage1} disabled={!input.trim()}>提交</button></div>
        </>
      )}

      {r1 && !r1.ok && (
        <>
          <div className="feedback-block bad">
            <b>❌ 答案：</b><b>{item.verb}</b>
            {forms && forms.past !== forms.base && <p style={{ margin: '4px 0 0', fontSize: 14 }}>三態：{forms.base} → {forms.past} → {forms.pp}</p>}
            {PV_NOTES[item.verb] && <p style={{ margin: '4px 0 0' }}>💡 {PV_NOTES[item.verb]}</p>}
            {(item.examples || []).slice(0, 1).map((ex, k) => <p key={k} style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: 14 }}>{ex}</p>)}
          </div>
          <button className="btn big" onClick={next}>下一題 →</button>
        </>
      )}

      {stage === 2 && (
        <>
          <div className="feedback-block good">
            ✅ <b>{item.verb}</b> 答對了！
            {forms && forms.past !== forms.base && <span style={{ fontSize: 14 }}>（三態：{forms.base} → {forms.past} → {forms.pp}）</span>}
          </div>
          {!r2 ? (
            <>
              <label className="field">第二關：用它造一個句子</label>
              <textarea className="input" rows={2} value={sentence} onChange={(e) => setSentence(e.target.value)}
                onKeyDown={onDoubleEnter(submitStage2)}
                placeholder={`Write a sentence with "${item.verb}"…（連按兩次 Enter 提交）`} />
              <div className="btn-row">
                <button className="btn" onClick={submitStage2} disabled={!sentence.trim() || checking}>
                  {checking ? 'AI 檢查中…' : '提交造句'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="transcript">{sentence}</div>
              <div className={'feedback-block ' + (r2.ok ? 'good' : 'bad')}>
                <b>{r2.ok ? '✅ 通過！' : '❌ 有問題：'}</b> {r2.feedback}
                {r2.betterVersion && <p style={{ margin: '4px 0 0' }}>✔ {r2.betterVersion}</p>}
              </div>
              <button className="btn big" onClick={next}>下一題 →</button>
            </>
          )}
        </>
      )}
    </div>
  )
}
