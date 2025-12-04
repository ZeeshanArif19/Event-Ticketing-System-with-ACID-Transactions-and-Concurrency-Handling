import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

const HeroBanner = ({ featuredEvent }) => {
    if (!featuredEvent) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative h-[500px] rounded-3xl overflow-hidden mb-16 shadow-2xl group"
        >
            {/* Background Image with Parallax-like scale */}
            <div className="absolute inset-0 overflow-hidden">
                {featuredEvent.image_url ? (
                    <img
                        src={featuredEvent.image_url}
                        alt={featuredEvent.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s] ease-out"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-600/30" />
                )}
                {/* Advanced Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            </div>

            {/* Content */}
            <div className="relative h-full container mx-auto px-8 flex items-center">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="max-w-3xl"
                >
                    {/* Featured Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-primary/20 text-white backdrop-blur-md border border-primary/30 mb-6 shadow-lg shadow-primary/10"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        FEATURED EVENT
                    </motion.div>

                    {/* Event Title */}
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                        <span className="text-gradient-premium drop-shadow-lg">
                            {featuredEvent.name}
                        </span>
                    </h1>

                    {/* Event Description */}
                    <p className="text-lg md:text-xl text-gray-300 mb-8 line-clamp-2 max-w-2xl leading-relaxed font-light">
                        {featuredEvent.description}
                    </p>

                    {/* Event Details */}
                    <div className="flex flex-wrap gap-6 mb-10 text-white/90">
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span className="font-medium tracking-wide">{formatDate(featuredEvent.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span className="font-medium tracking-wide">{featuredEvent.location}</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Link
                        to={`/events/${featuredEvent.id}`}
                        className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-primary hover:text-white transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] transform hover:-translate-y-1"
                    >
                        Book Tickets Now
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default HeroBanner;
