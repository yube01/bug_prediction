interface Props { probability: number }

const colorFor = (pct: number) =>
  pct >= 60 ? '#f03a4f' : pct >= 30 ? '#f5a800' : '#00c97a'

const labelFor = (pct: number) =>
  pct >= 60 ? 'HIGH RISK' : pct >= 30 ? 'MEDIUM RISK' : 'LOW RISK'

export default function RiskGauge({ probability }: Props) {
  const pct   = Math.round(probability * 100)
  const color = colorFor(pct)
  const label = labelFor(pct)
  const angle = -135 + (pct / 100) * 270

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 190, height: 115 }}>
        <svg viewBox="0 0 190 115" width="190" height="115">
          {/* Track */}
          <path d="M 18 105 A 77 77 0 0 1 172 105"
            fill="none" stroke="#1a1a30" strokeWidth="14" strokeLinecap="round" />
          {/* Fill */}
          <path d="M 18 105 A 77 77 0 0 1 172 105"
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={`${pct * 2.42} 242`}
            style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1), stroke 0.35s' }}
          />
          {/* Zone labels */}
          <text x="14"  y="120" fill="#00c97a" fontSize="8" fontFamily="Space Mono">LOW</text>
          <text x="81"  y="28"  fill="#f5a800" fontSize="8" fontFamily="Space Mono" textAnchor="middle">MED</text>
          <text x="163" y="120" fill="#f03a4f" fontSize="8" fontFamily="Space Mono" textAnchor="end">HIGH</text>
          {/* Needle */}
          <g transform={`rotate(${angle}, 95, 105)`}
             style={{ transition: 'transform 0.7s cubic-bezier(.4,0,.2,1)' }}>
            <line x1="95" y1="105" x2="95" y2="40"
              stroke={color} strokeWidth="2.5" strokeLinecap="round"
              style={{ transition: 'stroke 0.35s' }} />
            <circle cx="95" cy="105" r="5" fill={color}
              style={{ transition: 'fill 0.35s' }} />
          </g>
        </svg>

        {/* Value */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 26, color,
            transition: 'color 0.35s',
          }}>{pct}%</span>
        </div>
      </div>

      {/* Badge */}
      <div style={{
        padding: '5px 18px', borderRadius: 999,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color, fontFamily: 'Syne, sans-serif',
        fontWeight: 700, fontSize: 11,
        letterSpacing: '0.12em',
        transition: 'all 0.35s',
      }}>
        {label}
      </div>
    </div>
  )
}