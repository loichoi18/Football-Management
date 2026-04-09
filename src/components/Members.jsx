import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { useAuth } from '../App'

const POSITIONS = ['GK', 'DF', 'MF', 'ATK']
const POS_LABELS = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', ATK: 'Attacker' }
const POS_COLORS = { GK: '#ffd740', DF: '#42a5f5', MF: '#00e676', ATK: '#ff5252' }

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
  const [form, setForm] = useState({ name: '', pos1: 'MF', pos2: '' })

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('name', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const addMember = async () => {
    if (!form.name.trim()) return
    await addDoc(collection(db, 'members'), {
      name: form.name.trim(),
      pos1: form.pos1,
      pos2: form.pos2 || null,
      createdAt: Date.now()
    })
    setForm({ name: '', pos1: 'MF', pos2: '' })
    setShowAdd(false)
  }

  const deleteMember = async (id) => {
    if (confirm('Remove this player?')) {
      await deleteDoc(doc(db, 'members', id))
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
          {user && (
            <button className="btn btn-primary btn-small" onClick={() => setShowAdd(true)}>
              + Add
            </button>
          )}
        </div>
      </div>

      {members.length === 0 && (
        <div className="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <p>No players yet</p>
          {user && <p style={{ fontSize: 12 }}>Tap "+ Add" to add players</p>}
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
              <div className="player-row" key={m.id}>
                <div className="avatar" style={{ background: getInitialColor(m.name) }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <div className="player-name">{m.name}</div>
                  <div className="player-pos">
                    <span style={{ color: POS_COLORS[m.pos1] }}>{m.pos1}</span>
                    {m.pos2 && (
                      <span style={{ color: 'var(--text2)' }}> / <span style={{ color: POS_COLORS[m.pos2] }}>{m.pos2}</span></span>
                    )}
                  </div>
                </div>
                {user && (
                  <button className="btn btn-danger btn-small" onClick={() => deleteMember(m.id)} style={{ padding: '4px 10px', fontSize: 11 }}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      })}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Player</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>×</button>
            </div>

            <div className="input-group">
              <label>Player Name</label>
              <input className="input" placeholder="e.g. Khoa Tran" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className="row">
              <div className="input-group">
                <label>Primary Position</label>
                <select className="input" value={form.pos1} onChange={e => setForm({...form, pos1: e.target.value})}>
                  {POSITIONS.map(p => <option key={p} value={p}>{p} - {POS_LABELS[p]}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Secondary (optional)</label>
                <select className="input" value={form.pos2} onChange={e => setForm({...form, pos2: e.target.value})}>
                  <option value="">None</option>
                  {POSITIONS.filter(p => p !== form.pos1).map(p => <option key={p} value={p}>{p} - {POS_LABELS[p]}</option>)}
                </select>
              </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={addMember}>
              Add Player
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
