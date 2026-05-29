import styles from './EmptyState.module.css'

const ICONS = {
  tasks: '✓',
  email: '✉',
  calendar: '▦',
  drive: '◈',
  notes: '≡',
  lessons: '◎',
  ai: '✦',
  default: '○'
}

export default function EmptyState({ type = 'default', title, subtitle, action, onAction }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{ICONS[type] || ICONS.default}</div>
      <div className={styles.title}>{title}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      {action && <button className={styles.action} onClick={onAction}>{action}</button>}
    </div>
  )
}
