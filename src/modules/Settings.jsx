// 設定：API 金鑰、口音、資料匯出/匯入

import React, { useRef, useState } from 'react'
import { Screen } from '../lib/ui.jsx'
import * as store from '../lib/storage.js'

export default function Settings({ embedded }) {
  const [s, setS] = useState(() => ({ apiKey: '', sttLang: 'en-AU', ...store.get('settings', {}) }))
  const [savedMsg, setSavedMsg] = useState('')
  const fileRef = useRef(null)

  const save = (patch) => {
    const next = { ...s, ...patch }
    setS(next)
    store.set('settings', next)
    setSavedMsg('已儲存 ✓')
    setTimeout(() => setSavedMsg(''), 1500)
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store.exportAll(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `english-app-backup-${store.todayStr()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        store.importAll(JSON.parse(reader.result))
        setSavedMsg('匯入成功 ✓ 重新整理頁面後生效')
      } catch {
        setSavedMsg('匯入失敗：檔案格式不對')
      }
    }
    reader.readAsText(file)
  }

  const body = (
    <>
      <div className="card">
        <h3>🤖 AI 回饋（Anthropic API）</h3>
        <p>口說評分、偵錯短文生成、造句檢查需要 API 金鑰。金鑰只存在這台裝置的瀏覽器裡。</p>
        <label className="field">API Key</label>
        <input className="input" type="password" value={s.apiKey}
          onChange={(e) => setS({ ...s, apiKey: e.target.value })}
          onBlur={() => save({ apiKey: s.apiKey.trim() })}
          placeholder="sk-ant-…" />
        <p style={{ fontSize: 13 }}>到 console.anthropic.com → API Keys 建立。沒有金鑰時，所有模式仍可用（規則判定，無 AI 回饋）。</p>
      </div>

      <div className="card">
        <h3>🗣️ 語音</h3>
        <label className="field">口音（語音辨識與播放）</label>
        <select className="input" value={s.sttLang} onChange={(e) => save({ sttLang: e.target.value })}>
          <option value="en-AU">澳洲 English (en-AU)</option>
          <option value="en-US">美式 English (en-US)</option>
          <option value="en-GB">英式 English (en-GB)</option>
        </select>
      </div>

      <div className="card">
        <h3>🖼️ 圖片描述</h3>
        <label className="field">五句鷹架提示（This picture shows… / There is…）</label>
        <select className="input" value={s.scaffold === false ? 'off' : 'on'}
          onChange={(e) => save({ scaffold: e.target.value === 'on' })}>
          <option value="on">開（顯示提示）</option>
          <option value="off">關（進階：不看提示）</option>
        </select>
      </div>

      <div className="card">
        <h3>💾 資料</h3>
        <p>所有紀錄（錯誤庫、單字庫、進度）都存在這台裝置。換裝置前先匯出。</p>
        <div className="btn-row">
          <button className="btn secondary" onClick={exportData}>匯出備份</button>
          <button className="btn secondary" onClick={() => fileRef.current.click()}>匯入備份</button>
        </div>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
      </div>

      {savedMsg && <div className="feedback-block good">{savedMsg}</div>}
    </>
  )

  if (embedded) return body
  return <Screen title="設定">{body}</Screen>
}
