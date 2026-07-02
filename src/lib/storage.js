// localStorage wrapper — single namespace, JSON-serialized.
// Designed so the whole store can later move to a backend: all reads/writes
// go through get/set, and exportAll/importAll dump/restore the namespace.

const PREFIX = 'efa:'

export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function set(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function update(key, fallback, fn) {
  const next = fn(get(key, fallback))
  set(key, next)
  return next
}

export function exportAll() {
  const out = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k.startsWith(PREFIX)) out[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k))
  }
  return out
}

export function importAll(data) {
  for (const [k, v] of Object.entries(data)) set(k, v)
}

export function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ---- activity log / streak ----

export function logActivity(moduleId, count = 1) {
  const today = todayStr()
  update('activity', {}, (act) => {
    const day = act[today] || {}
    day[moduleId] = (day[moduleId] || 0) + count
    act[today] = day
    return act
  })
}

export function getTodayActivity() {
  return get('activity', {})[todayStr()] || {}
}

export function getStreak() {
  const act = get('activity', {})
  let streak = 0
  const d = new Date()
  // today counts if any activity; otherwise start from yesterday
  if (!act[todayStr(d)]) d.setDate(d.getDate() - 1)
  while (act[todayStr(d)]) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
