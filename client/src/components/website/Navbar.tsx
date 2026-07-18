import { useAuth } from '@/context/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const location = useLocation()
    return (
        <nav className="flex justify-between items-center p-4 bg-fill1 border-b border-border">
            <div className=" flex ">
                <div className="flex gap-2">
                    <Link to="/" className={` ${location.pathname === '/' ? 'active' : ''}`}>
                        <Button variant="smooth">
                            Bug Predictor
                        </Button>
                    </Link>
                    <Link to="/" className={` ${location.pathname === '/' ? 'active' : ''}`}>
                        <Button variant="ghost">
                            Explorer
                        </Button>
                    </Link>
                    <Link to="/dashboard" className={` ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                        <Button variant="ghost">
                            Dashboard
                        </Button>
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