// Anthropic API client (browser-direct, key stored locally in this personal app).
// All prompts require pure-JSON responses; callers get parsed objects or a thrown error.

import * as store from './storage.js'

const MODEL = 'claude-sonnet-4-6'

export function getApiKey() {
  return store.get('settings', {}).apiKey || ''
}

export function hasApiKey() {
  return !!getApiKey()
}

async function callClaude(system, userText, maxTokens = 1500) {
  const key = getApiKey()
  if (!key) throw new Error('NO_API_KEY')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userText }],
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API_ERROR ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  const text = (data.content || []).map((b) => b.text || '').join('')
  // strip accidental markdown fences before parsing
  const clean = text.replace(/^```(json)?/m, '').replace(/```\s*$/m, '').trim()
  return JSON.parse(clean)
}

// ---- Module 1: fluency coach (speaking) ----
const FLUENCY_SYSTEM = `You are a fluency coach. The learner is a Mandarin-speaking university student
whose knowledge is fine but whose spoken output breaks mid-sentence.
Evaluate ONLY: sentence completeness, breakdown points, naturalness.
DO NOT correct articles, plurals, or minor grammar — ignore them entirely.
Respond in Traditional Chinese for explanations, English for example sentences.
Return pure JSON (no markdown fences):
{ "completenessScore": 0-100, "breakdowns": [{"position": "quote of the broken fragment", "likelyCause": "繁中說明", "fix": "English example of a complete version"}],
  "naturalnessTips": ["繁中建議，內含英文範例"], "encouragement": "繁中一句鼓勵" }`

export function evaluateFluency(question, transcript, attempt = 1) {
  return callClaude(
    FLUENCY_SYSTEM,
    `Question: ${question}\nAttempt #${attempt} transcript (from speech recognition, so ignore punctuation):\n${transcript}`
  )
}

// ---- Module 2/3: strict accuracy coach (writing / error hunter) ----
const ACCURACY_SYSTEM = `You are a strict accuracy coach. Focus on exactly three error families:
(1) verb form after modals and "to", (2) articles & plurals & countability,
(3) part-of-speech misuse. Flag every instance. Explanations in Traditional Chinese.
Return pure JSON (no markdown fences):
{ "errors": [{"span": "exact erroneous text", "category": "verbForm|article|plural|posError", "correction": "corrected text", "ruleReminder": "繁中規則提醒"}] }`

export function checkWriting(text) {
  return callClaude(ACCURACY_SYSTEM, `Check this text:\n${text}`)
}

// ---- Module 3: variant generation for SRS review ----
const VARIANT_SYSTEM = `You generate practice items for a Mandarin-speaking learner's personal error bank.
Given one recorded error, create 3 NEW sentences that each contain the SAME error point
(same rule being violated), in different everyday/academic contexts.
Return pure JSON (no markdown fences):
{ "variants": [{"wrong": "sentence containing the error", "right": "corrected sentence", "errorSpan": "the erroneous words in the wrong sentence"}] }`

export function generateVariants(errorItem) {
  return callClaude(
    VARIANT_SYSTEM,
    `Error type: ${errorItem.type}\nOriginal error: "${errorItem.originalText}" → correct: "${errorItem.correction}"`
  )
}

// ---- Module 5: translation judging (zh → en) ----
const TRANSLATE_SYSTEM = `You judge whether a learner's spoken English matches a target Chinese prompt.
Accept synonyms and natural variants; the transcript comes from speech recognition, so ignore
punctuation/casing and be tolerant of homophones. Reject only if meaning is wrong or key words missing.
Return pure JSON (no markdown fences):
{ "ok": true/false, "reason": "繁中一句說明", "betterVersion": "a natural English version (only if not ok)" }`

export function judgeTranslation(zh, targetEn, spoken) {
  return callClaude(TRANSLATE_SYSTEM, `Chinese prompt: ${zh}\nReference English: ${targetEn}\nLearner said: ${spoken}`, 400)
}

// ---- Module 2: dynamic detection-passage generation ----
const PASSAGE_SYSTEM = `You write short error-detection passages for a Mandarin-speaking university student
(management/psychology/sociology essays). Write a 3-5 sentence academic-style passage and deliberately
plant 4-6 errors ONLY from these families, imitating these real error patterns:
- verb form after modal or "to" (e.g. "should anchors", "to enables")
- missing article / wrong plural / uncountable used as countable (e.g. "setting clear vision", "some resistances")
- part-of-speech misuse (e.g. "by communication people")
Return pure JSON (no markdown fences):
{ "passage": "the full text WITH errors", "errors": [{"span": "exact erroneous words as they appear", "category": "verbForm|article|plural|posError", "correction": "fixed words", "ruleReminder": "繁中提醒"}] }
Every "span" must appear verbatim exactly once in "passage".`

export function generatePassage(topicHint = '') {
  return callClaude(PASSAGE_SYSTEM, `Generate one passage.${topicHint ? ' Topic hint: ' + topicHint : ''}`)
}

// ---- Module 4: sentence check for vocab practice ----
const SENTENCE_SYSTEM = `You check one learner sentence using a target word. Verify: word used with correct
part of speech and meaning; also flag the three personal error families (verb form after modal/to,
articles/plurals, POS misuse) if present. Explanations in Traditional Chinese.
Return pure JSON (no markdown fences):
{ "ok": true/false, "feedback": "繁中回饋", "betterVersion": "improved sentence (only if not ok)" }`

export function checkSentence(word, pos, sentence) {
  return callClaude(SENTENCE_SYSTEM, `Target word: ${word} (${pos})\nLearner sentence: ${sentence}`, 400)
}
