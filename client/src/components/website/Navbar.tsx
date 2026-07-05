import { useAuth } from '@/context/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const location = useLocation()
    return (
        <nav className="flex justify-between items-center p-4 bg-fill1 border-b border-border">
            <div className=" flex gap-2 ">
                <div className="navbar-logo">
                    <span className="navbar-brand">Bug Predictor</span>
                </div>
                <div className="flex gap-2">
                    <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                        Explorer
                    </Link>
                    <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                        Dashboard
                    </Link>
                    <Link to="/predict" className={`nav-link ${location.pathname === '/predict' ? 'active' : ''}`}>
                        Predict
                    </Link>
                    <Link to="/model" className={`nav-link ${location.pathname === '/model' ? 'active' : ''}`}>
                        Model Info
                    </Link>
                </div>
            </div>
            <div className="flex gap-2 ">
                <div className="flex gap-2 items-center">
                    <div className="navbar-avatar">
                    </div>
                    <Avatar size="32">
                        <AvatarFallback >
                            {user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                    </Avatar>
                    <span className="navbar-email">{user?.email}</span>
                </div>
                <Button onClick={signOut}>
                    Sign out
                </Button>
            </div>
        </nav>)
}

export default Navbar