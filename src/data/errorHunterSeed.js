// Seed items for 錯誤獵人 — modeled on the learner's real error patterns
// (modal/to + base verb, articles & plurals & countability, POS misuse).
// Claude-generated items supplement these when an API key is set.

// ---- 題型 1: 動詞形式快打 (10s each) ----
// kind 'fill': pick the right form; kind 'judge': is the sentence correct?
export const VERB_FORM_DRILLS = [
  { kind: 'fill', sentence: 'Leaders should ___ the new vision in daily routines.', options: ['anchor', 'anchors', 'anchoring', 'anchored'], answer: 'anchor', rule: 'modal（should/can/must）後面接原形動詞' },
  { kind: 'fill', sentence: 'The app is designed to ___ and engage users.', options: ['enable', 'enables', 'enabling', 'enabled'], answer: 'enable', rule: 'to 後面接原形動詞' },
  { kind: 'fill', sentence: 'Managers must ___ short-term wins to sustain momentum.', options: ['create', 'creates', 'creating', 'created'], answer: 'create', rule: 'modal 後面接原形動詞' },
  { kind: 'fill', sentence: 'She can ___ the results more clearly with a chart.', options: ['present', 'presents', 'presenting', 'presented'], answer: 'present', rule: 'modal 後面接原形動詞' },
  { kind: 'fill', sentence: 'We need to ___ the survey before the deadline.', options: ['complete', 'completes', 'completing', 'completed'], answer: 'complete', rule: 'to 後面接原形動詞' },
  { kind: 'fill', sentence: 'The team should ___ feedback from every member.', options: ['collect', 'collects', 'collecting', 'collected'], answer: 'collect', rule: 'modal 後面接原形動詞' },
  { kind: 'fill', sentence: 'It is important to ___ employees during change.', options: ['support', 'supports', 'supporting', 'supported'], answer: 'support', rule: 'to 後面接原形動詞' },
  { kind: 'fill', sentence: 'A good leader must ___ clear goals early.', options: ['set', 'sets', 'setting', 'is setting'], answer: 'set', rule: 'modal 後面接原形動詞' },
  { kind: 'fill', sentence: 'Students can ___ their lecture recordings online.', options: ['access', 'accesses', 'accessing', 'accessed'], answer: 'access', rule: 'modal 後面接原形動詞' },
  { kind: 'fill', sentence: 'The policy aims to ___ workplace stress.', options: ['reduce', 'reduces', 'reducing', 'reduced'], answer: 'reduce', rule: 'to 後面接原形動詞' },
  { kind: 'judge', sentence: 'The manager should anchors the change in company culture.', correct: false, fixed: 'The manager should anchor the change in company culture.', rule: 'modal 後面接原形動詞：should anchor' },
  { kind: 'judge', sentence: 'This tool is designed to enables faster communication.', correct: false, fixed: 'This tool is designed to enable faster communication.', rule: 'to 後面接原形動詞：to enable' },
  { kind: 'judge', sentence: 'Employees must adapt to the new system quickly.', correct: true, rule: 'must + adapt（原形）— 正確' },
  { kind: 'judge', sentence: 'We should to discuss the plan tomorrow.', correct: false, fixed: 'We should discuss the plan tomorrow.', rule: 'modal 後面直接接原形，不加 to' },
  { kind: 'judge', sentence: 'The company wants to expanding into new markets.', correct: false, fixed: 'The company wants to expand into new markets.', rule: 'to 後面接原形動詞：to expand' },
  { kind: 'judge', sentence: 'Leaders can communicate the vision through stories.', correct: true, rule: 'can + communicate（原形）— 正確' },
  { kind: 'judge', sentence: 'Teams must worked together to hit the deadline.', correct: false, fixed: 'Teams must work together to hit the deadline.', rule: 'modal 後面接原形動詞：must work' },
  { kind: 'judge', sentence: 'It is essential to build trust before change begins.', correct: true, rule: 'to + build（原形）— 正確' },
]

// ---- 題型 2: 偵錯題 (90s, click to mark) ----
// Each error.span must appear verbatim exactly once in passage.
export const DETECTION_PASSAGES = [
  {
    passage: 'Successful change requires setting clear vision at the start. Leaders should anchors the new practices in daily work, and they need to celebrates every short-term win. Without these steps, employees may face some resistances to the process.',
    errors: [
      { span: 'setting clear vision', category: 'article', correction: 'setting a clear vision', ruleReminder: '單數可數名詞前要有冠詞：a clear vision' },
      { span: 'should anchors', category: 'verbForm', correction: 'should anchor', ruleReminder: 'modal 後面接原形動詞' },
      { span: 'to celebrates', category: 'verbForm', correction: 'to celebrate', ruleReminder: 'to 後面接原形動詞' },
      { span: 'some resistances', category: 'plural', correction: 'some resistance', ruleReminder: 'resistance 不可數，不加 s' },
    ],
  },
  {
    passage: 'The first stage of Lewin model is Unfrozen, where managers prepare people for change. By communication people openly, leaders can reduces anxiety. Research shows that employee who feel informed adapt faster.',
    errors: [
      { span: 'Lewin model', category: 'article', correction: "Lewin's model / the Lewin model", ruleReminder: '要有冠詞或所有格：the Lewin model / Lewin’s model' },
      { span: 'Unfrozen', category: 'posError', correction: 'Unfreeze', ruleReminder: '專有名詞：Lewin 的階段是 Unfreeze，不是 Unfrozen' },
      { span: 'By communication people', category: 'posError', correction: 'By communicating with people', ruleReminder: '名詞不能當動詞用：communication → communicating with' },
      { span: 'can reduces', category: 'verbForm', correction: 'can reduce', ruleReminder: 'modal 後面接原形動詞' },
      { span: 'employee who', category: 'plural', correction: 'employees who', ruleReminder: '泛指要用複數：employees' },
    ],
  },
  {
    passage: 'To improves team performance, managers must to listen actively. Giving regular feedbacks helps staff grow, and it also builds strong relationship between leader and team members.',
    errors: [
      { span: 'To improves', category: 'verbForm', correction: 'To improve', ruleReminder: 'to 後面接原形動詞' },
      { span: 'must to listen', category: 'verbForm', correction: 'must listen', ruleReminder: 'modal 後面直接接原形，不加 to' },
      { span: 'regular feedbacks', category: 'plural', correction: 'regular feedback', ruleReminder: 'feedback 不可數，不加 s' },
      { span: 'strong relationship', category: 'article', correction: 'a strong relationship', ruleReminder: '單數可數名詞前要有冠詞：a strong relationship' },
    ],
  },
  {
    passage: 'The university provides many resource for first-year student. Advisors can helps you plan your subjects, and workshops teach you how to writing academic essays. Taking advantages of these services is a smart strategy.',
    errors: [
      { span: 'many resource', category: 'plural', correction: 'many resources', ruleReminder: 'many + 複數名詞' },
      { span: 'first-year student', category: 'plural', correction: 'first-year students', ruleReminder: '泛指要用複數：students' },
      { span: 'can helps', category: 'verbForm', correction: 'can help', ruleReminder: 'modal 後面接原形動詞' },
      { span: 'to writing', category: 'verbForm', correction: 'to write', ruleReminder: 'to 後面接原形動詞' },
      { span: 'Taking advantages', category: 'plural', correction: 'Taking advantage', ruleReminder: '固定用法：take advantage of（不加 s）' },
    ],
  },
]

// ---- 題型 3: 詞性辨析 ----
export const POS_ITEMS = [
  { sentence: 'Good ___ is the key to teamwork.', options: ['communication', 'communicate', 'communicative'], answer: 'communication', explain: '主詞位置要用名詞 communication；communicate 是動詞' },
  { sentence: 'We need to ___ the data before drawing conclusions.', options: ['analysis', 'analyse', 'analytical'], answer: 'analyse', explain: 'to 後面接動詞 analyse；analysis 是名詞' },
  { sentence: 'Her ___ of the results was very thorough.', options: ['analyse', 'analysis', 'analytical'], answer: 'analysis', explain: '所有格後面接名詞 analysis' },
  { sentence: 'Managers should ___ with employees regularly.', options: ['communication', 'communicate', 'communicable'], answer: 'communicate', explain: 'modal 後面接動詞原形 communicate' },
  { sentence: 'The team made a quick ___ to change suppliers.', options: ['decide', 'decision', 'decisive'], answer: 'decision', explain: '冠詞 a + 形容詞後面接名詞 decision' },
  { sentence: 'It is hard to ___ without complete information.', options: ['decision', 'decide', 'decisive'], answer: 'decide', explain: 'to 後面接動詞原形 decide' },
  { sentence: 'The company will ___ its operations next year.', options: ['expansion', 'expand', 'expansive'], answer: 'expand', explain: 'will（modal）後面接動詞原形 expand' },
  { sentence: 'Rapid ___ can strain company resources.', options: ['expand', 'expansion', 'expanded'], answer: 'expansion', explain: '主詞位置要用名詞 expansion' },
  { sentence: 'Please ___ your sources in the essay.', options: ['reference', 'refer to', 'referral'], answer: 'reference', explain: '這裡 reference 當動詞（引用）；refer to 意思是「提及」' },
  { sentence: 'The professor gave a clear ___ of the theory.', options: ['explain', 'explanation', 'explanatory'], answer: 'explanation', explain: '冠詞 + 形容詞後面接名詞 explanation' },
  { sentence: 'Lewin’s first stage is called ___.', options: ['Unfrozen', 'Unfreeze', 'Unfreezing stage'], answer: 'Unfreeze', explain: '專有名詞要拼對：Unfreeze（不是 Unfrozen）' },
  { sentence: 'Yoga helps people ___ after a long day.', options: ['relaxation', 'relax', 'relaxing'], answer: 'relax', explain: 'help + 受詞 + 原形動詞 relax' },
]

// ---- Module 1 speaking topics ----
export const SPEAKING_TOPICS = [
  { type: 'tutorial', q: 'Do you agree that memory is reconstructive rather than a perfect recording? Why?' },
  { type: 'tutorial', q: 'Is obedience to authority mostly situational or dispositional? Use an example.' },
  { type: 'tutorial', q: 'Should companies use Lewin’s three-step model for change today? Why or why not?' },
  { type: 'tutorial', q: 'Does social media strengthen or weaken real-world communities? Explain your view.' },
  { type: 'tutorial', q: 'Is motivation at work driven more by money or by meaning? Give reasons.' },
  { type: 'tutorial', q: 'Do you think intelligence tests measure what really matters? Why?' },
  { type: 'scene', q: 'Describe your typical morning on a university day, from waking up to arriving on campus.' },
  { type: 'scene', q: 'Describe the busiest place you have seen in Melbourne — what people were doing, sounds, atmosphere.' },
  { type: 'scene', q: 'You are late for a group meeting because your tram broke down. Explain what happened and apologise.' },
  { type: 'scene', q: 'Describe your favourite study spot and explain why it works for you.' },
  { type: 'daily', q: 'What did you eat yesterday, and which meal was the best? Describe it.' },
  { type: 'daily', q: 'Tell me about a hobby you would like to start this year and why.' },
  { type: 'daily', q: 'What do you usually do on weekends in Melbourne?' },
  { type: 'daily', q: 'Describe a recent phone call or chat with your family. What did you talk about?' },
  { type: 'daily', q: 'If a friend visited Melbourne for three days, where would you take them?' },
]
