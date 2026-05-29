import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const GoogleContext = createContext(null)

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
  'profile',
  'email',
].join(' ')

export function GoogleProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cc_gtoken') || null)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_guser')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  // Load Google Identity Services script
  useEffect(() => {
    if (document.getElementById('google-gsi')) return
    const script = document.createElement('script')
    script.id = 'google-gsi'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const login = useCallback(() => {
    if (!CLIENT_ID) { alert('Google Client ID not configured'); return }
    setLoading(true)
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (resp) => {
        if (resp.error) { setLoading(false); return }
        setToken(resp.access_token)
        localStorage.setItem('cc_gtoken', resp.access_token)
        // Fetch user info
        try {
          const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` }
          })
          const u = await r.json()
          setUser(u)
          localStorage.setItem('cc_guser', JSON.stringify(u))
        } catch {}
        setLoading(false)
      }
    })
    client.requestAccessToken()
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('cc_gtoken')
    localStorage.removeItem('cc_guser')
  }, [])

  const gFetch = useCallback(async (url) => {
    if (!token) return null
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (r.status === 401) { logout(); return null }
    return r.json()
  }, [token, logout])

  return (
    <GoogleContext.Provider value={{ token, user, login, logout, loading, gFetch }}>
      {children}
    </GoogleContext.Provider>
  )
}

export const useGoogle = () => useContext(GoogleContext)
