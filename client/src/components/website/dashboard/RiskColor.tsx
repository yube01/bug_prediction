export const RISK_COLORS = {
    low: 'success',
    medium: 'warning',
    high: 'error',
} as const

// Static class strings so Tailwind's JIT scanner can pick them up
// (dynamic string interpolation like `bg-[${color}]` won't work).
export const RISK_BG_CLASSES = {
    low: 'bg-success',
    medium: 'bg-warning',
    high: 'bg-error',
} as const

export const RISK_TEXT_CLASSES = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-error',
} as const