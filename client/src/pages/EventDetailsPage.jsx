import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Calendar, MapPin, Clock, Share2, Heart, ArrowLeft, Ticket, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { addToWishlist, removeFromWishlist, isInWishlist, addToRecentlyViewed } from '../utils/localStorage';
import EventCard from '../components/EventCard';
import BookingWizard from '../components/BookingWizard';

const EventDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [showBookingWizard, setShowBookingWizard] = useState(false);

    const { data: event, isLoading, error } = useQuery({
        queryKey: ['event', id],
        queryFn: async () => {
            const response = await axios.get(`http://localhost:5000/api/events/${id}`);
            // Extract event from wrapper and add sensible defaults for missing fields
            const eventData = response.data.event || response.data;
            return {
                ...eventData,
                // Map venue to location for frontend compatibility
                location: eventData.venue || eventData.location || 'Venue TBA',
                // Add default price if not present
                price: eventData.price || 500,
                // Add default category if not present
                category: eventData.category || 'Entertainment',
                // Ensure event_date is valid
                event_date: eventData.event_date || new Date().toISOString(),
                // Add booked_seats count (default to 0 if not present)
                booked_seats: eventData.booked_seats || 0,
            };
        }
    });

    const { data: relatedEvents } = useQuery({
        queryKey: ['relatedEvents', event?.category],
        queryFn: async () => {
            if (!event?.category) return [];
            const response = await axios.get(`http://localhost:5000/api/events`);
            // Filter events by category and exclude current event
            const events = response.data.events || [];
            return events
                .filter(e => e.id !== event.id)
                .slice(0, 3)
                .map(e => ({
                    ...e,
                    location: e.venue || e.location || 'Venue TBA',
                    price: e.price || 500,
                    category: e.category || 'Entertainment'
                }));
        },
        enabled: !!event?.category
    });


    useEffect(() => {
        if (event) {
            setIsWishlisted(isInWishlist(event.id));
            addToRecentlyViewed(event);
        }
    }, [event]);

    const handleWishlistToggle = () => {
        if (isWishlisted) {
            removeFromWishlist(event.id);
            setIsWishlisted(false);
            toast({ title: "Removed from wishlist" });
        } else {
            addToWishlist(event.id);
            setIsWishlisted(true);
            toast({ title: "Added to wishlist" });
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied to clipboard!" });
    };

    const handleBookClick = () => {
        if (!isAuthenticated) {
            toast({
                title: "Please sign in",
                description: "You need to be logged in to book tickets.",
                variant: "destructive"
            });
            navigate('/login', { state: { from: `/events/${id}` } });
            return;
        }
        setShowBookingWizard(true);
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    if (error || !event) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold">Event not found</h2>
            <button onClick={() => navigate('/')} className="text-primary hover:underline">
                Return Home
            </button>
        </div>
    );

    const isSoldOut = event.booked_seats >= event.total_seats;

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div className="absolute inset-0">
                    {event.image_url ? (
                        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>

                <div className="absolute top-6 left-4 md:left-8 z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl"
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-white text-sm font-bold mb-4 shadow-lg shadow-primary/25">
                            {event.category}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-lg leading-tight">
                            {event.name}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-white/90 text-lg">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span className="font-medium">{new Date(event.event_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                <span className="font-medium">{new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                <span className="font-medium">{event.location}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Action Bar */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleWishlistToggle}
                                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all border ${isWishlisted
                                    ? 'bg-red-500/10 border-red-500 text-red-500'
                                    : 'bg-card border-border hover:bg-secondary'
                                    }`}
                            >
                                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex-1 py-3 rounded-xl bg-card border border-border hover:bg-secondary flex items-center justify-center gap-2 font-semibold transition-all"
                            >
                                <Share2 className="w-5 h-5" />
                                Share Event
                            </button>
                        </div>

                        {/* Description */}
                        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                            <p className="text-muted-foreground leading-relaxed text-lg">
                                {event.description}
                            </p>
                        </div>

                        {/* Related Events */}
                        {relatedEvents && relatedEvents.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {relatedEvents.map(relatedEvent => (
                                        <EventCard key={relatedEvent.id} event={relatedEvent} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Booking */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                                <div className="mb-6">
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide mb-1">Ticket Price</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-primary">₹{event.price}</span>
                                        <span className="text-muted-foreground">onwards</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                            <Ticket className="w-4 h-4" />
                                        </div>
                                        <span>Mobile e-ticket</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <span>Safe & Secure Booking</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <Star className="w-4 h-4" />
                                        </div>
                                        <span>Best Price Guarantee</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleBookClick}
                                    disabled={isSoldOut}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${isSoldOut
                                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                        : 'bg-primary text-white hover:bg-primary/90 shadow-primary/25'
                                        }`}
                                >
                                    {isSoldOut ? 'Sold Out' : 'Book Tickets'}
                                </button>

                                {!isSoldOut && (
                                    <p className="text-center text-xs text-muted-foreground mt-4">
                                        {event.total_seats - event.booked_seats} seats remaining
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Wizard Modal */}
            <AnimatePresence>
                {showBookingWizard && (
                    <BookingWizard
                        event={event}
                        onClose={() => setShowBookingWizard(false)}
                        onComplete={() => {
                            setShowBookingWizard(false);
                            navigate('/dashboard');
                            toast({
                                title: "Booking Successful!",
                                description: "Your tickets have been booked.",
                            });
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventDetailsPage;
