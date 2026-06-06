import type { GithubCommit } from '../../types'
import { getRiskLevel } from '../../utils/risk'
import RiskBadge from './RiskBadge';

interface Props { commit: GithubCommit; repo: string }

function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' · '
        + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function CommitRow({ commit, repo }: Props) {
    const risk = getRiskLevel(commit)
    const sha = commit.sha.slice(0, 7)
    const message = commit.commit.message.split('\n')[0]
    const author = commit.commit.author.name
    const date = formatDate(commit.commit.author.date)
    const additions = commit.stats?.additions
    const deletions = commit.stats?.deletions
    const filesCount = commit.files?.length

    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
            alignItems: 'start', padding: '14px 0',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                <div style={{
                    fontSize: 14, fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={message}>
                    {message}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <code style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        background: 'var(--color-background-secondary)',
                        padding: '2px 6px', borderRadius: 4,
                    }}>
                        {sha}
                    </code>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {author}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {date}
                    </span>
                </div>

                {commit.stats && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {additions !== undefined && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3B6D11' }}>
                                +{additions}
                            </span>
                        )}
                        {deletions !== undefined && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#A32D2D' }}>
                                -{deletions}
                            </span>
                        )}
                        {filesCount !== undefined && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                {filesCount} file{filesCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <RiskBadge level={risk} />

                <a href={`https://github.com/${repo}/commit/${commit.sha}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                    view on GitHub
                </a>
            </div>
        </div >
    )
}