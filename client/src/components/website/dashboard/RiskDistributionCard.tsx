import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import type { DonutDatum } from '@/utils/dashboardUtils'

interface RiskDistributionChartProps {
    data: DonutDatum[]
}

export default function RiskDistributionChart({ data }: RiskDistributionChartProps) {
    return (
        <div className="rounded-xl border border-border bg-fill1 p-4">
            <h3 className="mb-3 font-bold">
                Overall Risk Profile Breakdown
            </h3>

            <div className="flex h-55 flex-col items-center justify-center">
                <div className="h-full w-full max-w-70">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            {/* Recharts styling props are JS objects consumed by the library, not DOM
                  className targets, so these stay inline. */}
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--color-bg)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--color-fg)',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-2 flex gap-4">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                            <span>{d.name}:</span>
                            <span className="text-fg">{d.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}