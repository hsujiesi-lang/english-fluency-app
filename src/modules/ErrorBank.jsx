// 模組 3：個人錯誤庫 — 自動收集 + 間隔重複複習（變形出題）

import React, { useEffect, useState } from 'react'
import { Screen, Spinner, shuffle } from '../lib/ui.jsx'
import * as banks from '../lib/banks.js'
import * as claude from '../lib/claude.js'
import * as store from '../lib/storage.js'
import * as speech from '../lib/speech.js'

const TYPE_LABEL = {
  verbForm: '動詞形式',
  article: '冠詞',
  plural: '單複數',
  posError: '詞性誤用',
  prep: '介係詞',
  fluency: '流暢度',
}

export default function ErrorBank({ nav, embedded }) {
  const [view, setView] = useState('list') // list | review
  const [, force] = useState(0)
  const refresh = () => force((n) => n + 1)

  const errors = banks.getErrors()
  const due = banks.dueErrors()

  if (view === 'review') {
    return <ReviewSession due={due} onDone={() => { setView('list'); refresh() }} embedded={embedded} />
  }

  const body = (
    <>
      <div className="stat-grid">
        <div className="stat"><div className="num">{errors.length}</div><div className="lbl">總錯誤數</div></div>
        <div className="stat"><div className="num">{due.length}</div><div className="lbl">今日到期</div></div>
        <div className="stat"><div className="num">{errors.filter((e) => (e.srs?.streak || 0) >= 3).length}</div><div className="lbl">已熟練</div></div>
      </div>
      {due.length > 0 && (
        <button className="btn big" onClick={() => setView('review')}>開始複習（{due.length} 題）</button>
      )}
      {errors.length === 0 && (
        <div className="card"><p>還沒有紀錄。去玩「錯誤獵人」或「口說流暢度」，犯的錯會自動存進來。</p></div>
      )}
      <div style={{ marginTop: 14 }}>
        {errors.map((e) => (
          <div className="list-item" key={e.id}>
            <div style={{ flex: 1 }}>
              <span className={'tag ' + (e.type === 'fluency' ? 'warn' : 'bad')}>{TYPE_LABEL[e.type] || e.type}</span>
              <div style={{ marginTop: 4 }}>
                <s style={{ color: 'var(--bad)' }}>{e.originalText}</s>
                {e.correction && <> → <b style={{ color: 'var(--good)' }}>{e.correction}</b></>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                連對 {e.srs?.streak || 0} 次 · 間隔 {e.srs?.interval || 1} 天
              </div>
            </div>
            <button className="btn ghost small" onClick={() => { banks.deleteError(e.id); refresh() }}>刪除</button>
          </div>
        ))}
      </div>
    </>
  )

  if (embedded) return body
  return <Screen title="個人錯誤庫" sub="你的專屬弱點清單，到期就回收出題">{body}</Screen>
}

// ---- review session: variant questions ----

function ReviewSession({ due, onDone, embedded }) {
  const [i, setI] = useState(0)
  const [question, setQuestion] = useState(null) // {wrong, right} or fluency item
  const [loading, setLoading] = useState(false)
  const [answered, setAnswered] = useState(null) // 'right' | 'wrong'
  const [options, setOptions] = useState([])

  const item = due[i]

  useEffect(() => {
    if (!item) return
    setAnswered(null)
    setQuestion(null)
    if (item.type === 'fluency') {
      setQuestion({ fluency: true })
      return
    }
    // 變形出題：Claude 生成同錯誤點的新句子；失敗或無金鑰則用原句
    if (claude.hasApiKey()) {
      setLoading(true)
      claude.generateVariants(item)
        .then((res) => {
          const v = res.variants && res.variants[0]
          if (v && v.wrong && v.right) setQuestion({ wrong: v.wrong, right: v.right })
          else setQuestion({ wrong: item.originalText, right: item.correction })
        })
        .catch(() => setQuestion({ wrong: item.originalText, right: item.correction }))
        .finally(() => setLoading(false))
    } else {
      setQuestion({ wrong: item.originalText, right: item.correction })
    }
  }, [i])

  useEffect(() => {
    if (question && !question.fluency) setOptions(shuffle([question.right, question.wrong]))
  }, [question])

  if (!item) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>今天沒有到期的錯誤 🎉</h3>
        <button className="btn" onClick={onDone}>返回</button>
      </div>
    )
  }

  const answer = (choice) => {
    if (answered) return
    const correct = choice === question.right
    setAnswered(correct ? 'right' : 'wrong')
    banks.reviewError(item.id, correct)
    store.logActivity('errorBank')
  }

  const answerFluency = (managed) => {
    if (answered) return
    setAnswered(managed ? 'right' : 'wrong')
    banks.reviewError(item.id, managed)
    store.logActivity('errorBank')
  }

  const next = () => {
    if (i + 1 >= due.length) onDone()
    else setI(i + 1)
  }

  const body = (
    <>
      <p className="screen-sub">複習 {i + 1} / {due.length}</p>
      <div className="card">
        <span className={'tag ' + (item.type === 'fluency' ? 'warn' : 'bad')}>{TYPE_LABEL[item.type] || item.type}</span>
        {loading && <Spinner label="生成變化題…" />}
        {question && question.fluency && (
          <>
            <p style={{ color: 'var(--muted)' }}>上次你在這裡卡住了。現在把它說成一個完整的句子：</p>
            <p className="big-question">「{item.originalText}…」</p>
            {item.correction && <p style={{ fontSize: 14, color: 'var(--muted)' }}>提示：{item.correction}</p>}
            {!answered ? (
              <div className="btn-row">
                <button className="btn good" onClick={() => answerFluency(true)}>說出完整句了 ✅</button>
                <button className="btn bad" onClick={() => answerFluency(false)}>還是卡住 ❌</button>
              </div>
            ) : (
              <FeedbackAndNext answered={answered} item={item} next={next} />
            )}
          </>
        )}
        {question && !question.fluency && (
          <>
            <p style={{ color: 'var(--muted)' }}>哪一句是正確的？</p>
            {options.map((opt) => (
              <button key={opt} disabled={!!answered}
                className={'opt' + (answered ? (opt === question.right ? ' correct' : ' wrong') : '')}
                onClick={() => answer(opt)}>
                {opt}
              </button>
            ))}
            {answered && <FeedbackAndNext answered={answered} item={item} next={next} sayText={question.right} />}
          </>
        )}
      </div>
    </>
  )

  if (embedded) return body
  return <Screen title="錯誤複習">{body}</Screen>
}

function FeedbackAndNext({ answered, item, next, sayText }) {
  return (
    <>
      <div className={'feedback-block ' + (answered === 'right' ? 'good' : 'bad')}>
        {answered === 'right' ? '✅ 答對！間隔 ×2.5' : '❌ 重新進入學習狀態（10 分鐘後再問一次）'}
        {item.note && <p style={{ margin: '6px 0 0' }}>{item.note}</p>}
      </div>
      <div className="btn-row">
        {sayText && <button className="btn secondary" onClick={() => speech.speak(sayText)}>🔊 唸給我聽</button>}
        <button className="btn" onClick={next}>下一題 →</button>
      </div>
    </>
  )
}
