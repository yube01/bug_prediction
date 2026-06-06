import type { GithubBranch } from '../../types'

interface Props {
    branches: GithubBranch[]
    currentBranch: string
    onChange: (branch: string) => void
    loading: boolean
    status: 'idle' | 'ok' | 'error'
}

const DOT_COLOR: Record<string, string> = {
    idle: 'var(--color-border-tertiary)',
    ok: '#1D9E75',
    error: '#E24B4A',
}

export default function BranchSelect({ branches, currentBranch, onChange, loading, status }: Props) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="branchSel" style={{ fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                Branch
            </label>
            <select
                id="branchSel"
                value={currentBranch}
                onChange={e => onChange(e.target.value)}
                disabled={loading || branches.length === 0}
                style={{ flex: 1 }}
            >
                {branches.length === 0
                    ? <option value="">— enter a repo first —</option>
                    : branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)
                }
            </select>
            <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: DOT_COLOR[status],
                transition: 'background 0.3s',
            }} />
        </div>
    )
}