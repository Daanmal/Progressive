export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2'
export type JackpotKind = 'progressive' | 'must_hit' | 'fixed'

export interface PlayingCardSpec {
  rank: Rank
  suit: Suit
}

export interface Jackpot {
  id: string
  label: string
  kind: JackpotKind
  current: number
  seed: number
  contributionPercent: number
  mustHitBy?: number
  enabled: boolean
}

export interface HitRecord {
  id: string
  jackpotId: string
  label: string
  amount: number
  at: string
}

export interface ThemeConfig {
  background: string
  plaqueTop: string
  plaqueMid: string
  plaqueBottom: string
  plaqueEdge: string
  gold: string
  title: string
  closed: string
  wager: string
}

export interface AppConfig {
  titleLine1: string
  titleLine2: string
  showTitle: boolean
  tableId: string
  /** Small line on the left of the footer, e.g. "ARE YOU PLAYING SMOOTH?". */
  footerNotice: string
  progressiveWager: number
  tableOpen: boolean
  currencySymbol: string
  decimals: number
  leftCard: PlayingCardSpec
  rightCard: PlayingCardSpec
  /** Show fixed-kind jackpots as a compact list at the bottom instead of plaques. */
  fixedPayoutsAtBottom: boolean
  /** Data URL of an operator-uploaded logo; replaces the two hero cards. */
  logo?: string
  jackpots: Jackpot[]
  theme: ThemeConfig
  demoHandsPerMinute: number
  demoRunning: boolean
}

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
