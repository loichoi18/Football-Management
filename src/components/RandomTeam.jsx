import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { POS_COLORS, POS_GROUPS, POS_GROUP_ORDER, POS_TO_GROUP, GROUP_COLORS, TIERS, TIER_COLORS, getInitialColor } from '../constants'

const TIER_SCORE = { 'S+': 5, 'S': 4, 'A': 3, 'B': 2, 'F': 1 }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function RandomTeam() {
  const [members, setMembers] = useState([])
  const [teamA, setTeamA] = useState([])
  const [teamB, setTeamB] = useState([])
  const [captainA, setCaptainA] = useState(null)
  const [captainB, setCaptainB] = useState(null)
  const [generated, setGenerated] = useState(false)
  const [mode, setMode] = useState('random')
  const [unassigned, setUnassigned] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('name', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const getGroup = (m) => {
    const pri = m.priority || m.pos1 || 'MF'
    return POS_TO_GROUP[pri] || 'MF'
  }

  const generateTeams = () => {
    if (members.length < 2) return
    let a = [], b = []

    // Group by tier, then distribute
    TIERS.forEach(tier => {
      const pool = shuffle(members.filter(m => (m.tier || 'A') === tier))
      pool.forEach(player => {
        const aGroupCounts = {}; const bGroupCounts = {}
        POS_GROUP_ORDER.forEach(g => { aGroupCounts[g] = 0; bGroupCounts[g] = 0 })
        a.forEach(p => { aGroupCounts[getGroup(p)]++ })
        b.forEach(p => { bGroupCounts[getGroup(p)]++ })
        const pg = getGroup(player)
        const aMore = aGroupCounts[pg] > bGroupCounts[pg]
        const bMore = bGroupCounts[pg] > aGroupCounts[pg]

        if (a.length === b.length) {
          if (bMore) a.push(player)
          else if (aMore) b.push(player)
          else Math.random() < 0.5 ? a.push(player) : b.push(player)
        } else if (a.length < b.length) a.push(player)
        else b.push(player)
      })
    })

    const capA = a[Math.floor(Math.random() * a.length)]
    const capB = b[Math.floor(Math.random() * b.length)]
    setTeamA(a); setTeamB(b); setCaptainA(capA); setCaptainB(capB); setGenerated(true)
  }

  const startManual = () => {
    setMode('manual'); setTeamA([]); setTeamB([]); setCaptainA(null); setCaptainB(null)
    setUnassigned([...members]); setGenerated(true)
  }

  const assignPlayer = (player, team) => {
    setUnassigned(prev => prev.filter(p => p.id !== player.id))
    if (team === 'A') setTeamA(prev => [...prev, player])
    else setTeamB(prev => [...prev, player])
  }

  const removeFromTeam = (player, team) => {
    if (team === 'A') {
      setTeamA(prev => prev.filter(p => p.id !== player.id))
      if (captainA?.id === player.id) setCaptainA(null)
    } else {
      setTeamB(prev => prev.filter(p => p.id !== player.id))
      if (captainB?.id === player.id) setCaptainB(null)
    }
    setUnassigned(prev => [...prev, player])
  }

  const pickCaptain = (team) => {
    const list = team === 'A' ? teamA : teamB
    if (list.length === 0) return
    const cap = list[Math.floor(Math.random() * list.length)]
    if (team === 'A') setCaptainA(cap); else setCaptainB(cap)
  }

  const reset = () => {
    setTeamA([]); setTeamB([]); setCaptainA(null); setCaptainB(null)
    setGenerated(false); setMode('random'); setUnassigned([])
  }

  const groupByPosGroup = (list) => {
    const g = {}
    POS_GROUP_ORDER.forEach(grp => { g[grp] = [] })
    list.forEach(m => { g[getGroup(m)].push(m) })
    return g
  }

  const getTierScore = (list) => list.reduce((sum, m) => sum + (TIER_SCORE[m.tier] || 3), 0)

  const renderPlayer = (m, captain, teamLabel) => {
    const pri = m.priority || m.pos1 || 'MF'
    const allPos = m.positions || (m.pos1 ? [m.pos1, m.pos2].filter(Boolean) : [pri])
    return (
      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 12 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: getInitialColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {m.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.name}{captain?.id === m.id && ' 👑'}
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
            {allPos.map(p => (
              <span key={p} style={{ fontSize: 8, padding: '0 4px', borderRadius: 4, background: POS_COLORS[p] + '20', color: POS_COLORS[p], fontWeight: 700 }}>
                {p === pri ? `⭐${p}` : p}
              </span>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 9, color: TIER_COLORS[m.tier] || 'var(--text2)', fontWeight: 700 }}>{m.tier || 'A'}</span>
        {mode === 'manual' && (
          <button onClick={() => removeFromTeam(m, teamLabel)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, padding: 2 }}>✕</button>
        )}
      </div>
    )
  }

  const renderTeamList = (list, captain, label, color) => {
    const grouped = groupByPosGroup(list)
    const teamName = captain ? `Team ${captain.name}` : `Team ${label}`
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 1.5, color }}> TEAM {label}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 1, wordBreak: 'break-word' }}>{teamName}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{list.length} players · Score: {getTierScore(list)}</div>
        </div>
        {captain && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span className="badge" style={{ background: color + '20', color, padding: '3px 10px', fontSize: 11 }}>👑 {captain.name}</span>
          </div>
        )}
        {POS_GROUP_ORDER.map(grp => {
          if (grouped[grp].length === 0) return null
          return (
            <div key={grp} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GROUP_COLORS[grp], letterSpacing: 1, marginBottom: 3 }}>{grp}</div>
              {grouped[grp].map(m => renderPlayer(m, captain, label))}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <h1 className="section-title mb-16">Random Teams</h1>

      {!generated && (
        <div>
          <div className="card" style={{ textAlign: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" style={{ width: 48, height: 48, margin: '0 auto 12px' }}>
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
              Generate balanced teams from {members.length} players
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateTeams} disabled={members.length < 2}>🎲 Random</button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={startManual} disabled={members.length < 2}>✋ Manual</button>
            </div>
          </div>

          <div className="card">
            <div className="section-sub mb-8">Tier Distribution</div>
            {TIERS.map(tier => {
              const count = members.filter(m => (m.tier || 'A') === tier).length
              if (count === 0) return null
              return (
                <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontWeight: 700, color: TIER_COLORS[tier], width: 28 }}>{tier}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / members.length) * 100}%`, background: TIER_COLORS[tier], borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text2)', width: 20, textAlign: 'right' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {generated && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {mode === 'random' && <button className="btn btn-primary btn-small" style={{ flex: 1 }} onClick={generateTeams}>🎲 Re-roll</button>}
            {mode === 'manual' && (
              <>
                <button className="btn btn-outline btn-small" style={{ flex: 1 }} onClick={() => pickCaptain('A')}>👑 Cap A</button>
                <button className="btn btn-outline btn-small" style={{ flex: 1 }} onClick={() => pickCaptain('B')}>👑 Cap B</button>
              </>
            )}
            <button className="btn btn-danger btn-small" onClick={reset}>Reset</button>
          </div>

          {mode === 'manual' && unassigned.length > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="section-sub mb-8">Unassigned ({unassigned.length})</div>
              {unassigned.map(m => {
                const pri = m.priority || m.pos1 || 'MF'
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: getInitialColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text2)' }}>
                        {(m.positions || [pri]).map(p => p === pri ? `⭐${p}` : p).join(' ')} · <span style={{ color: TIER_COLORS[m.tier] }}>{m.tier || 'A'}</span>
                      </div>
                    </div>
                    <button className="btn btn-small" onClick={() => assignPlayer(m, 'A')}
                      style={{ padding: '4px 10px', fontSize: 11, background: 'rgba(0,230,118,0.1)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>→ A</button>
                    <button className="btn btn-small" onClick={() => assignPlayer(m, 'B')}
                      style={{ padding: '4px 10px', fontSize: 11, background: 'rgba(255,215,64,0.1)', color: 'var(--yellow)', border: '1px solid var(--yellow)' }}>→ B</button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="card" style={{ padding: 14 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
                <span>A: {getTierScore(teamA)} pts</span><span>Balance</span><span>B: {getTierScore(teamB)} pts</span>
              </div>
              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--bg)' }}>
                <div style={{ width: `${teamA.length + teamB.length > 0 ? (getTierScore(teamA) / (getTierScore(teamA) + getTierScore(teamB))) * 100 : 50}%`, background: 'var(--accent)', transition: 'width .3s' }} />
                <div style={{ flex: 1, background: 'var(--yellow)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {renderTeamList(teamA, captainA, 'A', 'var(--accent)')}
              <div style={{ width: 1, background: 'var(--border)' }} />
              {renderTeamList(teamB, captainB, 'B', 'var(--yellow)')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
