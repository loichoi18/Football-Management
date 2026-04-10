import React, { useState } from 'react'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { addDoc, collection, doc, setDoc } from 'firebase/firestore'
import { ALL_POSITIONS, POS_COLORS, POS_GROUPS, POS_GROUP_ORDER } from '../constants'

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [priority, setPriority] = useState('') // primary position
  const [positions, setPositions] = useState([]) // all selected (up to 3)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const togglePosition = (pos) => {
    if (positions.includes(pos)) {
      const newPos = positions.filter(p => p !== pos)
      setPositions(newPos)
      if (priority === pos) setPriority(newPos[0] || '')
    } else {
      if (positions.length >= 3) return
      const newPos = [...positions, pos]
      setPositions(newPos)
      if (!priority) setPriority(pos)
    }
  }

  const setPriorityPos = (pos) => {
    if (positions.includes(pos)) setPriority(pos)
  }

  const handleSubmit = async () => {
    setError('')
    if (isRegister) {
      if (!form.name.trim()) { setError('Name is required'); return }
      if (positions.length === 0) { setError('Select at least 1 position'); return }
      if (!priority) { setError('Tap a selected position again to set it as priority'); return }
    }
    setLoading(true)
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
        await updateProfile(cred.user, { displayName: form.name.trim() })

        // Auto-add to members
        await addDoc(collection(db, 'members'), {
          name: form.name.trim(),
          uid: cred.user.uid,
          priority,
          positions,
          tier: 'A',
          number: '',
          createdAt: Date.now()
        })

        // Save profile
        await setDoc(doc(db, 'profiles', cred.user.uid), {
          fullName: form.name.trim(),
          priority,
          positions,
          tier: 'A',
          dob: '', major: '', number: '',
          wantTeamWith: '', favoriteField: ''
        })
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password)
      }
    } catch (err) {
      const msg = err.code?.replace('auth/', '').replace(/-/g, ' ') || 'Something went wrong'
      setError(msg.charAt(0).toUpperCase() + msg.slice(1))
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <h1>UTS Bluelock</h1>
      <p>Manage your football team</p>

      <div className="auth-form">
        {error && <div className="error-msg">{error}</div>}

        {isRegister && (
          <div className="input-group">
            <label>Display Name</label>
            <input className="input" placeholder="Your name" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} />
          </div>
        )}

        <div className="input-group"><label>Email</label>
          <input className="input" type="email" placeholder="you@email.com" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})} />
        </div>

        <div className="input-group"><label>Password</label>
          <input className="input" type="password" placeholder="••••••••" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {/* Position picker on register */}
        {isRegister && (
          <div className="input-group">
            <label>Positions (pick up to 3, tap again to set priority ⭐)</label>
            {POS_GROUP_ORDER.map(group => (
              <div key={group} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: 1, marginBottom: 4 }}>
                  {POS_GROUPS[group].label}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {POS_GROUPS[group].positions.map(pos => {
                    const selected = positions.includes(pos)
                    const isPriority = priority === pos
                    return (
                      <button key={pos}
                        onClick={() => selected ? setPriorityPos(pos) : togglePosition(pos)}
                        onDoubleClick={() => togglePosition(pos)}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: 10,
                          border: `2px solid ${selected ? POS_COLORS[pos] : 'var(--border)'}`,
                          background: selected ? POS_COLORS[pos] + '20' : 'var(--bg)',
                          color: selected ? POS_COLORS[pos] : 'var(--text2)',
                          fontWeight: 700, fontSize: 13, cursor: 'pointer',
                          fontFamily: 'var(--font-body)', position: 'relative'
                        }}>
                        {isPriority && <span style={{ position: 'absolute', top: -6, right: -4, fontSize: 12 }}>⭐</span>}
                        {pos}
                        {selected && !isPriority && (
                          <span style={{ position: 'absolute', top: -6, right: -2, fontSize: 9, background: 'var(--card)', borderRadius: 10, padding: '0 3px' }}>✕</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {positions.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                Selected: {positions.map(p => (
                  <span key={p} style={{ color: POS_COLORS[p], fontWeight: 700 }}>
                    {p === priority ? `⭐${p}` : p}
                  </span>
                )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [])}
                {' '}· Tap a selected position to make it priority. Double-tap to remove.
              </div>
            )}
          </div>
        )}

        <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
        </button>

        <div className="auth-toggle">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); setPositions([]); setPriority('') }}>
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}
