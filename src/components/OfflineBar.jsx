import { useState, useEffect } from 'react'
import styles from './OfflineBar.module.css'

export default function OfflineBar() {
  const [online, setOnline] = useState(navigator.onLine)
  const [showBack, setShowBack] = useState(false)

  useEffect(() => {
    const goOnline = () => { setOnline(true); setShowBack(true); setTimeout(() => setShowBack(false), 3000) }
    const goOffline = () => { setOnline(false); setShowBack(false) }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [])

  if (online && !showBack) return null

  return (
    <div className={`${styles.bar} ${online ? styles.online : styles.offline}`}>
      {online ? '✓ Back online' : '⚠ No connection — showing cached data'}
    </div>
  )
}
