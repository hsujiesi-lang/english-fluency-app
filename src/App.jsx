import React, { useEffect, useState } from 'react'
import Home from './modules/Home.jsx'
import DailyPhrases from './modules/DailyPhrases.jsx'
import Speaking from './modules/Speaking.jsx'
import ErrorHunter from './modules/ErrorHunter.jsx'
import ErrorBank from './modules/ErrorBank.jsx'
import Vocab from './modules/Vocab.jsx'
import Settings from './modules/Settings.jsx'

const NAV = [
  { id: 'home', label: '首頁', icon: '🏠' },
  { id: 'phrases', label: '短句', icon: '💬' },
  { id: 'speaking', label: '口說', icon: '🎙️' },
  { id: 'hunter', label: '獵人', icon: '🎯' },
  { id: 'me', label: '我的', icon: '📚' },
]

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

  return (
    <>
      {screen === 'home' && <Home nav={nav} phrases={phrases} />}
      {screen === 'phrases' && <DailyPhrases nav={nav} phrases={phrases} params={params} />}
      {screen === 'speaking' && <Speaking nav={nav} />}
      {screen === 'hunter' && <ErrorHunter nav={nav} />}
      {screen === 'me' && <Me nav={nav} params={params} />}
      <nav className="bottom-nav">
        {NAV.map((n) => (
          <button key={n.id} className={screen === n.id ? 'active' : ''} onClick={() => nav(n.id)}>
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
