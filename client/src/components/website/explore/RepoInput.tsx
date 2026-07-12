import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <div>
      <Label>   Enter a public GitHub repo to browse commits with bug risk indicators. </Label>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="owner/repo  or paste a GitHub URL"
          style={{ flex: 1 }}
          disabled={loading}
          aria-label="GitHub repository"
        />
        <Button type="submit" disabled={loading || !value.trim()}>
          {loading ? 'Loading…' : 'Load repo'}
        </Button>
      </form>
    </div>
  )
}