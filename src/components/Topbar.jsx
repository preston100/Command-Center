import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useGoogle } from '../context/GoogleContext'
import styles from './Topbar.module.css'

const TITLES = {
  dashboard: 'Dashboard', tasks: 'Tasks', calendar: 'Calendar',
  email: 'Gmail', drive: 'Google Drive', lessons: 'Lesson Planner',
  notes: 'Notes', habits: 'Habit Tracker', timer: 'Focus Timer', ai: 'AI Assistant',
}

const WMO_ICONS = {
  0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',
  51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',
  71:'🌨',73:'🌨',75:'🌨',80:'🌦',81:'🌧',82:'⛈',
  95:'⛈',96:'⛈',99:'⛈'
}

function fetchWeather() {
  return fetch('https://api.open-meteo.com/v1/forecast?latitude=48.1486&longitude=17.1077&current=temperature_2m,weather_code&timezone=Europe/Bratislava')
    .then(r => r.json())
    .then(d => ({ temp: Math.round(d.current.temperature_2m), icon: WMO_ICONS[d.current.weather_code] || '🌡' }))
    .catch(() => null)
}

export default function Topbar() {
  const { activeTab } = useApp()
  const { token, user, login, logout, loading } = useGoogle()
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    fetchWeather().then(w => w && setWeather(w))
    // Refresh every 30 minutes
    const interval = setInterval(() => {
      fetchWeather().then(w => w && setWeather(w))
    }, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <header className={styles.topbar}>
      <div className={styles.title}>{TITLES[activeTab] || 'Command'}</div>
      <div className={styles.right}>
        {weather && (
          <div className={styles.weather}>
            {weather.icon} {weather.temp}°C
          </div>
        )}
        {token ? (
          <button className={styles.connected} onClick={logout}>
            {user?.picture && <img src={user.picture} className={styles.avatar} alt="" />}
            <span className={styles.connectedName}>{user?.given_name || 'Connected'}</span>
            <span className={styles.dot}>●</span>
          </button>
        ) : (
          <button className={styles.connectBtn} onClick={login} disabled={loading}>
            {loading ? '…' : 'Connect Google'}
          </button>
        )}
        <div className={styles.clock}>
          <span className={styles.time}>{timeStr}</span>
          <span className={styles.date}>{dateStr}</span>
        </div>
      </div>
    </header>
  )
}
