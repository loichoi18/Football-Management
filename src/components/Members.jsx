import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore'
import { useAuth } from '../App'

const POSITIONS = ['GK', 'DF', 'MF', 'ATK']
const POS_LABELS = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', ATK: 'Attacker' }
const POS_COLORS = { GK: '#ffd740', DF: '#42a5f5', MF: '#00e676', ATK: '#ff5252' }
const TIERS = ['S+', 'S', 'A', 'B', 'F']
const TIER_COLORS = { 'S+': '#ff4081', 'S': '#ffd740', 'A': '#00e676', 'B': '#42a5f5', 'F': '#90a4ae' }

function getInitialColor(name) {
  const colors = ['#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#009688','#4caf50','#ff9800','#ff5722','#795548']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function Members() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', pos1: 'MF', pos2: '', tier: 'A', number: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('name', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, err => {
      setError('Cannot load members: ' + err.message)
    })
    return unsub
  }, [])

  const resetForm = () => {
    setForm({ name: '', pos1: 'MF', pos2: '', tier: 'A', number: '' })
    setEditId(null)
    setShowAdd(false)
    setError('')
  }

  const openEdit = (m) => {
    setForm({ name: m.name, pos1: m.pos1 || 'MF', pos2: m.pos2 || '', tier: m.tier || 'A', number: m.number || '' })
    setEditId(m.id)
    setShowAdd(true)
    setError('')
  }

  const saveMember = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setError('')
    setSaving(true)
    const data = {
      name: form.name.trim(),
      pos1: form.pos1,
      pos2: form.pos2 || null,
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
    } catch (err) {
      setError('Failed to save: ' + err.message)
    }
    setSaving(false)
  }

  const deleteMember = async (id) => {
    if (confirm('Remove this player?')) {
      try { await deleteDoc(doc(db, 'members', id)) }
      catch (err) { setError('Failed to remove: ' + err.message) }
    }
  }

  const grouped = {}
  POSITIONS.forEach(p => { grouped[p] = [] })
  members.forEach(m => {
    const pos = m.pos1 || 'MF'
    if (grouped[pos]) grouped[pos].push(m)
    else grouped['MF'].push(m)
  })

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

      {POSITIONS.map(pos => {
        if (grouped[pos].length === 0) return null
        return (
          <div className="pos-group" key={pos}>
            <div className="pos-header">
              <span style={{ color: POS_COLORS[pos] }}>{pos}</span>
              <span style={{ color: 'var(--text2)', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 400, marginLeft: 8 }}>
                {POS_LABELS[pos]} · {grouped[pos].length}
              </span>
            </div>
            {grouped[pos].map(m => (
              <div className="player-row" key={m.id} onClick={() => user && openEdit(m)} style={{ cursor: user ? 'pointer' : 'default' }}>
                <div className="avatar" style={{ background: getInitialColor(m.name) }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <div className="player-name">
                    {m.number && <span style={{ color: 'var(--text2)', fontSize: 12, marginRight: 4 }}>#{m.number}</span>}
                    {m.name}
                  </div>
                  <div className="player-pos">
                    <span style={{ color: POS_COLORS[m.pos1] }}>{m.pos1}</span>
                    {m.pos2 && <span style={{ color: 'var(--text2)' }}> / <span style={{ color: POS_COLORS[m.pos2] }}>{m.pos2}</span></span>}
                    {m.tier && (
                      <span className="badge" style={{ marginLeft: 8, background: 'rgba(255,255,255,0.05)', color: TIER_COLORS[m.tier], padding: '1px 8px', fontSize: 10 }}>
                        {m.tier}
                      </span>
                    )}
                  </div>
                </div>
                {user && (
                  <button className="btn btn-danger btn-small" onClick={(e) => { e.stopPropagation(); deleteMember(m.id) }} style={{ padding: '4px 10px', fontSize: 11 }}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      })}

      {showAdd && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Player' : 'Add Player'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <div className="row">
              <div className="input-group" style={{ flex: 2 }}>
                <label>Player Name</label>
                <input className="input" placeholder="e.g. Khoa Tran" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Number</label>
                <input className="input" placeholder="#" value={form.number} onChange={e => setForm({...form, number: e.target.value})} />
              </div>
            </div>
            <div className="row">
              <div className="input-group">
                <label>Primary Position</label>
                <select className="input" value={form.pos1} onChange={e => setForm({...form, pos1: e.target.value})}>
                  {POSITIONS.map(p => <option key={p} value={p}>{p} - {POS_LABELS[p]}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Secondary</label>
                <select className="input" value={form.pos2} onChange={e => setForm({...form, pos2: e.target.value})}>
                  <option value="">None</option>
                  {POSITIONS.filter(p => p !== form.pos1).map(p => <option key={p} value={p}>{p} - {POS_LABELS[p]}</option>)}
                </select>
              </div>
            </div>
            <div className="input-group">
              <label>Tier</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {TIERS.map(t => (
                  <button key={t} onClick={() => setForm({...form, tier: t})}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 10, border: '2px solid',
                      borderColor: form.tier === t ? TIER_COLORS[t] : 'var(--border)',
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
