import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react'
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
    const [expanded, setExpanded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const risk = getRiskLevel(commit)
    const sha = commit.sha.slice(0, 7)
    const message = commit.commit.message.split('\n')[0]
    const author = commit.commit.author.name
    const date = formatDate(commit.commit.author.date)
    const additions = commit.stats?.additions
    const deletions = commit.stats?.deletions
    const filesCount = commit.files?.length
    const prediction = commit.prediction
    const predictionColor =
        !prediction ? 'var(--color-text-secondary)'
            : prediction.risk_score >= 60 ? '#A32D2D'
                : prediction.risk_score >= 30 ? '#854F0B'
                    : '#3B6D11'

    return (
        <div style={{
            borderBottom: '0.5px solid var(--color-border-tertiary)',
            padding: '12px 0',
        }}>
            {/* Header / Clickable row */}
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => prediction && setExpanded(!expanded)}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 12,
                    alignItems: 'start',
                    cursor: prediction ? 'pointer' : 'default',
                    background: isHovered && prediction ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    padding: '8px 12px',
                    margin: '0 -12px',
                    borderRadius: '6px',
                    transition: 'background 0.2s ease',
                }}
            >
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

                    {/* Inline Risk Factors */}
                    {prediction && prediction.risk_score >= 30 && prediction.top_risk_factors && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            {prediction.top_risk_factors.map((factor, i) => (
                                <span key={i} style={{
                                    fontSize: 10,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: prediction.risk_score >= 60 ? 'rgba(163,45,45,0.08)' : 'rgba(133,79,11,0.08)',
                                    color: predictionColor,
                                    border: `1px solid ${predictionColor}25`,
                                    fontWeight: 500,
                                }}>
                                    {factor}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        {prediction ? (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    gap: 3,
                                }}
                            >
                                <span style={{
                                    color: predictionColor,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    lineHeight: 1,
                                }}>
                                    {prediction.risk_score}%
                                </span>
                                <span style={{
                                    color: predictionColor,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                }}>
                                    {prediction.risk_level.toLowerCase()}
                                </span>
                            </div>
                        ) : (
                            <RiskBadge level={risk} />
                        )}

                        <a href={`https://github.com/${repo}/commit/${commit.sha}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}
                        >
                            view on GitHub
                        </a>
                    </div>

                    {prediction && (
                        <div style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', paddingRight: 4 }}>
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded details section */}
            {expanded && prediction && (
                <div style={{
                    marginTop: 10,
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    animation: 'fadeUp 0.2s ease',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12 }}>
                            <AlertCircle size={14} style={{ color: predictionColor }} />
                            <span>Risk Analysis Details</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                            Score: {prediction.risk_score}% ({prediction.risk_level.toLowerCase()})
                        </span>
                    </div>

                    <div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                            Key Risk Factors
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {prediction.top_risk_factors.map((f, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12,
                                    color: 'var(--text)',
                                }}>
                                    <span style={{ color: predictionColor }}>•</span>
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {prediction.recommendation && (
                        <div style={{
                            borderTop: '1px solid var(--border)',
                            paddingTop: 10,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                                <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                                <span>Recommendation</span>
                            </div>
                            <div style={{
                                padding: 10,
                                borderRadius: 6,
                                background: prediction.risk_score >= 60 ? 'rgba(163,45,45,0.04)' : prediction.risk_score >= 30 ? 'rgba(133,79,11,0.04)' : 'rgba(59,109,17,0.04)',
                                borderLeft: `3px solid ${predictionColor}`,
                                fontSize: 12,
                                lineHeight: 1.5,
                                color: 'var(--text)',
                            }}>
                                {prediction.recommendation}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
