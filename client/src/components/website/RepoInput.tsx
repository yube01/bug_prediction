import React, { useState } from 'react'

interface Props {
  onLoad: (repo: string) => void
  loading: boolean
}

export default function RepoInput({ onLoad, loading }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) onLoad(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="owner/repo  or paste a GitHub URL"
        style={{ flex: 1 }}
        disabled={loading}
        aria-label="GitHub repository"
      />
      <button type="submit" disabled={loading || !value.trim()} style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
        {loading ? 'Loading…' : 'Load repo'}
      </button>
    </form>
  )
}