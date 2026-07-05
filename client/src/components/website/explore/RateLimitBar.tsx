import { useEffect, useState } from 'react'
import type { RateLimitInfo } from '@/types'
import { fetchRateLimit, onRateLimitUpdate } from '@/api/github'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"


function formatReset(date: Date): string {
  const mins = Math.max(0, Math.round((date.getTime() - Date.now()) / 60000))
  if (mins <= 0) return 'now'
  if (mins === 1) return 'in 1 min'
  return `in ${mins} min`
}

export default function RateLimitBar() {
  const [info, setInfo] = useState<RateLimitInfo | null>(null)

  useEffect(() => {
    // Fetch initial rate limit on mount
    fetchRateLimit().then(setInfo).catch(() => null)

    // Subscribe to updates from every API call
    const unsub = onRateLimitUpdate(setInfo)
    return unsub
  }, [])

  if (!info) return null

  const pct = (info.remaining / info.limit) * 100
  const isLow = info.remaining <= 15
  const isGone = info.remaining === 0
  const barColor = isGone ? '#E24B4A' : isLow ? '#BA7517' : '#1D9E75'
  const txtColor = isGone ? '#A32D2D' : isLow ? '#854F0B' : '#3B6D11'

  return (

    <Popover>
      <PopoverTrigger asChild>
        <Button
          title="GitHub API rate limit"
          aria-label={`GitHub API: ${info.remaining} requests remaining`}
        >
          <span style={{ fontSize: 11, color: txtColor, whiteSpace: 'nowrap' }}>
            {info.remaining}/{info.limit} req
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-80 flex-col gap-2 bg-fill1">
        <div>
          GitHub API rate limit
        </div>

        {/* Big bar */}
        <div style={{
          height: 8, background: `${barColor}20`,
          borderRadius: 4, overflow: 'hidden', marginBottom: 10,
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: barColor, borderRadius: 4,
            transition: 'width 0.4s ease',
          }} />
        </div>

        <div >
          {[
            ['Remaining', `${info.remaining} requests`],
            ['Limit', `${info.limit} / hour`],
            ['Resets', formatReset(info.resetAt)],
          ].map(([label, value]) => (
            <div key={label}className="flex justify-between items-center">
              <span >{label}</span>
              <span >
                {value}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}