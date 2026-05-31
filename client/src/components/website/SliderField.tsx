import React from 'react'

interface Props {
  label:       string
  name:        string
  value:       number
  onChange:    (e: React.ChangeEvent<HTMLInputElement>) => void
  min?:        number
  max?:        number
  step?:       number
  description?: string
}

export default function SliderField({
  label, name, value, onChange,
  min = 0, max = 100, step = 1, description,
}: Props) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label style={{
          fontSize: 10, letterSpacing: '0.09em',
          color: 'var(--text2)', textTransform: 'uppercase',
        }}>
          {label}
        </label>
        <span style={{
          fontFamily: 'Space Mono', fontWeight: 700,
          fontSize: 12, color: 'var(--text)',
          background: 'var(--border)', padding: '1px 7px',
          borderRadius: 4, minWidth: 44, textAlign: 'right',
        }}>
          {value}
        </span>
      </div>

      <div style={{ position: 'relative', height: 18, display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div style={{
          position: 'absolute', inset: '7px 0',
          height: 4, background: 'var(--border)', borderRadius: 2,
        }} />
        {/* Fill */}
        <div style={{
          position: 'absolute', left: 0, top: 7, height: 4,
          width: `${pct}%`, borderRadius: 2,
          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
          transition: 'width 0.08s',
        }} />
        {/* Native input (invisible — handles interaction) */}
        <input type="range" name={name}
          min={min} max={max} step={step} value={value}
          onChange={onChange}
          style={{
            position: 'absolute', inset: 0, width: '100%',
            opacity: 0, cursor: 'pointer', zIndex: 2, height: 18,
          }}
        />
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 7px)`,
          width: 14, height: 14,
          background: 'var(--accent)', borderRadius: '50%',
          border: '2px solid var(--accent2)',
          boxShadow: '0 0 8px rgba(91,82,232,0.55)',
          pointerEvents: 'none',
          transition: 'left 0.08s',
          zIndex: 1,
        }} />
      </div>

      {description && (
        <span style={{ fontSize: 9, color: '#44446a' }}>{description}</span>
      )}
    </div>
  )
}