import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, User, LogOut, Ticket, Moon, Sun, ChevronDown, Music, Trophy, Laugh, Laptop, Baby, Theater } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../components/ThemeProvider';
import { getWishlist } from '../utils/localStorage';
import axios from 'axios';

// Icon mapping for categories from database
const iconMap = {
    'Music': Music,
    'Trophy': Trophy,
    'Laugh': Laugh,
    'Laptop': Laptop,
    'Baby': Baby,
    'Theater': Theater
};

// Enhanced dropdown component
const Dropdown = ({ trigger, children, align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>
            {isOpen && (
                <div
                    className={`absolute top-full mt-3 ${align === 'right' ? 'right-0' : 'left-0'} z-[9999] min-w-[220px] rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-2 shadow-2xl shadow-black/10 animate-in fade-in-0 zoom-in-95 duration-200`}
                    onClick={() => setIsOpen(false)}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

const DropdownItem = ({ onClick, children, className = '', destructive = false }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-2.5 text-sm rounded-xl transition-all duration-200 hover:bg-secondary/80 active:scale-[0.98] ${destructive ? 'text-destructive hover:bg-destructive/10' : ''} ${className}`}
    >
        {children}
    </button>
);

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [wishlistCount, setWishlistCount] = useState(0);
    const [categories, setCategories] = useState([]);
    const [isScrolled, setIsScrolled] = useState(false);

    // Track scroll for navbar style
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    // Update wishlist count
    useEffect(() => {
        const updateWishlistCount = () => {
            const wishlist = getWishlist();
            setWishlistCount(wishlist.length);
        };

        updateWishlistCount();
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
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-border/50' : 'bg-background/95 backdrop-blur-sm border-b border-border'}`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 font-bold text-lg group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300">
                            <Ticket className="w-5 h-5 text-white" />
                        </div>
                        <span className="hidden sm:inline text-foreground font-bold tracking-tight">EventHub</span>
                    </Link>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search events, venues..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-border bg-secondary/50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all duration-300"
                            />
                        </div>
                    </form>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        {/* Categories */}
                        <Dropdown
                            align="right"
                            trigger={
                                <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl transition-all duration-200">
                                    Categories
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            }
                        >
                            <div className="w-64">
                                {categories.map((category) => {
                                    const Icon = iconMap[category.icon] || Theater;
                                    return (
                                        <DropdownItem
                                            key={category.id}
                                            onClick={() => navigate(`/category/${category.id}`)}
                                            className="p-3 mb-1"
                                        >
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.color || 'from-gray-500 to-gray-600'} flex items-center justify-center mr-3 shadow-md`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold text-foreground text-sm">{category.name}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>
                                            </div>
                                        </DropdownItem>
                                    );
                                })}
                            </div>
                        </Dropdown>

                        {/* Wishlist */}
                        <button
                            onClick={() => navigate(isAuthenticated ? '/dashboard?tab=wishlist' : '/login')}
                            className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                        >
                            <Heart className="w-5 h-5" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>

                        {/* User Menu */}
                        {isAuthenticated ? (
                            <Dropdown
                                align="right"
                                trigger={
                                    <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary/80 transition-all duration-200 ml-1">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-md">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="hidden md:inline text-sm font-medium text-foreground max-w-[100px] truncate">{user?.name || 'User'}</span>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                                    </button>
                                }
                            >
                                <div className="w-56">
                                    <div className="px-4 py-3 border-b border-border mb-2">
                                        <p className="font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || ''}</p>
                                    </div>
                                    <DropdownItem onClick={() => navigate('/dashboard')}>
                                        <Ticket className="w-4 h-4 mr-3 text-primary" />
                                        My Bookings
                                    </DropdownItem>
                                    <DropdownItem onClick={() => navigate('/dashboard?tab=wishlist')}>
                                        <Heart className="w-4 h-4 mr-3 text-primary" />
                                        Wishlist
                                    </DropdownItem>
                                    <div className="my-2 h-px bg-border" />
                                    <DropdownItem onClick={handleLogout} destructive>
                                        <LogOut className="w-4 h-4 mr-3" />
                                        Sign out
                                    </DropdownItem>
                                </div>
                            </Dropdown>
                        ) : (
                            <Link
                                to="/login"
                                className="ml-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="md:hidden pb-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-border bg-secondary/50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                        />
                    </div>
                </form>
            </div>
        </nav>
    );
};

export default Navbar;
