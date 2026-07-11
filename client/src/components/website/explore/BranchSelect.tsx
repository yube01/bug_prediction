import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { GithubBranch } from '@/types'

interface Props {
    branches: GithubBranch[]
    currentBranch: string
    onChange: (branch: string) => void
    loading: boolean
}

export default function BranchSelect({ branches, currentBranch, onChange, loading }: Props) {
    const disabled = loading || branches.length === 0

    return (
        <div className="flex flex-col gap-2">
            <Label
                htmlFor="branchSel"            >
                Branch
            </Label>
            <Select
                value={currentBranch}
                onValueChange={onChange}
                disabled={disabled}
            >
                <SelectTrigger id="branchSel" className="flex-1">
                    <SelectValue
                        placeholder={
                            branches.length === 0
                                ? 'Enter a repo link in the above input first'
                                : 'Select a branch'
                        }
                    />
                </SelectTrigger>
                <SelectContent>
                    {branches.map(b => (
                        <SelectItem key={b.name} value={b.name}>
                            {b.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}