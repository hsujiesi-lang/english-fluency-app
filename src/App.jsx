import React, { useEffect, useState } from 'react'
import Home from './modules/Home.jsx'
import DailyPhrases from './modules/DailyPhrases.jsx'
import Speaking from './modules/Speaking.jsx'
import ErrorHunter from './modules/ErrorHunter.jsx'
import Writing from './modules/Writing.jsx'
import Picture from './modules/Picture.jsx'
import Topics from './modules/Topics.jsx'
import Output from './modules/Output.jsx'
import Grammar from './modules/Grammar.jsx'
import Phrasal from './modules/Phrasal.jsx'
import Talk from './modules/Talk.jsx'
import ErrorBank from './modules/ErrorBank.jsx'
import Vocab from './modules/Vocab.jsx'
import Settings from './modules/Settings.jsx'

const NAV = [
  { id: 'home', label: '首頁', icon: '🏠' },
  { id: 'output', label: 'Output', icon: '🗣️' },
  { id: 'grammar', label: '文法', icon: '📐' },
  { id: 'phrasal', label: 'Phrasal', icon: '🧩' },
  { id: 'topics', label: '主題', icon: '🗂️' },
  { id: 'me', label: '我的', icon: '📚' },
]
// 這些畫面仍存在，由 hub 進入：phrases/speaking/writing/picture/hunter/talk
const HUB_OF = { phrases: 'output', speaking: 'output', talk: 'output', picture: 'output', writing: 'grammar', hunter: 'grammar' }

export default function App() {
  const [screen, setScreen] = useState('home')
  // sub-screen params, e.g. { tab: 'vocab' } for the Me screen
  const [params, setParams] = useState({})
  const [phrases, setPhrases] = useState(null)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/phrases.json')
      .then((r) => r.json())
      .then(setPhrases)
      .catch(() => setPhrases([]))
  }, [])

  const nav = (id, p = {}) => {
    setParams(p)
    setScreen(id)
    window.scrollTo(0, 0)
  }

  const activeNav = HUB_OF[screen] || screen
  return (
    <>
      {screen === 'home' && <Home nav={nav} phrases={phrases} />}
      {screen === 'output' && <Output nav={nav} />}
      {screen === 'grammar' && <Grammar nav={nav} />}
      {screen === 'phrasal' && <Phrasal nav={nav} params={params} />}
      {screen === 'talk' && <Talk nav={nav} />}
      {screen === 'phrases' && <DailyPhrases nav={nav} phrases={phrases} params={params} />}
      {screen === 'speaking' && <Speaking nav={nav} />}
      {screen === 'writing' && <Writing nav={nav} params={params} />}
      {screen === 'picture' && <Picture nav={nav} />}
      {screen === 'topics' && <Topics nav={nav} />}
      {screen === 'hunter' && <ErrorHunter nav={nav} />}
      {screen === 'me' && <Me nav={nav} params={params} />}
      <nav className="bottom-nav">
        {NAV.map((n) => (
          <button key={n.id} className={activeNav === n.id ? 'active' : ''} onClick={() => nav(n.id)}>
            <span className="icon">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
    </>
  )
}

function Me({ nav, params }) {
  const [tab, setTab] = useState(params.tab || 'errors')
  useEffect(() => { if (params.tab) setTab(params.tab) }, [params])
  return (
    <div className="screen">
      <h1 className="screen-title">我的資料</h1>
      <div className="tabs">
        <button className={tab === 'errors' ? 'active' : ''} onClick={() => setTab('errors')}>錯誤庫</button>
        <button className={tab === 'vocab' ? 'active' : ''} onClick={() => setTab('vocab')}>單字庫</button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>設定</button>
      </div>
      {tab === 'errors' && <ErrorBank nav={nav} embedded />}
      {tab === 'vocab' && <Vocab nav={nav} embedded />}
      {tab === 'settings' && <Settings embedded />}
    </div>
  )
}
