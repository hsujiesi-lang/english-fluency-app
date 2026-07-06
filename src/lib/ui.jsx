// Small shared UI pieces + hooks used across modules.

import React, { useEffect, useRef, useState } from 'react'

export function Screen({ title, sub, onBack, children }) {
  return (
    <div className="screen">
      {onBack && (
        <div className="back-row">
          <button className="btn ghost" onClick={onBack}>← 返回</button>
        </div>
      )}
      {title && <h1 className="screen-title">{title}</h1>}
      {sub && <p className="screen-sub">{sub}</p>}
      {children}
    </div>
  )
}

export function TimerBar({ secondsLeft, total }) {
  const pct = Math.max(0, Math.min(100, (secondsLeft / total) * 100))
  return (
    <div className={'timerbar' + (secondsLeft <= 5 ? ' danger' : '')}>
      <div style={{ width: pct + '%' }} />
    </div>
  )
}

// Countdown hook: returns [secondsLeft, running, {start, stop, reset}]
export function useCountdown(onExpire) {
  const [left, setLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const ref = useRef({ timer: null, onExpire })
  ref.current.onExpire = onExpire

  const stop = () => {
    if (ref.current.timer) clearInterval(ref.current.timer)
    ref.current.timer = null
    setRunning(false)
  }

  const start = (seconds) => {
    stop()
    setLeft(seconds)
    setRunning(true)
    let remaining = seconds
    ref.current.timer = setInterval(() => {
      remaining -= 1
      setLeft(Math.max(0, remaining))
      if (remaining <= 0) {
        clearInterval(ref.current.timer)
        ref.current.timer = null
        setRunning(false)
        ref.current.onExpire && ref.current.onExpire()
      }
    }, 1000)
  }

  useEffect(() => stop, [])
  return [left, running, { start, stop }]
}

export function Spinner({ label = '思考中…' }) {
  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
      <span className="spin" /> {label}
    </p>
  )
}

// Textarea helper: pressing Enter twice in a row (blank line) submits.
// At the second Enter keydown, the value still ends with the first "\n".
export function onDoubleEnter(submit) {
  return (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    const v = e.target.value
    if (v.trim() && /\n\s*$/.test(v)) {
      e.preventDefault()
      submit()
    }
  }
}

// 答完題（回饋顯示中）連按兩次 Enter → 下一題。
// active 為 true 時掛全域監聽；正在輸入框裡打字時不觸發。
export function useDoubleEnterNext(active, onNext) {
  const fnRef = useRef(onNext)
  fnRef.current = onNext
  const lastRef = useRef(0)
  useEffect(() => {
    if (!active) return
    const h = (e) => {
      if (e.key !== 'Enter') return
      const tag = e.target?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      const now = Date.now()
      if (now - lastRef.current < 800) {
        lastRef.current = 0
        fnRef.current()
      } else {
        lastRef.current = now
      }
    }
    window.addEventListener('keydown', h)
    return () => { window.removeEventListener('keydown', h); lastRef.current = 0 }
  }, [active])
}

// 回合結束時的錯題總覽。items: [{q, your, right, why}]
export function WrongList({ items }) {
  if (!items || items.length === 0) {
    return <div className="feedback-block good" style={{ textAlign: 'left' }}>🎯 本回合全對，沒有錯題！</div>
  }
  return (
    <div style={{ textAlign: 'left' }}>
      <h3 style={{ margin: '14px 0 8px', fontSize: 16 }}>❌ 本回合錯題（{items.length}）</h3>
      {items.map((w, k) => (
        <div key={k} className="feedback-block bad" style={{ margin: '8px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{w.q}</div>
          {w.your != null && String(w.your).trim() !== '' && (
            <div style={{ fontSize: 14 }}>妳的答案:<s style={{ marginLeft: 4 }}>{w.your}</s></div>
          )}
          <div style={{ fontSize: 14 }}>正解:<b style={{ marginLeft: 4, color: 'var(--good)' }}>{w.right}</b></div>
          {w.why && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{w.why}</div>}
        </div>
      ))}
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>這些都已存進錯誤庫，之後會排程複習</p>
    </div>
  )
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pick(arr, n) {
  return shuffle(arr).slice(0, n)
}
