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

  const steps = [
    { id: 1, label: '早安 / 晚安法 1 題', mins: 2, done: dailyDone, go: null },
    { id: 2, label: '每日短句：聽讀 5 ＋ 中翻英 5', mins: 6, done: (act.phrases || 0) >= 10, go: () => nav('phrases') },
    { id: 3, label: '口說流暢度 2 題（含重講）', mins: 12, done: (act.speaking || 0) >= 4, go: () => nav('speaking') },
    { id: 4, label: '錯誤獵人 10 題', mins: 7, done: (act.hunter || 0) >= 10, go: () => nav('hunter') },
    {
      id: 5, label: `錯誤庫 / 單字庫到期複習${dueErr + dueVoc > 0 ? `（${dueErr + dueVoc} 項）` : ''}`,
      mins: 3,
      done: dueErr + dueVoc === 0 || (act.errorBank || 0) + (act.vocab || 0) > 0,
      go: () => nav('me', { tab: dueErr > 0 ? 'errors' : 'vocab' }),
    },
  ]
  const doneCount = steps.filter((s) => s.done).length

  return (
    <Screen title="英文練習" sub="每天 30 分鐘，把知道的變成說得出的">
      <div className="stat-grid">
        <div className="stat"><div className="num">🔥 {streak}</div><div className="lbl">連續天數</div></div>
        <div className="stat"><div className="num">{doneCount}/5</div><div className="lbl">今日進度</div></div>
        <div className="stat"><div className="num">{dueErr + dueVoc}</div><div className="lbl">待複習</div></div>
      </div>

      <MorningEvening embedded />

      <div className="card">
        <h3>📋 今日 30 分鐘流程</h3>
        {steps.map((s) => (
          <div key={s.id}
            onClick={s.done || !s.go ? undefined : s.go}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderBottom: s.id < 5 ? '1px solid #f0f0f4' : 'none',
              cursor: s.done || !s.go ? 'default' : 'pointer',
              opacity: s.done ? 0.55 : 1,
            }}>
            <span style={{ fontSize: 20 }}>{s.done ? '✅' : '⬜'}</span>
            <span style={{ flex: 1, fontSize: 15, textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
            <span className="tag">{s.mins} 分</span>
          </div>
        ))}
      </div>

      <div className="card" onClick={() => nav('phrases')} style={{ cursor: 'pointer' }}>
        <h3>💬 每日短句</h3><p>聽讀 / 中翻英 / 早安晚安法 — {phrases ? phrases.length : '…'} 句</p>
      </div>
      <div className="card" onClick={() => nav('speaking')} style={{ cursor: 'pointer' }}>
        <h3>🎙️ 口說流暢度</h3><p>限時口說＋強制重講 — 練的是「說完整」</p>
      </div>
      <div className="card" onClick={() => nav('hunter')} style={{ cursor: 'pointer' }}>
        <h3>🎯 錯誤獵人</h3><p>動詞形式 / 冠詞單複數 / 詞性 — 你的三大弱點</p>
      </div>
      <div className="card" onClick={() => nav('me')} style={{ cursor: 'pointer' }}>
        <h3>📚 錯誤庫＆單字庫</h3><p>錯過的都會回來考你（間隔重複）</p>
      </div>
    </Screen>
  )
}
