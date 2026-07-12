import { useMemo, useState, type ChangeEvent } from 'react'
import type { SearchHistoryItem } from '@/api/auth'
import { filterAndSortRepos, type SortOption } from '@/utils/dashboardUtils'
import { RISK_BG_CLASSES } from './RiskColor'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'

interface RepositoryHistoryPanelProps {
    repos: SearchHistoryItem[]
    onExplore: (repoName: string, branch: string) => void
    onDelete: (id: string) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'date', label: 'Date Analyzed' },
    { value: 'name', label: 'Repo Name' },
    { value: 'commits', label: 'Total Commits' },
    { value: 'high_risk', label: 'High Risk Commits' },
]


export default function RepositoryHistoryPanel({ repos, onExplore, onDelete }: RepositoryHistoryPanelProps) {
    const [filterText, setFilterText] = useState('')
    const [sortBy, setSortBy] = useState<SortOption>('date')

    const filteredAndSortedRepos = useMemo(
        () => filterAndSortRepos(repos, filterText, sortBy),
        [repos, filterText, sortBy],
    )

    return (
        <div className="rounded-xl border border-border bg-fill1 px-6 py-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <h3 className="heading-6">
                    Searched Repositories ({repos.length})
                </h3>

                <div className="flex items-center gap-3">
                    <Input
                        type="text"
                        placeholder="Filter repositories..."
                        value={filterText}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value)}
                    />

                    <Select
                        value={sortBy}
                        onValueChange={(value) => setSortBy(value as SortOption)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-bg'>
                            {SORT_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem >
                            ))}
                        </SelectContent>

                    </Select>
                </div>
            </div>

            <div className="overflow-x-auto">
                {filteredAndSortedRepos.length === 0 ? (
                    <div className="p-8 text-center text-xs">No repositories match your filter query.</div>
                ) : (
                    <Table >
                        <TableHeader>
                            <TableRow>
                                <TableHead >Repository Name</TableHead>
                                <TableHead >Branch</TableHead>
                                <TableHead >Commits</TableHead>
                                <TableHead >Risk Level Breakdown</TableHead>
                                <TableHead >Analyzed At</TableHead>
                                <TableHead >Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedRepos.map(item => (
                                <RepoRow key={item.id} item={item} onExplore={onExplore} onDelete={onDelete} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}

function RepoRow({
    item,
    onExplore,
    onDelete,
}: {
    item: SearchHistoryItem
    onExplore: (repoName: string, branch: string) => void
    onDelete: (id: string) => void
}) {
    const total = item.high_risk_count + item.medium_risk_count + item.low_risk_count
    const highPct = total > 0 ? (item.high_risk_count / total) * 100 : 0
    const medPct = total > 0 ? (item.medium_risk_count / total) * 100 : 0
    const lowPct = total > 0 ? (item.low_risk_count / total) * 100 : 0

    return (
        <TableRow className="border-border">
            <TableCell className="px-2 py-3 ">{item.repo_name}</TableCell>
            <TableCell className="px-2 py-3 ">{item.branch}</TableCell>
            <TableCell className="px-2 py-3 ">{item.total_commits}</TableCell>
            <TableCell className="px-2 py-3">
                {total > 0 ? (
                    <div className="flex flex-col gap-1">
                        <div className="flex h-2 w-35 overflow-hidden rounded-full bg-bg">
                            {lowPct > 0 && (
                                <div
                                    className={RISK_BG_CLASSES.low}
                                    style={{ width: `${lowPct}%` }}
                                    title={`Low Risk: ${item.low_risk_count}`}
                                />
                            )}
                            {medPct > 0 && (
                                <div
                                    className={RISK_BG_CLASSES.medium}
                                    style={{ width: `${medPct}%` }}
                                    title={`Medium Risk: ${item.medium_risk_count}`}
                                />
                            )}
                            {highPct > 0 && (
                                <div
                                    className={RISK_BG_CLASSES.high}
                                    style={{ width: `${highPct}%` }}
                                    title={`High Risk: ${item.high_risk_count}`}
                                />
                            )}
                        </div>
                        <div className="flex gap-1.5">
                            <span className="text-success-text">{item.low_risk_count}L</span>
                            <span className="text-warning-text">{item.medium_risk_count}M</span>
                            <span className="text-error-text">{item.high_risk_count}H</span>
                        </div>
                    </div>
                ) : (
                    <span className="text-[10px] text-fg2">No commit details</span>
                )}
            </TableCell>
            <TableCell className="px-2 py-3  text-fg2">
                {new Date(item.searched_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="px-2 py-3 text-right">
                <div className="flex gap-2">
                    <Button
                        size="28"
                        variant="outline"
                        onClick={() => onExplore(item.repo_name, item.branch)}
                    >
                        Explore
                    </Button>
                    <Button
                        size="28"
                        color="error"
                        onClick={() => onDelete(item.id)}
                    >
                        Delete
                    </Button>
                </div>
            </TableCell>
        </TableRow >
    )
}