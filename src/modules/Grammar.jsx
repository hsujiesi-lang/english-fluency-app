// 文法 hub — 冠詞、介係詞為主，加上詞性/用法/錯誤獵人/筆記

import React from 'react'
import { Screen } from '../lib/ui.jsx'

export default function Grammar({ nav }) {
  return (
    <Screen title="文法" sub="妳的三大弱點，各個擊破">
      <div className="card" onClick={() => nav('writing', { section: 'articles' })} style={{ cursor: 'pointer' }}>
        <h3>📰 冠詞區分</h3>
        <p>a / an / the / 不加 — 照妳自己的冠詞系統出題</p>
      </div>
      <div className="card" onClick={() => nav('writing', { section: 'prep' })} style={{ cursor: 'pointer' }}>
        <h3>📍 介係詞 IN / ON / AT</h3>
        <p>圖解懶人包 27 個片語的句子挖空</p>
      </div>
      <div className="card" onClick={() => nav('writing', { section: 'pos' })} style={{ cursor: 'pointer' }}>
        <h3>🔤 詞性使用</h3>
        <p>communication vs communicate — 給字根打正確詞形</p>
      </div>
      <div className="card" onClick={() => nav('writing', { section: 'usage' })} style={{ cursor: 'pointer' }}>
        <h3>⚖️ 用法辨析</h3>
        <p>near/nearby、for vs to have — Notion 筆記的易錯用法</p>
      </div>
      <div className="card" onClick={() => nav('hunter')} style={{ cursor: 'pointer' }}>
        <h3>🎯 錯誤獵人</h3>
        <p>每日 10 題混合：快打、偵錯短文、詞性</p>
      </div>
      <div className="card" onClick={() => nav('writing', { section: 'notes' })} style={{ cursor: 'pointer', border: '1.5px dashed var(--brand)' }}>
        <h3>📚 文法筆記（查閱）</h3>
        <p>冠詞規則表、IN/ON/AT 圖解、量詞、用法對照</p>
      </div>
    </Screen>
  )
}
