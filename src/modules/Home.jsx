// 首頁：連續天數、早安/晚安、每日 30 分鐘流程引導、模組捷徑

import React from 'react'
import { Screen } from '../lib/ui.jsx'
import { MorningEvening } from './DailyPhrases.jsx'
import * as store from '../lib/storage.js'
import * as banks from '../lib/banks.js'

export default function Home({ nav, phrases }) {
  const streak = store.getStreak()
  const act = store.getTodayActivity()
  const dueErr = banks.dueErrors().length
  const dueVoc = banks.dueVocab().length
  const dailyKey = store.todayStr() + (new Date().getHours() >= 20 ? ':pm' : ':am')
  const dailyDone = !!store.get('dailyAnswers', {})[dailyKey]

  // 手動打勾狀態（依日期儲存，每天重置）；沒打勾過的項目用活動紀錄自動判定
  const today = store.todayStr()
  const [checks, setChecks] = React.useState(() => store.get('dailyChecklist', {})[today] || {})

  const steps = [
    { id: 1, label: 'Phrasal verb 今日 20 個（背＋練）', mins: 8, auto: (act.phrasal || 0) >= 10, go: () => nav('phrasal', { tab: 'today' }) },
    { id: 2, label: '每日短句：聽讀 5 ＋ 中翻英 5', mins: 5, auto: (act.phrases || 0) >= 10, go: () => nav('phrases') },
    {
      id: 3, label: `Review 錯誤文法${dueErr > 0 ? `（${dueErr} 項到期）` : ''}`,
      mins: 4,
      auto: dueErr === 0 || (act.errorBank || 0) > 0,
      go: () => nav('me', { tab: 'errors' }),
    },
    { id: 4, label: 'Speaking：主題對談 1 題（自由聊）', mins: 8, auto: (act.talk || 0) >= 1, go: () => nav('talk') },
    { id: 5, label: 'Speaking：口說流暢度（用主題對談的題目）', mins: 7, auto: (act.speaking || 0) >= 2, go: () => nav('speaking') },
  ].map((s) => ({ ...s, done: s.id in checks ? checks[s.id] : s.auto }))

  const toggle = (s) => {
    const next = { ...checks, [s.id]: !s.done }
    setChecks(next)
    store.set('dailyChecklist', { [today]: next })
  }
  const doneCount = steps.filter((s) => s.done).length

  return (
    <Screen title="英文練習" sub="每天 30 分鐘，把知道的變成說得出的">
      <div className="stat-grid">
        <div className="stat"><div className="num">🔥 {streak}</div><div className="lbl">連續天數</div></div>
        <div className="stat"><div className="num">{doneCount}/{steps.length}</div><div className="lbl">今日進度</div></div>
        <div className="stat"><div className="num">{dueErr + dueVoc}</div><div className="lbl">待複習</div></div>
      </div>

      <MorningEvening embedded />

      <div className="card">
        <h3>📋 今日 30 分鐘流程</h3>
        {steps.map((s) => (
          <div key={s.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderBottom: s.id < steps.length ? '1px solid #f0f0f4' : 'none',
              opacity: s.done ? 0.55 : 1,
            }}>
            <span onClick={() => toggle(s)} style={{ fontSize: 20, cursor: 'pointer', userSelect: 'none' }}>{s.done ? '✅' : '⬜'}</span>
            <span
              onClick={s.done || !s.go ? undefined : s.go}
              style={{ flex: 1, fontSize: 15, textDecoration: s.done ? 'line-through' : 'none', cursor: s.done || !s.go ? 'default' : 'pointer' }}>
              {s.label}
            </span>
            <span className="tag">{s.mins} 分</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>🚃 通勤時間</h3>
        <p style={{ marginBottom: 8 }}>在電車上滑兩下就能練：</p>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn secondary" onClick={() => nav('writing', { section: 'articles' })}>📰 冠詞練習</button>
          <button className="btn secondary" onClick={() => nav('writing', { section: 'prep' })}>📍 介係詞練習</button>
        </div>
      </div>

      <div className="card" onClick={() => nav('output')} style={{ cursor: 'pointer' }}>
        <h3>🗣️ Output 產出</h3>
        <p>Writing（Paraphrase・圖片描述）＋ Speaking（主題對談・口說流暢度・每日短句）</p>
      </div>
      <div className="card" onClick={() => nav('grammar')} style={{ cursor: 'pointer' }}>
        <h3>📐 文法</h3>
        <p>冠詞、介係詞 IN/ON/AT、詞性、用法、錯誤獵人、文法筆記</p>
      </div>
      <div className="card" onClick={() => nav('phrasal')} style={{ cursor: 'pointer' }}>
        <h3>🧩 Phrasal Verbs</h3>
        <p>118 個總列表（三態＋📌 釘選）＋兩段式練習（回想→造句）</p>
      </div>
      <div className="card" onClick={() => nav('topics')} style={{ cursor: 'pointer' }}>
        <h3>🗂️ 主題單字</h3>
        <p>天氣 🌦️ 身體 🧍 衣服 👕 電影 🎬 情緒 💭 化妝 💄 料理 🍳</p>
      </div>
      <div className="card" onClick={() => nav('me', { tab: 'vocab' })} style={{ cursor: 'pointer' }}>
        <h3>📗 單字庫</h3>
        <p>自動生成單字卡＋中→英拼寫練習＋到期複習</p>
      </div>
      <div className="card" onClick={() => nav('me', { tab: 'errors' })} style={{ cursor: 'pointer' }}>
        <h3>📕 錯誤庫</h3>
        <p>所有練習的錯誤自動收集，間隔重複回來考妳</p>
      </div>
    </Screen>
  )
}
