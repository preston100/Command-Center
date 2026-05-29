import { useApp } from '../context/AppContext'
import styles from './Habits.module.css'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function getLast7() {
  return Array.from({length: 7}, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

export default function Habits() {
  const { habits, habitLog, toggleHabit, todayHabits } = useApp()
  const last7 = getLast7()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Habit Tracker</h2>
        <p className={styles.sub}>Track daily habits — tap to toggle today</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.colLabel} />
        {last7.map((d, i) => {
          const date = new Date(d)
          const isToday = i === 6
          return (
            <div key={d} className={`${styles.dayHead} ${isToday ? styles.today : ''}`}>
              <span>{DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]}</span>
              <span className={styles.dayNum}>{date.getDate()}</span>
            </div>
          )
        })}

        {habits.map(h => (
          <>
            <div key={h.id + 'l'} className={styles.habitLabel}>
              <span>{h.icon}</span> {h.label}
            </div>
            {last7.map((d, i) => {
              const done = (habitLog[d] || []).includes(h.id)
              const isToday = i === 6
              return (
                <button
                  key={h.id + d}
                  className={`${styles.cell} ${done ? styles.done : ''} ${isToday ? styles.todayCell : ''}`}
                  onClick={isToday ? () => toggleHabit(h.id) : undefined}
                  style={{ cursor: isToday ? 'pointer' : 'default' }}
                >
                  {done ? '✓' : ''}
                </button>
              )
            })}
          </>
        ))}
      </div>

      <div className={styles.streakRow}>
        {habits.map(h => {
          let streak = 0
          for (let i = last7.length - 1; i >= 0; i--) {
            if ((habitLog[last7[i]] || []).includes(h.id)) streak++
            else break
          }
          return (
            <div key={h.id} className={styles.streakCard}>
              <span className={styles.streakNum}>{streak}</span>
              <span className={styles.streakLabel}>{h.label}</span>
              <span className={styles.streakSub}>day streak</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
