// 從使用者 Notion「Englishhhh」筆記整合的題庫（2026-07-03 匯入）。
// 冠詞題完全依照她自己整理的系統：純抽象不加冠詞 / 被限定加 the / 變成經驗加 a / 泛指用複數。
// 用法題來自她口語文章的真實錯誤修正（locates→is located、six hundreds→six hundred…）。

// ---- 冠詞加強題（併入寫作→冠詞區分）----
export const ARTICLE_EXTRA = [
  {
    text: 'Students often feel ___ pressure before exams.',
    blanks: [{ answer: ['×'], why: '純抽象概念（pressure）不加冠詞 — 妳的筆記：feel pressure' }],
  },
  {
    text: '___ pressure of final exams keeps me up at night.',
    blanks: [{ answer: ['the'], why: '抽象名詞被 of 限定 → the（the pressure of exams）' }],
  },
  {
    text: 'Moving abroad alone was ___ challenge, but it built ___ confidence.',
    blanks: [
      { answer: ['a'], why: '抽象概念變成「一次經驗」→ a challenge' },
      { answer: ['×'], why: 'confidence 純抽象、泛指 → 不加冠詞（build confidence）' },
    ],
  },
  {
    text: 'Passing the exam on my first try was ___ success.',
    blanks: [{ answer: ['a'], why: '抽象概念變成「一件事」→ a success' }],
  },
  {
    text: 'We live in ___ society that values productivity over rest.',
    blanks: [{ answer: ['a'], why: '「作為一種社會形態」→ a society that…' }],
  },
  {
    text: '___ society places pressure on young people.',
    blanks: [{ answer: ['×'], why: 'society 泛指時不加冠詞 — 妳的筆記：society places pressure' }],
  },
  {
    text: 'Missing ___ deadline was ___ failure I often made in high school.',
    blanks: [
      { answer: ['the'], why: '不是抽象概念、被預設已知 → the deadline' },
      { answer: ['a'], why: '抽象變成一件事 → a failure' },
    ],
  },
  {
    text: 'I started ___ university in February.',
    blanks: [{ answer: ['×'], why: 'college / school / university 當「人生階段」不加 the' }],
  },
  {
    text: '___ stress that students face is often invisible.',
    blanks: [{ answer: ['the'], why: '被 that 子句限定 → the stress that…' }],
  },
  {
    text: 'It came as ___ shock when the course was cancelled.',
    blanks: [{ answer: ['a'], why: '抽象變成一次事件 → a shock' }],
  },
  {
    text: 'Many Asian students feel constrained by ___ education system.',
    blanks: [{ answer: ['the'], why: '具體已知的東西 → the system / the workplace' }],
  },
  {
    text: 'They are fighting for ___ freedom.',
    blanks: [{ answer: ['×'], why: '純抽象概念 → fight for freedom，不加冠詞' }],
  },
  {
    text: 'Facing ___ reality of adulthood is hard.',
    blanks: [{ answer: ['the'], why: '特定現實 → the reality of adulthood' }],
  },
]

// ---- 用法辨析（寫作→新 section；全部來自她的筆記/真實錯誤）----
export const USAGE_CLOZE = [
  { text: "There's a nice cafe ___ my school.", blanks: [{ answer: ['near'], why: 'near 是介係詞，後面接名詞；nearby 是副詞放句尾（I live nearby.）' }] },
  { text: 'I live ___, so I can walk to campus.', blanks: [{ answer: ['nearby'], why: 'nearby 當副詞放句尾，不接名詞' }] },
  { text: 'My apartment ___ in Melbourne CBD.', blanks: [{ answer: ['is located', 'is situated'], why: '要說 be located，不能說 locates（妳的真實錯誤修正）' }] },
  { text: 'Before ___ into the new apartment, I lived in a student accommodation.', blanks: [{ answer: ['moving'], why: 'before + V-ing（或 before I moved）' }] },
  { text: 'The rent was six ___ dollars per week.', blanks: [{ answer: ['hundred'], why: 'hundred 當數量詞不加 s（six hundreds ❌）' }] },
  { text: 'My new home is on ___ 49th floor.', blanks: [{ answer: ['the'], why: '序數（49th）前面要加 the' }] },
  { text: 'We had a meeting ___ morning, so I got up early.', blanks: [{ answer: ['this'], why: '特定的某一天用 this morning，不是 in the morning' }] },
  { text: 'I just want to go home ___ a quick nap.', blanks: [{ answer: ['for'], why: '生活小事、習慣 → for；明確行為、意圖 → to have' }] },
  { text: 'She went to the clinic to ___ a check-up.', blanks: [{ answer: ['have'], why: '事件性行為（check-up / shower / talk / meeting）固定用 to have' }] },
  { text: 'I spent four months ___ for a suitable unit.', blanks: [{ answer: ['searching', 'looking'], why: 'spend + 時間/金錢 + V-ing（spent months to find ❌）' }] },
  { text: "I've been really busy ___.", blanks: [{ answer: ['recently', 'lately'], why: 'recently 搭配現在完成式（I\'ve been… recently）' }] },
  { text: 'There are ___ opportunities for beginners, so it is hard to start.', blanks: [{ answer: ['few'], why: 'few = 很少（負面）；a few = 有一些（正面）— 可數名詞' }] },
  { text: 'I have read ___ few chapters of this book already.', blanks: [{ answer: ['a'], why: 'a few = 有一些（正面）' }] },
  { text: 'There are ___ students this year than last year.', blanks: [{ answer: ['fewer'], why: 'fewer + 可數；less + 不可數' }] },
  { text: 'I got ___ great score on the essay.', blanks: [{ answer: ['a'], why: 'a great score（單數）/ great scores（複數）' }] },
  { text: 'Long-distance ___ are hard to maintain.', blanks: [{ answer: ['relationships'], why: '泛指一類社會現象 → 複數（long-distance relationships）' }] },
  { text: 'We have plenty of ___ before the deadline.', blanks: [{ answer: ['time'], why: 'plenty of + 不可數名詞（time / money / space / information）' }] },
  { text: 'I have watched this movie ___ couple of times.', blanks: [{ answer: ['a'], why: 'a couple of ≈ 大約兩個，接可數複數（times / days / years）' }] },
  { text: 'The living room is ___ to the kitchen.', blanks: [{ answer: ['connected', 'next', 'close', 'adjacent'], why: 'connected / next / close / adjacent + to（妳的筆記四種說法都對）' }] },
  { text: 'I am practising ___ conversation for my speaking test.', blanks: [{ answer: ['everyday'], why: 'everyday（形容詞，連寫）＝日常的；every day（分開）＝每天（副詞）' }] },
  { text: 'We chat ___ about our lives in Melbourne.', blanks: [{ answer: ['every day'], why: 'every day（分開寫）當副詞 = 每天' }] },
]

// ---- 錯誤獵人加強判斷題（她的真實錯誤模式）----
export const JUDGE_EXTRA = [
  { kind: 'judge', sentence: 'My apartment locates in the CBD.', correct: false, fixed: 'My apartment is located in the CBD.', rule: 'be located：不能說 locates（妳 Notion 裡的真實錯誤）' },
  { kind: 'judge', sentence: 'The fee was six hundreds per week.', correct: false, fixed: 'The fee was six hundred dollars per week.', rule: 'hundred 當數量詞不加 s' },
  { kind: 'judge', sentence: "There's a cafe nearby my apartment.", correct: false, fixed: "There's a cafe near my apartment.", rule: 'near 接名詞；nearby 不接名詞（放句尾或名詞前）' },
  { kind: 'judge', sentence: 'I enjoy to cook after class.', correct: false, fixed: 'I enjoy cooking after class.', rule: 'enjoy 是及物動詞：enjoy + V-ing / enjoy the + n.' },
  { kind: 'judge', sentence: 'I look forward to seeing you soon.', correct: true, rule: 'look forward to 的 to 是介係詞 → + V-ing ✔' },
  { kind: 'judge', sentence: 'I look forward to see you soon.', correct: false, fixed: 'I look forward to seeing you soon.', rule: 'look forward to + V-ing（to 是介係詞）' },
  { kind: 'judge', sentence: 'Since I just got the offer and finished enrollment.', correct: false, fixed: "Since I just got the offer, I'm going to enrol in subjects now.", rule: 'since 是副詞子句，後面一定要接主要子句' },
  { kind: 'judge', sentence: 'He gave up smoking last year.', correct: true, rule: 'give up + V-ing ✔' },
  { kind: 'judge', sentence: 'I practise English everyday.', correct: false, fixed: 'I practise English every day.', rule: 'every day（分開）是副詞；everyday（連寫）是形容詞' },
  { kind: 'judge', sentence: 'Would you mind sharing your notes?', correct: true, rule: 'mind + V-ing ✔' },
  { kind: 'judge', sentence: 'I spent two hours to finish the reading.', correct: false, fixed: 'I spent two hours finishing the reading.', rule: 'spend + 時間 + V-ing' },
  { kind: 'judge', sentence: 'She managed to finish the essay on time.', correct: true, rule: 'manage + to V ✔' },
]

// ---- 偵錯短文（改編自她 Notion 口語文章的原始錯誤版本）----
export const PASSAGE_EXTRA = [
  {
    passage: "I'm living in an apartment that locates in Melbourne CBD. The rent was six hundreds per week. Before I moving into this place, I stayed at a student accommodation nearby my school. I spent four months to find a suitable unit, and my new home is on forty-ninth floor.",
    errors: [
      { span: 'locates', category: 'verbForm', correction: 'is located', ruleReminder: 'be located：不能說 locates' },
      { span: 'six hundreds', category: 'plural', correction: 'six hundred dollars', ruleReminder: 'hundred 當數量詞不加 s' },
      { span: 'I moving', category: 'verbForm', correction: 'moving / I moved', ruleReminder: 'before + V-ing 或 before + 主詞 + 過去式' },
      { span: 'nearby my school', category: 'posError', correction: 'near my school', ruleReminder: 'near 是介係詞接名詞；nearby 不接名詞' },
      { span: 'to find', category: 'verbForm', correction: 'finding', ruleReminder: 'spend + 時間 + V-ing' },
      { span: 'forty-ninth floor', category: 'article', correction: 'the 49th floor', ruleReminder: '序數前要加 the' },
    ],
  },
]

// ---- Phrasal verb 易混淆提醒（來自她的「小但超重要的用法提醒」）----
export const PV_NOTES = {
  'catch up with': 'catch up with＝追上（落後之後）或敘舊，看受詞；≠ keep up with（持續跟上）',
  'keep up with': 'keep up with＝持續跟上；≠ catch up with（落後之後追上）',
  'train for': 'train for + 目標；train in + 領域（很常搞混！）',
  'train in': 'train in + 領域；train for + 目標（很常搞混！）',
  'admire for': 'admire + 人；admire + 人 + for + 原因',
  'shift to': 'shift to＝方向/心態/長期改變；change over to＝東西/系統/立刻換',
  'change over to': 'change over to＝東西/系統/立刻換；shift to＝長期方向',
  'look forward to (Ving)': 'to 是介係詞，後面接 V-ing',
  'make use of': 'make use of（中性）；take advantage of（偏負面或撿便宜）',
  'take advantage of': 'take advantage of（善用，偏負面）；make use of（中性）',
}

// ---- 單字庫拼字清單（她 Notion 的 Vocabs spelling）----
export const SPELLING_IMPORT = [
  { word: 'theoretical', partOfSpeech: 'adj', zhMeaning: '理論的' },
  { word: 'meal', partOfSpeech: 'noun', zhMeaning: '一餐' },
  { word: 'disruption', partOfSpeech: 'noun', zhMeaning: '中斷、擾亂' },
  { word: 'scholar', partOfSpeech: 'noun', zhMeaning: '學者' },
  { word: 'century', partOfSpeech: 'noun', zhMeaning: '世紀' },
  { word: 'extreme', partOfSpeech: 'adj', zhMeaning: '極端的' },
  { word: 'laboratory', partOfSpeech: 'noun', zhMeaning: '實驗室' },
  { word: 'habit', partOfSpeech: 'noun', zhMeaning: '習慣' },
  { word: 'hobby', partOfSpeech: 'noun', zhMeaning: '嗜好' },
  { word: 'accompany', partOfSpeech: 'verb', zhMeaning: '陪伴' },
  { word: 'companion', partOfSpeech: 'noun', zhMeaning: '伴侶、同伴' },
  { word: 'cinema', partOfSpeech: 'noun', zhMeaning: '電影院' },
  { word: 'cinnamon', partOfSpeech: 'noun', zhMeaning: '肉桂' },
  { word: 'cruel', partOfSpeech: 'adj', zhMeaning: '殘暴的' },
  { word: 'curse', partOfSpeech: 'noun', zhMeaning: '詛咒' },
  { word: 'curl', partOfSpeech: 'verb', zhMeaning: '捲曲（curls 捲髮）' },
  { word: 'accommodate', partOfSpeech: 'verb', zhMeaning: '容納' },
  { word: 'consequently', partOfSpeech: 'adv', zhMeaning: '因此' },
  { word: 'excessive', partOfSpeech: 'adj', zhMeaning: '過度的' },
  { word: 'maintenance', partOfSpeech: 'noun', zhMeaning: '維護、保養' },
]
