import { useAuth } from '@/context/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const location = useLocation()

    return (
        <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-fill1/80 backdrop-blur-md border-b border-border shadow-sm">
            <div className="flex items-center gap-8">
                {/* Brand / Logo Area */}
                <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-accent flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-white font-bold text-lg font-heading">P</span>
                    </div>
                    <span className="font-heading font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fg to-fg-secondary">
                        Predictor
                    </span>
                </Link>

                {/* Navigation Links */}
                <div className="flex gap-2">
                    <Link to="/predict">
                        <Button variant={location.pathname === '/predict' ? 'soft' : 'ghost'} className="rounded-full text-sm font-medium">
                            Predict Risk
                        </Button>
                    </Link>
                    <Link to="/">
                        <Button variant={location.pathname === '/' ? 'soft' : 'ghost'} className="rounded-full text-sm font-medium">
                            Explorer
                        </Button>
                    </Link>
                    <Link to="/history">
                        <Button variant={location.pathname === '/history' ? 'soft' : 'ghost'} className="rounded-full text-sm font-medium">
                            History
                        </Button>
                    </Link>
                    <Link to="/dashboard">
                        <Button variant={location.pathname === '/dashboard' ? 'soft' : 'ghost'} className="rounded-full text-sm font-medium">
                            Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-fill2 border border-soft shadow-inner">
                    <Avatar className="w-7 h-7 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-fg-secondary pr-1">{user?.email}</span>
                </div>
                
                <Button onClick={signOut} variant="outline" className="rounded-full border-border hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors">
                    Sign out
                </Button>
            </div>
        </nav>
    )
}

export default Navbar