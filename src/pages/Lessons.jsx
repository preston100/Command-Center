import { useState, useEffect } from 'react'
import { useGoogle } from '../context/GoogleContext'
import styles from './Lessons.module.css'

const LESSON_KEYWORDS = ['english', 'lesson', 'group a', 'group b', 'kids', 'teaching', 'class']

function isLesson(event) {
  const title = (event.summary || '').toLowerCase()
  return LESSON_KEYWORDS.some(kw => title.includes(kw))
}

function formatTime(e) {
  if (e.start?.dateTime) {
    const s = new Date(e.start.dateTime)
    const en = new Date(e.end?.dateTime || e.start.dateTime)
    return `${s.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} → ${en.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`
  }
  return 'All day'
}

function formatDate(e) {
  const d = new Date(e.start?.dateTime || e.start?.date)
  return d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})
}

export default function Lessons() {
  const { token, gFetch, login } = useGoogle()
  const [events, setEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('lessons')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    const start = new Date()
    start.setDate(start.getDate() - 7) // past week
    const end = new Date()
    end.setDate(end.getDate() + 30) // next month
    gFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=100`)
      .then(data => {
        const items = data?.items || []
        setAllEvents(items)
        setEvents(items.filter(isLesson))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const displayEvents = filter === 'lessons' ? events : allEvents
  const today = new Date()

  const upcoming = displayEvents.filter(e => new Date(e.start?.dateTime || e.start?.date) >= today)
  const past = displayEvents.filter(e => new Date(e.start?.dateTime || e.start?.date) < today)

  return (
    <div className={styles.wrap}>
      {!token && (
        <div className={styles.banner}>
          <span>Connect Google Calendar to see your lessons</span>
          <button className={styles.bannerBtn} onClick={login}>Connect →</button>
        </div>
      )}

      <div className={styles.toolbar}>
        <button className={`${styles.filterBtn} ${filter === 'lessons' ? styles.active : ''}`}
          onClick={() => setFilter('lessons')}>
          Lessons only ({events.length})
        </button>
        <button className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}>
          All events ({allEvents.length})
        </button>
        {filter === 'lessons' && (
          <span className={styles.hint}>Showing events with: english, lesson, group, kids, class</span>
        )}
      </div>

      {loading && <p className={styles.loading}>Loading from Google Calendar…</p>}

      {!token && (
        <div className={styles.noConnect}>
          <p>Your lessons will be pulled directly from Google Calendar.</p>
          <p>Any event with "english", "lesson", "group", "kids", or "class" in the title will appear here.</p>
        </div>
      )}

      {token && upcoming.length === 0 && !loading && (
        <p className={styles.empty}>
          No {filter === 'lessons' ? 'lesson ' : ''}events found in the next 30 days.
          {filter === 'lessons' && ' Try switching to "All events" or add lesson events to your Google Calendar.'}
        </p>
      )}

      {upcoming.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>Upcoming</div>
          {upcoming.map(e => (
            <div key={e.id} className={styles.eventItem}>
              <div className={styles.eventDate}>{formatDate(e)}</div>
              <div className={styles.eventInfo}>
                <div className={styles.eventTitle}>{e.summary}</div>
                <div className={styles.eventTime}>{formatTime(e)}</div>
                {e.description && <div className={styles.eventDesc}>{e.description}</div>}
                {e.location && <div className={styles.eventDesc}>📍 {e.location}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>Past week</div>
          {past.slice().reverse().map(e => (
            <div key={e.id} className={`${styles.eventItem} ${styles.pastEvent}`}>
              <div className={styles.eventDate}>{formatDate(e)}</div>
              <div className={styles.eventInfo}>
                <div className={styles.eventTitle}>{e.summary}</div>
                <div className={styles.eventTime}>{formatTime(e)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
