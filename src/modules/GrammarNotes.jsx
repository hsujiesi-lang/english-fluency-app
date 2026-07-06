// 文法筆記 — 使用者 Notion 文法整理表格的查閱區（冠詞系統、量詞、用法、phrasal verbs 全表）

import React, { useEffect, useState } from 'react'
import { Screen, Spinner } from '../lib/ui.jsx'
import { ARTICLE_RULES, QUANTIFIER_NOTES, USAGE_NOTES, PREP_CHEAT, PV_REMINDERS } from '../data/grammarNotes.js'

const BADGE_STYLE = {
  '×': { background: 'var(--bad-soft)', color: 'var(--bad)' },
  'the': { background: 'var(--brand-soft)', color: 'var(--brand)' },
  'a': { background: 'var(--good-soft)', color: 'var(--good)' },
  's': { background: 'var(--warn-soft)', color: 'var(--warn)' },
}

export default function GrammarNotes({ onBack }) {
  const [tab, setTab] = useState('articles')
  return (
    <Screen title="文法筆記" sub="妳的 Notion 整理，隨時查（出題也是照這些規則）" onBack={onBack}>
      <div className="tabs">
        <button className={tab === 'articles' ? 'active' : ''} onClick={() => setTab('articles')}>冠詞</button>
        <button className={tab === 'prep' ? 'active' : ''} onClick={() => setTab('prep')}>介係詞</button>
        <button className={tab === 'quant' ? 'active' : ''} onClick={() => setTab('quant')}>量詞</button>
        <button className={tab === 'usage' ? 'active' : ''} onClick={() => setTab('usage')}>用法</button>
        <button className={tab === 'pv' ? 'active' : ''} onClick={() => setTab('pv')}>Phrasal V.</button>
      </div>
      {tab === 'articles' && <RuleSections sections={ARTICLE_RULES} />}
      {tab === 'prep' && <PrepCheatSheet />}
      {tab === 'quant' && <RuleSections sections={QUANTIFIER_NOTES} />}
      {tab === 'usage' && <RuleSections sections={USAGE_NOTES} />}
      {tab === 'pv' && <PhrasalTable />}
    </Screen>
  )
}

function RuleSections({ sections }) {
  const [open, setOpen] = useState(() => new Set([0]))
  const toggle = (i) => setOpen((prev) => {
    const nx = new Set(prev)
    nx.has(i) ? nx.delete(i) : nx.add(i)
    return nx
  })
  return sections.map((sec, i) => (
    <div className="card" key={i} style={{ padding: '12px 16px' }}>
      <h3 onClick={() => toggle(i)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
        {sec.badge && (
          <span className="tag" style={{ ...BADGE_STYLE[sec.badge], fontSize: 14, minWidth: 30, textAlign: 'center' }}>{sec.badge}</span>
        )}
        <span style={{ flex: 1, fontSize: 15 }}>{sec.title}</span>
        <span style={{ color: 'var(--muted)' }}>{open.has(i) ? '▾' : '▸'}</span>
      </h3>
      {open.has(i) && (
        <div style={{ marginTop: 10 }}>
          {sec.rows.map(([left, right], k) => (
            <div key={k} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: k < sec.rows.length - 1 ? '1px solid #f0f0f4' : 'none' }}>
              <div style={{ flex: '0 0 38%', fontWeight: 700, fontSize: 14 }}>{left}</div>
              <div style={{ flex: 1, fontSize: 14, color: 'var(--muted)' }}>{right}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  ))
}

// IN/ON/AT 三欄圖解懶人包
function PrepCheatSheet() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {PREP_CHEAT.map((col) => (
          <div key={col.key} style={{ background: col.soft, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: col.color, color: 'white', textAlign: 'center', fontWeight: 800, fontSize: 20, padding: '8px 0' }}>
              {col.key}
            </div>
            <div style={{ padding: '8px 8px 4px', flex: 1 }}>
              {col.items.map((it) => (
                <div key={it.en} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: col.color }}>{it.en.split(' ')[0]}</span>{' '}
                    {it.en.split(' ').slice(1).join(' ')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>（{it.zh}）</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `2px solid ${col.color}`, margin: '0 8px', padding: '6px 0 8px', fontSize: 11, fontWeight: 700, color: col.color, textAlign: 'center' }}>
              {col.rule}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
        「寫作 → 📍 介係詞」的題目就是從這張表出的
      </p>
    </>
  )
}

function PhrasalTable() {
  const [all, setAll] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/phrasal-verbs.json').then((r) => r.json()).then(setAll).catch(() => setAll([]))
  }, [])
  if (!all) return <Spinner label="載入…" />
  const query = q.trim().toLowerCase()
  const list = all.filter((d) => !query || d.verb.toLowerCase().includes(query) || d.zhMeaning.toLowerCase().includes(query))
  return (
    <>
      <div className="card" style={{ padding: '12px 16px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>🔎 小但超重要的用法提醒</h3>
        {PV_REMINDERS.map(([left, right], k) => (
          <div key={k} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: k < PV_REMINDERS.length - 1 ? '1px solid #f0f0f4' : 'none' }}>
            <div style={{ flex: '0 0 42%', fontWeight: 700, fontSize: 14, color: 'var(--brand)' }}>{left}</div>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--muted)' }}>{right}</div>
          </div>
        ))}
      </div>
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={`🔍 搜尋 ${all.length} 個 phrasal verbs…`} style={{ marginBottom: 10 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {list.map((d) => (
          <div className="list-item" key={d.verb} style={{ padding: '8px 10px', marginBottom: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ color: 'var(--brand)', fontSize: 14 }}>{d.verb}</b>
              {d.priority && <span className="tag warn" style={{ marginLeft: 4 }}>一直忘</span>}
              <div style={{ fontSize: 13 }}>{d.zhMeaning}</div>
              {d.examples?.[0] && (
                <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--muted)', marginTop: 2 }}>{d.examples[0]}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
