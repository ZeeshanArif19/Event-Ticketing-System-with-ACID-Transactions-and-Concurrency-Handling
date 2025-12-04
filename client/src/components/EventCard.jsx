import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Heart, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { addToWishlist, removeFromWishlist, isInWishlist } from '../utils/localStorage';

const EventCard = ({ event }) => {
    const [isWishlisted, setIsWishlisted] = useState(isInWishlist(event.id));
    const [isHovered, setIsHovered] = useState(false);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const availableSeats = event.total_seats - event.booked_seats;
    const isLowAvailability = availableSeats < event.total_seats * 0.2;
    const isSoldOut = availableSeats === 0;

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isWishlisted) {
            removeFromWishlist(event.id);
            setIsWishlisted(false);
        } else {
            addToWishlist(event.id);
            setIsWishlisted(true);
        }
    };

    return (
        <Link
            to={`/events/${event.id}`}
            className="block group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-shadow duration-300"
            >
                {/* Image Container */}
                <div className="relative h-52 overflow-hidden bg-secondary">
                    {event.image_url ? (
                        <motion.img
                            animate={{ scale: isHovered ? 1.08 : 1 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            src={event.image_url}
                            alt={event.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
                            <Ticket className="w-16 h-16 text-primary/20" />
                        </div>
                    )}

                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="px-3 py-1.5 text-xs font-semibold bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full text-foreground shadow-sm">
                            {event.category}
                        </span>
                    </div>

                    {/* Wishlist Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleWishlistToggle}
                        className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
                    >
                        <Heart
                            className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                        />
                    </motion.button>

                    {/* Status badges */}
                    {isSoldOut && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white font-bold text-xl px-6 py-2 border-2 border-white/50 rounded-lg tracking-wide">SOLD OUT</span>
                        </div>
                    )}
                    {!isSoldOut && isLowAvailability && (
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-3 left-3 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full shadow-lg"
                        >
                            🔥 Only {availableSeats} left
                        </motion.span>
                    )}
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Event Name */}
                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {event.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {event.description}
                    </p>

                    {/* Event Meta */}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-5">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-medium">{formatDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{formatTime(event.event_date)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="truncate">{event.location}</span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">From</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                ₹{event.price}
                            </p>
                        </div>
                        <motion.span
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${isSoldOut
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40'
                                }`}
                        >
                            {isSoldOut ? 'Sold Out' : 'Book Now'}
                        </motion.span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default EventCard;
