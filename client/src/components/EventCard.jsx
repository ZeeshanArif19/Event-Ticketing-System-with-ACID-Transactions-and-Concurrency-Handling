import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { addToWishlist, removeFromWishlist, isInWishlist } from '../utils/localStorage';

const EventCard = ({ event }) => {
    const [isWishlisted, setIsWishlisted] = useState(isInWishlist(event.id));

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
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
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="group h-full"
        >
            <Link to={`/events/${event.id}`} className="block h-full">
                <div className="relative overflow-hidden rounded-2xl glass-card h-full flex flex-col">
                    {/* Event Image */}
                    <div className="relative h-56 md:h-64 overflow-hidden">
                        {event.image_url ? (
                            <img
                                src={event.image_url}
                                alt={event.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                                <Calendar className="w-16 h-16 text-primary/50" />
                            </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg">
                                {event.category}
                            </span>
                        </div>

                        {/* Wishlist Heart Button */}
                        <button
                            onClick={handleWishlistToggle}
                            className="absolute top-3 right-3 p-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all duration-300 group/heart"
                            aria-label="Add to wishlist"
                        >
                            <Heart
                                className={`w-5 h-5 transition-all duration-300 ${isWishlisted
                                        ? 'fill-red-500 text-red-500 scale-110'
                                        : 'text-white group-hover/heart:scale-110'
                                    }`}
                            />
                        </button>

                        {/* Sold Out / Low Availability Badge */}
                        {isSoldOut && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-white text-2xl font-bold tracking-wider border-2 border-white px-6 py-2 rounded-lg transform -rotate-12">SOLD OUT</span>
                            </div>
                        )}
                        {!isSoldOut && isLowAvailability && (
                            <div className="absolute bottom-3 left-3">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/90 text-white backdrop-blur-sm shadow-lg animate-pulse">
                                    Only {availableSeats} left!
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Event Details */}
                    <div className="p-5 flex flex-col flex-grow">
                        {/* Event Name */}
                        <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
                            {event.name}
                        </h3>

                        {/* Event Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                            {event.description}
                        </p>

                        {/* Event Metadata */}
                        <div className="space-y-2.5 mb-5">
                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                <Calendar className="w-4 h-4 shrink-0 text-primary" />
                                <span className="truncate font-medium">{formatDate(event.event_date)}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                <Clock className="w-4 h-4 shrink-0 text-primary" />
                                <span className="truncate font-medium">{formatTime(event.event_date)}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                <MapPin className="w-4 h-4 shrink-0 text-primary" />
                                <span className="line-clamp-1 font-medium">{event.location}</span>
                            </div>
                        </div>

                        {/* Price and CTA */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Starting from</p>
                                <p className="text-2xl font-bold text-primary glow-text">
                                    ₹{event.price}
                                </p>
                            </div>
                            <button
                                disabled={isSoldOut}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${isSoldOut
                                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                        : 'bg-primary text-white hover:bg-primary/90 hover:shadow-primary/50 hover:-translate-y-0.5'
                                    }`}
                            >
                                {isSoldOut ? 'Sold Out' : 'Book Now'}
                            </button>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default EventCard;
