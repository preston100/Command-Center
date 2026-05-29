import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const GoogleContext = createContext(null)

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Full read+write scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/tasks',
  'profile',
  'email',
].join(' ')

export function GoogleProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cc_gtoken') || null)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_guser')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

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
    const doLogin = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
          if (resp.error) { setLoading(false); return }
          setToken(resp.access_token)
          localStorage.setItem('cc_gtoken', resp.access_token)
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
    }
    if (window.google?.accounts?.oauth2) {
      doLogin()
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval)
          doLogin()
        }
      }, 200)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('cc_gtoken')
    localStorage.removeItem('cc_guser')
  }, [])

  const gFetch = useCallback(async (url, options = {}) => {
    if (!token) return null
    const r = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    })
    if (r.status === 401) { logout(); return null }
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      throw new Error(err?.error?.message || `HTTP ${r.status}`)
    }
    if (r.status === 204) return {}
    return r.json()
  }, [token, logout])

  return (
    <GoogleContext.Provider value={{ token, user, login, logout, loading, gFetch }}>
      {children}
    </GoogleContext.Provider>
  )
}

export const useGoogle = () => useContext(GoogleContext)
