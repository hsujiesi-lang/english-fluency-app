// Simplified SM-2: correct → interval ×2.5 (start 1 day); wrong → reset to 1 day (Learning).

export function newSrs() {
  return { interval: 1, due: new Date().toISOString(), streak: 0 }
}

export function review(srs, correct) {
  const s = { ...(srs || newSrs()) }
  if (correct) {
    s.streak = (s.streak || 0) + 1
    s.interval = s.streak === 1 ? 1 : Math.round((s.interval || 1) * 2.5 * 10) / 10
  } else {
    s.streak = 0
    s.interval = 1
  }
  const due = new Date()
  due.setDate(due.getDate() + Math.max(1, Math.round(s.interval)))
  // wrong answers come back the same day (Learning): due in 10 minutes
  if (!correct) due.setTime(Date.now() + 10 * 60 * 1000)
  s.due = due.toISOString()
  return s
}

export function isDue(srs) {
  if (!srs || !srs.due) return true
  return new Date(srs.due) <= new Date()
}

export function dueItems(items) {
  return (items || []).filter((it) => isDue(it.srs))
}
