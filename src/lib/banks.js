// Shared operations on the two personal collections:
// errorBank (模組 3) and vocab (模組 4). Schemas per spec Appendix A.

import * as store from './storage.js'
import { newSrs, review, isDue } from './srs.js'

// ---- error bank ----

export function getErrors() {
  return store.get('errorBank', [])
}

export function addError({ type, originalText, correction, sourceModule, note = '' }) {
  const items = getErrors()
  // avoid exact duplicates; refresh existing instead
  const dup = items.find((e) => e.originalText === originalText && e.type === type)
  if (dup) return dup
  const item = {
    id: store.uuid(),
    type, // verbForm | article | plural | posError | fluency
    originalText,
    correction,
    note,
    sourceModule,
    createdAt: new Date().toISOString(),
    srs: newSrs(),
  }
  store.set('errorBank', [item, ...items])
  return item
}

export function reviewError(id, correct) {
  store.update('errorBank', [], (items) =>
    items.map((e) => (e.id === id ? { ...e, srs: review(e.srs, correct) } : e))
  )
}

export function deleteError(id) {
  store.update('errorBank', [], (items) => items.filter((e) => e.id !== id))
}

export function dueErrors() {
  return getErrors().filter((e) => isDue(e.srs))
}

// ---- vocab ----

export function getVocab() {
  return store.get('vocab', [])
}

export function addVocab({ word, partOfSpeech, zhMeaning, example = '', errorType = 'meaning' }) {
  const items = getVocab()
  const dup = items.find((v) => v.word.toLowerCase() === word.toLowerCase())
  if (dup) return dup
  const item = {
    id: store.uuid(),
    word,
    partOfSpeech, // noun | verb | adj | adv | phrasalVerb
    zhMeaning,
    example,
    errorType, // spelling | meaning | usage
    createdAt: new Date().toISOString(),
    srs: newSrs(),
  }
  store.set('vocab', [item, ...items])
  return item
}

export function updateVocab(id, patch) {
  store.update('vocab', [], (items) => items.map((v) => (v.id === id ? { ...v, ...patch } : v)))
}

export function reviewVocab(id, correct) {
  store.update('vocab', [], (items) =>
    items.map((v) => (v.id === id ? { ...v, srs: review(v.srs, correct) } : v))
  )
}

export function deleteVocab(id) {
  store.update('vocab', [], (items) => items.filter((v) => v.id !== id))
}

export function dueVocab() {
  return getVocab().filter((v) => isDue(v.srs))
}

// ---- phrase SRS queue (模組 5：說不出的句子) ----

export function getPhraseQueue() {
  return store.get('phraseQueue', {}) // { [phraseId]: srs }
}

export function queuePhrase(phraseId) {
  store.update('phraseQueue', {}, (q) => ({ ...q, [phraseId]: q[phraseId] || newSrs() }))
}

export function reviewPhrase(phraseId, correct) {
  store.update('phraseQueue', {}, (q) => {
    const srs = review(q[phraseId] || newSrs(), correct)
    // graduate out of the queue after 3 consecutive correct
    if (correct && srs.streak >= 3) {
      const { [phraseId]: _, ...rest } = q
      return rest
    }
    return { ...q, [phraseId]: srs }
  })
}

export function duePhraseIds() {
  const q = getPhraseQueue()
  return Object.keys(q).filter((id) => isDue(q[id]))
}
