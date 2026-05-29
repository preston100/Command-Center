import { useState } from 'react'
import Card from '../components/Card'
import styles from './Lessons.module.css'

const LESSONS = [
  { group: 'Group A', topic: 'A2 Present Perfect', date: 'Thu 29 May · 14:00', duration: '45 min', status: 'ready' },
  { group: 'Group B', topic: 'A1 Animals vocabulary', date: 'Thu 29 May · 09:00', duration: '45 min', status: 'ready' },
  { group: 'Group A', topic: 'B1 Storytelling', date: 'Fri 30 May · 14:00', duration: '45 min', status: 'draft' },
  { group: 'Group B', topic: 'A2 Phonics review', date: 'Mon 2 Jun · 09:00', duration: '45 min', status: 'todo' },
]

const GROUPS = [
  { name: 'Group A', level: 'A2', count: 6, color: 'green' },
  { name: 'Group B', level: 'A1', count: 5, color: 'blue' },
]

const STATUS_LABEL = { ready: 'Ready', draft: 'Draft', todo: 'Not started' }
const STATUS_COLOR = { ready: 'green', draft: 'amber', todo: 'text3' }

export default function Lessons() {
  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        <Card title="Lesson plans" icon="◎" action="+ New plan" className="fade-up">
          {LESSONS.map((l,i) => (
            <div key={i} className={styles.lesson}>
              <div className={styles.lessonRow}>
                <span className={styles.topic}>{l.group} — {l.topic}</span>
                <span className={`${styles.status} ${styles[STATUS_COLOR[l.status]]}`}>
                  {STATUS_LABEL[l.status]}
                </span>
              </div>
              <div className={styles.meta}>
                <span>{l.date}</span>
                <span>·</span>
                <span>{l.duration}</span>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Groups" icon="◈" className="fade-up-1">
          {GROUPS.map((g,i) => (
            <div key={i} className={styles.group}>
              <span className={`${styles.groupDot} ${styles[g.color]}`} />
              <div>
                <div className={styles.groupName}>{g.name}</div>
                <div className={styles.groupMeta}>{g.count} students · Level {g.level}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
