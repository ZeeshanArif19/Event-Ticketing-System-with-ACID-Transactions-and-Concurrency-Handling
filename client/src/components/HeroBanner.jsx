import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight, Sparkles } from 'lucide-react';

const HeroBanner = ({ featuredEvent }) => {
    if (!featuredEvent) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[450px] md:h-[500px] rounded-3xl overflow-hidden mb-12 group"
        >
            {/* Background Image with Ken Burns effect */}
            <div className="absolute inset-0">
                {featuredEvent.image_url ? (
                    <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 8, ease: "linear" }}
                        src={featuredEvent.image_url}
                        alt={featuredEvent.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 via-purple-500/20 to-pink-500/10" />
                )}
                {/* Multi-layer gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] bg-[length:24px_24px]" />
            </div>

            {/* Floating decorative elements */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-40 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-pulse delay-1000" />

            {/* Content */}
            <div className="relative h-full flex items-center px-8 md:px-14">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-2xl"
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-primary to-purple-500 text-white mb-6 shadow-lg shadow-primary/25"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Featured Event
                    </motion.div>

                    {/* Title with gradient */}
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-[1.1] tracking-tight">
                        {featuredEvent.name}
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-white/70 mb-8 line-clamp-2 max-w-xl leading-relaxed">
                        {featuredEvent.description}
                    </p>

                    {/* Meta info with glass effect */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{formatDate(featuredEvent.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>{featuredEvent.location}</span>
                        </div>
                    </div>

                    {/* CTA Button with hover effect */}
                    <Link
                        to={`/events/${featuredEvent.id}`}
                        className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-base hover:bg-primary hover:text-white transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-primary/30 hover:-translate-y-0.5"
                    >
                        Get Tickets
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>

            {/* Price Tag */}
            <div className="absolute bottom-8 right-8 md:bottom-12 md:right-14">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-center"
                >
                    <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Starting from</p>
                    <p className="text-3xl font-bold text-white">₹{featuredEvent.price || '500'}</p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default HeroBanner;
