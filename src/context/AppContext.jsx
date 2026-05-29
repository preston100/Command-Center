import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

const HABITS = [
  { id: 1, label: 'Exercise', icon: '◈' },
  { id: 2, label: 'Study', icon: '◎' },
  { id: 3, label: 'Prep lessons', icon: '✓' },
  { id: 4, label: 'Read', icon: '≡' },
  { id: 5, label: 'Dev work', icon: '⬡' },
]

const INITIAL_NOTES = `Quick captures\n\n- Check if Tomáš needs extra review on past tense\n- Look into Unity NavMesh tutorial\n- BAdmin: reread Porter's 5 forces for exam`

const todayKey = () => new Date().toISOString().split('T')[0]

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [notes, setNotes] = useState(() => localStorage.getItem('cc_notes') || INITIAL_NOTES)
  const [habitLog, setHabitLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_habits')) || {} } catch { return {} }
  })

  // Google Tasks integration — tasks come from Google Tasks API when connected
  const [localTasks, setLocalTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_local_tasks')) || [] } catch { return [] }
  })
  const [googleTasks, setGoogleTasks] = useState([])
  const [googleTasksLoaded, setGoogleTasksLoaded] = useState(false)

  useEffect(() => { localStorage.setItem('cc_notes', notes) }, [notes])
  useEffect(() => { localStorage.setItem('cc_habits', JSON.stringify(habitLog)) }, [habitLog])
  useEffect(() => { localStorage.setItem('cc_local_tasks', JSON.stringify(localTasks)) }, [localTasks])

  // Merge: google tasks take priority, local tasks are fallback
  const tasks = googleTasksLoaded ? googleTasks : localTasks

  const toggleHabit = (habitId) => {
    const key = todayKey()
    setHabitLog(prev => {
      const today = prev[key] || []
      const next = today.includes(habitId) ? today.filter(h => h !== habitId) : [...today, habitId]
      return { ...prev, [key]: next }
    })
  }
  const todayHabits = habitLog[todayKey()] || []

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab,
      tasks, localTasks, setLocalTasks, googleTasks, setGoogleTasks, setGoogleTasksLoaded,
      notes, setNotes,
      habits: HABITS, habitLog, toggleHabit, todayHabits,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
