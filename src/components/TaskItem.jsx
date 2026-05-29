import { useApp } from '../context/AppContext'
import styles from './TaskItem.module.css'

const TAG_COLORS = {
  lesson: 'blue',
  uni: 'amber',
  dev: 'green',
  other: 'text3',
}

export default function TaskItem({ task }) {
  const { toggleTask, deleteTask } = useApp()

  return (
    <div className={`${styles.item} ${task.done ? styles.done : ''}`}>
      <button
        className={`${styles.check} ${task.done ? styles.checked : ''}`}
        onClick={() => toggleTask(task.id)}
        aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.done && <span>✓</span>}
      </button>
      <span className={styles.text}>{task.text}</span>
      <span className={`${styles.tag} ${styles[TAG_COLORS[task.tag] || 'text3']}`}>
        {task.tag}
      </span>
      <button
        className={styles.del}
        onClick={() => deleteTask(task.id)}
        aria-label="Delete task"
      >×</button>
    </div>
  )
}
