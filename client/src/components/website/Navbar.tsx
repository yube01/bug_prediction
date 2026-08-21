import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Link, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button, IconButton } from '../ui/button'
import { Menu, X } from 'lucide-react'

const Navbar = () => {
    const { user, signOut } = useAuth()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
    const closeMobileMenu = () => setIsMobileMenuOpen(false)

    return (
        <nav className="sticky top-0 z-50 px-6 py-3 bg-fill1/90 backdrop-blur-md border-b border-border shadow-sm">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-8">
                    {/* Brand / Logo Area */}
                    <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <img src="./favicon.png" alt="" className="size-10 sm:size-13" />
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex gap-2">
                        <Link to="/predict">
                            <Button variant={location.pathname === '/predict' ? 'soft' : 'ghost'} className="text-sm font-medium">
                                Predict Risk
                            </Button>
                        </Link>
                        <Link to="/explore">
                            <Button variant={location.pathname === '/explore' ? 'soft' : 'ghost'} className="text-sm font-medium">
                                Explorer
                            </Button>
                        </Link>
                        <Link to="/history">
                            <Button variant={location.pathname === '/history' ? 'soft' : 'ghost'} className="text-sm font-medium">
                                History
                            </Button>
                        </Link>
                        <Link to="/dashboard">
                            <Button variant={location.pathname === '/dashboard' ? 'soft' : 'ghost'} className="text-sm font-medium">
                                Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Desktop User Profile & Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <>
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-fill2 border border-soft shadow-inner">
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
                        </>
                    ) : (
                        <>
                            <Link to="/signin">
                                <Button variant="ghost" className="rounded-full text-sm font-medium hover:bg-fill2">
                                    Sign in
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <Button className="rounded-full bg-primary hover:bg-primary-hover text-black shadow-md shadow-primary/20 text-sm font-medium px-5">
                                    Sign up
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="md:hidden flex items-center">
                    <IconButton variant="ghost" onClick={toggleMobileMenu} className="text-fg-secondary">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </IconButton>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-fill1 border-b border-border shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
                    <div className="flex flex-col gap-2 border-b border-border/50 pb-4">
                        <Link to="/predict" onClick={closeMobileMenu}>
                            <Button variant={location.pathname === '/predict' ? 'soft' : 'ghost'} className="w-full justify-start text-sm font-medium">
                                Predict Risk
                            </Button>
                        </Link>
                        <Link to="/explore" onClick={closeMobileMenu}>
                            <Button variant={location.pathname === '/explore' ? 'soft' : 'ghost'} className="w-full justify-start text-sm font-medium">
                                Explorer
                            </Button>
                        </Link>
                        <Link to="/history" onClick={closeMobileMenu}>
                            <Button variant={location.pathname === '/history' ? 'soft' : 'ghost'} className="w-full justify-start text-sm font-medium">
                                History
                            </Button>
                        </Link>
                        <Link to="/dashboard" onClick={closeMobileMenu}>
                            <Button variant={location.pathname === '/dashboard' ? 'soft' : 'ghost'} className="w-full justify-start text-sm font-medium">
                                Dashboard
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        {user ? (
                            <>
                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-fill2 border border-soft">
                                    <Avatar className="w-8 h-8 border border-border">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                            {user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-fg">{user?.full_name}</span>
                                        <span className="text-xs text-fg-secondary">{user?.email}</span>
                                    </div>
                                </div>
                                <Button onClick={() => { signOut(); closeMobileMenu(); }} variant="outline" className="w-full border-border text-error hover:bg-error/10">
                                    Sign out
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link to="/signin" onClick={closeMobileMenu}>
                                    <Button variant="outline" className="w-full">
                                        Sign in
                                    </Button>
                                </Link>
                                <Link to="/signup" onClick={closeMobileMenu}>
                                    <Button className="w-full bg-primary hover:bg-primary-hover text-black">
                                        Sign up
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}

export default Navbar