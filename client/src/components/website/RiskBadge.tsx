import React from 'react'
import type { RiskLevel } from '../../types'

interface Props { level: RiskLevel }

const STYLE: Record<RiskLevel, React.CSSProperties> = {
    high: { background: '#FCEBEB', color: '#A32D2D' },
    medium: { background: '#FAEEDA', color: '#854F0B' },
    low: { background: '#EAF3DE', color: '#3B6D11' },
    unknown: { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' },
}

const LABEL: Record<RiskLevel, string> = {
    high: 'High risk', medium: 'Medium risk', low: 'Low risk', unknown: 'Unknown',
}

export default function RiskBadge({ level }: Props) {
    return (
        <span style={{
            ...STYLE[level],
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, padding: '3px 8px',
            borderRadius: 'var(--border-radius-md)', fontWeight: 500,
        }}>
            {LABEL[level]}
        </span>
    )
}