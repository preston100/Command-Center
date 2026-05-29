import { useApp } from '../context/AppContext'
import styles from './Sidebar.module.css'

const NAV = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'tasks',     icon: '✓', label: 'Tasks' },
  { id: 'calendar',  icon: '▦', label: 'Calendar' },
  { id: 'email',     icon: '✉', label: 'Gmail' },
  { id: 'drive',     icon: '◈', label: 'Drive' },
]
const NAV2 = [
  { id: 'lessons', icon: '◎', label: 'Lessons' },
  { id: 'notes',   icon: '≡', label: 'Notes' },
  { id: 'habits',  icon: '◷', label: 'Habits' },
  { id: 'timer',   icon: '◉', label: 'Focus Timer' },
  { id: 'ai',      icon: '✦', label: 'AI Assistant' },
]

export default function Sidebar() {
  const { activeTab, setActiveTab } = useApp()
  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>C</div>
      <div className={styles.group}>
        {NAV.map(n => (
          <button key={n.id} className={`${styles.btn} ${activeTab === n.id ? styles.active : ''}`}
            onClick={() => setActiveTab(n.id)} aria-label={n.label}>
            {n.icon}
            <span className={styles.tooltip}>{n.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.divider} />
      <div className={styles.group}>
        {NAV2.map(n => (
          <button key={n.id} className={`${styles.btn} ${activeTab === n.id ? styles.active : ''}`}
            onClick={() => setActiveTab(n.id)} aria-label={n.label}>
            {n.icon}
            <span className={styles.tooltip}>{n.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.spacer} />
      <button className={styles.btn} aria-label="Settings">
        ⚙
        <span className={styles.tooltip}>Settings</span>
      </button>
    </nav>
  )
}
