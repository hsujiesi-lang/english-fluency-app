// 模組 2：錯誤獵人 — 動詞形式快打 / 偵錯題 / 詞性辨析
// 每日混合 10 題；答錯自動寫入個人錯誤庫。

import React, { useEffect, useRef, useState } from 'react'
import { Screen, TimerBar, useCountdown, Spinner, pick, shuffle } from '../lib/ui.jsx'
import { VERB_FORM_DRILLS, DETECTION_PASSAGES, POS_ITEMS } from '../data/errorHunterSeed.js'
import * as banks from '../lib/banks.js'
import * as claude from '../lib/claude.js'
import * as store from '../lib/storage.js'

export default function ErrorHunter({ nav }) {
  const [session, setSession] = useState(null) // [{kind:'verb'|'passage'|'pos', data}]
  const [i, setI] = useState(0)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [done, setDone] = useState(false)

  const build = () => {
    const items = [
      ...pick(VERB_FORM_DRILLS, 5).map((d) => ({ kind: 'verb', data: d })),
      { kind: 'passage', data: pick(DETECTION_PASSAGES, 1)[0] },
      ...pick(POS_ITEMS, 4).map((d) => ({ kind: 'pos', data: d })),
    ]
    // 快打在前熱身，偵錯題壓軸前段，詞性收尾
    setSession(items)
    setI(0)
    setScore({ right: 0, total: 0 })
    setDone(false)
  }

  useEffect(build, [])

  if (!session) return <Screen title="錯誤獵人"><Spinner /></Screen>

  if (done) {
    return (
      <Screen title="錯誤獵人">
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>今日 10 題完成 🎉</h3>
          <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand)', margin: 8 }}>
            {score.right} / {score.total}
          </p>
          <p>答錯的都存進錯誤庫了，明天會回來考你</p>
        </div>
        <div className="btn-row">
          <button className="btn secondary" onClick={() => nav('me', { tab: 'errors' })}>看錯誤庫</button>
          <button className="btn" onClick={build}>再來一輪</button>
        </div>
      </Screen>
    )
  }

  const item = session[i]
  const onResult = (right, count, total) => {
    setScore((s) => ({
      right: s.right + (count ?? (right ? 1 : 0)),
      total: s.total + (total ?? 1),
    }))
    store.logActivity('hunter')
  }
  const next = () => {
    if (i + 1 >= session.length) setDone(true)
    else setI(i + 1)
  }

  return (
    <Screen title="錯誤獵人" sub={`第 ${i + 1} / ${session.length} 題`}>
      {item.kind === 'verb' && <VerbDrill key={i} drill={item.data} onResult={onResult} next={next} />}
      {item.kind === 'passage' && <PassageQ key={i} seed={item.data} onResult={onResult} next={next} />}
      {item.kind === 'pos' && <PosQ key={i} q={item.data} onResult={onResult} next={next} />}
    </Screen>
  )
}

// ---- 題型 1：動詞形式快打（10 秒） ----

const DRILL_SECONDS = 10

function VerbDrill({ drill, onResult, next }) {
  const [answered, setAnswered] = useState(null) // {chosen, correct}
  const answeredRef = useRef(false)
  const [left, , timer] = useCountdown(() => answer(null))
  const [options] = useState(() => (drill.kind === 'fill' ? shuffle(drill.options) : null))

  useEffect(() => { timer.start(DRILL_SECONDS) }, [])

  function answer(choice) {
    if (answeredRef.current) return
    answeredRef.current = true
    timer.stop()
    let correct
    if (drill.kind === 'fill') correct = choice === drill.answer
    else correct = choice === drill.correct // choice: true=句子正確, false=有錯
    setAnswered({ chosen: choice, correct })
    onResult(correct)
    if (!correct) {
      banks.addError({
        type: 'verbForm',
        originalText: drill.kind === 'fill'
          ? drill.sentence.replace('___', choice || drill.options.find((o) => o !== drill.answer))
          : drill.sentence,
        correction: drill.kind === 'fill'
          ? drill.sentence.replace('___', drill.answer)
          : (drill.fixed || drill.sentence),
        sourceModule: 'errorHunter',
        note: drill.rule,
      })
    }
  }

  return (
    <div className="card">
      <span className="tag">動詞形式快打</span>
      <TimerBar secondsLeft={answered ? 0 : left} total={DRILL_SECONDS} />
      <p className="big-question">{drill.sentence}</p>
      {drill.kind === 'fill' && options.map((o) => (
        <button key={o} disabled={!!answered}
          className={'opt' + (answered ? (o === drill.answer ? ' correct' : o === answered.chosen ? ' wrong' : '') : '')}
          onClick={() => answer(o)}>
          {o}
        </button>
      ))}
      {drill.kind === 'judge' && !answered && (
        <div className="btn-row">
          <button className="btn good" onClick={() => answer(true)}>✓ 句子正確</button>
          <button className="btn bad" onClick={() => answer(false)}>✗ 有錯</button>
        </div>
      )}
      {answered && (
        <>
          <div className={'feedback-block ' + (answered.correct ? 'good' : 'bad')}>
            <b>{answered.correct ? '✅ 正確！' : answered.chosen === null ? '⏰ 時間到！' : '❌ 答錯了'}</b>
            <p style={{ margin: '6px 0 0' }}>{drill.rule}</p>
            {drill.kind === 'judge' && drill.fixed && <p style={{ margin: '4px 0 0' }}>✔ {drill.fixed}</p>}
          </div>
          <button className="btn big" onClick={next}>下一題 →</button>
        </>
      )}
    </div>
  )
}

// ---- 題型 2：偵錯題（90 秒，點擊標記） ----

const PASSAGE_SECONDS = 90

function PassageQ({ seed, onResult, next }) {
  const [data, setData] = useState(null)
  const [marked, setMarked] = useState(new Set())
  const [graded, setGraded] = useState(null)
  const gradedRef = useRef(false)
  const markedRef = useRef(marked)
  markedRef.current = marked
  const [left, , timer] = useCountdown(() => grade())

  useEffect(() => {
    let cancelled = false
    // 有 API 金鑰時用 Claude 生成新短文（模仿真實錯誤模式），失敗退回內建題
    if (claude.hasApiKey() && Math.random() < 0.6) {
      claude.generatePassage()
        .then((res) => {
          if (cancelled) return
          const ok = res.passage && Array.isArray(res.errors) &&
            res.errors.every((e) => res.passage.includes(e.span))
          setData(ok ? res : seed)
        })
        .catch(() => !cancelled && setData(seed))
    } else {
      setData(seed)
    }
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (data && !graded) timer.start(PASSAGE_SECONDS)
  }, [data])

  if (!data) return <div className="card"><Spinner label="準備偵錯短文…" /></div>

  // tokenize with char offsets so marks can be matched to error spans
  const tokens = []
  {
    const re = /\S+/g
    let m
    while ((m = re.exec(data.passage))) tokens.push({ text: m[0], start: m.index, end: m.index + m[0].length, idx: tokens.length })
  }
  const spanRanges = data.errors.map((e) => {
    const start = data.passage.indexOf(e.span)
    return { ...e, start, end: start + e.span.length }
  })
  const tokenInSpan = (t, s) => t.start < s.end && t.end > s.start

  const toggle = (idx) => {
    if (gradedRef.current) return
    setMarked((prev) => {
      const nx = new Set(prev)
      nx.has(idx) ? nx.delete(idx) : nx.add(idx)
      return nx
    })
  }

  function grade() {
    if (gradedRef.current) return
    gradedRef.current = true
    timer.stop()
    const mk = markedRef.current
    const found = []
    const missed = []
    for (const s of spanRanges) {
      const hit = tokens.some((t) => mk.has(t.idx) && tokenInSpan(t, s))
      ;(hit ? found : missed).push(s)
    }
    const falseMarks = [...mk].filter((idx) => !spanRanges.some((s) => tokenInSpan(tokens[idx], s))).length
    for (const s of missed) {
      banks.addError({
        type: s.category,
        originalText: s.span,
        correction: s.correction,
        sourceModule: 'errorHunter',
        note: s.ruleReminder,
      })
    }
    setGraded({ found, missed, falseMarks })
    onResult(found.length === spanRanges.length && falseMarks === 0, found.length, spanRanges.length)
  }

  const tokenClass = (t) => {
    if (!graded) return marked.has(t.idx) ? 'token marked' : 'token'
    const inErr = spanRanges.some((s) => tokenInSpan(t, s))
    if (inErr && marked.has(t.idx)) return 'token hit'
    if (inErr) return 'token miss'
    if (marked.has(t.idx)) return 'token marked'
    return 'token'
  }

  return (
    <div className="card">
      <span className="tag">偵錯題</span>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>
        點擊你認為有錯的字（冠詞/單複數/動詞形式/詞性），共 {data.errors.length} 處
      </p>
      {!graded && <TimerBar secondsLeft={left} total={PASSAGE_SECONDS} />}
      <p className="passage">
        {tokens.map((t, k) => (
          <React.Fragment key={k}>
            <span className={tokenClass(t)} onClick={() => toggle(t.idx)}>{t.text}</span>{' '}
          </React.Fragment>
        ))}
      </p>
      {!graded ? (
        <button className="btn big" onClick={grade} disabled={marked.size === 0}>
          交卷（已標記 {marked.size} 處）
        </button>
      ) : (
        <>
          <div className={'feedback-block ' + (graded.missed.length === 0 ? 'good' : 'bad')}>
            找到 {graded.found.length} / {data.errors.length} 處錯誤
            {graded.falseMarks > 0 && `，誤標 ${graded.falseMarks} 處`}
          </div>
          {data.errors.map((e, k) => (
            <div key={k} className="list-item" style={{ padding: '10px 12px' }}>
              <div>
                <s style={{ color: 'var(--bad)' }}>{e.span}</s> → <b style={{ color: 'var(--good)' }}>{e.correction}</b>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{e.ruleReminder}</div>
              </div>
            </div>
          ))}
          <button className="btn big" onClick={next}>下一題 →</button>
        </>
      )}
    </div>
  )
}

// ---- 題型 3：詞性辨析 ----

function PosQ({ q, onResult, next }) {
  const [answered, setAnswered] = useState(null)
  const [options] = useState(() => shuffle(q.options))
  const [sentence, setSentence] = useState('')
  const [checking, setChecking] = useState(false)
  const [sentFeedback, setSentFeedback] = useState(null)

  const answer = (choice) => {
    if (answered) return
    const correct = choice === q.answer
    setAnswered({ chosen: choice, correct })
    onResult(correct)
    if (!correct) {
      banks.addError({
        type: 'posError',
        originalText: q.sentence.replace('___', choice),
        correction: q.sentence.replace('___', q.answer),
        sourceModule: 'errorHunter',
        note: q.explain,
      })
    }
  }

  const checkSentence = async () => {
    setChecking(true)
    try {
      const res = await claude.checkSentence(q.answer, '如題', sentence)
      setSentFeedback(res)
      if (!res.ok) {
        banks.addError({
          type: 'posError',
          originalText: sentence,
          correction: res.betterVersion || '',
          sourceModule: 'errorHunter',
          note: res.feedback,
        })
      }
    } catch {
      setSentFeedback({ ok: true, feedback: '（AI 檢查失敗，先跳過）' })
    }
    setChecking(false)
  }

  return (
    <div className="card">
      <span className="tag">詞性辨析</span>
      <p className="big-question">{q.sentence}</p>
      {options.map((o) => (
        <button key={o} disabled={!!answered}
          className={'opt' + (answered ? (o === q.answer ? ' correct' : o === answered.chosen ? ' wrong' : '') : '')}
          onClick={() => answer(o)}>
          {o}
        </button>
      ))}
      {answered && (
        <>
          <div className={'feedback-block ' + (answered.correct ? 'good' : 'bad')}>
            <b>{answered.correct ? '✅ 正確！' : '❌ 答錯了'}</b>
            <p style={{ margin: '6px 0 0' }}>{q.explain}</p>
          </div>
          {claude.hasApiKey() && !sentFeedback && (
            <>
              <label className="field">進階（可跳過）：用「{q.answer}」造一個句子</label>
              <textarea className="input" rows={2} value={sentence} onChange={(e) => setSentence(e.target.value)} />
              <div className="btn-row">
                <button className="btn secondary" disabled={!sentence.trim() || checking} onClick={checkSentence}>
                  {checking ? '檢查中…' : 'AI 檢查造句'}
                </button>
              </div>
            </>
          )}
          {sentFeedback && (
            <div className={'feedback-block ' + (sentFeedback.ok ? 'good' : 'bad')}>
              {sentFeedback.feedback}
              {sentFeedback.betterVersion && <p style={{ margin: '4px 0 0' }}>✔ {sentFeedback.betterVersion}</p>}
            </div>
          )}
          <button className="btn big" onClick={next}>下一題 →</button>
        </>
      )}
    </div>
  )
}
