import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { useGoogle } from '../context/GoogleContext'
import styles from './Dashboard.module.css'

const GEMINI_SYSTEM = `You are a personal assistant for Preston who teaches English to kids in Slovakia, studies Business Administration, and makes Unity/C# games. Be direct and helpful. No filler.`
const COLORS = ['blue','green','amber','purple']

function QuickAdd() {
  const { localTasks, setLocalTasks, setGoogleTasks, notes, setNotes } = useApp()
  const { token } = useGoogle()
  const [val, setVal] = useState('')

  const handle = async () => {
    if (!val.trim()) return
    const v = val.trim()
    if (v.startsWith('note:') || v.startsWith('n:')) {
      setNotes(notes + '\n- ' + v.replace(/^(note:|n:)\s*/, ''))
    } else {
      const tag = v.includes('#lesson') ? 'lesson' : v.includes('#uni') ? 'uni' : v.includes('#dev') ? 'dev' : 'other'
      const text = v.replace(/#\w+/g, '').trim()
      const newTask = { id: Date.now().toString(), text, done: false, tag }
      if (token) {
        // Will be synced via Tasks page — add locally for now
        setGoogleTasks(prev => [newTask, ...prev])
      } else {
        setLocalTasks(prev => [newTask, ...prev])
      }
    }
    setVal('')
  }

  return (
    <div className={styles.quickAdd}>
      <span className={styles.qaIcon}>+</span>
      <input className={styles.qaInput} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handle()}
        placeholder="Add task… or note: to save a note  (#lesson #uni #dev)" />
      {val && <button className={styles.qaBtn} onClick={handle}>↵</button>}
    </div>
  )
}

function MiniAI() {
  const [input, setInput] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    const key = localStorage.getItem('cc_gemini_key')
    if (!input.trim()) return
    if (!key) { setReply('Add your Gemini key in the AI tab first.'); return }
    setLoading(true); setReply('')
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: GEMINI_SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: input }] }],
          generationConfig: { maxOutputTokens: 300 }
        })
      })
      const data = await res.json()
      setReply(data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.')
    } catch { setReply('Error — check AI tab.') }
    setLoading(false); setInput('')
  }

  return (
    <div className={styles.miniAI}>
      {(reply || loading) && <div className={styles.aiReply}>{loading ? 'Thinking…' : reply}</div>}
      <div className={styles.aiRow}>
        <input className={styles.aiInput} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()} placeholder="Ask AI anything…" />
        <button className={styles.aiSend} onClick={ask} disabled={loading}>✦</button>
      </div>
    </div>
  )
}

const PANEL_DEFS = [
  { id: 'tasks',  label: 'Tasks',       col: 0 },
  { id: 'today',  label: 'Today',       col: 1 },
  { id: 'habits', label: 'Habits',      col: 1 },
  { id: 'notes',  label: 'Quick Note',  col: 1 },
  { id: 'email',  label: 'Inbox',       col: 2 },
  { id: 'ai',     label: 'AI',          col: 2 },
]

export default function Dashboard() {
  const { tasks, notes, setNotes, habits, todayHabits, toggleHabit, setActiveTab } = useApp()
  const { token, gFetch, login } = useGoogle()
  const [calEvents, setCalEvents] = useState([])
  const [emails, setEmails] = useState([])
  const [showCustomize, setShowCustomize] = useState(false)
  const [hiddenPanels, setHiddenPanels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_hidden')) || [] } catch { return [] }
  })
  const [colWidths, setColWidths] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_colw')) || [33, 34, 33] } catch { return [33, 34, 33] }
  })
  const gridRef = useRef()
  const dragging = useRef(null)

  useEffect(() => { localStorage.setItem('cc_hidden', JSON.stringify(hiddenPanels)) }, [hiddenPanels])
  useEffect(() => { localStorage.setItem('cc_colw', JSON.stringify(colWidths)) }, [colWidths])

  useEffect(() => {
    if (!token) return
    const start = new Date(); start.setHours(0,0,0,0)
    const end = new Date(); end.setHours(23,59,59,999)
    gFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=8`)
      .then(d => setCalEvents(d?.items || []))
  }, [token])

  useEffect(() => {
    if (!token) return
    gFetch('https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=5&labelIds=INBOX')
      .then(async data => {
        if (!data?.threads) return
        const details = await Promise.all(data.threads.slice(0,5).map(t =>
          gFetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`)
        ))
        setEmails(details.filter(Boolean).map(t => {
          const msg = t.messages?.[0]
          const h = msg?.payload?.headers || []
          const get = n => h.find(x => x.name.toLowerCase() === n)?.value || ''
          const unread = msg?.labelIds?.includes('UNREAD')
          const from = get('from').replace(/<.*>/, '').trim()
          const subject = get('subject') || '(no subject)'
          const date = new Date(parseInt(msg?.internalDate))
          const isToday = date.toDateString() === new Date().toDateString()
          const time = isToday ? date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : date.toLocaleDateString('en-GB',{day:'numeric',month:'short'})
          return { id: t.id, from, subject, time, unread }
        }))
      })
  }, [token])

  // Column resize
  const startDrag = useCallback((idx, e) => {
    e.preventDefault()
    dragging.current = { idx, startX: e.clientX, startWidths: [...colWidths] }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [colWidths])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !gridRef.current) return
      const { idx, startX, startWidths } = dragging.current
      const totalW = gridRef.current.offsetWidth
      const deltaPct = ((e.clientX - startX) / totalW) * 100
      setColWidths(prev => {
        const next = [...prev]
        next[idx] = Math.max(15, startWidths[idx] + deltaPct)
        next[idx+1] = Math.max(15, startWidths[idx+1] - deltaPct)
        // normalize to 100
        const sum = next.reduce((a,b) => a+b, 0)
        return next.map(w => (w/sum)*100)
      })
    }
    const onUp = () => {
      dragging.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  const incomplete = tasks.filter(t => !t.done)
  const SAMPLE_EVENTS = [
    { id:'s1', time:'09:00', label:'Kids English — Group B', color:'blue' },
    { id:'s2', time:'11:30', label:'Business Admin lecture', color:'amber' },
    { id:'s3', time:'14:00', label:'Kids English — Group A', color:'blue' },
    { id:'s4', time:'18:00', label:'Unity dev block', color:'green' },
  ]
  const SAMPLE_EMAILS = [
    { id:'e1', from:'School Admin', subject:'Schedule change for next week', time:'08:42', unread:true },
    { id:'e2', from:'Uni Portal', subject:'Assignment deadline reminder', time:'Yesterday', unread:true },
    { id:'e3', from:'Unity Forum', subject:'Re: Rigidbody2D question', time:'Yesterday', unread:false },
  ]

  const displayEvents = token ? calEvents : SAMPLE_EVENTS
  const displayEmails = token ? emails : SAMPLE_EMAILS

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <QuickAdd />
        <button className={styles.customizeBtn} onClick={() => setShowCustomize(v => !v)}>
          {showCustomize ? '✕ Done' : '⊞ Customize'}
        </button>
      </div>

      {showCustomize && (
        <div className={styles.customizeBar}>
          <span className={styles.customizeLabel}>Panels:</span>
          {PANEL_DEFS.map(p => (
            <button key={p.id}
              className={`${styles.pill} ${hiddenPanels.includes(p.id) ? styles.pillOff : styles.pillOn}`}
              onClick={() => setHiddenPanels(prev => prev.includes(p.id) ? prev.filter(x=>x!==p.id) : [...prev, p.id])}
            >{p.label}</button>
          ))}
          <button className={styles.resetBtn} onClick={() => { setColWidths([33,34,33]); setHiddenPanels([]) }}>Reset</button>
        </div>
      )}

      <div className={styles.grid} ref={gridRef}>
        {/* COL 0 */}
        <div className={styles.col} style={{width:`${colWidths[0]}%`}}>
          {!hiddenPanels.includes('tasks') && (
            <div className={`${styles.panel} ${styles.scrollPanel} fu`}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>✓ Tasks <span className={styles.badge}>{incomplete.length}</span></span>
                <button className={styles.panelLink} onClick={() => setActiveTab('tasks')}>All →</button>
              </div>
              {incomplete.length === 0 && <p className={styles.empty}>All clear ✓</p>}
              {incomplete.map(t => (
                <div key={t.id} className={styles.taskRow}>
                  <div className={styles.check} />
                  <span className={styles.taskText}>{t.text}</span>
                  <span className={`${styles.tag} ${styles[t.tag]}`}>{t.tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.divider} onMouseDown={e => startDrag(0, e)} />

        {/* COL 1 */}
        <div className={styles.col} style={{width:`${colWidths[1]}%`}}>
          {!hiddenPanels.includes('today') && (
            <div className={`${styles.panel} fu1`}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>▦ Today</span>
                <button className={styles.panelLink} onClick={() => setActiveTab('calendar')}>Calendar →</button>
              </div>
              {displayEvents.length === 0 && <p className={styles.empty}>No events today</p>}
              {displayEvents.map((e, i) => {
                const time = e.time || (e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : 'All day')
                const label = e.label || e.summary
                return (
                  <div key={e.id} className={styles.event}>
                    <span className={styles.eventTime}>{time}</span>
                    <span className={`${styles.dot} ${styles[e.color || COLORS[i%COLORS.length]]}`} />
                    <span className={styles.eventLabel}>{label}</span>
                  </div>
                )
              })}
            </div>
          )}
          {!hiddenPanels.includes('habits') && (
            <div className={`${styles.panel} fu2`}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>◷ Habits</span>
                <button className={styles.panelLink} onClick={() => setActiveTab('habits')}>All →</button>
              </div>
              <div className={styles.habitRow}>
                {habits.map(h => (
                  <button key={h.id} className={`${styles.habitBtn} ${todayHabits.includes(h.id) ? styles.habitDone : ''}`}
                    onClick={() => toggleHabit(h.id)}>
                    {h.icon} {h.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!hiddenPanels.includes('notes') && (
            <div className={`${styles.panel} ${styles.flexPanel} fu3`}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>≡ Note</span>
                <button className={styles.panelLink} onClick={() => setActiveTab('notes')}>Notes →</button>
              </div>
              <textarea className={styles.noteArea} value={notes}
                onChange={e => setNotes(e.target.value)} placeholder="Capture a thought…" />
            </div>
          )}
        </div>

        <div className={styles.divider} onMouseDown={e => startDrag(1, e)} />

        {/* COL 2 */}
        <div className={styles.col} style={{width:`${colWidths[2]}%`}}>
          {!hiddenPanels.includes('email') && (
            <div className={`${styles.panel} fu4`}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>✉ Inbox</span>
                <button className={styles.panelLink} onClick={() => setActiveTab('email')}>Open →</button>
              </div>
              {!token && <button className={styles.connectBtn} onClick={login}>Connect Google →</button>}
              {displayEmails.map((e, i) => (
                <div key={e.id || i} className={styles.emailItem}>
                  <div className={styles.emailRow}>
                    <span className={styles.emailFrom}>{e.unread && <span className={styles.unreadDot}/>}{e.from}</span>
                    <span className={styles.emailTime}>{e.time}</span>
                  </div>
                  <div className={styles.emailSub}>{e.subject}</div>
                </div>
              ))}
            </div>
          )}
          {!hiddenPanels.includes('ai') && (
            <div className={`${styles.panel} ${styles.flexPanel} fu5`}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>✦ AI</span>
                <button className={styles.panelLink} onClick={() => setActiveTab('ai')}>Full →</button>
              </div>
              <MiniAI />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
