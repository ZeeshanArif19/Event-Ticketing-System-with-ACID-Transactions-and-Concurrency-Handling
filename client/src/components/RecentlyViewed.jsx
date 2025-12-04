import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getRecentlyViewed } from '../utils/localStorage';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import EventCard from './EventCard';

const RecentlyViewed = ({ events = [] }) => {
    const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);
    const scrollContainerRef = React.useRef(null);

    useEffect(() => {
        setRecentlyViewedIds(getRecentlyViewed());
    }, []);

    const recentlyViewedEvents = recentlyViewedIds
        .map(id => events.find(event => event.id === parseInt(id)))
        .filter(Boolean)
        .slice(0, 6);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (recentlyViewedEvents.length === 0) {
        return null;
    }

    return (
        <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">Recently Viewed</h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => scroll('left')}
                        className="rounded-full"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => scroll('right')}
                        className="rounded-full"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {recentlyViewedEvents.map((event, index) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="flex-shrink-0 w-80"
                    >
                        <EventCard event={event} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default RecentlyViewed;
