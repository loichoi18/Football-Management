import React, { useState, useEffect, createContext, useContext } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Events from './components/Events'
import Members from './components/Members'
import Profile from './components/Profile'
import RandomTeam from './components/RandomTeam'
import AuthScreen from './components/AuthScreen'
import './styles.css'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const ICONS = {
  events: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  members: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  random: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
}

export default function App() {
  const [tab, setTab] = useState('events')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:32, color:'var(--accent)', letterSpacing:2 }}>NATIONS FC</div>
    </div>
  )

  // Show auth screen if not logged in
  if (!user) {
    return (
      <AuthContext.Provider value={{ user }}>
        <div className="tab-content">
          <AuthScreen />
        </div>
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{ user }}>
      <div className="tab-content">
        {tab === 'events' && <Events />}
        {tab === 'members' && <Members />}
        {tab === 'random' && <RandomTeam />}
        {tab === 'profile' && <Profile />}
      </div>
      <nav className="bottom-nav">
        {['events', 'members', 'random', 'profile'].map(t => (
          <button key={t} className={`nav-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {ICONS[t]}
            <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
          </button>
        ))}
      </nav>
    </AuthContext.Provider>
  )
}
