import { useApp } from '../context/AppContext'
import Card from '../components/Card'
import styles from './Notes.module.css'

export default function Notes() {
  const { notes, setNotes } = useApp()

  return (
    <div className={styles.wrap}>
      <Card title="Notes" icon="≡" className="fade-up">
        <textarea
          className={styles.noteArea}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Start typing..."
          spellCheck
        />
      </Card>
    </div>
  )
}
