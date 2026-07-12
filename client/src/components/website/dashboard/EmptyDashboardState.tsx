import { useNavigate } from 'react-router-dom'

export default function EmptyDashboardState() {
    const navigate = useNavigate()

    return (
        <div className="mx-auto my-16 max-w-175 rounded-xl border border-border bg-fill1 px-8 py-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
            <div className="mb-6 text-5xl ">📊</div>
            <h2 className="mb-3 font-['Syne'] text-2xl font-bold text-fg">No Repositories Analyzed Yet</h2>
            <p className="mx-auto mb-8 max-w-120 text-sm leading-relaxed text-fg2">
                Analyze your first repository to unlock comprehensive risk management dashboards,
                performance aggregates, and repository comparisons.
            </p>
            <button
                onClick={() => navigate('/')}
                className="rounded-lg  from-accent to-accent2 px-7 py-3 font-['Syne'] text-[13px] font-bold tracking-[0.06em] text-white shadow-[0_4px_15px_rgba(91,82,232,0.4)] transition-all hover:brightness-110"
            >
                [ ANALYZE A REPOSITORY ]
            </button>
        </div>
    )
}