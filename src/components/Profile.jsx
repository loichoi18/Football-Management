import React, { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useAuth } from '../App'

const POSITIONS = ['GK', 'DF', 'MF', 'ATK']
const TIERS = ['S+', 'S', 'A', 'B', 'F']
const TIER_COLORS = { 'S+': '#ff4081', 'S': '#ffd740', 'A': '#00e676', 'B': '#42a5f5', 'F': '#90a4ae' }

function getInitialColor(name) {
  const colors = ['#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#009688','#4caf50','#ff9800','#ff5722','#795548']
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function Profile() {
  const { user } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: '', dob: '', major: '', number: '', position: '',
    wantTeamWith: '', favoriteField: '', tier: 'A'
  })
  const [saving, setSaving] = useState(false)

  // Load profile data when user logs in
  useEffect(() => {
    if (!user) return
    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'profiles', user.uid))
        if (snap.exists()) {
          setProfileData({ ...profileData, ...snap.data() })
        } else {
          setProfileData(prev => ({ ...prev, fullName: user.displayName || '' }))
        }
      } catch (err) {
        console.error('Load profile error:', err)
      }
    }
    loadProfile()
  }, [user])

  const handleAuth = async () => {
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        if (!authForm.name.trim()) { setError('Name is required'); setLoading(false); return }
        const cred = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password)
        await updateProfile(cred.user, { displayName: authForm.name.trim() })
      } else {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password)
      }
      setAuthForm({ email: '', password: '', name: '' })
    } catch (err) {
      const msg = err.code?.replace('auth/', '').replace(/-/g, ' ') || 'Something went wrong'
      setError(msg.charAt(0).toUpperCase() + msg.slice(1))
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'profiles', user.uid), profileData)
      if (profileData.fullName && profileData.fullName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: profileData.fullName })
      }
      setEditing(false)
    } catch (err) {
      setError('Failed to save: ' + err.message)
    }
    setSaving(false)
  }

  // ── Not logged in ──
  if (!user) {
    return (
      <div className="auth-container">
        <h1>NATIONS FC</h1>
        <p>Manage your football team</p>
        <div className="auth-form">
          {error && <div className="error-msg">{error}</div>}
          {isRegister && (
            <div className="input-group"><label>Display Name</label>
              <input className="input" placeholder="Your name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
            </div>
          )}
          <div className="input-group"><label>Email</label>
            <input className="input" type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
          </div>
          <div className="input-group"><label>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAuth()} />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleAuth} disabled={loading}>
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
      {/* Header card */}
      <div className="card">
        <div className="profile-header">
          <div className="avatar profile-avatar" style={{ background: getInitialColor(displayName) }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-name">{profileData.fullName || displayName}</div>
          <div className="profile-email">{user.email}</div>
          {profileData.tier && (
            <span className="badge" style={{ background: TIER_COLORS[profileData.tier] + '25', color: TIER_COLORS[profileData.tier], fontSize: 14, padding: '4px 16px' }}>
              Tier {profileData.tier}
            </span>
          )}
        </div>
      </div>

      {/* Profile info card */}
      <div className="card">
        <div className="flex-between mb-12">
          <div className="section-sub" style={{ marginBottom: 0 }}>Profile Info</div>
          <button className="btn btn-outline btn-small" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {editing ? (
          <>
            <div className="input-group"><label>Full Name</label>
              <input className="input" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
            </div>
            <div className="row">
              <div className="input-group"><label>Date of Birth</label>
                <input className="input" type="date" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} />
              </div>
              <div className="input-group"><label>Number</label>
                <input className="input" placeholder="#10" value={profileData.number} onChange={e => setProfileData({...profileData, number: e.target.value})} />
              </div>
            </div>
            <div className="input-group"><label>Major / Occupation</label>
              <input className="input" placeholder="e.g. Computer Science" value={profileData.major} onChange={e => setProfileData({...profileData, major: e.target.value})} />
            </div>
            <div className="input-group"><label>Position</label>
              <select className="input" value={profileData.position} onChange={e => setProfileData({...profileData, position: e.target.value})}>
                <option value="">Select</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="input-group"><label>Want to be in team with</label>
              <input className="input" placeholder="e.g. Khoa, Joey" value={profileData.wantTeamWith} onChange={e => setProfileData({...profileData, wantTeamWith: e.target.value})} />
            </div>
            <div className="input-group"><label>Favorite Field</label>
              <input className="input" placeholder="e.g. Mackey Park" value={profileData.favoriteField} onChange={e => setProfileData({...profileData, favoriteField: e.target.value})} />
            </div>
            <div className="input-group"><label>Tier</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {TIERS.map(t => (
                  <button key={t} onClick={() => setProfileData({...profileData, tier: t})}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid',
                      borderColor: profileData.tier === t ? TIER_COLORS[t] : 'var(--border)',
                      background: profileData.tier === t ? TIER_COLORS[t] + '20' : 'var(--bg)',
                      color: profileData.tier === t ? TIER_COLORS[t] : 'var(--text2)',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)'
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-full mt-12" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </>
        ) : (
          <div style={{ fontSize: 13 }}>
            {[
              ['Full Name', profileData.fullName],
              ['Date of Birth', profileData.dob],
              ['Major', profileData.major],
              ['Number', profileData.number ? `#${profileData.number}` : ''],
              ['Position', profileData.position],
              ['Team With', profileData.wantTeamWith],
              ['Favorite Field', profileData.favoriteField],
              ['Tier', profileData.tier],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text2)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: label === 'Tier' && value ? TIER_COLORS[value] : 'var(--text)' }}>
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="card">
        <button className="btn btn-danger btn-full" onClick={() => signOut(auth)}>Sign Out</button>
      </div>
    </div>
  )
}
