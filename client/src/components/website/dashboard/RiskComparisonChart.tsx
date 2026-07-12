import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import type { BarDatum } from '@/utils/dashboardUtils'

interface RepoComparisonChartProps {
    data: BarDatum[]
}

export default function RepoComparisonChart({ data }: RepoComparisonChartProps) {
    return (
        <div className="rounded-xl border border-border bg-fill1 p-4">
            <h3 className="mb-3  font-bold">
                Compare Top Repositories
            </h3>

            <div className="h-55">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="name"
                            tick={{ fill: 'var(--color-fg)' }}
                            stroke="var(--color-border)"
                        />
                        <YAxis tick={{ fill: 'var(--color-fg)' }} stroke="var(--color-border)" />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '0.5rem',
                                color: 'var(--color-fg)',
                            }}
                        />
                        <Legend />
                        <Bar dataKey="Low Risk" stackId="a" fill="#00c97a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Medium Risk" stackId="a" fill="#f5a800" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="High Risk" stackId="a" fill="#f03a4f" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}