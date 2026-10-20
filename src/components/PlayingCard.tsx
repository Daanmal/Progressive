import type { PlayingCardSpec, Suit } from '../types'

const SUIT_PATH: Record<Suit, string> = {
  spades:
    'M50 8 C50 8 18 38 18 58 C18 74 32 84 46 84 C46 84 42 96 36 104 L64 104 C58 96 54 84 54 84 C68 84 82 74 82 58 C82 38 50 8 50 8 Z',
  hearts:
    'M50 96 L18 52 C8 40 10 22 24 16 C36 11 46 18 50 28 C54 18 64 11 76 16 C90 22 92 40 82 52 Z',
  diamonds: 'M50 8 L86 50 L50 92 L14 50 Z',
  clubs:
    'M50 38 C38 38 30 28 30 20 C30 10 40 4 50 12 C60 4 70 10 70 20 C70 28 62 38 50 38 C64 38 76 48 76 60 C76 72 64 80 52 76 L58 100 L42 100 L48 76 C36 80 24 72 24 60 C24 48 36 38 50 38 Z',
}

interface Props {
  card: PlayingCardSpec
  rotate?: number
  className?: string
}

export function PlayingCard({ card, rotate = 0, className }: Props) {
  const red = card.suit === 'hearts' || card.suit === 'diamonds'
  const fill = red ? '#c4161c' : '#141414'
  const faceId = `cardFace-${card.rank}-${card.suit}`

  return (
    <svg
      className={className}
      viewBox="0 0 120 168"
      role="img"
      aria-label={`${card.rank} of ${card.suit}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <defs>
        <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="100%" stopColor="#efe6d2" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="116" height="164" rx="10" fill="#1a1208" />
      <rect x="5" y="5" width="110" height="158" rx="8" fill={`url(#${faceId})`} />
      <text
        x="14"
        y="32"
        fill={fill}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="26"
        fontWeight="700"
      >
        {card.rank}
      </text>
      <path d={SUIT_PATH[card.suit]} transform="translate(2, 28) scale(0.28)" fill={fill} />
      <path d={SUIT_PATH[card.suit]} transform="translate(24, 46) scale(0.72)" fill={fill} />
      <g transform="rotate(180 60 84)">
        <text
          x="14"
          y="32"
          fill={fill}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="26"
          fontWeight="700"
        >
          {card.rank}
        </text>
        <path d={SUIT_PATH[card.suit]} transform="translate(2, 28) scale(0.28)" fill={fill} />
      </g>
    </svg>
  )
}
