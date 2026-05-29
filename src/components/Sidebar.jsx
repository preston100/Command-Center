import { useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './Sidebar.module.css'

const NAV = [
  { id: 'dashboard', icon: '⊞', label: 'Home' },
  { id: 'tasks',     icon: '✓', label: 'Tasks' },
  { id: 'calendar',  icon: '▦', label: 'Calendar' },
  { id: 'email',     icon: '✉', label: 'Gmail' },
  { id: 'drive',     icon: '◈', label: 'Drive' },
]
const NAV2 = [
  { id: 'lessons', icon: '◎', label: 'Lessons' },
  { id: 'notes',   icon: '≡', label: 'Notes' },
  { id: 'habits',  icon: '◷', label: 'Habits' },
  { id: 'timer',   icon: '◉', label: 'Timer' },
  { id: 'ai',      icon: '✦', label: 'AI' },
]

function MobileMore({ activeTab, setActiveTab }) {
  const [open, setOpen] = useState(false)
  const isSecondary = NAV2.some(n => n.id === activeTab)
  const active = NAV2.find(n => n.id === activeTab)

  return (
    <div className={styles.moreWrap}>
      {open && (
        <div className={styles.moreMenu}>
          {NAV2.map(n => (
            <button key={n.id}
              className={`${styles.moreItem} ${activeTab === n.id ? styles.moreActive : ''}`}
              onClick={() => { setActiveTab(n.id); setOpen(false) }}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        className={`${styles.mobileBtn} ${isSecondary ? styles.mobileActive : ''}`}
        onClick={() => setOpen(v => !v)}>
        <span className={styles.mobileIcon}>{isSecondary ? active?.icon : '⋯'}</span>
        <span className={styles.mobileLabel}>{isSecondary ? active?.label : 'More'}</span>
      </button>
    </div>
  )
}

export default function Sidebar() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>C</div>
        <div className={styles.group}>
          {NAV.map(n => (
            <button key={n.id} className={`${styles.btn} ${activeTab === n.id ? styles.active : ''}`}
              onClick={() => setActiveTab(n.id)} aria-label={n.label} title={n.label}>
              <span>{n.icon}</span>
              <span className={styles.tooltip}>{n.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.divider} />
        <div className={styles.group}>
          {NAV2.map(n => (
            <button key={n.id} className={`${styles.btn} ${activeTab === n.id ? styles.active : ''}`}
              onClick={() => setActiveTab(n.id)} aria-label={n.label} title={n.label}>
              <span>{n.icon}</span>
              <span className={styles.tooltip}>{n.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.spacer} />
        <button className={styles.btn} aria-label="Settings" title="Settings">⚙</button>
      </nav>

      <nav className={styles.mobileNav}>
        {NAV.map(n => (
          <button key={n.id}
            className={`${styles.mobileBtn} ${activeTab === n.id ? styles.mobileActive : ''}`}
            onClick={() => setActiveTab(n.id)} aria-label={n.label}>
            <span className={styles.mobileIcon}>{n.icon}</span>
            <span className={styles.mobileLabel}>{n.label}</span>
          </button>
        ))}
        <MobileMore activeTab={activeTab} setActiveTab={setActiveTab} />
      </nav>
    </>
  )
}
