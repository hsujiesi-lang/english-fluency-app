// 模組 5：每日短句（120 句）— 聽讀 / 中翻英 / 早安晚安法

import React, { useEffect, useRef, useState } from 'react'
import { Screen, TimerBar, useCountdown, Spinner, pick, shuffle, onDoubleEnter } from '../lib/ui.jsx'
import * as speech from '../lib/speech.js'
import * as store from '../lib/storage.js'
import * as banks from '../lib/banks.js'
import * as claude from '../lib/claude.js'

const SECTIONS = {
  routine: '每日例行',
  home: '家務整理',
  study: '工作學校',
  social: '社交休閒',
}

export default function DailyPhrases({ nav, phrases, params }) {
  const [mode, setMode] = useState(params.mode || null)
  if (!phrases) return <Screen title="每日短句"><Spinner label="載入中…" /></Screen>

  if (mode === 'listen') return <ListenRead phrases={phrases} onBack={() => setMode(null)} />
  if (mode === 'translate') return <Translate phrases={phrases} onBack={() => setMode(null)} />
  if (mode === 'daily') return <MorningEvening onBack={() => setMode(null)} />
  if (mode === 'browse') return <BrowseAll phrases={phrases} onBack={() => setMode(null)} />

  const dueCount = banks.duePhraseIds().length
  return (
    <Screen title="每日短句" sub="120 句墨爾本日常 — 每天唸熟一點點">
      <div className="card" onClick={() => setMode('listen')} style={{ cursor: 'pointer' }}>
        <h3>🔊 聽讀模式</h3>
        <p>TTS 播放 → 跟讀，語速可調（0.7x / 1.0x）</p>
      </div>
      <div className="card" onClick={() => setMode('translate')} style={{ cursor: 'pointer' }}>
        <h3>🗣️ 中翻英</h3>
        <p>看中文 → 8 秒內說出英文 {dueCount > 0 && <span className="tag warn">待複習 {dueCount}</span>}</p>
      </div>
      <div className="card" onClick={() => setMode('daily')} style={{ cursor: 'pointer' }}>
        <h3>🌅 早安 / 晚安法</h3>
        <p>白天練 I'm going to…，晚上練過去式</p>
      </div>
      <div className="card" onClick={() => setMode('browse')} style={{ cursor: 'pointer' }}>
        <h3>📖 短句總覽</h3>
        <p>120 句依主題分組全列出，可搜尋、點喇叭聽發音</p>
      </div>
      {!speech.sttSupported() && (
        <div className="notice">⚠️ 這個瀏覽器不支援語音辨識（iOS Safari 常見）。語音題會改用打字作答；聽讀模式仍可正常使用。</div>
      )}
    </Screen>
  )
}

// ---- 短句總覽（分主題全列） ----

const SECTION_ICON = { routine: '🛒', home: '🧹', study: '🎓', social: '🎉' }

function BrowseAll({ phrases, onBack }) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const query = q.trim().toLowerCase()
  const match = (p) =>
    (filter === 'all' || p.section === filter) &&
    (!query || p.zh.toLowerCase().includes(query) || p.en.toLowerCase().includes(query))

  const sections = filter === 'all' ? Object.keys(SECTIONS) : [filter]

  return (
    <Screen title="短句總覽" onBack={onBack}>
      <div className="tabs">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部</button>
        {Object.entries(SECTIONS).map(([k, v]) => (
          <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{v}</button>
        ))}
      </div>
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 搜尋中文或英文…" style={{ marginBottom: 12 }} />
      {sections.map((sec) => {
        const list = phrases.filter((p) => p.section === sec && match(p))
        if (!list.length) return null
        return (
          <div key={sec}>
            <h3 style={{ margin: '16px 4px 8px', fontSize: 16 }}>
              {SECTION_ICON[sec]} {SECTIONS[sec]}（{list.length} 句）
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {list.map((p) => (
                <div className="list-item" key={p.id}
                  style={{ padding: '8px 10px', marginBottom: 0, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{p.id}. {p.zh}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>{p.en}</div>
                  </div>
                  <button className="btn ghost small" style={{ padding: '4px 6px' }}
                    onClick={() => speech.speak(p.en.split('/')[0])}>🔊</button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {phrases.filter(match).length === 0 && (
        <div className="card"><p>找不到符合「{q}」的短句</p></div>
      )}
    </Screen>
  )
}

// ---- 聽讀 ----

function ListenRead({ phrases, onBack }) {
  const [section, setSection] = useState('routine')
  const [idx, setIdx] = useState(0)
  const [rate, setRate] = useState(1.0)
  const [transcript, setTranscript] = useState('')
  const [recording, setRecording] = useState(false)
  const [result, setResult] = useState(null)
  const recRef = useRef(null)

  const list = phrases.filter((p) => p.section === section)
  const p = list[idx] || list[0]

  const play = () => {
    speech.speak(p.en.split('/')[0], { rate })
  }

  const go = (d) => {
    stopRec()
    setTranscript('')
    setResult(null)
    setIdx((i) => Math.min(list.length - 1, Math.max(0, i + d)))
  }

  const stopRec = () => {
    if (recRef.current) { recRef.current.stop(); recRef.current = null }
    setRecording(false)
  }

  const record = () => {
    if (recording) {
      stopRec()
      return
    }
    setTranscript('')
    setResult(null)
    setRecording(true)
    recRef.current = speech.listen({
      onUpdate: (t) => setTranscript(t),
      onEnd: (t) => {
        setRecording(false)
        if (t) setResult(speech.fuzzyMatch(t, p.en, p.accept))
        store.logActivity('phrases')
      },
      onError: () => setRecording(false),
    })
  }

  useEffect(() => () => stopRec(), [])

  return (
    <Screen title="聽讀模式" onBack={onBack}>
      <div className="tabs">
        {Object.entries(SECTIONS).map(([k, v]) => (
          <button key={k} className={section === k ? 'active' : ''} onClick={() => { stopRec(); setSection(k); setIdx(0); setTranscript(''); setResult(null) }}>{v}</button>
        ))}
      </div>
      <div className="card">
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{idx + 1} / {list.length}</p>
        <p className="big-question">{p.zh}</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand)' }}>{p.en}</p>
        <div className="btn-row">
          <button className="btn" onClick={play}>🔊 播放</button>
          <button className="btn secondary" onClick={() => setRate(rate === 1.0 ? 0.7 : 1.0)}>語速 {rate}x</button>
        </div>
        {speech.sttSupported() && (
          <>
            <button className={'btn big ' + (recording ? 'bad' : 'good')} onClick={record}>
              {recording ? <><span className="recording-dot" />停止跟讀</> : '🎤 跟讀（自我比對）'}
            </button>
            {transcript && <div className="transcript">{transcript}</div>}
            {result && (
              <div className={'feedback-block ' + (result.ok ? 'good' : 'bad')}>
                {result.ok ? '✅ 唸得很接近！' : '再試一次 — 對照上面的句子，注意漏掉的字'}
              </div>
            )}
          </>
        )}
      </div>
      <div className="btn-row">
        <button className="btn secondary" disabled={idx === 0} onClick={() => go(-1)}>← 上一句</button>
        <button className="btn" disabled={idx >= list.length - 1} onClick={() => go(1)}>下一句 →</button>
      </div>
    </Screen>
  )
}

// ---- 中翻英 ----

const ROUND_SIZE = 5
const ANSWER_SECONDS = 8

function Translate({ phrases, onBack }) {
  const [queue, setQueue] = useState(null) // phrase objects for this round
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | listening | judging | result | done
  const [transcript, setTranscript] = useState('')
  const [typed, setTyped] = useState('')
  const [verdict, setVerdict] = useState(null) // {ok, reason?, betterVersion?}
  const [score, setScore] = useState(0)
  const recRef = useRef(null)
  const canSpeak = speech.sttSupported()
  const [left, , timer] = useCountdown(() => finishAnswer())
  // latest answer text, readable from the timer-expiry callback
  const transcriptRef = useRef('')
  transcriptRef.current = canSpeak ? transcript : typed

  const startRound = () => {
    const dueIds = new Set(banks.duePhraseIds())
    const due = phrases.filter((p) => dueIds.has(String(p.id)))
    const rest = phrases.filter((p) => !dueIds.has(String(p.id)))
    const round = [...pick(due, ROUND_SIZE), ...pick(rest, ROUND_SIZE)].slice(0, ROUND_SIZE)
    setQueue(shuffle(round))
    setI(0)
    setScore(0)
    setPhase('idle')
  }

  useEffect(startRound, [])
  useEffect(() => () => { if (recRef.current) recRef.current.stop() }, [])

  if (!queue) return <Screen title="中翻英" onBack={onBack}><Spinner /></Screen>
  const p = queue[i]

  const begin = () => {
    setTranscript('')
    setTyped('')
    setVerdict(null)
    setPhase('listening')
    timer.start(ANSWER_SECONDS)
    if (canSpeak) {
      recRef.current = speech.listen({
        onUpdate: (t) => setTranscript(t),
        onEnd: () => {},
        onError: () => {},
      })
    }
  }

  async function finishAnswer() {
    timer.stop()
    if (recRef.current) { recRef.current.stop(); recRef.current = null }
    const answer = transcriptRef.current.trim()
    setPhase('judging')

    let v
    const local = speech.fuzzyMatch(answer, p.en, p.accept || [])
    if (!answer) {
      v = { ok: false, reason: '時間到，沒有聽到答案' }
    } else if (local.ok) {
      v = { ok: true, reason: '符合句型！' }
    } else if (claude.hasApiKey()) {
      try {
        v = await claude.judgeTranslation(p.zh, p.en, answer)
      } catch {
        v = { ok: false, reason: '和參考句差異較大（AI 比對失敗，用規則判定）', betterVersion: p.en }
      }
    } else {
      v = { ok: false, reason: '和參考句差異較大', betterVersion: p.en }
    }

    setVerdict(v)
    setPhase('result')
    if (v.ok) setScore((s) => s + 1)
    // SRS: wrong → into queue; queued item reviewed either way
    const inQueue = banks.getPhraseQueue()[String(p.id)]
    if (!v.ok) {
      banks.queuePhrase(String(p.id))
      if (inQueue) banks.reviewPhrase(String(p.id), false)
      speech.speak(p.en.split('/')[0], { rate: 0.9 })
    } else if (inQueue) {
      banks.reviewPhrase(String(p.id), true)
    }
    store.logActivity('phrases')
  }

  const next = () => {
    if (i + 1 >= queue.length) setPhase('done')
    else { setI(i + 1); setPhase('idle') }
  }

  if (phase === 'done') {
    return (
      <Screen title="中翻英" onBack={onBack}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>本回合完成 🎉</h3>
          <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand)', margin: 8 }}>{score} / {queue.length}</p>
          <p>說不出的句子已加入複習佇列</p>
        </div>
        <div className="btn-row">
          <button className="btn big" onClick={startRound}>再來一回合</button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen title="中翻英" onBack={onBack}>
      <p className="screen-sub">{i + 1} / {queue.length}　答對 {score}</p>
      <div className="card">
        <p className="big-question">{p.zh}</p>
        {phase === 'idle' && (
          <button className="btn big" onClick={begin}>
            {canSpeak ? `🎤 開始（${ANSWER_SECONDS} 秒內說出英文）` : `開始（打字作答）`}
          </button>
        )}
        {phase === 'listening' && (
          <>
            <TimerBar secondsLeft={left} total={ANSWER_SECONDS} />
            {canSpeak ? (
              <div className="transcript">{transcript || <span style={{ color: 'var(--muted)' }}>聽取中…</span>}</div>
            ) : (
              <input className="input" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && finishAnswer()} placeholder="輸入英文…" />
            )}
            <div className="btn-row">
              <button className="btn" onClick={finishAnswer}>提交</button>
            </div>
          </>
        )}
        {phase === 'judging' && <Spinner label="比對中…" />}
        {phase === 'result' && verdict && (
          <>
            <div className={'feedback-block ' + (verdict.ok ? 'good' : 'bad')}>
              <b>{verdict.ok ? '✅ 正確！' : '❌ 再加油'}</b> {verdict.reason}
              {!verdict.ok && (
                <p style={{ margin: '6px 0 0' }}>參考：<b>{verdict.betterVersion || p.en}</b></p>
              )}
            </div>
            {transcriptRef.current && <p style={{ color: 'var(--muted)', fontSize: 14 }}>你說的：{transcriptRef.current}</p>}
            <div className="btn-row">
              <button className="btn secondary" onClick={() => speech.speak(p.en.split('/')[0], { rate: 0.9 })}>🔊 再聽一次</button>
              <button className="btn" onClick={next}>下一題 →</button>
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}

// ---- 早安 / 晚安法 ----

export function MorningEvening({ onBack, embedded }) {
  const isEvening = new Date().getHours() >= 20
  const question = isEvening ? 'What did you do today?' : 'What are you going to do today?'
  const hint = isEvening ? '用過去式：I went to… / I studied…' : '用 I\'m going to + 原形動詞'
  const key = store.todayStr() + (isEvening ? ':pm' : ':am')
  const [saved, setSaved] = useState(() => (store.get('dailyAnswers', {})[key] || ''))
  const [text, setText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [recording, setRecording] = useState(false)
  const recRef = useRef(null)
  const canSpeak = speech.sttSupported()

  const record = () => {
    if (recording) { recRef.current && recRef.current.stop(); recRef.current = null; setRecording(false); return }
    setTranscript('')
    setRecording(true)
    recRef.current = speech.listen({
      onUpdate: (t) => { setTranscript(t); setText(t) },
      onEnd: () => setRecording(false),
      onError: () => setRecording(false),
    })
  }

  const save = () => {
    const answer = (text || transcript).trim()
    if (!answer) return
    store.update('dailyAnswers', {}, (a) => ({ ...a, [key]: answer }))
    setSaved(answer)
    store.logActivity('daily')
  }

  useEffect(() => () => { if (recRef.current) recRef.current.stop() }, [])

  const body = (
    <div className="card">
      <h3>{isEvening ? '🌙 晚安法' : '🌅 早安法'}</h3>
      <p className="big-question">{question}</p>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>{hint}</p>
      {saved ? (
        <div className="feedback-block good">今天已記錄：<b>{saved}</b></div>
      ) : (
        <>
          {canSpeak && (
            <button className={'btn big ' + (recording ? 'bad' : 'good')} onClick={record}>
              {recording ? <><span className="recording-dot" />停止</> : '🎤 說出你的答案'}
            </button>
          )}
          <textarea className="input" rows={2} style={{ marginTop: 10 }} value={text}
            onChange={(e) => setText(e.target.value)} onKeyDown={onDoubleEnter(save)}
            placeholder={(canSpeak ? '或直接輸入…' : '輸入你的答案…') + '（連按兩次 Enter 提交）'} />
          <div className="btn-row">
            <button className="btn" onClick={save} disabled={!(text || transcript).trim()}>存入今日紀錄</button>
          </div>
        </>
      )}
    </div>
  )

  if (embedded) return body
  return <Screen title="早安 / 晚安法" onBack={onBack}>{body}</Screen>
}
