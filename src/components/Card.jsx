import styles from './Card.module.css'
export default function Card({ title, icon, action, onAction, children, scroll = false, className = '', style }) {
  return (
    <div className={`${styles.card} ${className}`} style={style}>
      {(title || action) && (
        <div className={styles.header}>
          {title && <span className={styles.title}>{icon && <span>{icon}</span>}{title}</span>}
          {action && <button className={styles.action} onClick={onAction}>{action}</button>}
        </div>
      )}
      <div className={scroll ? styles.scrollBody : styles.body}>{children}</div>
    </div>
  )
}
