// 主題單詞 — 天氣/身體/衣服/電影/情緒/料理。
// 列表（含發音、連續播放）＋主動練習（中→英打字、聽音拼寫）。答錯自動加入單字庫。

import React, { useEffect, useRef, useState } from 'react'
import { Screen, Spinner, pick, onDoubleEnter, useDoubleEnterNext, WrongList } from '../lib/ui.jsx'
import { TOPICS } from '../data/topicVocab.js'
import * as speech from '../lib/speech.js'
import * as banks from '../lib/banks.js'
import * as store from '../lib/storage.js'

const ROUND = 8

export default function Topics({ nav }) {
  const [topic, setTopic] = useState(null)
  if (topic) return <TopicView topic={topic} onBack={() => setTopic(null)} />

  return (
    <Screen title="主題單詞" sub="一次吃透一個生活主題 — 列表＋練習">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {TOPICS.map((t) => (
          <div className="card" key={t.id} onClick={() => setTopic(t)}
            style={{ cursor: 'pointer', textAlign: 'center', marginBottom: 0, padding: '20px 10px' }}>
            <div style={{ fontSize: 34 }}>{t.emoji}</div>
            <h3 style={{ margin: '6px 0 2px' }}>{t.name}</h3>
            <p style={{ margin: 0 }}>{t.words.length} 個單詞</p>
          </div>
        ))}
      </div>
    </Screen>
  )
}

function TopicView({ topic, onBack }) {
  const [tab, setTab] = useState('list')
  return (
    <Screen title={`${topic.emoji} ${topic.name}`} onBack={onBack}>
      <div className="tabs">
        <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>列表</button>
        <button className={tab === 'recall' ? 'active' : ''} onClick={() => setTab('recall')}>中→英</button>
        <button className={tab === 'spell' ? 'active' : ''} onClick={() => setTab('spell')}>聽音拼寫</button>
      </div>
      {tab === 'list' && <WordList topic={topic} />}
      {tab === 'recall' && <Quiz key="recall" topic={topic} mode="recall" />}
      {tab === 'spell' && <Quiz key="spell" topic={topic} mode="spell" />}
    </Screen>
  )
}

// ---- 列表（含連續播放）----

function WordList({ topic }) {
  const [playing, setPlaying] = useState(false)
  const [playIdx, setPlayIdx] = useState(-1)
  const stopRef = useRef(false)

  const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms))
  const speakSafe = (text, opts) => Promise.race([speech.speak(text, opts), sleepMs(12000)])

  async function playAll() {
    setPlaying(true)
    stopRef.current = false
    for (let k = 0; k < topic.words.length; k++) {
      if (stopRef.current) break
      setPlayIdx(k)
      const w = topic.words[k]
      await speakSafe(w.zh, { lang: 'zh-TW' })
      if (stopRef.current) break
      await speakSafe(w.en, { rate: 0.95 })
      if (stopRef.current) break
      await sleepMs(500)
    }
    setPlaying(false)
    setPlayIdx(-1)
  }
  const stop = () => { stopRef.current = true; speech.stopSpeaking(); setPlaying(false); setPlayIdx(-1) }
  useEffect(() => () => { stopRef.current = true; speech.stopSpeaking() }, [])

  return (
    <>
      <div className="btn-row" style={{ marginTop: 0 }}>
        {!playing
          ? <button className="btn good" onClick={playAll}>▶️ 播放全部（中→英）</button>
          : <button className="btn bad" onClick={stop}>⏹ 停止（{playIdx + 1} / {topic.words.length}）</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {topic.words.map((w, k) => (
          <div className="list-item" key={w.en}
            style={{
              marginBottom: 0, alignItems: 'flex-start',
              outline: playing && playIdx === k ? '2.5px solid var(--brand)' : 'none',
              background: playing && playIdx === k ? 'var(--brand-soft)' : 'var(--card)',
            }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ color: 'var(--brand)', fontSize: 15 }}>{w.en}</b>
              <span style={{ marginLeft: 6, fontSize: 13 }}>{w.zh}</span>
              <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--muted)', marginTop: 2 }}>{w.ex}</div>
            </div>
            <button className="btn ghost small" style={{ padding: '4px 6px' }} onClick={() => speech.speak(w.en)}>🔊</button>
          </div>
        ))}
      </div>
    </>
  )
}

// ---- 練習（recall: 看中文打英文 / spell: 聽音拼寫）----

function Quiz({ topic, mode }) {
  const [items, setItems] = useState(() => pick(topic.words, Math.min(ROUND, topic.words.length)))
  const [i, setI] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [wrongs, setWrongs] = useState([])
  const [done, setDone] = useState(false)

  const w = items[i]
  useDoubleEnterNext(!!result && !done, () => next())

  // 聽拼題：進題自動播一次
  useEffect(() => {
    if (mode === 'spell' && w && !done) speech.speak(w.en, { rate: 0.85 })
  }, [i, done])

  const norm = (s) => s.toLowerCase().replace(/[^a-z\s-]/g, '').replace(/\s+/g, ' ').trim()

  const submit = () => {
    if (result || !input.trim()) return
    const ok = norm(input) === norm(w.en)
    setResult({ ok })
    store.logActivity('topics')
    if (!ok) {
      setWrongs((ws) => [...ws, { q: mode === 'recall' ? w.zh : `（聽力）${w.zh}`, your: input, right: w.en, why: w.ex }])
      // 自動收進單字庫：recall 錯 → 語意練法；spell 錯 → 拼寫練法
      banks.addVocab({ word: w.en, partOfSpeech: w.pos, zhMeaning: w.zh, example: w.ex, errorType: mode === 'recall' ? 'meaning' : 'spelling' })
    } else {
      speech.speak(w.en)
    }
  }

  const next = () => {
    setInput('')
    setResult(null)
    if (i + 1 >= items.length) setDone(true)
    else setI(i + 1)
  }

  const restart = () => {
    setItems(pick(topic.words, Math.min(ROUND, topic.words.length)))
    setI(0); setInput(''); setResult(null); setWrongs([]); setDone(false)
  }

  if (done) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>本回合完成 🎉</h3>
        <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand)', margin: 8 }}>
          {items.length - wrongs.length} / {items.length}
        </p>
        <WrongList items={wrongs} />
        {wrongs.length > 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>錯的字已自動加入單字庫</p>}
        <button className="btn big" onClick={restart}>再來一回合</button>
      </div>
    )
  }

  return (
    <div className="card">
      <p className="screen-sub" style={{ margin: '0 0 8px' }}>{i + 1} / {items.length}</p>
      {mode === 'recall' ? (
        <p className="big-question">{w.zh}</p>
      ) : (
        <div className="btn-row">
          <button className="btn secondary" onClick={() => speech.speak(w.en, { rate: 0.85 })}>🔊 再聽一次（{w.zh}）</button>
        </div>
      )}
      {!result ? (
        <>
          <input className="input" autoFocus autoCapitalize="off" autoCorrect="off" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={mode === 'recall' ? '打出對應的英文單字…' : '打出聽到的拼法…'} />
          <div className="btn-row">
            <button className="btn" onClick={submit} disabled={!input.trim()}>提交</button>
          </div>
        </>
      ) : (
        <>
          <div className={'feedback-block ' + (result.ok ? 'good' : 'bad')}>
            <b>{result.ok ? '✅ 正確！' : '❌ 答案：'}</b> <b>{w.en}</b>（{w.zh}）
            <p style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: 14 }}>{w.ex}</p>
          </div>
          <button className="btn big" onClick={next}>下一題 →</button>
        </>
      )}
    </div>
  )
}
