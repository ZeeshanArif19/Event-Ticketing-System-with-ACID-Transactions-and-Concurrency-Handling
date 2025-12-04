import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, User, LogOut, Ticket, Moon, Sun, ChevronDown, Music, Trophy, Laugh, Laptop, Baby, Theater } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../components/ThemeProvider';
import { getWishlist } from '../utils/localStorage';
import axios from 'axios';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

// Icon mapping for categories from database
const iconMap = {
    'Music': Music,
    'Trophy': Trophy,
    'Laugh': Laugh,
    'Laptop': Laptop,
    'Baby': Baby,
    'Theater': Theater
};

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [wishlistCount, setWishlistCount] = useState(0);
    const [categories, setCategories] = useState([]);

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/categories');
                setCategories(response.data.categories || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Update wishlist count on mount and when wishlist changes
    useEffect(() => {
        const updateWishlistCount = () => {
            const wishlist = getWishlist();
            setWishlistCount(wishlist.length);
        };

        updateWishlistCount();

        // Listen for wishlist updates
        window.addEventListener('wishlistUpdated', updateWishlistCount);
        return () => window.removeEventListener('wishlistUpdated', updateWishlistCount);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="sticky top-0 z-50 glass-effect border-b border-white/10 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold shrink-0 group">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-primary/50 transition-all duration-300 group-hover:scale-105">
                            <Ticket className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <span className="text-gradient font-extrabold hidden sm:inline tracking-tight group-hover:opacity-90 transition-opacity">EventHub</span>
                    </Link>

                    {/* Desktop Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 rounded-full border border-border/50 bg-secondary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 shadow-inner"
                            />
                        </div>
                    </form>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Categories Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 px-4 py-2 rounded-full hover:bg-accent/50 transition-all duration-300 text-sm font-medium border border-transparent hover:border-border/50">
                                    <span className="hidden md:inline">Categories</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-2 glass-card border-white/10">
                                {categories.map((category) => {
                                    const Icon = iconMap[category.icon] || Theater;
                                    return (
                                        <DropdownMenuItem
                                            key={category.id}
                                            onClick={() => navigate(`/category/${category.id}`)}
                                            className="cursor-pointer rounded-lg p-3 hover:bg-primary/10 focus:bg-primary/10 transition-colors mb-1 last:mb-0"
                                        >
                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mr-4 shadow-md`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">{category.name}</p>
                                                <p className="text-xs text-muted-foreground">{category.description}</p>
                                            </div>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Wishlist Button */}
                        <button
                            onClick={() => navigate(isAuthenticated ? '/dashboard?tab=wishlist' : '/login')}
                            className="relative p-2.5 rounded-full hover:bg-accent/50 transition-all duration-300 group"
                            aria-label="Wishlist"
                        >
                            <Heart className="w-5 h-5 group-hover:text-red-500 transition-colors" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-full hover:bg-accent/50 transition-all duration-300 hover:rotate-12"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-5 h-5 text-yellow-400" />
                            ) : (
                                <Moon className="w-5 h-5 text-slate-700" />
                            )}
                        </button>

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full hover:bg-accent/50 transition-all duration-300 border border-transparent hover:border-border/50">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <span className="hidden md:inline text-sm font-semibold">{user?.name || 'User'}</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 glass-card border-white/10 p-2">
                                    <div className="px-3 py-2 bg-muted/30 rounded-lg mb-2">
                                        <p className="text-sm font-bold text-foreground">{user?.name || 'User'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                                    </div>
                                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="rounded-lg cursor-pointer">
                                        <User className="w-4 h-4 mr-2" />
                                        My Bookings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/dashboard?tab=wishlist')} className="rounded-lg cursor-pointer">
                                        <Heart className="w-4 h-4 mr-2" />
                                        Wishlist
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/50" />
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive rounded-lg cursor-pointer">
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link
                                to="/login"
                                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="md:hidden mt-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-full border border-border/50 bg-secondary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                        />
                    </div>
                </form>
            </div>
        </nav>
    );
};

export default Navbar;
