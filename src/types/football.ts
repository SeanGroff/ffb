export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST'

export type Player = {
  name: string
  position: Position
  rank: number
  tier: number
  bye: number
}

export type Scoring = 'consensus' | 'ppr' | 'half-point-ppr'
