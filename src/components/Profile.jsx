import React, { useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useAuth } from '../App'
import { ALL_POSITIONS, POS_COLORS, POS_GROUPS, POS_GROUP_ORDER, TIERS, TIER_COLORS, getInitialColor } from '../constants'

export default function Profile() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: '', dob: '', major: '', number: '',
    positions: [], priority: '',
    wantTeamWith: '', favoriteField: '', tier: 'A'
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'profiles', user.uid))
        if (snap.exists()) {
          setProfileData(prev => ({ ...prev, ...snap.data() }))
        } else {
          setProfileData(prev => ({ ...prev, fullName: user.displayName || '' }))
        }
      } catch (err) { console.error(err) }
    }
    load()
  }, [user])

  const togglePosition = (pos) => {
    const { positions, priority } = profileData
    if (positions.includes(pos)) {
      const newPos = positions.filter(p => p !== pos)
      setProfileData({ ...profileData, positions: newPos, priority: priority === pos ? (newPos[0] || '') : priority })
    } else {
      if (positions.length >= 3) return
      const newPos = [...positions, pos]
      setProfileData({ ...profileData, positions: newPos, priority: priority || pos })
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'profiles', user.uid), profileData)
      if (profileData.fullName && profileData.fullName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: profileData.fullName })
      }
      setEditing(false)
    } catch (err) { setError('Failed to save: ' + err.message) }
    setSaving(false)
  }

  if (!user) return null
  const displayName = profileData.fullName || user.displayName || user.email?.split('@')[0] || 'Player'

  return (
    <div>
      <div className="card">
        <div className="profile-header">
          <div className="avatar profile-avatar" style={{ background: getInitialColor(displayName) }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-name">{displayName}</div>
          <div className="profile-email">{user.email}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            {(profileData.positions || []).map(p => (
              <span key={p} style={{
                padding: '2px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: POS_COLORS[p] + '20', color: POS_COLORS[p],
                border: p === profileData.priority ? `1.5px solid ${POS_COLORS[p]}` : '1.5px solid transparent'
              }}>
                {p === profileData.priority && '⭐'}{p}
              </span>
            ))}
            {profileData.tier && (
              <span style={{ padding: '2px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: TIER_COLORS[profileData.tier] + '25', color: TIER_COLORS[profileData.tier] }}>
                Tier {profileData.tier}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-12">
          <div className="section-sub" style={{ marginBottom: 0 }}>Profile Info</div>
          <button className="btn btn-outline btn-small" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button>
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

            {/* Position picker */}
            <div className="input-group">
              <label>Positions (up to 3, tap selected to set priority ⭐)</label>
              {POS_GROUP_ORDER.map(group => (
                <div key={group} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: 1, marginBottom: 4 }}>{POS_GROUPS[group].label}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {POS_GROUPS[group].positions.map(pos => {
                      const selected = (profileData.positions || []).includes(pos)
                      const isPriority = profileData.priority === pos
                      return (
                        <button key={pos}
                          onClick={() => selected ? setProfileData({...profileData, priority: pos}) : togglePosition(pos)}
                          onDoubleClick={() => { if (selected) togglePosition(pos) }}
                          style={{
                            flex: 1, padding: '10px 0', borderRadius: 10, position: 'relative',
                            border: `2px solid ${selected ? POS_COLORS[pos] : 'var(--border)'}`,
                            background: selected ? POS_COLORS[pos] + '20' : 'var(--bg)',
                            color: selected ? POS_COLORS[pos] : 'var(--text2)',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)'
                          }}>
                          {isPriority && <span style={{ position: 'absolute', top: -6, right: -4, fontSize: 12 }}>⭐</span>}
                          {pos}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
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
                      flex: 1, padding: '10px 0', borderRadius: 10,
                      border: `2px solid ${profileData.tier === t ? TIER_COLORS[t] : 'var(--border)'}`,
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
              ['Positions', (profileData.positions || []).map(p => p === profileData.priority ? `⭐${p}` : p).join(', ')],
              ['Team With', profileData.wantTeamWith],
              ['Favorite Field', profileData.favoriteField],
              ['Tier', profileData.tier],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text2)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: label === 'Tier' && value ? TIER_COLORS[value] : 'var(--text)' }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <button className="btn btn-danger btn-full" onClick={() => signOut(auth)}>Sign Out</button>
      </div>
    </div>
  )
}
