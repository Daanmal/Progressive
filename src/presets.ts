import { defaultConfig } from './defaultConfig'
import type { AppConfig, Jackpot, ThemeConfig } from './types'

export interface Preset {
  id: string
  name: string
  blurb: string
  config: AppConfig
}

type PresetInput = Partial<Omit<AppConfig, 'theme'>> & { theme?: Partial<ThemeConfig> }

function build(input: PresetInput): AppConfig {
  return { ...defaultConfig, ...input, theme: { ...defaultConfig.theme, ...input.theme } }
}

function progressive(
  id: string,
  label: string,
  current: number,
  seed: number,
  contributionPercent: number,
): Jackpot {
  return { id, label, kind: 'progressive', current, seed, contributionPercent, enabled: true }
}

function mustHit(
  id: string,
  label: string,
  current: number,
  seed: number,
  contributionPercent: number,
  mustHitBy: number,
): Jackpot {
  return {
    id,
    label,
    kind: 'must_hit',
    current,
    seed,
    contributionPercent,
    mustHitBy,
    enabled: true,
  }
}

function fixed(id: string, label: string, amount: number): Jackpot {
  return {
    id,
    label,
    kind: 'fixed',
    current: amount,
    seed: amount,
    contributionPercent: 0,
    enabled: true,
  }
}

export const presets: Preset[] = [
  {
    id: 'classic',
    name: 'Blackjack Match',
    blurb: 'Blue plaques, six meters.',
    config: build({}),
  },
  {
    id: 'red-room',
    name: 'Red progressive',
    blurb: 'Red plaques with a 7s pay table.',
    config: build({
      titleLine2: 'PROGRESSIVE',
      decimals: 2,
      demoRunning: false,
      theme: {
        background: '#140306',
        plaqueTop: '#ff9f8a',
        plaqueMid: '#9d150d',
        plaqueBottom: '#d6492f',
        plaqueEdge: '#f3d15a',
        gold: '#ffd76a',
        title: '#ff3b30',
        closed: '#ff7a18',
        wager: '#ffb347',
      },
      jackpots: [
        progressive('royal-7s', "Three 7's - Diamonds", 12480.5, 500, 10),
        progressive('suited-bj', 'Matching Suited Blackjacks', 64200, 5000, 8),
        mustHit('must-hit', 'Must Hit', 341.8, 100, 6, 500),
        fixed('p-7-suited', "Three 7's - Suited", 250),
        fixed('p-7-color', "Three 7's - Same Color", 100),
        fixed('p-7-any', "Three 7's - Any", 50),
        fixed('p-final-7s', 'Final Two Cards - 7s', 25),
        fixed('p-final-7', 'Either Final Two Cards - 7', 10),
      ],
    }),
  },
  {
    id: 'high-limit',
    name: 'High limit',
    blurb: 'Black and gold, $25 wager.',
    config: build({
      titleLine2: 'PROGRESSIVE',
      tableId: 'BJ-100',
      progressiveWager: 25,
      decimals: 0,
      demoRunning: false,
      theme: {
        background: '#0a0a0c',
        plaqueTop: '#e6e6ee',
        plaqueMid: '#2b2f3a',
        plaqueBottom: '#4b5265',
        plaqueEdge: '#d9b45a',
        gold: '#f7e7b5',
        title: '#f3d15a',
        closed: '#ff7a18',
        wager: '#d9b45a',
      },
      jackpots: [
        progressive('high-ak', 'AK Blackjacks Matching Suit', 2874500, 250000, 14),
        progressive('high-sbj', 'Matching Suited Blackjacks', 184250, 25000, 9),
        mustHit('high-mh', 'Must Hit', 7840, 2500, 7, 10000),
        fixed('high-aces', 'Three Aces', 500),
        fixed('high-kings', 'Three Kings', 250),
      ],
    }),
  },
]
