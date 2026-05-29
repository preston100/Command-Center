import { useState, useRef, useEffect } from 'react'
import { useGoogle } from '../context/GoogleContext'
import { useApp } from '../context/AppContext'
import styles from './AI.module.css'

const SYSTEM = (calEvents, tasks) => `You are a personal assistant for Preston, who:
- Teaches English to kids in Slovakia (groups A1/A2/B1 levels)
- Studies Business Administration
- Makes games in Unity with C#
- Is based in Bratislava, Slovakia

Be direct, sharp, and helpful. No filler. Respond in English unless asked otherwise.

TODAY'S CALENDAR:
${calEvents.length > 0 ? calEvents.map(e => {
  const time = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : 'All day'
  return `- ${time}: ${e.summary}`
}).join('\n') : '- No events today'}

PENDING TASKS:
${tasks.filter(t=>!t.done).map(t=>`- [${t.tag}] ${t.text}`).join('\n') || '- None'}

Use this context to give relevant, personalized help. You can reference their schedule and tasks naturally.`

export default function AI() {
  const { token, gFetch } = useGoogle()
  const { tasks } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cc_gemini_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [calEvents, setCalEvents] = useState([])
  const [briefing, setBriefing] = useState('')
  const [briefingLoading, setBriefingLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!token) return
    const start = new Date(); start.setHours(0,0,0,0)
    const end = new Date(); end.setHours(23,59,59,999)
    gFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=10`)
      .then(d => setCalEvents(d?.items || []))
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  const saveKey = () => {
    localStorage.setItem('cc_gemini_key', apiKey)
    setShowKeyInput(false)
  }

  const getDailyBriefing = async () => {
    if (!apiKey) { setShowKeyInput(true); return }
    setBriefingLoading(true)
    const prompt = `Give me a sharp daily briefing for today. Include:
1. A quick summary of today's schedule
2. Which tasks I should prioritize
3. One tip or reminder based on my schedule
Keep it concise — 4-6 sentences max.`
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM(calEvents, tasks) }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300 }
        })
      })
      const data = await res.json()
      setBriefing(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
    } catch {}
    setBriefingLoading(false)
  }

  const send = async () => {
    if (!input.trim() || loading) return
    if (!apiKey) { setShowKeyInput(true); return }
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    const history = [...messages, userMsg]
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM(calEvents, tasks) }] },
          contents: history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          generationConfig: { maxOutputTokens: 1024 }
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }])
    }
    setLoading(false)
  }

  return (
    <div className={styles.wrap}>
      {showKeyInput && (
        <div className={styles.keyBox}>
          <p className={styles.keyLabel}>Enter your Gemini API key</p>
          <div className={styles.keyRow}>
            <input className={styles.keyInput} type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIza..." onKeyDown={e => e.key === 'Enter' && saveKey()} />
            <button className={styles.saveBtn} onClick={saveKey}>Save</button>
          </div>
          <p className={styles.keyHint}>Free key at aistudio.google.com · Stored locally only</p>
        </div>
      )}

      <div className={styles.context}>
        <div className={styles.contextLeft}>
          <span className={styles.contextLabel}>Today's schedule loaded</span>
          <span className={styles.contextSub}>{calEvents.length} events · {tasks.filter(t=>!t.done).length} pending tasks</span>
        </div>
        <button className={styles.briefingBtn} onClick={getDailyBriefing} disabled={briefingLoading}>
          {briefingLoading ? 'Loading…' : '✦ Daily briefing'}
        </button>
      </div>

      {briefing && (
        <div className={styles.briefing}>
          <div className={styles.briefingHead}>✦ Daily Briefing</div>
          <div className={styles.briefingBody}>{briefing}</div>
          <button className={styles.closeBriefing} onClick={() => setBriefing('')}>Dismiss</button>
        </div>
      )}

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.suggestions}>
            <p className={styles.suggestLabel}>Try asking:</p>
            {[
              'What should I focus on today?',
              'Help me plan a lesson on present perfect for A2 kids',
              'Explain Porter\'s 5 forces simply',
              'How do I implement a singleton in Unity C#?',
            ].map((s,i) => (
              <button key={i} className={styles.suggest} onClick={() => setInput(s)}>{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.assistant}`}>
            <div className={styles.bubble}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.msg} ${styles.assistant}`}>
            <div className={`${styles.bubble} ${styles.thinking}`}><span/><span/><span/></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputRow}>
        <textarea className={styles.input} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask anything… (Enter to send, Shift+Enter for new line)" rows={2} />
        <button className={styles.sendBtn} onClick={send} disabled={loading}>{loading ? '…' : '↑'}</button>
      </div>
      {!apiKey && <button className={styles.keyPrompt} onClick={() => setShowKeyInput(true)}>✦ Add Gemini API key to enable AI</button>}
    </div>
  )
}
