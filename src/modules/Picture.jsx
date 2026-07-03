// 模組 8：圖片描述訓練 — 同一張圖可切換「寫作版」（嚴格抓三類錯 + contentAccuracy）
// 與「口說版」（只評流暢度 + 強制重講）。五句鷹架可在設定開關。Lv1-4 難度階梯。

import React, { useEffect, useRef, useState } from 'react'
import { Screen, TimerBar, useCountdown, Spinner, onDoubleEnter } from '../lib/ui.jsx'
import * as images from '../lib/images.js'
import * as speech from '../lib/speech.js'
import * as claude from '../lib/claude.js'
import * as banks from '../lib/banks.js'
import * as store from '../lib/storage.js'

const WRITE_SECONDS = 300
const PREP_SECONDS = 30
const SPEAK_1 = 60
const SPEAK_2 = 45

const LEVELS = {
  1: { label: 'Lv1 五句描述', req: 'Write 5 separate sentences: overview, subject (there is/are), position (preposition), action (present continuous), speculation (might/could/seems to + base verb).' },
  2: { label: 'Lv2 連貫段落', req: 'Write ONE coherent paragraph (not numbered sentences) using at least two connectives (however, therefore, while, in addition, after that...).' },
  3: { label: 'Lv3 兩圖比較', req: 'Compare the TWO images in a short paragraph. Must use "whereas" or "in contrast" at least once.' },
  4: { label: 'Lv4 圖表描述', req: 'Describe this chart/diagram academically: start with "The chart/graph/diagram shows...", report key numbers or stages, and end with one overall trend sentence.' },
}

const SCAFFOLD = [
  '① 整體：This picture shows…',
  '② 主體：There is / There are…',
  '③ 位置：in / on / at / next to / behind…',
  '④ 動作：…is/are + V-ing',
  '⑤ 推測：It might / could / seems to + 原形',
]

const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)

export default function Picture({ nav }) {
  const [level, setLevel] = useState(() => store.get('pictureLevel', 1))
  const [mode, setMode] = useState(() => (dayOfYear() % 2 === 0 ? 'writing' : 'speaking'))
  const [imgs, setImgs] = useState([]) // display URLs or data URLs
  const [running, setRunning] = useState(false)
  const fileRef = useRef(null)

  const newImages = (lv = level) => {
    if (lv === 4) {
      const c = images.CHARTS[Math.floor(Math.random() * images.CHARTS.length)]
      setImgs([images.chartUrl(c.file)])
    } else if (lv === 3) {
      setImgs([images.randomPhotoUrl(), images.randomPhotoUrl()])
    } else {
      setImgs([images.randomPhotoUrl()])
    }
  }

  useEffect(() => newImages(level), [])

  const changeLevel = (lv) => {
    setLevel(lv)
    store.set('pictureLevel', lv)
    newImages(lv)
  }

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const raw = await images.blobToDataUrl(file)
    const small = await images.downscaleDataUrl(raw)
    setImgs([small])
    e.target.value = ''
  }

  if (running) {
    const props = { level, imgs, onExit: () => setRunning(false) }
    return mode === 'writing' ? <WritingRun {...props} /> : <SpeakingRun {...props} />
  }

  const todaySuggested = dayOfYear() % 2 === 0 ? 'writing' : 'speaking'
  return (
    <Screen title="圖片描述" sub="一張圖，同時練介係詞、modal＋原形、冠詞單複數">
      <div className="tabs">
        {Object.entries(LEVELS).map(([k, v]) => (
          <button key={k} className={level === Number(k) ? 'active' : ''} onClick={() => changeLevel(Number(k))}>{v.label}</button>
        ))}
      </div>
      <div className="card">
        <ImageView imgs={imgs} />
        <div className="btn-row">
          <button className="btn secondary" onClick={() => newImages()}>🔀 換一張圖</button>
          {level <= 2 && <button className="btn secondary" onClick={() => fileRef.current.click()}>📷 用自己的照片</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={upload} />
      </div>
      <div className="card">
        <div className="tabs" style={{ marginBottom: 8 }}>
          <button className={mode === 'writing' ? 'active' : ''} onClick={() => setMode('writing')}>
            ✍️ 寫作版{todaySuggested === 'writing' ? '（今日建議）' : ''}
          </button>
          <button className={mode === 'speaking' ? 'active' : ''} onClick={() => setMode('speaking')}>
            🎙️ 口說版{todaySuggested === 'speaking' ? '（今日建議）' : ''}
          </button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {mode === 'writing'
            ? `限時 5 分鐘。嚴格批改三類錯誤＋內容是否符合畫面。`
            : `準備 ${PREP_SECONDS} 秒 → 口述 ${SPEAK_1} 秒 → 強制重講 ${SPEAK_2} 秒。只評流暢度。`}
        </p>
        {!claude.hasApiKey() && (
          <div className="notice">未設定 API 金鑰：改用鷹架清單自我批改（在設定頁加金鑰可獲得 AI 看圖回饋）。</div>
        )}
        {mode === 'speaking' && !speech.sttSupported() && (
          <div className="notice">⚠️ 此瀏覽器不支援語音辨識，口說版會改用打字。</div>
        )}
        <button className="btn big" onClick={() => setRunning(true)} disabled={imgs.length === 0}>開始</button>
      </div>
    </Screen>
  )
}

function ImageView({ imgs }) {
  // 主來源掛掉時自動換備援（loremflickr → picsum → 提示換一張）
  const onErr = (e) => {
    const img = e.target
    const tries = Number(img.dataset.tries || 0)
    if (tries === 0) {
      img.dataset.tries = 1
      img.src = images.fallbackPhotoUrl()
    } else {
      img.style.display = 'none'
      img.insertAdjacentHTML('afterend',
        '<div style="flex:1;padding:28px 12px;text-align:center;background:#fee2e2;border-radius:12px;font-size:14px;color:#dc2626">圖片載入失敗 — 請檢查網路後按「換一張圖」</div>')
    }
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {imgs.map((src, i) => (
        <img key={src} src={src} alt={'圖 ' + (i + 1)} onError={onErr}
          style={{ width: imgs.length === 2 ? '50%' : '100%', borderRadius: 12, background: '#e5e7eb', minHeight: 120, objectFit: 'cover' }} />
      ))}
    </div>
  )
}

function ScaffoldHints() {
  const on = store.get('settings', {}).scaffold !== false
  if (!on) return null
  return (
    <div className="feedback-block" style={{ fontSize: 14 }}>
      {SCAFFOLD.map((s) => <div key={s}>{s}</div>)}
    </div>
  )
}

async function toDataUrls(imgs) {
  return Promise.all(imgs.map(async (src) =>
    src.startsWith('data:') ? images.downscaleDataUrl(src) : images.urlToDataUrl(src)
  ))
}

// ---- 本地鷹架檢查（無金鑰的主動自我批改）----
function localChecklist(text, level) {
  const t = ' ' + text.toLowerCase() + ' '
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 2)
  const checks = []
  if (level === 1) checks.push({ label: '寫滿 5 句', ok: sentences.length >= 5 })
  checks.push({ label: '有 There is / There are', ok: /there\s+(is|are|was|were)/.test(t) })
  checks.push({ label: '有位置介係詞（in/on/at/next to/behind…）', ok: /\s(in|on|at|next to|behind|near|under|above|in front of|beside)\s/.test(t) })
  checks.push({ label: '有現在進行式（is/are + V-ing）', ok: /\s(is|are)\s+\w+ing\s/.test(t) })
  checks.push({ label: '有推測句（might/could/may/seems to + 原形）', ok: /\s(might|could|may|must)\s+\w+|seems?\s+to\s+\w+/.test(t) })
  if (level === 2) checks.push({ label: '用了至少 2 個連接詞', ok: (t.match(/\s(however|therefore|while|in addition|moreover|after that|because|although)\s/g) || []).length >= 2 })
  if (level === 3) checks.push({ label: '用了 whereas / in contrast', ok: /whereas|in contrast/.test(t) })
  if (level === 4) checks.push({ label: '學術開頭（The chart/graph/diagram shows…）', ok: /the (chart|graph|diagram|figure|process)\s+(shows|illustrates|presents|describes)/.test(t) })
  if (level === 4) checks.push({ label: '有引用數據/階段', ok: /\d/.test(text) })
  return checks
}

// ---- 寫作版 ----

function WritingRun({ level, imgs, onExit }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('writing') // writing | judging | feedback
  const [result, setResult] = useState(null) // {errors, contentAccuracy, taskCheck, praise} | {checks}
  const textRef = useRef('')
  textRef.current = text
  const [left, , timer] = useCountdown(() => submit())

  useEffect(() => { timer.start(WRITE_SECONDS) }, [])

  async function submit() {
    timer.stop()
    const content = textRef.current.trim()
    if (!content) { onExit(); return }
    store.logActivity('picture')
    setPhase('judging')
    if (claude.hasApiKey()) {
      try {
        const dataUrls = await toDataUrls(imgs)
        const res = await claude.checkPictureWriting(dataUrls, content, LEVELS[level].req)
        for (const e of res.errors || []) {
          banks.addError({
            type: e.category, originalText: e.span, correction: e.correction,
            sourceModule: 'picture', note: e.ruleReminder,
          })
        }
        setResult(res)
      } catch (err) {
        setResult({ checks: localChecklist(content, level), apiError: err.message })
      }
    } else {
      setResult({ checks: localChecklist(content, level) })
    }
    setPhase('feedback')
  }

  return (
    <Screen title={'圖片描述 · 寫作版 · ' + LEVELS[level].label} onBack={onExit}>
      <div className="card">
        <ImageView imgs={imgs} />
        {phase === 'writing' && (
          <>
            <TimerBar secondsLeft={left} total={WRITE_SECONDS} />
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>剩 {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}　{LEVELS[level].label}</p>
            <ScaffoldHints />
            <textarea className="input" rows={7} autoFocus value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={onDoubleEnter(submit)}
              placeholder={(level === 1 ? 'This picture shows…\nThere are…\n…' : 'Write here…') + '\n（連按兩次 Enter 提交）'} />
            <div className="btn-row">
              <button className="btn" onClick={submit} disabled={!text.trim()}>提交批改</button>
            </div>
          </>
        )}
        {phase === 'judging' && <Spinner label="AI 看圖批改中…" />}
        {phase === 'feedback' && result && (
          <>
            <div className="transcript" style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
            {result.apiError && <div className="notice">AI 批改失敗（{result.apiError.slice(0, 60)}），改用鷹架自我檢查：</div>}
            {result.checks && (
              <>
                {result.checks.map((c, k) => (
                  <div key={k} className={'feedback-block ' + (c.ok ? 'good' : 'bad')} style={{ padding: '6px 12px' }}>
                    {c.ok ? '✅' : '❌'} {c.label}
                  </div>
                ))}
              </>
            )}
            {result.errors && (
              <>
                {result.errors.length === 0
                  ? <div className="feedback-block good">✅ 三類目標錯誤：0 個，太強了！</div>
                  : result.errors.map((e, k) => (
                    <div key={k} className="feedback-block bad">
                      <s>{e.span}</s> → <b>{e.correction}</b>
                      <span style={{ display: 'block', fontSize: 13 }}>{e.ruleReminder}</span>
                    </div>
                  ))}
                {result.contentAccuracy && (
                  <div className="feedback-block">
                    🖼️ 內容符合度 <b>{result.contentAccuracy.score}</b>/100 — {result.contentAccuracy.comment}
                  </div>
                )}
                {result.taskCheck && (
                  <div className={'feedback-block ' + (result.taskCheck.done ? 'good' : 'bad')}>
                    {result.taskCheck.done ? '✅' : '❌'} 本關要求：{result.taskCheck.comment}
                  </div>
                )}
                {result.praise && <p style={{ color: 'var(--good)', fontWeight: 700 }}>{result.praise}</p>}
              </>
            )}
            <button className="btn big" onClick={onExit}>完成，返回</button>
          </>
        )}
      </div>
    </Screen>
  )
}

// ---- 口說版（30 秒準備 → 60 秒口述 → 回饋 → 強制重講 45 秒 → 比較）----

function SpeakingRun({ level, imgs, onExit }) {
  const [phase, setPhase] = useState('prep')
  const [live, setLive] = useState('')
  const [t1, setT1] = useState('')
  const [t2, setT2] = useState('')
  const [fb1, setFb1] = useState(null)
  const [fb2, setFb2] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const recRef = useRef(null)
  const liveRef = useRef('')
  liveRef.current = live
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const canSpeak = speech.sttSupported()

  const [left, , timer] = useCountdown(() => {
    if (phaseRef.current === 'prep') beginSpeak(1)
    else if (phaseRef.current === 'speak1') endSpeak(1)
    else if (phaseRef.current === 'speak2') endSpeak(2)
  })

  useEffect(() => { timer.start(PREP_SECONDS) }, [])
  useEffect(() => () => { if (recRef.current) recRef.current.stop() }, [])

  const beginSpeak = (attempt) => {
    timer.stop()
    setLive('')
    setPhase('speak' + attempt)
    timer.start(attempt === 1 ? SPEAK_1 : SPEAK_2)
    if (canSpeak) {
      recRef.current = speech.listen({ onUpdate: (t) => setLive(t), onEnd: () => {}, onError: () => {} })
    }
  }

  async function endSpeak(attempt) {
    timer.stop()
    if (recRef.current) { recRef.current.stop(); recRef.current = null }
    const text = liveRef.current.trim()
    attempt === 1 ? setT1(text) : setT2(text)
    store.logActivity('picture')
    setPhase('feedback' + attempt)
    if (!text || !claude.hasApiKey()) return
    setEvaluating(true)
    try {
      const dataUrls = await toDataUrls(imgs)
      const fb = await claude.evaluatePictureSpeaking(dataUrls, text, attempt)
      if (attempt === 1) {
        setFb1(fb)
        for (const b of fb.breakdowns || []) {
          banks.addError({ type: 'fluency', originalText: b.position, correction: b.fix, sourceModule: 'picture', note: b.likelyCause })
        }
      } else setFb2(fb)
    } catch (e) {
      const err = { naturalnessTips: ['AI 評分失敗：' + e.message.slice(0, 60)] }
      attempt === 1 ? setFb1(err) : setFb2(err)
    }
    setEvaluating(false)
  }

  const FbView = ({ fb }) => fb ? (
    <>
      {fb.completenessScore != null && <p>完整度：<b style={{ color: 'var(--brand)', fontSize: 24 }}>{fb.completenessScore}</b>/100</p>}
      {(fb.breakdowns || []).map((b, k) => (
        <div key={k} className="feedback-block bad">「{b.position}」<br /><span style={{ fontSize: 14 }}>{b.likelyCause}<br />✔ {b.fix}</span></div>
      ))}
      {(fb.naturalnessTips || []).map((tip, k) => <div key={k} className="feedback-block">{tip}</div>)}
      {fb.contentAccuracy && <div className="feedback-block">🖼️ 內容符合度 <b>{fb.contentAccuracy.score}</b>/100 — {fb.contentAccuracy.comment}</div>}
      {fb.encouragement && <p style={{ color: 'var(--good)', fontWeight: 700 }}>{fb.encouragement}</p>}
    </>
  ) : (
    <div className="feedback-block">自我檢查：五句鷹架都講到了嗎？哪裡卡住了？重講時把卡住的那句說完整。</div>
  )

  return (
    <Screen title={'圖片描述 · 口說版 · ' + LEVELS[level].label} onBack={onExit}>
      <div className="card">
        <ImageView imgs={imgs} />
        {phase === 'prep' && (
          <>
            <TimerBar secondsLeft={left} total={PREP_SECONDS} />
            <p style={{ color: 'var(--muted)' }}>💭 準備中… {left} 秒後自動開始錄音</p>
            <ScaffoldHints />
            <button className="btn big" onClick={() => beginSpeak(1)}>直接開始 🎤</button>
          </>
        )}
        {(phase === 'speak1' || phase === 'speak2') && (
          <>
            <TimerBar secondsLeft={left} total={phase === 'speak1' ? SPEAK_1 : SPEAK_2} />
            <p><span className="recording-dot" />第 {phase === 'speak1' ? 1 : 2} 次口述… {left}s</p>
            {canSpeak
              ? <div className="transcript">{live || <span style={{ color: 'var(--muted)' }}>開始描述…</span>}</div>
              : <textarea className="input" rows={4} autoFocus value={live} onChange={(e) => setLive(e.target.value)} placeholder="打字模式…" />}
            <button className="btn big bad" onClick={() => endSpeak(phase === 'speak1' ? 1 : 2)}>提前結束</button>
          </>
        )}
        {phase === 'feedback1' && (
          <>
            <div className="transcript">{t1 || '（無內容）'}</div>
            {evaluating ? <Spinner label="AI 看圖評分…" /> : (
              <>
                <FbView fb={fb1} />
                <div className="feedback-block">🔁 <b>立刻重講一次（{SPEAK_2} 秒）— 第二次一定更順。</b></div>
                <button className="btn big" onClick={() => beginSpeak(2)}>🎤 重講一次</button>
              </>
            )}
          </>
        )}
        {phase === 'feedback2' && (
          <>
            {fb1?.completenessScore != null && fb2?.completenessScore != null && (
              <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="stat"><div className="num">{fb1.completenessScore}</div><div className="lbl">第 1 次</div></div>
                <div className="stat"><div className="num" style={{ color: fb2.completenessScore >= fb1.completenessScore ? 'var(--good)' : 'var(--warn)' }}>{fb2.completenessScore}</div><div className="lbl">第 2 次</div></div>
              </div>
            )}
            <p style={{ fontWeight: 700, margin: '8px 0 2px' }}>第 1 次</p>
            <div className="transcript">{t1 || '（無內容）'}</div>
            <p style={{ fontWeight: 700, margin: '8px 0 2px' }}>第 2 次</p>
            <div className="transcript">{t2 || '（無內容）'}</div>
            {evaluating ? <Spinner label="AI 評第 2 次…" /> : <FbView fb={fb2} />}
            {!evaluating && <button className="btn big" onClick={onExit}>完成，返回</button>}
          </>
        )}
      </div>
    </Screen>
  )
}
