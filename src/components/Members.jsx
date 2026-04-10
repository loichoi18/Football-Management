import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore'
import { useAuth } from '../App'
import { ALL_POSITIONS, POS_COLORS, POS_GROUPS, POS_GROUP_ORDER, POS_TO_GROUP, GROUP_COLORS, TIERS, TIER_COLORS, getInitialColor } from '../constants'

export default function Members() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', positions: [], priority: '', tier: 'A', number: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('name', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, err => { setError('Cannot load members: ' + err.message) })
    return unsub
  }, [])

  const resetForm = () => {
    setForm({ name: '', positions: [], priority: '', tier: 'A', number: '' })
    setEditId(null); setShowAdd(false); setError('')
  }

  const openEdit = (m) => {
    // Support old format (pos1/pos2) and new format (positions/priority)
    let positions = m.positions || []
    let priority = m.priority || ''
    if (positions.length === 0 && m.pos1) {
      positions = [m.pos1]
      if (m.pos2) positions.push(m.pos2)
      priority = m.pos1
    }
    setForm({ name: m.name, positions, priority: priority || positions[0] || '', tier: m.tier || 'A', number: m.number || '' })
    setEditId(m.id); setShowAdd(true); setError('')
  }

  const togglePosition = (pos) => {
    const { positions, priority } = form
    if (positions.includes(pos)) {
      const newPos = positions.filter(p => p !== pos)
      setForm({ ...form, positions: newPos, priority: priority === pos ? (newPos[0] || '') : priority })
    } else {
      if (positions.length >= 3) return
      const newPos = [...positions, pos]
      setForm({ ...form, positions: newPos, priority: priority || pos })
    }
  }

  const saveMember = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (form.positions.length === 0) { setError('Select at least 1 position'); return }
    setError(''); setSaving(true)
    const data = {
      name: form.name.trim(),
      positions: form.positions,
      priority: form.priority || form.positions[0],
      tier: form.tier || 'A',
      number: form.number || '',
    }
    try {
      if (editId) {
        await updateDoc(doc(db, 'members', editId), data)
      } else {
        await addDoc(collection(db, 'members'), { ...data, createdAt: Date.now() })
      }
      resetForm()
    } catch (err) { setError('Failed to save: ' + err.message) }
    setSaving(false)
  }

  const deleteMember = async (id) => {
    if (confirm('Remove this player?')) {
      try { await deleteDoc(doc(db, 'members', id)) }
      catch (err) { setError('Failed to remove: ' + err.message) }
    }
  }

  // Group by priority position's group
  const grouped = {}
  POS_GROUP_ORDER.forEach(g => { grouped[g] = [] })
  members.forEach(m => {
    const pri = m.priority || m.pos1 || 'MF'
    const group = POS_TO_GROUP[pri] || 'MF'
    grouped[group].push(m)
  })

  const renderPosTag = (pos, isPriority) => (
    <span key={pos} style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700,
      background: POS_COLORS[pos] + '20', color: POS_COLORS[pos],
      border: isPriority ? `1.5px solid ${POS_COLORS[pos]}` : '1.5px solid transparent',
      marginRight: 3
    }}>
      {isPriority && '⭐'}{pos}
    </span>
  )

  return (
    <div>
      <div className="flex-between mb-16">
        <h1 className="section-title" style={{ marginBottom: 0 }}>Members</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-green">{members.length} players</span>
          {user && <button className="btn btn-primary btn-small" onClick={() => { resetForm(); setShowAdd(true) }}>+ Add</button>}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {members.length === 0 && !error && (
        <div className="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p>No players yet</p>
        </div>
      )}

      {POS_GROUP_ORDER.map(group => {
        if (grouped[group].length === 0) return null
        return (
          <div className="pos-group" key={group}>
            <div className="pos-header">
              <span style={{ color: GROUP_COLORS[group] }}>{group}</span>
              <span style={{ color: 'var(--text2)', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 400, marginLeft: 8 }}>
                {POS_GROUPS[group].label} · {grouped[group].length}
              </span>
            </div>
            {grouped[group].map(m => {
              const allPos = m.positions || (m.pos1 ? [m.pos1, m.pos2].filter(Boolean) : [])
              const pri = m.priority || m.pos1 || ''
              return (
                <div className="player-row" key={m.id} onClick={() => user && openEdit(m)} style={{ cursor: user ? 'pointer' : 'default' }}>
                  <div className="avatar" style={{ background: getInitialColor(m.name) }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="player-info">
                    <div className="player-name">
                      {m.number && <span style={{ color: 'var(--text2)', fontSize: 12, marginRight: 4 }}>#{m.number}</span>}
                      {m.name}
                    </div>
                    <div style={{ marginTop: 3 }}>
                      {allPos.map(p => renderPosTag(p, p === pri))}
                      {m.tier && (
                        <span className="badge" style={{ marginLeft: 4, background: 'rgba(255,255,255,0.05)', color: TIER_COLORS[m.tier], padding: '1px 8px', fontSize: 10 }}>
                          {m.tier}
                        </span>
                      )}
                    </div>
                  </div>
                  {user && (
                    <button className="btn btn-danger btn-small" onClick={(e) => { e.stopPropagation(); deleteMember(m.id) }} style={{ padding: '4px 10px', fontSize: 11 }}>✕</button>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Add / Edit modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Player' : 'Add Player'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            {error && <div className="error-msg">{error}</div>}

            <div className="row">
              <div className="input-group" style={{ flex: 2 }}><label>Player Name</label>
                <input className="input" placeholder="e.g. Khoa Tran" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="input-group" style={{ flex: 1 }}><label>Number</label>
                <input className="input" placeholder="#" value={form.number} onChange={e => setForm({...form, number: e.target.value})} />
              </div>
            </div>

            {/* Position picker */}
            <div className="input-group">
              <label>Positions (up to 3, tap selected to set priority ⭐)</label>
              {POS_GROUP_ORDER.map(group => (
                <div key={group} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: 1, marginBottom: 4 }}>{POS_GROUPS[group].label}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {POS_GROUPS[group].positions.map(pos => {
                      const selected = form.positions.includes(pos)
                      const isPriority = form.priority === pos
                      return (
                        <button key={pos}
                          onClick={() => {
                            if (selected) {
                              // If already selected, set as priority; double-click to remove
                              setForm({ ...form, priority: pos })
                            } else {
                              togglePosition(pos)
                            }
                          }}
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
                          {selected && !isPriority && (
                            <span style={{ position: 'absolute', top: -6, right: -2, fontSize: 9, background: 'var(--card)', borderRadius: 10, padding: '0 3px' }}>✕</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {form.positions.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                  Selected: {form.positions.map(p => p === form.priority ? `⭐${p}` : p).join(', ')} · Tap to set priority. Double-tap to remove.
                </div>
              )}
            </div>

            {/* Tier */}
            <div className="input-group">
              <label>Tier</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {TIERS.map(t => (
                  <button key={t} onClick={() => setForm({...form, tier: t})}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10,
                      border: `2px solid ${form.tier === t ? TIER_COLORS[t] : 'var(--border)'}`,
                      background: form.tier === t ? TIER_COLORS[t] + '20' : 'var(--bg)',
                      color: form.tier === t ? TIER_COLORS[t] : 'var(--text2)',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)'
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-full mt-12" onClick={saveMember} disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Player'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
