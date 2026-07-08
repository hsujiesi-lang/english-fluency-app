// 主題對談 — 20 個常見聊天主題，每天挑一個講 10-15 分鐘。
// 不限時自由發揮（有引導問題），AI 只評流暢度，斷裂點進錯誤庫。

import React, { useEffect, useRef, useState } from 'react'
import { Screen, Spinner } from '../lib/ui.jsx'
import { TALK_TOPICS } from '../data/talkTopics.js'
import * as speech from '../lib/speech.js'
import * as claude from '../lib/claude.js'
import * as banks from '../lib/banks.js'
import * as store from '../lib/storage.js'

export default function Talk({ nav }) {
  const [topic, setTopic] = useState(null)
  const doneIds = store.get('talkDone', [])

  if (topic) return <TalkSession topic={topic} onBack={() => setTopic(null)} />

  return (
    <Screen title="主題對談" sub="20 個聊天主題 — 每天一題，講到自然為止">
      <p className="screen-sub">已完成 {doneIds.length} / {TALK_TOPICS.length}</p>
      {TALK_TOPICS.map((t) => (
        <div className="list-item" key={t.id} onClick={() => setTopic(t)}
          style={{ cursor: 'pointer', opacity: doneIds.includes(t.id) ? 0.6 : 1 }}>
          <div style={{ flex: 1 }}>
            <b>{doneIds.includes(t.id) ? '✅' : t.emoji} Day {t.id}：{t.name}</b>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t.qs[0]}</div>
          </div>
          <span style={{ color: 'var(--muted)' }}>›</span>
        </div>
      ))}
    </Screen>
  )
}

function TalkSession({ topic, onBack }) {
  const [phase, setPhase] = useState('intro') // intro | talking | judging | feedback
  const [live, setLive] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [fb, setFb] = useState(null)
  const recRef = useRef(null)
  const timerRef = useRef(null)
  const liveRef = useRef('')
  liveRef.current = live
  const canSpeak = speech.sttSupported()

  const start = () => {
    setLive('')
    setSeconds(0)
    setPhase('talking')
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    if (canSpeak) {
      recRef.current = speech.listen({ onUpdate: (t) => setLive(t), onEnd: () => {}, onError: () => {} })
    }
  }

  async function finish() {
    clearInterval(timerRef.current)
    if (recRef.current) { recRef.current.stop(); recRef.current = null }
    const text = liveRef.current.trim()
    store.logActivity('talk')
    store.update('talkDone', [], (d) => d.includes(topic.id) ? d : [...d, topic.id])
    if (!text || !claude.hasApiKey()) {
      setFb(null)
      setPhase('feedback')
      return
    }
    setPhase('judging')
    try {
      const res = await claude.evaluateFluency(`Conversation topic: ${topic.name}. Questions: ${topic.qs.join(' / ')}`, text, 1)
      setFb(res)
      for (const b of res.breakdowns || []) {
        banks.addError({ type: 'fluency', originalText: b.position, correction: b.fix, sourceModule: 'talk', note: b.likelyCause })
      }
    } catch (e) {
      setFb({ naturalnessTips: ['AI 評分失敗：' + e.message.slice(0, 50)] })
    }
    setPhase('feedback')
  }

  useEffect(() => () => { clearInterval(timerRef.current); if (recRef.current) recRef.current.stop() }, [])

  const mm = String(Math.floor(seconds / 60)).padStart(1, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <Screen title={`${topic.emoji} Day ${topic.id}`} sub={topic.name} onBack={onBack}>
      <div className="card">
        <p style={{ fontWeight: 700, margin: '0 0 6px' }}>引導問題（挑著回答就好）：</p>
        {topic.qs.map((q, k) => <p key={k} style={{ margin: '4px 0', fontSize: 15 }}>{k + 1}. {q}</p>)}

        {phase === 'intro' && (
          <>
            {!canSpeak && <div className="notice">⚠️ 此瀏覽器不支援語音辨識，會改用打字模式。</div>}
            {!claude.hasApiKey() && <div className="notice">未設定 API 金鑰 — 可以練習並看逐字稿，但沒有 AI 流暢度回饋。</div>}
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>目標 2-5 分鐘。不用完美，把句子說完整比說得快重要。</p>
            <button className="btn big good" onClick={start}>🎤 開始聊</button>
          </>
        )}

        {phase === 'talking' && (
          <>
            <p><span className="recording-dot" />聊天中… {mm}:{ss}</p>
            {canSpeak
              ? <div className="transcript" style={{ minHeight: 120 }}>{live || <span style={{ color: 'var(--muted)' }}>開始說話…</span>}</div>
              : <textarea className="input" rows={6} autoFocus value={live} onChange={(e) => setLive(e.target.value)} placeholder="打字模式：盡量寫完整句…" />}
            <button className="btn big" onClick={finish}>說完了，給我回饋</button>
          </>
        )}

        {phase === 'judging' && <Spinner label="AI 分析流暢度…" />}

        {phase === 'feedback' && (
          <>
            <p style={{ fontWeight: 700, margin: '10px 0 4px' }}>逐字稿（{mm}:{ss}）</p>
            <div className="transcript">{live || '（無內容）'}</div>
            {fb ? (
              <>
                {fb.completenessScore != null && <p>完整度：<b style={{ color: 'var(--brand)', fontSize: 24 }}>{fb.completenessScore}</b>/100</p>}
                {(fb.breakdowns || []).map((b, k) => (
                  <div key={k} className="feedback-block bad">「{b.position}」<br /><span style={{ fontSize: 14 }}>{b.likelyCause}<br />✔ {b.fix}</span></div>
                ))}
                {(fb.naturalnessTips || []).map((t, k) => <div key={k} className="feedback-block">{t}</div>)}
                {fb.encouragement && <p style={{ color: 'var(--good)', fontWeight: 700 }}>{fb.encouragement}</p>}
              </>
            ) : (
              <div className="feedback-block">自我檢查：哪一題講得最順？哪裡卡住了？可以按「再聊一次」把卡住的地方講完整。</div>
            )}
            <div className="btn-row">
              <button className="btn secondary" onClick={start}>🔁 再聊一次</button>
              <button className="btn" onClick={onBack}>選下一個主題</button>
            </div>
          </>
        )}
      </div>
    </Screen>
  )
}
