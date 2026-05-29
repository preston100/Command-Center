import { AppProvider, useApp } from './context/AppContext'
import { GoogleProvider } from './context/GoogleContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import OfflineBar from './components/OfflineBar'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Email from './pages/Email'
import Drive from './pages/Drive'
import Lessons from './pages/Lessons'
import Notes from './pages/Notes'
import Habits from './pages/Habits'
import Timer from './pages/Timer'
import AI from './pages/AI'
import styles from './App.module.css'

const PAGES = {
  dashboard: Dashboard, tasks: Tasks, calendar: Calendar,
  email: Email, drive: Drive, lessons: Lessons,
  notes: Notes, habits: Habits, timer: Timer, ai: AI,
}

function AppInner() {
  const { activeTab } = useApp()
  const Page = PAGES[activeTab] || Dashboard
  return (
    <div className={styles.app}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <OfflineBar />
        <div className={styles.content}>
          <div className={styles.page} key={activeTab}>
            <Page />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <GoogleProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </GoogleProvider>
  )
}
