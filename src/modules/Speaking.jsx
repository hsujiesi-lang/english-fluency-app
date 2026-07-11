// 模組 1：口說流暢度 — 30 秒準備 → 60 秒口說 → AI 評流暢度 → 強制重講 45 秒 → 比較
// 只評流暢度（完整句、斷裂點、自然度），刻意忽略冠詞/單複數等小錯。

import React, { useEffect, useRef, useState } from 'react'
import { Screen, TimerBar, useCountdown, Spinner, pick } from '../lib/ui.jsx'
import { SPEAKING_TOPICS } from '../data/errorHunterSeed.js'
import { TALK_TOPICS } from '../data/talkTopics.js'

// 題庫以「主題對談」的 60 個問題為主，原本的 tutorial/情境題保留混入
const TALK_QUESTIONS = TALK_TOPICS.flatMap((t) => t.qs.map((q) => ({ type: 'talk', topicName: t.name, q })))
const ALL_TOPICS = [...TALK_QUESTIONS, ...SPEAKING_TOPICS]
import * as speech from '../lib/speech.js'
import * as claude from '../lib/claude.js'
import * as banks from '../lib/banks.js'
import * as store from '../lib/storage.js'

const PREP_SECONDS = 30
const SPEAK_1 = 60
const SPEAK_2 = 45

const TYPE_LABEL = { tutorial: 'Tutorial 討論', scene: '情境描述', daily: '日常話題', talk: '主題對談' }

export default function Speaking({ nav }) {
  const [topic, setTopic] = useState(() => pick(ALL_TOPICS, 1)[0])
  const [phase, setPhase] = useState('intro') // intro | prep | speak1 | feedback1 | speak2 | feedback2
  const [t1, setT1] = useState('') // transcript attempt 1
  const [t2, setT2] = useState('')
  const [fb1, setFb1] = useState(null)
  const [fb2, setFb2] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [live, setLive] = useState('')
  const recRef = useRef(null)
  const liveRef = useRef('')
  liveRef.current = live
  const canSpeak = speech.sttSupported()

  const [left, , timer] = useCountdown(() => {
    if (phaseRef.current === 'prep') beginSpeak(1)
    else if (phaseRef.current === 'speak1') endSpeak(1)
    else if (phaseRef.current === 'speak2') endSpeak(2)
  })
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => () => { if (recRef.current) recRef.current.stop() }, [])

  const reroll = () => setTopic((old) => {
    const others = ALL_TOPICS.filter((t) => t.q !== old.q)
    return pick(others, 1)[0]
  })

  const startPrep = () => {
    setPhase('prep')
    timer.start(PREP_SECONDS)
  }

  const beginSpeak = (attempt) => {
    timer.stop()
    setLive('')
    setPhase('speak' + attempt)
    timer.start(attempt === 1 ? SPEAK_1 : SPEAK_2)
    if (canSpeak) {
      recRef.current = speech.listen({
        onUpdate: (t) => setLive(t),
        onEnd: () => {},
        onError: () => {},
      })
    }
  }

  async function endSpeak(attempt) {
    timer.stop()
    if (recRef.current) { recRef.current.stop(); recRef.current = null }
    const text = liveRef.current.trim()
    if (attempt === 1) setT1(text)
    else setT2(text)
    store.logActivity('speaking')

    if (!text) {
      const empty = { completenessScore: 0, breakdowns: [], naturalnessTips: ['沒有收到內容 — 再試一次，大聲一點！'], encouragement: '' }
      attempt === 1 ? (setFb1(empty), setPhase('feedback1')) : (setFb2(empty), setPhase('feedback2'))
      return
    }

    setPhase('feedback' + attempt)
    if (!claude.hasApiKey()) {
      const noKey = null // 無金鑰：只顯示逐字稿與自我檢查
      attempt === 1 ? setFb1(noKey) : setFb2(noKey)
      return
    }
    setEvaluating(true)
    try {
      const fb = await claude.evaluateFluency(topic.q, text, attempt)
      if (attempt === 1) {
        setFb1(fb)
        // 斷裂點寫入錯誤庫
        for (const b of fb.breakdowns || []) {
          banks.addError({
            type: 'fluency',
            originalText: b.position,
            correction: b.fix,
            sourceModule: 'speaking',
            note: b.likelyCause,
          })
        }
      } else setFb2(fb)
    } catch (e) {
      const err = { completenessScore: null, breakdowns: [], naturalnessTips: ['AI 評分失敗：' + e.message], encouragement: '' }
      attempt === 1 ? setFb1(err) : setFb2(err)
    }
    setEvaluating(false)
  }

  const restart = () => {
    setTopic(pick(ALL_TOPICS, 1)[0])
    setPhase('intro')
    setT1(''); setT2(''); setFb1(null); setFb2(null); setLive('')
  }

  return (
    <Screen title="口說流暢度" sub="目標是說完整的句子 — 小文法錯就放過它">
      <div className="card">
        <span className="tag">{TYPE_LABEL[topic.type]}{topic.topicName ? `・${topic.topicName}` : ''}</span>
        <p className="big-question">{topic.q}</p>

        {phase === 'intro' && (
          <>
            {!canSpeak && <div className="notice">⚠️ 這個瀏覽器不支援語音辨識（iOS Safari 常見）。請改用 Chrome，或用打字模式練習組句速度。</div>}
            {!claude.hasApiKey() && <div className="notice">尚未設定 API 金鑰 — 仍可練習並看逐字稿，但沒有 AI 流暢度評分。到「我的 → 設定」貼上金鑰。</div>}
            <div className="btn-row">
              <button className="btn secondary" onClick={reroll}>🎲 換一題</button>
              <button className="btn" onClick={startPrep}>開始（準備 {PREP_SECONDS} 秒）</button>
            </div>
          </>
        )}

        {phase === 'prep' && (
          <>
            <TimerBar secondsLeft={left} total={PREP_SECONDS} />
            <p style={{ color: 'var(--muted)' }}>💭 想 2-3 個要點就好，不要寫稿。{left} 秒後自動開始錄音。</p>
            <button className="btn big" onClick={() => beginSpeak(1)}>我準備好了，直接開始 🎤</button>
          </>
        )}

        {(phase === 'speak1' || phase === 'speak2') && (
          <>
            <TimerBar secondsLeft={left} total={phase === 'speak1' ? SPEAK_1 : SPEAK_2} />
            <p><span className="recording-dot" />錄音中（第 {phase === 'speak1' ? 1 : 2} 次）… {left}s</p>
            {canSpeak ? (
              <div className="transcript">{live || <span style={{ color: 'var(--muted)' }}>開始說話…</span>}</div>
            ) : (
              <textarea className="input" rows={4} autoFocus value={live} onChange={(e) => setLive(e.target.value)}
                placeholder="打字模式：盡快組出完整句子…" />
            )}
            <button className="btn big bad" onClick={() => endSpeak(phase === 'speak1' ? 1 : 2)}>提前結束</button>
          </>
        )}

        {phase === 'feedback1' && (
          <>
            <Transcript label="第 1 次" text={t1} />
            {evaluating ? <Spinner label="AI 分析流暢度…" /> : <FeedbackView fb={fb1} />}
            {!evaluating && (
              <>
                <div className="feedback-block">
                  🔁 <b>關鍵步驟：立刻重講一次同一題（{SPEAK_2} 秒）。</b><br />
                  第二次會更順 — 這就是流暢度訓練的核心。
                </div>
                <button className="btn big" onClick={() => beginSpeak(2)}>🎤 重講一次（{SPEAK_2} 秒）</button>
              </>
            )}
          </>
        )}

        {phase === 'feedback2' && (
          <>
            <CompareView t1={t1} t2={t2} fb1={fb1} fb2={fb2} evaluating={evaluating} />
            {!evaluating && (
              <div className="btn-row">
                <button className="btn secondary" onClick={() => nav('me', { tab: 'errors' })}>看錯誤庫</button>
                <button className="btn" onClick={restart}>換下一題</button>
              </div>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}

function Transcript({ label, text }) {
  return (
    <>
      <p style={{ fontWeight: 700, margin: '10px 0 4px' }}>{label}逐字稿</p>
      <div className="transcript">{text || '（無內容）'}</div>
    </>
  )
}

function FeedbackView({ fb }) {
  if (!fb) {
    return (
      <div className="feedback-block">
        自我檢查：剛剛有幾句是「說完整」的？在哪裡卡住了？記住卡住的地方，等下重講時把那句說完。
      </div>
    )
  }
  return (
    <>
      {fb.completenessScore !== null && fb.completenessScore !== undefined && (
        <p style={{ fontSize: 18 }}>完整度：<b style={{ color: 'var(--brand)', fontSize: 26 }}>{fb.completenessScore}</b> / 100</p>
      )}
      {(fb.breakdowns || []).map((b, i) => (
        <div key={i} className="feedback-block bad">
          <b>斷裂點：</b>「{b.position}」<br />
          <span style={{ fontSize: 14 }}>{b.likelyCause}</span><br />
          <span style={{ fontSize: 14 }}>✔ {b.fix}</span>
        </div>
      ))}
      {(fb.naturalnessTips || []).map((t, i) => (
        <div key={i} className="feedback-block">{t}</div>
      ))}
      {fb.encouragement && <p style={{ color: 'var(--good)', fontWeight: 700 }}>{fb.encouragement}</p>}
    </>
  )
}

function CompareView({ t1, t2, fb1, fb2, evaluating }) {
  const s1 = fb1?.completenessScore
  const s2 = fb2?.completenessScore
  return (
    <>
      <h3 style={{ margin: '10px 0' }}>兩次比較</h3>
      {s1 != null && s2 != null && (
        <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat"><div className="num">{s1}</div><div className="lbl">第 1 次</div></div>
          <div className="stat"><div className="num" style={{ color: s2 >= s1 ? 'var(--good)' : 'var(--warn)' }}>{s2}</div><div className="lbl">第 2 次</div></div>
        </div>
      )}
      <Transcript label="第 1 次" text={t1} />
      <Transcript label="第 2 次" text={t2} />
      {evaluating ? <Spinner label="AI 分析第 2 次…" /> : <FeedbackView fb={fb2} />}
      {!evaluating && s1 != null && s2 != null && s2 > s1 && (
        <div className="feedback-block good">📈 進步了 {s2 - s1} 分！重講真的有用。</div>
      )}
    </>
  )
}
