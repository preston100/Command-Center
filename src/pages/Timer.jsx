import { useState, useEffect, useRef } from 'react'
import styles from './Timer.module.css'

const PRESETS = [
  { label: 'Pomodoro', work: 25, break: 5 },
  { label: 'Long',     work: 50, break: 10 },
  { label: 'Short',    work: 15, break: 3 },
]

export default function Timer() {
  const [preset, setPreset] = useState(0)
  const [mode, setMode] = useState('work') // 'work' | 'break'
  const [running, setRunning] = useState(false)
  const [seconds, setSeconds] = useState(PRESETS[0].work * 60)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef(null)

  const total = mode === 'work' ? PRESETS[preset].work * 60 : PRESETS[preset].break * 60
  const pct = ((total - seconds) / total) * 100
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (mode === 'work') { setSessions(n => n + 1); setMode('break'); setSeconds(PRESETS[preset].break * 60) }
            else { setMode('work'); setSeconds(PRESETS[preset].work * 60) }
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode, preset])

  const reset = () => {
    setRunning(false)
    clearInterval(intervalRef.current)
    setMode('work')
    setSeconds(PRESETS[preset].work * 60)
  }

  const selectPreset = (i) => {
    setPreset(i); reset()
    setSeconds(PRESETS[i].work * 60)
  }

  const r = 80
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className={styles.page}>
      <div className={styles.presets}>
        {PRESETS.map((p, i) => (
          <button key={i} className={`${styles.preset} ${preset === i ? styles.active : ''}`} onClick={() => selectPreset(i)}>
            {p.label} · {p.work}m
          </button>
        ))}
      </div>

      <div className={styles.ring}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--bg-4)" strokeWidth="6" />
          <circle cx="100" cy="100" r={r} fill="none"
            stroke={mode === 'work' ? 'var(--accent)' : 'var(--green)'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className={styles.ringInner}>
          <div className={styles.modeBadge} style={{ background: mode === 'work' ? 'var(--accent-2)' : 'var(--green-2)', color: mode === 'work' ? 'var(--accent)' : 'var(--green)' }}>
            {mode === 'work' ? 'Focus' : 'Break'}
          </div>
          <div className={styles.clockFace}>{mins}:{secs}</div>
          <div className={styles.sessions}>{sessions} sessions done</div>
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.btn} onClick={reset}>↺ Reset</button>
        <button className={`${styles.btn} ${styles.main}`} onClick={() => setRunning(r => !r)}>
          {running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button className={styles.btn} onClick={() => { setMode(m => m === 'work' ? 'break' : 'work'); setRunning(false); setSeconds(mode === 'work' ? PRESETS[preset].break * 60 : PRESETS[preset].work * 60) }}>
          ⇄ Skip
        </button>
      </div>

      <div className={styles.tip}>
        {mode === 'work' ? '🎯 Stay focused — you got this' : '☕ Take a proper break, step away'}
      </div>
    </div>
  )
}
