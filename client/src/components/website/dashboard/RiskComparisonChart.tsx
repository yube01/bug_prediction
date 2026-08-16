import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import type { BarDatum } from '@/utils/dashboardUtils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface RepoComparisonChartProps {
    data: BarDatum[]
}

export default function RepoComparisonChart({ data }: RepoComparisonChartProps) {
    const mappedData = data.map((d, i) => ({
        ...d,
        shortName: `R${i + 1}`
    }))

    return (
        <Card className="shadow-none h-full flex flex-col border-border bg-fill1/50 backdrop-blur-sm">
            <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="text-xs text-primary font-bold uppercase tracking-[0.12em]">
                    Compare Top Repositories
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 flex-1 flex flex-col min-h-[300px]">
                <div className="flex-1 min-h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mappedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                            <XAxis
                                dataKey="shortName"
                                tick={{ fill: 'var(--color-fg-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                                stroke="var(--color-border)"
                                tickMargin={10}
                                axisLine={false}
                            />
                            <YAxis 
                                tick={{ fill: 'var(--color-fg-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
                                stroke="var(--color-border)" 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                labelFormatter={(label) => {
                                    const repo = mappedData.find(d => d.shortName === label)
                                    return repo ? repo.name : label
                                }}
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
                            <Legend 
                                wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-fg-secondary)' }}
                            />
                            <Bar dataKey="Low Risk" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={32} />
                            <Bar dataKey="Medium Risk" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={32} />
                            <Bar dataKey="High Risk" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {mappedData.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11px] font-mono text-fg-secondary">
                        {mappedData.map(d => (
                            <div key={d.shortName} className="flex items-center gap-1.5">
                                <span className="font-bold text-fg bg-fill2 px-1.5 py-0.5 rounded border border-border shadow-sm">
                                    {d.shortName}
                                </span> 
                                <span>{d.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}