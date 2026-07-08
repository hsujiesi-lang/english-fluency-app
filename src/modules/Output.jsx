// Output hub — 產出練習的總入口：Writing ＆ Speaking

import React from 'react'
import { Screen } from '../lib/ui.jsx'

export default function Output({ nav }) {
  return (
    <Screen title="Output 產出練習" sub="寫出來、說出口 — 把知道的變成用得出的">
      <h3 style={{ margin: '4px 4px 8px' }}>✍️ Writing</h3>
      <div className="card" onClick={() => nav('writing', { section: 'paraphrase' })} style={{ cursor: 'pointer' }}>
        <h3>🔄 Paraphrase 改寫</h3>
        <p>主動↔被動、名詞化、學術語氣 — 整句打出來</p>
      </div>
      <div className="card" onClick={() => nav('picture')} style={{ cursor: 'pointer' }}>
        <h3>🖼️ 圖片描述</h3>
        <p>看圖限時輸出（寫作版嚴格批改 / 口說版）Lv1-4</p>
      </div>

      <h3 style={{ margin: '16px 4px 8px' }}>🎙️ Speaking</h3>
      <div className="card" onClick={() => nav('talk')} style={{ cursor: 'pointer', border: '1.5px dashed var(--brand)' }}>
        <h3>💬 主題對談</h3>
        <p>20 個日常聊天主題 — 每天一題，自由聊 2-5 分鐘</p>
      </div>
      <div className="card" onClick={() => nav('speaking')} style={{ cursor: 'pointer' }}>
        <h3>⏱️ 口說流暢度</h3>
        <p>限時口說＋強制重講 — 練「說完整」的反應</p>
      </div>
      <div className="card" onClick={() => nav('phrases')} style={{ cursor: 'pointer' }}>
        <h3>💬 每日短句</h3>
        <p>120 句聽讀 / 中翻英（限時＋不限時）/ 早晚安法</p>
      </div>
    </Screen>
  )
}
