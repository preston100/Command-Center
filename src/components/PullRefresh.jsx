import styles from './PullRefresh.module.css'

export default function PullRefresh({ progress, pulling }) {
  if (!pulling && progress === 0) return null
  return (
    <div className={styles.wrap} style={{ opacity: progress }}>
      <div className={styles.spinner} style={{ transform: `rotate(${progress * 360}deg)` }}>
        ↻
      </div>
      <span>{progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}</span>
    </div>
  )
}
