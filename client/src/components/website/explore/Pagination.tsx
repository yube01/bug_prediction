import React from 'react'

interface Props {
  currentPage:  number
  totalPages:   number
  onPageChange: (page: number) => void
}

const btnStyle: React.CSSProperties = {
  width: 32, height: 32,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '0.5px solid var(--color-border-tertiary)',
  borderRadius: 'var(--border-radius-md)',
  background: 'var(--color-background-primary)',
  cursor: 'pointer', fontSize: 13,
  color: 'var(--color-text-secondary)',
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  const buildPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = [1]
    if (currentPage > 3) pages.push('…')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++)
      pages.push(i)
    if (currentPage < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: '1rem' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ ...btnStyle, opacity: currentPage === 1 ? 0.4 : 1 }}
        aria-label="Previous page"
      >
        ‹
      </button>

      {buildPages().map((pg, i) =>
        pg === '…' ? (
          <span key={`ellipsis-${i}`} style={{ color: 'var(--color-text-secondary)', padding: '0 4px' }}>…</span>
        ) : (
          <button
            key={pg}
            onClick={() => onPageChange(pg as number)}
            style={{
              ...btnStyle,
              background: pg === currentPage ? 'var(--color-background-secondary)' : btnStyle.background,
              color:      pg === currentPage ? 'var(--color-text-primary)'          : btnStyle.color,
              fontWeight: pg === currentPage ? 500                                  : 400,
              borderColor: pg === currentPage ? 'var(--color-border-secondary)'     : btnStyle.borderColor,
            }}
            aria-label={`Page ${pg}`}
            aria-current={pg === currentPage ? 'page' : undefined}
          >
            {pg}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ ...btnStyle, opacity: currentPage === totalPages ? 0.4 : 1 }}
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  )
}