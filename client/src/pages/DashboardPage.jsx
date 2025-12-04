import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Heart, User, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserBookings } from '../hooks/useBookings';
import { useEvents } from '../hooks/useEvents';
import { getWishlist, removeFromWishlist } from '../utils/localStorage';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EventCard from '../components/EventCard';
import QRCode from 'react-qr-code';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const DashboardPage = () => {
    const [searchParams] = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'bookings';
    const { user, logout } = useAuth();
    const { data: bookings, isLoading: bookingsLoading } = useUserBookings();
    const { data: allEvents } = useEvents();
    const navigate = useNavigate();

    const wishlistIds = getWishlist();
    const wishlistEvents = allEvents?.filter(event => wishlistIds.includes(event.id)) || [];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'cancelled':
            case 'failed':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    const handleRemoveFromWishlist = (eventId) => {
        removeFromWishlist(eventId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-between items-start"
                    >
                        <div>
                            <h1 className="text-4xl font-bold mb-2">
                                Welcome back, <span className="text-gradient">{user?.name || 'User'}</span>!
                            </h1>
                            <p className="text-muted-foreground">
                                Manage your bookings, wishlist, and profile
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </motion.div>
                </div>

                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
                        <TabsTrigger value="bookings">My Bookings</TabsTrigger>
                        <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                    </TabsList>

                    {/* My Bookings Tab */}
                    <TabsContent value="bookings">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h2 className="text-2xl font-bold mb-6">My Bookings</h2>

                            {bookingsLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <LoadingSpinner />
                                </div>
                            ) : !bookings || bookings.length === 0 ? (
                                <div className="border border-border rounded-xl p-12 bg-card text-center">
                                    <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Start exploring events and book your first ticket!
                                    </p>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Browse Events
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {bookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="border border-border rounded-xl overflow-hidden bg-card shadow-lg hover:shadow-xl transition-shadow"
                                        >
                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold mb-2">
                                                            {booking.event_name || 'Event Name'}
                                                        </h3>
                                                        <div className="space-y-1 text-sm text-muted-foreground">
                                                            <p>Event Date: {formatDate(booking.event_date || new Date())}</p>
                                                            <p>Booked: {formatDate(booking.created_at || new Date())}</p>
                                                            <p>Tickets: {booking.quantity || 1}</p>
                                                            {booking.seat_number && <p>Seat: {booking.seat_number}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                                                booking.status
                                                            )}`}
                                                        >
                                                            {booking.status || 'Pending'}
                                                        </span>
                                                        <p className="text-lg font-bold text-primary">
                                                            ₹{booking.total_amount || booking.price}
                                                        </p>
                                                    </div>
                                                </div>

                                                {booking.status === 'confirmed' && booking.booking_reference && (
                                                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <p className="text-sm text-muted-foreground mb-1">
                                                                Booking Reference
                                                            </p>
                                                            <p className="font-mono font-bold">
                                                                {booking.booking_reference}
                                                            </p>
                                                        </div>
                                                        <div className="p-2 bg-white rounded-lg">
                                                            <QRCode
                                                                value={booking.booking_reference}
                                                                size={80}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>

                    {/* Wishlist Tab */}
                    <TabsContent value="wishlist">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>

                            {wishlistEvents.length === 0 ? (
                                <div className="border border-border rounded-xl p-12 bg-card text-center">
                                    <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No wishlisted events</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Save events you're interested in to your wishlist!
                                    </p>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Browse Events
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {wishlistEvents.map((event) => (
                                        <div key={event.id} className="relative">
                                            <EventCard event={event} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>

                    {/* Profile Tab */}
                    <TabsContent value="profile">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h2 className="text-2xl font-bold mb-6">Profile</h2>

                            <div className="max-w-2xl">
                                <div className="border border-border rounded-xl p-6 bg-card shadow-lg">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                            <User className="w-10 h-10 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold">{user?.name || 'User'}</h3>
                                            <p className="text-sm text-muted-foreground">Member</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                            <Mail className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Email</p>
                                                <p className="font-medium">{user?.email || 'email@example.com'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                            <Ticket className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Bookings</p>
                                                <p className="font-medium">{bookings?.length || 0}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                            <Heart className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Wishlist Items</p>
                                                <p className="font-medium">{wishlistEvents.length}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-border">
                                        <h4 className="font-semibold mb-4">Quick Stats</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                                <p className="text-2xl font-bold text-primary">
                                                    {bookings?.filter(b => b.status === 'confirmed').length || 0}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Active Bookings</p>
                                            </div>
                                            <div className="p-4 rounded-lg bg-muted border border-border">
                                                <p className="text-2xl font-bold">
                                                    {bookings?.filter(b => b.status === 'pending').length || 0}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Pending</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default DashboardPage;
