// 寫作模組題庫 — 全部是主動產出型（打字），沒有選擇題。
// 冠詞與詞性題模仿使用者的真實錯誤模式（漏冠詞、不可數當可數、名詞當動詞）。

// ---- Section 1: 冠詞區分（克漏字打字：a / an / the / ×）----
// blanks 依 ___ 出現順序；answer 是可接受的寫法（× = 不加冠詞）
export const ARTICLE_CLOZE = [
  {
    text: 'Setting ___ clear vision is ___ first step of ___ successful change process.',
    blanks: [
      { answer: ['a'], why: '單數可數名詞 vision 第一次出現 → a' },
      { answer: ['the'], why: '序數 first 前面固定用 the' },
      { answer: ['a'], why: '泛指某一次成功的變革過程 → a' },
    ],
  },
  {
    text: 'Employees often show ___ resistance when ___ management announces ___ big restructure.',
    blanks: [
      { answer: ['×'], why: 'resistance 不可數、泛指 → 不加冠詞（也不能加 s）' },
      { answer: ['×', 'the'], why: '泛指管理層可不加；特指這家公司的管理層可加 the' },
      { answer: ['a'], why: '單數可數名詞 restructure 第一次出現 → a' },
    ],
  },
  {
    text: 'I sent ___ follow-up email to ___ lecturer, and she replied within ___ hour.',
    blanks: [
      { answer: ['a'], why: '單數可數名詞 email 第一次出現 → a' },
      { answer: ['the', 'my'], why: '特指妳的那位 lecturer → the（或 my）' },
      { answer: ['an'], why: 'hour 的 h 不發音，母音開頭 → an' },
    ],
  },
  {
    text: '___ trust between leaders and staff is built through ___ open communication.',
    blanks: [
      { answer: ['×'], why: 'trust 不可數、泛指 → 不加冠詞' },
      { answer: ['×'], why: 'communication 不可數、泛指 → 不加冠詞' },
    ],
  },
  {
    text: 'We collected ___ feedback from ___ participants who joined ___ study last semester.',
    blanks: [
      { answer: ['×'], why: 'feedback 不可數 → 不加冠詞（不能說 a feedback / feedbacks）' },
      { answer: ['the', '×'], why: '特指參加研究的那群人 → the（泛指也可不加）' },
      { answer: ['the'], why: '特指上學期那個研究 → the' },
    ],
  },
  {
    text: 'Creating ___ sense of urgency is ___ essential part of Kotter’s model.',
    blanks: [
      { answer: ['a'], why: '固定用法：a sense of…' },
      { answer: ['an'], why: 'essential 母音開頭 → an' },
    ],
  },
  {
    text: '___ research shows that ___ short-term wins keep ___ momentum going.',
    blanks: [
      { answer: ['×'], why: 'research 不可數、泛指 → 不加冠詞' },
      { answer: ['×'], why: '複數泛指 → 不加冠詞（注意要用複數 wins）' },
      { answer: ['×', 'the'], why: 'momentum 不可數，泛指不加（特指該計畫的動能可加 the）' },
    ],
  },
  {
    text: 'After ___ lecture, I spent ___ hour in ___ library reviewing my notes.',
    blanks: [
      { answer: ['the'], why: '特指剛上完的那堂課 → the' },
      { answer: ['an'], why: 'hour 母音發音開頭 → an' },
      { answer: ['the'], why: '特指學校那間圖書館 → the' },
    ],
  },
  {
    text: 'She gave me ___ useful advice about writing ___ introduction of ___ essay.',
    blanks: [
      { answer: ['×', 'some'], why: 'advice 不可數 → 不加冠詞或用 some（不能說 an advice）' },
      { answer: ['the'], why: '特指這篇文章的引言 → the' },
      { answer: ['an', 'the', 'my'], why: '泛指一篇 essay → an；特指自己那篇 → the/my' },
    ],
  },
  {
    text: 'Lodging ___ tax return online takes less than ___ hour in ___ Australia.',
    blanks: [
      { answer: ['a', 'my', 'your'], why: '單數可數名詞 → a（或 my/your）' },
      { answer: ['an'], why: 'hour → an' },
      { answer: ['×'], why: '國名前不加冠詞（少數例外如 the UK, the US）' },
    ],
  },
]

// ---- Section 2: 詞性使用（給字根，打出正確詞形）----
export const POS_CLOZE = [
  { text: 'Good ___ between departments prevents misunderstanding.', root: 'communicate', answer: ['communication'], why: '主詞位置需要名詞 communication' },
  { text: 'Managers should ___ with their teams every week.', root: 'communication', answer: ['communicate'], why: 'modal（should）後需要動詞原形 communicate' },
  { text: 'Her ___ of the interview data took two weeks.', root: 'analyse', answer: ['analysis'], why: '所有格後需要名詞 analysis' },
  { text: 'We need to ___ the results before the meeting.', root: 'analysis', answer: ['analyse', 'analyze'], why: 'to 後需要動詞原形 analyse' },
  { text: 'The board made a quick ___ to cancel the project.', root: 'decide', answer: ['decision'], why: '冠詞 a + 形容詞後需要名詞 decision' },
  { text: 'It is hard to ___ without enough information.', root: 'decision', answer: ['decide'], why: 'to 後需要動詞原形 decide' },
  { text: 'The new policy faced strong ___ from senior staff.', root: 'resist', answer: ['resistance'], why: '形容詞 strong 後需要名詞 resistance（不可數，不加 s）' },
  { text: 'Employees may ___ change if they feel excluded.', root: 'resistance', answer: ['resist'], why: 'may 後需要動詞原形 resist' },
  { text: 'A clear ___ of the theory helped everyone follow the lecture.', root: 'explain', answer: ['explanation'], why: '冠詞 + 形容詞後需要名詞 explanation' },
  { text: 'Money alone does not ___ people in the long run.', root: 'motivation', answer: ['motivate'], why: '助動詞 does not 後需要動詞原形 motivate' },
  { text: 'Rapid ___ into new markets can strain resources.', root: 'expand', answer: ['expansion'], why: '主詞位置需要名詞 expansion' },
  { text: 'The team worked hard to ___ in a very competitive market.', root: 'success', answer: ['succeed'], why: 'to 後需要動詞原形 succeed' },
  { text: 'Strong ___ skills are essential for group projects.', root: 'manage', answer: ['management', 'managerial'], why: '修飾 skills 用名詞 management（或形容詞 managerial）' },
  { text: 'The results were not statistically ___.', root: 'significance', answer: ['significant'], why: 'be 動詞 + 副詞後需要形容詞 significant' },
]

// ---- Section 3: Paraphrase 改寫 ----
// kind: passive（主動→被動）| active（被動→主動）| nominal（動詞→名詞化）| academic（學術改寫）
export const PARAPHRASE_TASKS = [
  {
    kind: 'passive',
    instruction: '把句子改成被動語態（passive voice）',
    source: 'Researchers conducted the survey in 2025.',
    refs: ['The survey was conducted in 2025.', 'The survey was conducted by researchers in 2025.'],
    keyWords: ['was conducted'],
    hint: '受詞變主詞：The survey…',
  },
  {
    kind: 'passive',
    instruction: '把句子改成被動語態（passive voice）',
    source: 'The company implemented the new policy last month.',
    refs: ['The new policy was implemented last month.', 'The new policy was implemented by the company last month.'],
    keyWords: ['was implemented'],
    hint: 'The new policy…',
  },
  {
    kind: 'passive',
    instruction: '把句子改成被動語態（passive voice）',
    source: 'Managers should communicate the vision clearly.',
    refs: ['The vision should be communicated clearly.', 'The vision should be communicated clearly by managers.'],
    keyWords: ['should be communicated'],
    hint: 'modal 的被動：should be + p.p.',
  },
  {
    kind: 'active',
    instruction: '把句子改成主動語態（active voice）',
    source: 'The questionnaire was completed by 120 students.',
    refs: ['120 students completed the questionnaire.', 'One hundred and twenty students completed the questionnaire.'],
    keyWords: ['students completed'],
    hint: 'by 後面的人變主詞',
  },
  {
    kind: 'active',
    instruction: '把句子改成主動語態（active voice）',
    source: 'Significant improvements were reported by the participants.',
    refs: ['The participants reported significant improvements.', 'Participants reported significant improvements.'],
    keyWords: ['reported significant improvements'],
    hint: 'The participants…',
  },
  {
    kind: 'nominal',
    instruction: '用名詞化（nominalisation）改寫：把括號中的動詞變成名詞',
    source: 'The manager (decided) to restructure the team, which surprised everyone.',
    refs: ["The manager's decision to restructure the team surprised everyone.", 'The decision to restructure the team surprised everyone.'],
    keyWords: ['decision'],
    hint: 'decide → decision，讓名詞當主詞',
  },
  {
    kind: 'nominal',
    instruction: '用名詞化（nominalisation）改寫：把括號中的動詞變成名詞',
    source: 'The company (expanded) rapidly, and this created cash-flow problems.',
    refs: ["The company's rapid expansion created cash-flow problems.", 'The rapid expansion of the company created cash-flow problems.'],
    keyWords: ['expansion'],
    hint: 'expand → expansion',
  },
  {
    kind: 'nominal',
    instruction: '用名詞化（nominalisation）改寫：把括號中的動詞變成名詞',
    source: 'Staff (resisted) the change, which slowed the project down.',
    refs: ["Staff resistance to the change slowed the project down.", 'Resistance to the change slowed the project down.', "The staff's resistance to the change slowed the project down."],
    keyWords: ['resistance'],
    hint: 'resist → resistance（不可數）',
  },
  {
    kind: 'academic',
    instruction: '把口語句改寫成學術語氣（避免 got / a lot of / people don’t like…）',
    source: "The company got a lot of problems because people didn't like the change.",
    refs: [
      'The company encountered numerous problems because employees opposed the change.',
      'The company faced significant difficulties due to employee resistance to the change.',
    ],
    keyWords: [],
    hint: 'got → encountered/faced；a lot of → numerous/significant；didn’t like → opposed/resisted',
  },
  {
    kind: 'academic',
    instruction: '把口語句改寫成學術語氣',
    source: 'The results show that the training was really good for new workers.',
    refs: [
      'The results indicate that the training was highly beneficial for new employees.',
      'The findings suggest that the training programme significantly benefited new employees.',
    ],
    keyWords: [],
    hint: 'show → indicate/suggest；really good → highly beneficial',
  },
  {
    kind: 'academic',
    instruction: '把口語句改寫成學術語氣',
    source: 'Lots of studies say social media is bad for how well students sleep.',
    refs: [
      'Numerous studies suggest that social media negatively affects students’ sleep quality.',
      'A substantial body of research indicates that social media use impairs sleep quality among students.',
    ],
    keyWords: [],
    hint: 'lots of studies say → numerous studies suggest；bad for → negatively affects',
  },
]
