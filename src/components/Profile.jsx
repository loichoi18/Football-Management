import React, { useState } from 'react'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { useAuth } from '../App'

function getInitialColor(name) {
  const colors = ['#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#009688','#4caf50','#ff9800','#ff5722','#795548']
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function Profile() {
  const { user } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return }
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
        await updateProfile(cred.user, { displayName: form.name.trim() })
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password)
      }
      setForm({ email: '', password: '', name: '' })
    } catch (err) {
      const msg = err.code?.replace('auth/', '').replace(/-/g, ' ') || 'Something went wrong'
      setError(msg.charAt(0).toUpperCase() + msg.slice(1))
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await signOut(auth)
  }

  // ── Logged out ──
  if (!user) {
    return (
      <div className="auth-container">
        <h1>NATIONS FC</h1>
        <p>Manage your football team</p>

        <div className="auth-form">
          {error && <div className="error-msg">{error}</div>}

          {isRegister && (
            <div className="input-group">
              <label>Display Name</label>
              <input className="input" placeholder="Your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <input className="input" type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <div className="auth-toggle">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setIsRegister(!isRegister); setError('') }}>
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Logged in ──
  const displayName = user.displayName || user.email?.split('@')[0] || 'Player'

  return (
    <div>
      <div className="card">
        <div className="profile-header">
          <div
            className="avatar profile-avatar"
            style={{ background: user.photoURL ? 'transparent' : getInitialColor(displayName) }}
          >
            {user.photoURL
              ? <img src={user.photoURL} alt={displayName} />
              : displayName.charAt(0).toUpperCase()
            }
          </div>
          <div className="profile-name">{displayName}</div>
          <div className="profile-email">{user.email}</div>
        </div>
      </div>

      <div className="card">
        <div className="section-sub">Account</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
          Signed in as <strong style={{ color: 'var(--text)' }}>{user.email}</strong>
        </p>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 18 }}>
          As a registered member you can create events, add players, and manage the team.
        </p>
        <button className="btn btn-danger btn-full" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
