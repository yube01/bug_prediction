import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import type { DonutDatum } from '@/utils/dashboardUtils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface RiskDistributionChartProps {
    data: DonutDatum[]
}

export default function RiskDistributionChart({ data }: RiskDistributionChartProps) {
    return (
        <Card className="shadow-none h-full flex flex-col border-border bg-fill1/50 backdrop-blur-sm">
            <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="text-xs text-primary font-bold uppercase tracking-[0.12em]">
                    Overall Risk Profile Breakdown
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                <div className="h-[220px] w-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                cursor={{ fill: 'var(--color-fill2)', opacity: 0.4 }}
                                contentStyle={{
                                    background: 'var(--color-bg)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--color-fg)',
                                    fontSize: '12px',
                                    fontFamily: 'var(--font-mono)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-5 text-[13px] font-mono text-fg-secondary">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: d.color }} />
                            <span>{d.name}:</span>
                            <span className="text-fg font-bold">{d.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}