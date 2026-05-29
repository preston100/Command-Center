import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useGoogle } from '../context/GoogleContext'
import styles from './Tasks.module.css'

const TAGS = ['lesson', 'uni', 'dev', 'other']

export default function Tasks() {
  const { tasks, localTasks, setLocalTasks, setGoogleTasks, setGoogleTasksLoaded } = useApp()
  const { token, gFetch } = useGoogle()
  const [text, setText] = useState('')
  const [tag, setTag] = useState('other')
  const [taskListId, setTaskListId] = useState(null)
  const [syncing, setSyncing] = useState(false)

  // Load Google Tasks
  useEffect(() => {
    if (!token) return
    setSyncing(true)
    gFetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists')
      .then(async data => {
        const list = data?.items?.[0]
        if (!list) { setSyncing(false); return }
        setTaskListId(list.id)
        const tasksData = await gFetch(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=true&maxResults=50`)
        const items = (tasksData?.items || []).map(t => ({
          id: t.id,
          text: t.title,
          done: t.status === 'completed',
          tag: t.notes?.match(/#(\w+)/)?.[1] || 'other',
          googleId: t.id,
          listId: list.id,
        }))
        setGoogleTasks(items)
        setGoogleTasksLoaded(true)
        setSyncing(false)
      })
  }, [token])

  const addTask = async () => {
    if (!text.trim()) return
    const newTask = { id: Date.now().toString(), text: text.trim(), done: false, tag }

    if (token && taskListId) {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: text.trim(), notes: `#${tag}`, status: 'needsAction' })
      })
      const created = await res.json()
      setGoogleTasks(prev => [{ ...newTask, id: created.id, googleId: created.id, listId: taskListId }, ...prev])
    } else {
      setLocalTasks(prev => [newTask, ...prev])
    }
    setText('')
  }

  const toggleTask = async (task) => {
    const newDone = !task.done
    if (token && task.googleId) {
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${task.listId}/tasks/${task.googleId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newDone ? 'completed' : 'needsAction' })
      })
      setGoogleTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: newDone } : t))
    } else {
      setLocalTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: newDone } : t))
    }
  }

  const deleteTask = async (task) => {
    if (token && task.googleId) {
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${task.listId}/tasks/${task.googleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setGoogleTasks(prev => prev.filter(t => t.id !== task.id))
    } else {
      setLocalTasks(prev => prev.filter(t => t.id !== task.id))
    }
  }

  const incomplete = tasks.filter(t => !t.done)
  const complete = tasks.filter(t => t.done)

  return (
    <div className={styles.wrap}>
      <div className={styles.addCard}>
        <div className={styles.addRow}>
          <input className={styles.input} value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="New task…" />
          <button className={styles.addBtn} onClick={addTask}>Add</button>
        </div>
        <div className={styles.tagRow}>
          {TAGS.map(t => (
            <button key={t} className={`${styles.tagBtn} ${tag === t ? styles.active : ''} ${styles[t]}`}
              onClick={() => setTag(t)}>{t}</button>
          ))}
          {token && (
            <span className={styles.syncBadge}>{syncing ? '⟳ Syncing…' : '✓ Synced with Google Tasks'}</span>
          )}
        </div>
      </div>

      {!token && (
        <div className={styles.syncNote}>
          Tasks are saved locally. Connect Google to sync with Google Tasks on your phone.
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>Active — {incomplete.length}</div>
        {incomplete.length === 0 && <p className={styles.empty}>Nothing pending ✓</p>}
        {incomplete.map(t => (
          <div key={t.id} className={styles.taskItem}>
            <button className={styles.check} onClick={() => toggleTask(t)} aria-label="Complete" />
            <span className={styles.taskText}>{t.text}</span>
            <span className={`${styles.tag} ${styles[t.tag]}`}>{t.tag}</span>
            <button className={styles.del} onClick={() => deleteTask(t)}>×</button>
          </div>
        ))}
      </div>

      {complete.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>Done — {complete.length}</div>
          {complete.map(t => (
            <div key={t.id} className={`${styles.taskItem} ${styles.done}`}>
              <button className={`${styles.check} ${styles.checked}`} onClick={() => toggleTask(t)}>✓</button>
              <span className={styles.taskText}>{t.text}</span>
              <span className={`${styles.tag} ${styles[t.tag]}`}>{t.tag}</span>
              <button className={styles.del} onClick={() => deleteTask(t)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
