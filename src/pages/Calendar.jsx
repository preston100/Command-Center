import EmptyState from "../components/EmptyState"
import { useState, useEffect } from 'react'
import { useGoogle } from '../context/GoogleContext'
import styles from './Calendar.module.css'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const COLORS = ['blue','green','amber','purple','red']

function getDayOfWeek(date) {
  const d = date.getDay()
  return d === 0 ? 6 : d - 1
}

function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}

export default function Calendar() {
  const { token, gFetch, login } = useGoogle()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(new Date())
  const [showAdd, setShowAdd] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', duration: '60' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const today = new Date()

  const weekStart = new Date(selected)
  weekStart.setDate(selected.getDate() - getDayOfWeek(selected))
  weekStart.setHours(0,0,0,0)

  const week = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const loadEvents = () => {
    if (!token) return
    setLoading(true)
    const start = new Date(weekStart)
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 7)
    gFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=50`)
      .then(d => { setEvents(d?.items || []); setLoading(false) })
  }

  useEffect(() => { loadEvents() }, [token, weekStart.toDateString()])

  const selectedEvents = events.filter(e => {
    const start = e.start?.dateTime || e.start?.date
    return start && new Date(start).toDateString() === selected.toDateString()
  })

  const addEvent = async () => {
    if (!newEvent.title.trim()) { setAddError('Please enter a title'); return }
    if (!newEvent.date) { setAddError('Please pick a date'); return }
    setAdding(true)
    setAddError('')

    let body
    if (newEvent.time) {
      const startDT = new Date(`${newEvent.date}T${newEvent.time}:00`)
      const endDT = new Date(startDT.getTime() + parseInt(newEvent.duration) * 60000)
      body = {
        summary: newEvent.title.trim(),
        start: { dateTime: startDT.toISOString(), timeZone: 'Europe/Bratislava' },
        end: { dateTime: endDT.toISOString(), timeZone: 'Europe/Bratislava' }
      }
    } else {
      body = {
        summary: newEvent.title.trim(),
        start: { date: newEvent.date },
        end: { date: newEvent.date }
      }
    }

    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const err = await res.json()
        setAddError(err.error?.message || 'Failed to add event')
        setAdding(false)
        return
      }
      const created = await res.json()
      setEvents(prev => [...prev, created].sort((a,b) => new Date(a.start?.dateTime||a.start?.date) - new Date(b.start?.dateTime||b.start?.date)))
      setAdding(false)
      setShowAdd(false)
      setNewEvent({ title: '', date: '', time: '', duration: '60' })
      // Jump to that date
      setSelected(new Date(newEvent.date + 'T12:00:00'))
    } catch(e) {
      setAddError(e.message)
      setAdding(false)
    }
  }

  const formatTime = (e) => {
    if (e.start?.dateTime) {
      const s = new Date(e.start.dateTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})
      const en = new Date(e.end.dateTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})
      return `${s} → ${en}`
    }
    return 'All day'
  }

  const hasEvents = (date) => events.some(e => {
    const s = e.start?.dateTime || e.start?.date
    return s && new Date(s).toDateString() === date.toDateString()
  })

  return (
    <div className={styles.wrap}>
      {!token && (
        <div className={styles.banner}>
          <span>Connect Google Calendar to see real events</span>
          <button className={styles.bannerBtn} onClick={login}>Connect →</button>
        </div>
      )}

      {showAdd && (
        <div className={styles.addBox}>
          <div className={styles.addHeader}>
            <span>New event</span>
            <button onClick={() => { setShowAdd(false); setAddError('') }}>✕</button>
          </div>
          <input className={styles.field} placeholder="Event title *" value={newEvent.title}
            onChange={e => setNewEvent(p=>({...p,title:e.target.value}))}
            onKeyDown={e => e.key === 'Enter' && addEvent()} />
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Date *</label>
              <input className={styles.field} type="date" value={newEvent.date}
                onChange={e => setNewEvent(p=>({...p,date:e.target.value}))} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Time (optional)</label>
              <input className={styles.field} type="time" value={newEvent.time}
                onChange={e => setNewEvent(p=>({...p,time:e.target.value}))} />
            </div>
          </div>
          {newEvent.time && (
            <select className={styles.field} value={newEvent.duration}
              onChange={e => setNewEvent(p=>({...p,duration:e.target.value}))}>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          )}
          {addError && <p className={styles.error}>{addError}</p>}
          <div className={styles.addActions}>
            <button className={styles.saveBtn} onClick={addEvent} disabled={adding || !token}>
              {!token ? 'Connect Google first' : adding ? 'Adding…' : 'Add to Google Calendar'}
            </button>
            <button className={styles.cancelBtn} onClick={() => { setShowAdd(false); setAddError('') }}>Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.main}>
        <div className={styles.weekNav}>
          <button className={styles.navBtn} onClick={() => { const d = new Date(selected); d.setDate(d.getDate()-7); setSelected(d) }}>←</button>
          <span className={styles.weekLabel}>
            {weekStart.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} — {week[6].toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
          </span>
          <button className={styles.navBtn} onClick={() => { const d = new Date(selected); d.setDate(d.getDate()+7); setSelected(d) }}>→</button>
          <button className={styles.todayBtn} onClick={() => setSelected(new Date())}>Today</button>
          <button className={styles.addBtn} onClick={() => {
            setNewEvent(p=>({...p, date: toLocalISODate(selected)}))
            setShowAdd(true)
          }}>+ Add event</button>
        </div>

        <div className={styles.week}>
          {week.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            const isSelected = day.toDateString() === selected.toDateString()
            const dayEvents = events.filter(e => {
              const s = e.start?.dateTime || e.start?.date
              return s && new Date(s).toDateString() === day.toDateString()
            })
            return (
              <div key={i}
                className={`${styles.dayCol} ${isToday ? styles.todayCol : ''} ${isSelected ? styles.selectedCol : ''}`}
                onClick={() => setSelected(day)}
              >
                <div className={styles.dayHead}>
                  <span className={styles.dayName}>{DAYS[i]}</span>
                  <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>{day.getDate()}</span>
                </div>
                <div className={styles.dayEvents}>
                  {dayEvents.slice(0,3).map((e,j) => (
                    <div key={e.id} className={`${styles.eventPill} ${styles[COLORS[j%COLORS.length]]}`}>
                      {e.start?.dateTime && <span className={styles.pillTime}>{new Date(e.start.dateTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>}
                      <span className={styles.pillTitle}>{e.summary}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && <span className={styles.more}>+{dayEvents.length-3}</span>}
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.detail}>
          <div className={styles.detailHead}>
            {selected.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
            {loading && <span className={styles.loadingText}> · Loading…</span>}
          </div>
          {token && selectedEvents.length === 0 && !loading && (
            <p className={styles.empty}>No events — <button className={styles.addLink} onClick={() => { setNewEvent(p=>({...p,date:toLocalISODate(selected)})); setShowAdd(true) }}>Add one?</button></p>
          )}
          {!token && <EmptyState type="calendar" title="No events" subtitle="Connect Google Calendar to see your schedule" action="Connect Google" onAction={login} />}
          {selectedEvents.map((e,i) => (
            <div key={e.id} className={styles.detailEvent}>
              <div className={`${styles.detailDot} ${styles[COLORS[i%COLORS.length]]}`} />
              <div>
                <div className={styles.detailTitle}>{e.summary}</div>
                <div className={styles.detailTime}>{formatTime(e)}</div>
                {e.description && <div className={styles.detailDesc}>{e.description}</div>}
                {e.location && <div className={styles.detailDesc}>📍 {e.location}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
