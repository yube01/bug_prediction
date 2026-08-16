import { useNavigate } from 'react-router-dom'
import SearchHistory from '@/components/website/explore/SearchHistory'

export default function SearchHistoryPage() {
    const navigate = useNavigate()

    const handleReSearch = (repoName: string, branch: string) => {
        navigate(`/?repo=${encodeURIComponent(repoName)}&branch=${encodeURIComponent(branch)}`)
    }

    return (
        <div className="max-w-4xl mx-auto p-6 flex flex-col gap-8 animate-in fade-in duration-500">
            <div>
                <h1 className="heading-2 bg-clip-text text-transparent bg-gradient-to-r from-fg to-fg-secondary">Search History</h1>
                <p className="text-sm text-fg-secondary mt-1">Review your previously analyzed repositories and jump right back in.</p>
            </div>
            
            <SearchHistory onReSearch={handleReSearch} />
        </div>
    )
}
