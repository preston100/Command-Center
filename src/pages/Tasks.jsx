import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { useGoogle } from '../context/GoogleContext'
import styles from './Tasks.module.css'

const TAGS = ['lesson', 'uni', 'dev', 'other']

export default function Tasks() {
  const { token, gFetch } = useGoogle()
  const [tasks, setTasks] = useState([])
  const [localTasks, setLocalTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_local_tasks')) || [] } catch { return [] }
  })
  const [taskListId, setTaskListId] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [text, setText] = useState('')
  const [tag, setTag] = useState('other')

  useEffect(() => {
    localStorage.setItem('cc_local_tasks', JSON.stringify(localTasks))
  }, [localTasks])

  const loadGoogleTasks = useCallback(async () => {
    if (!token) return
    setSyncing(true)
    try {
      const lists = await gFetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists')
      const list = lists?.items?.[0]
      if (!list) { setSyncing(false); return }
      setTaskListId(list.id)
      const data = await gFetch(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=true&maxResults=100&showHidden=true`)
      const items = (data?.items || [])
        .filter(t => t.title?.trim())
        .map(t => ({
          id: t.id,
          text: t.title,
          done: t.status === 'completed',
          tag: t.notes?.match(/#(\w+)/)?.[1] || 'other',
          googleId: t.id,
          listId: list.id,
        }))
      setTasks(items)
    } catch (e) {
      console.error('Tasks load error:', e)
    }
    setSyncing(false)
  }, [token, gFetch])

  useEffect(() => { loadGoogleTasks() }, [loadGoogleTasks])

  const allTasks = token ? tasks : localTasks

  const addTask = async () => {
    if (!text.trim()) return
    const newTask = { id: Date.now().toString(), text: text.trim(), done: false, tag }
    if (token && taskListId) {
      try {
        const created = await gFetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.trim(), notes: `#${tag}`, status: 'needsAction' })
        })
        setTasks(prev => [{ ...newTask, id: created.id, googleId: created.id, listId: taskListId }, ...prev])
      } catch(e) { console.error(e) }
    } else {
      setLocalTasks(prev => [newTask, ...prev])
    }
    setText('')
  }

  const toggleTask = async (task) => {
    const newDone = !task.done
    if (token && task.googleId) {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: newDone } : t))
      try {
        await gFetch(`https://tasks.googleapis.com/tasks/v1/lists/${task.listId}/tasks/${task.googleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newDone ? 'completed' : 'needsAction', completed: newDone ? new Date().toISOString() : null })
        })
      } catch(e) {
        // Revert on error
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !newDone } : t))
        console.error(e)
      }
    } else {
      setLocalTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: newDone } : t))
    }
  }

  const deleteTask = async (task) => {
    if (token && task.googleId) {
      setTasks(prev => prev.filter(t => t.id !== task.id))
      try {
        await gFetch(`https://tasks.googleapis.com/tasks/v1/lists/${task.listId}/tasks/${task.googleId}`, {
          method: 'DELETE'
        })
      } catch(e) { console.error(e); loadGoogleTasks() }
    } else {
      setLocalTasks(prev => prev.filter(t => t.id !== task.id))
    }
  }

  const incomplete = allTasks.filter(t => !t.done)
  const complete = allTasks.filter(t => t.done)

  return (
    <div className={styles.wrap}>
      <div className={styles.addCard}>
        <div className={styles.addRow}>
          <input className={styles.input} value={text}
            onChange={e => setText(e.target.value)}
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
            <span className={styles.syncBadge}>
              {syncing ? '⟳ Syncing…' : `✓ Google Tasks · ${allTasks.length} tasks`}
            </span>
          )}
        </div>
      </div>

      {!token && (
        <div className={styles.syncNote}>
          Tasks are saved locally. Connect Google to sync with Google Tasks on your Pixel.
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
