import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, query, orderBy } from 'firebase/firestore'
import { useAuth } from '../App'

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [voterName, setVoterName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(null) // eventId
  const [pendingVote, setPendingVote] = useState(null) // {eventId, vote}
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '' })

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const addEvent = async () => {
    if (!form.title || !form.date || !form.time) return
    await addDoc(collection(db, 'events'), {
      ...form,
      votes: {},
      createdAt: Date.now()
    })
    setForm({ title: '', date: '', time: '', location: '' })
    setShowAdd(false)
  }

  const deleteEvent = async (id) => {
    if (confirm('Delete this event?')) {
      await deleteDoc(doc(db, 'events', id))
    }
  }

  const startVote = (eventId, vote) => {
    // Check if user is logged in, use their displayName
    if (user && user.displayName) {
      castVote(eventId, vote, user.displayName)
    } else {
      // Ask for name
      setPendingVote({ eventId, vote })
      setShowNamePrompt(eventId)
    }
  }

  const castVote = async (eventId, vote, name) => {
    const eventRef = doc(db, 'events', eventId)
    const ev = events.find(e => e.id === eventId)
    const votes = { ...(ev.votes || {}) }
    votes[name] = vote
    await updateDoc(eventRef, { votes })
    setShowNamePrompt(null)
    setVoterName('')
    setPendingVote(null)
  }

  const submitNameVote = () => {
    if (!voterName.trim() || !pendingVote) return
    castVote(pendingVote.eventId, pendingVote.vote, voterName.trim())
  }

  const getVoteCounts = (votes = {}) => {
    const yes = Object.values(votes).filter(v => v === 'yes').length
    const no = Object.values(votes).filter(v => v === 'no').length
    return { yes, no, total: Object.keys(votes).length }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div>
      <div className="flex-between mb-16">
        <h1 className="section-title" style={{ marginBottom: 0 }}>Events</h1>
        {user && (
          <button className="btn btn-primary btn-small" onClick={() => setShowAdd(true)}>
            + New
          </button>
        )}
      </div>

      {events.length === 0 && (
        <div className="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p>No upcoming events</p>
          {user && <p style={{ fontSize: 12 }}>Tap "+ New" to create one</p>}
        </div>
      )}

      {events.map(ev => {
        const counts = getVoteCounts(ev.votes)
        const myVote = user?.displayName ? ev.votes?.[user.displayName] : null
        return (
          <div className="card" key={ev.id}>
            <div className="flex-between">
              <div>
                <span className="badge badge-green">OPEN</span>
              </div>
              {user && (
                <button className="btn btn-danger btn-small" onClick={() => deleteEvent(ev.id)}>
                  Delete
                </button>
              )}
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 1, margin: '10px 0 4px' }}>
              {ev.title}
            </h2>

            <div className="event-meta">
              <span>📅 {formatDate(ev.date)}</span>
              <span>⏰ {ev.time}</span>
            </div>
            {ev.location && (
              <div className="event-meta" style={{ marginTop: 2 }}>
                <span>📍 {ev.location}</span>
              </div>
            )}

            {/* Vote count */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '16px 0 4px' }}>
              <span className="vote-count">{counts.yes}</span>
              <span className="vote-label">/ {counts.yes + counts.no} voted · going</span>
            </div>

            {/* Vote question */}
            <div style={{ fontSize: 15, fontWeight: 600, margin: '10px 0 6px', color: 'var(--yellow)' }}>
              Buổi này đi k?
            </div>

            <div className="vote-bar">
              <button
                className={`vote-btn ${myVote === 'yes' ? 'voted-yes' : ''}`}
                onClick={() => startVote(ev.id, 'yes')}
              >
                ✅ Vào cả người
              </button>
              <button
                className={`vote-btn ${myVote === 'no' ? 'voted-no' : ''}`}
                onClick={() => startVote(ev.id, 'no')}
              >
                ❌ Dell
              </button>
            </div>

            {/* Voter names */}
            {counts.total > 0 && (
              <div className="voter-list" style={{ marginTop: 10 }}>
                {Object.entries(ev.votes || {}).map(([name, vote]) => (
                  <span key={name} className={`voter-chip ${vote === 'yes' ? 'voter-yes' : 'voter-no'}`}>
                    {vote === 'yes' ? '✅' : '❌'} {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Name prompt for anonymous voters */}
      {showNamePrompt && (
        <div className="modal-overlay" onClick={() => { setShowNamePrompt(null); setPendingVote(null) }}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tên bạn là gì?</h2>
              <button className="modal-close" onClick={() => { setShowNamePrompt(null); setPendingVote(null) }}>×</button>
            </div>
            <div className="input-group">
              <label>Your name</label>
              <input
                className="input"
                placeholder="Enter your name..."
                value={voterName}
                onChange={e => setVoterName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitNameVote()}
                autoFocus
              />
            </div>
            <button className="btn btn-primary btn-full" onClick={submitNameVote}>
              Vote
            </button>
          </div>
        </div>
      )}

      {/* Add event modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Event</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="input-group">
              <label>Title</label>
              <input className="input" placeholder="e.g. Tuesday Game" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="row">
              <div className="input-group">
                <label>Date</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Time</label>
                <input className="input" type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
              </div>
            </div>
            <div className="input-group">
              <label>Location</label>
              <input className="input" placeholder="e.g. Mackey Park, Marrickville" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            </div>
            <button className="btn btn-primary btn-full" onClick={addEvent}>
              Create Event
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
