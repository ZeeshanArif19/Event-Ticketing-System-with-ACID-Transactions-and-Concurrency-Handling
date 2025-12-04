import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useEvents } from '../hooks/useEvents';
import HeroBanner from '../components/HeroBanner';
import CategoryGrid from '../components/CategoryGrid';
import EventCard from '../components/EventCard';
import EventSkeleton from '../components/EventSkeleton';
import RecentlyViewed from '../components/RecentlyViewed';

const HomePage = () => {
    const { data: events, isLoading, isError, error } = useEvents();

    // Get featured event (first event for now)
    const featuredEvent = events?.[0];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-8">
                {/* Hero Banner */}
                <HeroBanner featuredEvent={featuredEvent} />

                {/* Category Grid */}
                <CategoryGrid />

                {/* Trending Events */}
                <section className="py-8">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8">
                        Trending Events
                    </h2>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <EventSkeleton key={i} />
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="text-center py-20">
                            <p className="text-destructive text-lg">
                                Error loading events: {error?.message}
                            </p>
                        </div>
                    ) : events && events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.slice(0, 6).map((event, index) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                >
                                    <EventCard event={event} />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground text-lg">
                                No events available at the moment.
                            </p>
                        </div>
                    )}
                </section>

                {/* Recently Viewed */}
                <RecentlyViewed />
            </div>
        </div>
    );
};

export default HomePage;
