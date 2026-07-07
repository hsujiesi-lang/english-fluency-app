// Web Speech API helpers: TTS (speechSynthesis) + STT (SpeechRecognition).
// iOS Safari has limited SpeechRecognition support — always feature-detect
// with sttSupported() and offer a typing fallback in the UI.

import * as store from './storage.js'

export function sttSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function ttsSupported() {
  return 'speechSynthesis' in window
}

export function getLang() {
  return store.get('settings', {}).sttLang || 'en-AU'
}

let lastCancelAt = 0

function speakOnce(text, { rate, lang }) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang || getLang()
    u.rate = rate
    const voices = speechSynthesis.getVoices()
    const base = u.lang.split('-')[0]
    const v = voices.find((v) => v.lang === u.lang)
      || voices.find((v) => v.lang.replace('_', '-').startsWith(base))
    if (v) u.voice = v // 找不到就交給瀏覽器依 u.lang 選預設聲音
    const t0 = Date.now()
    u.onend = () => resolve(Date.now() - t0)
    u.onerror = () => resolve(Date.now() - t0)
    // Chrome 已知問題：synthesis 可能卡在 paused 狀態 → 先 resume 再講
    speechSynthesis.resume()
    speechSynthesis.speak(u)
  })
}

export async function speak(text, { rate = 1.0, lang } = {}) {
  if (!ttsSupported()) return
  // 只在真的有殘留語音時才 cancel，並稍等一下 —
  // Chrome 的 cancel() 之後立刻 speak() 常會把新語音靜默吃掉
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel()
    await new Promise((r) => setTimeout(r, 120))
  }
  const ms = await speakOnce(text, { rate, lang })
  // 幾乎瞬間就「結束」＝八成沒真的播出來（被 cancel 競態吃掉）→ 重試一次。
  // 但如果是使用者剛按了暫停（stopSpeaking），就不要重試。
  if (ms < 60 && text.length > 2 && Date.now() - lastCancelAt > 500) {
    await new Promise((r) => setTimeout(r, 250))
    await speakOnce(text, { rate, lang })
  }
}

export function stopSpeaking() {
  if (!ttsSupported()) return
  lastCancelAt = Date.now()
  speechSynthesis.cancel()
}

// Continuous recognizer with live interim results.
// Returns { stop() }; calls onUpdate(fullTranscript, isFinalChunk) as text arrives.
export function listen({ onUpdate, onEnd, onError, continuous = true } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    onError && onError(new Error('SpeechRecognition not supported'))
    return { stop: () => {} }
  }
  const rec = new SR()
  rec.lang = getLang()
  rec.continuous = continuous
  rec.interimResults = true
  let finalText = ''
  let stopped = false

  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += t + ' '
      else interim += t
    }
    onUpdate && onUpdate((finalText + interim).trim(), false)
  }
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return
    onError && onError(new Error(e.error))
  }
  rec.onend = () => {
    // Chrome stops recognition after silence; restart if user hasn't stopped.
    if (!stopped && continuous) {
      try { rec.start() } catch { /* already started */ }
      return
    }
    onEnd && onEnd(finalText.trim())
  }
  try { rec.start() } catch (err) { onError && onError(err) }

  return {
    stop() {
      stopped = true
      try { rec.stop() } catch { /* noop */ }
    },
  }
}

// Fuzzy match a spoken answer against acceptable variants (rule-based fallback
// when no Claude API key is set). Normalizes and checks token overlap.
export function fuzzyMatch(spoken, target, acceptList = []) {
  const norm = (s) =>
    s.toLowerCase()
      .replace(/[^a-z0-9\s']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const sp = norm(spoken)
  if (!sp) return { ok: false, score: 0 }
  const candidates = [target, ...acceptList].map(norm)
  // exact / containment
  for (const c of candidates) {
    if (sp === c || sp.includes(c) || c.includes(sp)) return { ok: true, score: 1 }
  }
  // token overlap: content words of the best candidate
  const STOP = new Set(['the', 'a', 'an', 'my', 'to', 'for', 'some', 'and', 'or', 'of', 'up', 'out', 'in', 'on', 'at'])
  let best = 0
  for (const c of candidates) {
    const ct = c.split(' ').filter((w) => !STOP.has(w))
    if (!ct.length) continue
    const spSet = new Set(sp.split(' '))
    const hit = ct.filter((w) => spSet.has(w)).length
    best = Math.max(best, hit / ct.length)
  }
  return { ok: best >= 0.7, score: best }
}
