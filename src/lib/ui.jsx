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
