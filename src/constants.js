export const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'MF', 'LW', 'ST', 'RW']

export const POS_GROUPS = {
  GK: { label: 'Goalkeeper', positions: ['GK'] },
  DF: { label: 'Defender', positions: ['CB', 'LB', 'RB'] },
  MF: { label: 'Midfielder', positions: ['MF'] },
  ATK: { label: 'Attacker', positions: ['LW', 'ST', 'RW'] },
}

export const POS_GROUP_ORDER = ['GK', 'DF', 'MF', 'ATK']

export const POS_TO_GROUP = {}
Object.entries(POS_GROUPS).forEach(([group, data]) => {
  data.positions.forEach(pos => { POS_TO_GROUP[pos] = group })
})

export const POS_COLORS = {
  GK: '#ffd740', CB: '#42a5f5', LB: '#42a5f5', RB: '#42a5f5',
  MF: '#00e676', LW: '#ff5252', ST: '#ff5252', RW: '#ff5252',
}

export const GROUP_COLORS = { GK: '#ffd740', DF: '#42a5f5', MF: '#00e676', ATK: '#ff5252' }

export const TIERS = ['S+', 'S', 'A', 'B', 'F']
export const TIER_COLORS = { 'S+': '#ff4081', 'S': '#ffd740', 'A': '#00e676', 'B': '#42a5f5', 'F': '#90a4ae' }

export function getInitialColor(name) {
  const colors = ['#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#009688','#4caf50','#ff9800','#ff5722','#795548']
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
