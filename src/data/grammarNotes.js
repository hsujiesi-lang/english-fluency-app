// 文法筆記參考資料 — 忠實搬自使用者 Notion「Englishhhh」的 Grammar / 用法 頁（2026-07-03 同步）。
// 這是「查閱用」的原始表格；出題版在 notionSeed.js。

export const ARTICLE_RULES = [
  {
    title: '純抽象概念 → ❌ 不加冠詞',
    badge: '×',
    rows: [
      ['life', 'enjoy life'],
      ['reality', 'escape reality'],
      ['freedom', 'fight for freedom'],
      ['success', 'define success'],
      ['happiness', 'pursue happiness'],
      ['education', 'value education'],
      ['bias', 'reduce bias'],
      ['pressure', 'feel pressure'],
      ['stress', 'deal with stress'],
      ['confidence', 'build confidence'],
      ['college / school / university', '人生階段不需 the（start university）'],
      ['society', 'society places pressure'],
      ['Topic n.', 'Topic three'],
    ],
  },
  {
    title: '抽象概念＋被「限定」→ ✅ 加 the',
    badge: 'the',
    rows: [
      ['the + of', 'the pressure of exams / the society of the 21st century'],
      ['the + that 子句', 'the stress that students face'],
      ['前文限定', 'This job is hard. The pressure is real.'],
      ['特定現實', 'face the reality of adulthood'],
      ['已知的東西', 'the rubric'],
    ],
  },
  {
    title: '抽象名詞「變成一種經驗 / 事件」→ ✅ 加 a / an',
    badge: 'a',
    rows: [
      ['an experience', 'It was a valuable experience.'],
      ['a success', 'Passing the exam was a success.'],
      ['a failure', 'Missing the deadline was a failure.'],
      ['a challenge', 'Moving abroad is a challenge.'],
      ['a shock', 'It came as a shock.'],
      ['a society（一種社會形態）', 'We live in a society that values productivity over rest.'],
    ],
  },
  {
    title: '不是抽象概念、被預設已知 → ✅ 加 the',
    badge: 'the',
    rows: [
      ['the deadline', 'Missing the deadline was a failure I often made in high school.'],
      ['the workplace', 'Issues in the workplace are often overlooked.'],
      ['the system', 'Many Asian students feel constrained by the education system.'],
      ['the 49th floor', '敘述樓層（序數）前要加 the'],
    ],
  },
  {
    title: '泛指一類東西 → ✅ 用複數 s',
    badge: 's',
    rows: [
      ['水果 / 書 / 動物', 'fruits / books / animals'],
      ['手機 / 城市', 'phones / cities'],
      ['遠距離關係', 'long-distance relationships'],
      ['親密 / 人際 / 工作 / 家庭關係', 'intimate / interpersonal / workplace / family relationships'],
    ],
  },
]

export const QUANTIFIER_NOTES = [
  {
    title: 'plenty of + 不可數名詞',
    rows: [
      ['plenty of', 'time / money / water / food / space / information / energy / patience / natural light'],
    ],
  },
  {
    title: 'a couple of ≈ 大約 2（＋可數複數）',
    rows: [['a couple of', 'times / days / years']],
  },
  {
    title: 'a few vs. few（可數名詞）',
    rows: [
      ['a few＝有一些（正面）', 'I have read a few chapters. / He has a few friends in Melbourne.'],
      ['few＝很少（負面）', 'She has few reasons to stay. / There are few opportunities for beginners.'],
    ],
  },
  {
    title: 'a little vs. little（不可數名詞）',
    rows: [
      ['常見不可數名詞', 'time / money / water / patience / energy / confidence / experience'],
      ['fewer vs. less', 'fewer＋可數 / less＋不可數'],
    ],
  },
]

export const USAGE_NOTES = [
  {
    title: 'near vs. nearby',
    rows: [
      ['near（介係詞）＋名詞', 'near my school / a cafe near the station'],
      ['nearby（副詞）放句尾', 'I live nearby. / There’s a café nearby.'],
      ['nearby（形容詞）放名詞前', 'a nearby café / a nearby park'],
    ],
  },
  {
    title: 'for + 名詞 vs. to have + 名詞',
    rows: [
      ['生活小事、習慣 → for', 'go home for a nap / go out for coffee / meet for drinks / take time for a break'],
      ['明確行為、意圖 → to have', 'go home to have a shower / meet to have a talk / to have a meeting / to have a check-up'],
      ['幾乎一定用 have 的', 'shower / talk / discussion / meeting / check-up / a cry'],
    ],
  },
  {
    title: '妳的真實錯誤修正',
    rows: [
      ['be located', '❌ an apartment that locates in… → ✅ that is located in…（或直接 located in）'],
      ['before + V-ing', '❌ before I moving into → ✅ before moving into / before I moved into'],
      ['金額', '❌ six hundreds per week → ✅ six hundred dollars per week（hundred 不加 s）'],
      ['樓層', '❌ on forty-ninth floor → ✅ on the 49th floor（序數前加 the）'],
      ['特定某天', '❌ We… in the morning → ✅ We… this morning'],
      ['at school', 'at my school，不是 in my school'],
    ],
  },
  {
    title: '其他小提醒',
    rows: [
      ['every day ≠ everyday', 'every day（副詞，分開）＝每天；everyday（形容詞）＝日常的'],
      ['connected 作形容詞', 'The living room is connected / next / close / adjacent to the kitchen.'],
      ['since 子句', 'since 是副詞子句，後面一定要接主要子句，不能單獨成句'],
      ['recently + 現在完成', 'I’ve been busy recently.'],
      ['spend + 時間/錢 + V-ing', 'I spent four months searching…（不是 to find）'],
      ['enjoy（及物）', 'enjoy + V-ing / enjoy the + n.'],
      ['a great score', 'a great score（單數）/ great scores（複數）'],
      ['paying / buying', 'paying 接錢 / buying 接食物、東西'],
      ['run out of', 'it is easy to run out of X / X runs out easily'],
      ['when 子句不倒裝', 'when the deadline approaches（不是 when does…）'],
    ],
  },
]

export const PV_REMINDERS = [
  ['catch up with', '「進度」或「敘舊」都可以，看受詞；＝落後之後追上'],
  ['keep up with', '持續跟上（≠ catch up with）'],
  ['admire / admire for', 'admire＋人；admire＋人＋for＋原因'],
  ['train for / train in', 'train for＋目標；train in＋領域'],
  ['shift to', '方向 / 心態 / 長期改變'],
  ['change over to', '東西 / 系統 / 立刻換'],
  ['make use of / take advantage of', 'make use of 中性；take advantage of 偏負面'],
  ['look forward to + V-ing', 'to 是介係詞，接 V-ing'],
]
