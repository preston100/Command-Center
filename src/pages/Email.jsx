import { useEffect, useState } from 'react'
import { useGoogle } from '../context/GoogleContext'
import EmptyState from '../components/EmptyState'
import styles from './Email.module.css'

function getHeader(headers, name) {
  return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
}

function decodeBody(payload) {
  const tryDecode = (data) => {
    try { return atob(data.replace(/-/g, '+').replace(/_/g, '/')) } catch { return '' }
  }
  if (payload?.body?.data) return tryDecode(payload.body.data)
  if (payload?.parts) {
    const text = payload.parts.find(p => p.mimeType === 'text/plain')
    if (text?.body?.data) return tryDecode(text.body.data)
    const html = payload.parts.find(p => p.mimeType === 'text/html')
    if (html?.body?.data) return tryDecode(html.body.data).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return ''
}

export default function Email() {
  const { token, gFetch, login } = useGoogle()
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [selectedBody, setSelectedBody] = useState('')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    gFetch('https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=20&labelIds=INBOX')
      .then(async data => {
        if (!data?.threads) { setLoading(false); return }
        const details = await Promise.all(
          data.threads.slice(0, 15).map(t =>
            gFetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)
          )
        )
        setThreads(details.filter(Boolean))
        setLoading(false)
      })
  }, [token])

  const openThread = async (thread) => {
    setSelected(thread)
    setSelectedBody('')
    const full = await gFetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}?format=full`)
    const lastMsg = full?.messages?.[full.messages.length - 1]
    setSelectedBody(decodeBody(lastMsg?.payload) || '(No content)')
    // Mark as read
    fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}/modify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
    })
    setThreads(prev => prev.map(t => t.id === thread.id ? {
      ...t, messages: t.messages?.map(m => ({ ...m, labelIds: m.labelIds?.filter(l => l !== 'UNREAD') }))
    } : t))
  }

  const emails = threads.map(t => {
    const msg = t.messages?.[0]
    const headers = msg?.payload?.headers || []
    const unread = msg?.labelIds?.includes('UNREAD')
    const from = getHeader(headers, 'From').replace(/<.*>/, '').trim()
    const subject = getHeader(headers, 'Subject') || '(no subject)'
    const date = new Date(parseInt(msg?.internalDate))
    const isToday = date.toDateString() === new Date().toDateString()
    const time = isToday
      ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return { id: t.id, from, subject, time, unread }
  })

  const SAMPLE = [
    { from: 'School Admin', subject: 'Schedule change for next week', time: '08:42', unread: true },
    { from: 'Uni Portal', subject: 'Assignment deadline reminder', time: 'Yesterday', unread: true },
    { from: 'Unity Forum', subject: 'Re: Rigidbody2D question', time: 'Yesterday', unread: false },
  ]

  return (
    <div className={styles.wrap}>
      {!token && (
        <div className={styles.banner}>
          <span>Connect Google to load your real Gmail inbox</span>
          <button className={styles.bannerBtn} onClick={login}>Connect →</button>
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.list}>
          <div className={styles.listHeader}>
            <span className={styles.listTitle}>✉ Inbox</span>
          </div>
          {loading && <p className={styles.loading}>Loading…</p>}
          {(token ? emails : SAMPLE).map((e, i) => (
            <div key={e.id || i}
              className={`${styles.email} ${e.unread ? styles.unread : ''} ${selected?.id === e.id ? styles.active : ''}`}
              onClick={() => token && openThread(threads.find(t => t.id === e.id))}
            >
              <div className={styles.emailRow}>
                <span className={styles.from}>{e.unread && <span className={styles.dot} />}{e.from}</span>
                <span className={styles.time}>{e.time}</span>
              </div>
              <div className={styles.subject}>{e.subject}</div>
            </div>
          ))}
        </div>

        {selected && (
          <div className={styles.reader}>
            <div className={styles.readerHeader}>
              <button className={styles.backBtn} onClick={() => setSelected(null)}>← Back</button>
              <div className={styles.readerSubject}>
                {getHeader(threads.find(t=>t.id===selected.id)?.messages?.[0]?.payload?.headers||[], 'Subject')}
              </div>
            </div>
            <div className={styles.readerFrom}>
              From: {getHeader(threads.find(t=>t.id===selected.id)?.messages?.[0]?.payload?.headers||[], 'From')}
            </div>
            <div className={styles.readerBody}>{selectedBody || 'Loading…'}</div>
          </div>
        )}

        {!selected && token && (
          <div className={styles.placeholder}>
            <EmptyState type="email" title="Select an email" subtitle="Tap any message to read it" />
          </div>
        )}
      </div>
    </div>
  )
}
