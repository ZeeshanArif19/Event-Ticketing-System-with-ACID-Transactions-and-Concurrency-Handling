import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/EventCard';
import EventSkeleton from '../components/EventSkeleton';
import Breadcrumb from '../components/Breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getCategoryById } from '../constants/categories';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

const CategoryPage = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const { data: events, isLoading, isError, error } = useEvents();
    const [sortBy, setSortBy] = useState('newest');

    const category = getCategoryById(categoryName);

    // Filter events by category
    const filteredEvents = useMemo(() => {
        if (!events) return [];

        return events.filter(event => {
            const eventCategoryName = event.category?.toLowerCase() ||
                event.name.toLowerCase().includes(category?.name.toLowerCase()) ||
                event.description?.toLowerCase().includes(category?.name.toLowerCase());
            return eventCategoryName;
        });
    }, [events, category]);

    // Sort events
    const sortedEvents = useMemo(() => {
        const sorted = [...filteredEvents];

        if (sortBy === 'newest') {
            sorted.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
        } else if (sortBy === 'popular') {
            // You can add popularity logic based on your data
            // For now, just sorting by total_seats as a proxy
            sorted.sort((a, b) => b.total_seats - a.total_seats);
        }

        return sorted;
    }, [filteredEvents, sortBy]);

    if (isError) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load events: {error.message}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Category not found
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const CategoryIcon = category.icon;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: 'Categories', href: '/' },
                        { label: category.name }
                    ]}
                />

                {/* Category Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                            <CategoryIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold">{category.name} Events</h1>
                            <p className="text-muted-foreground">{category.description}</p>
                        </div>
                    </div>
                </div>

                {/* Sort Controls */}
                <div className="flex justify-between items-center mb-8">
                    <p className="text-muted-foreground">
                        {sortedEvents.length} {sortedEvents.length === 1 ? 'event' : 'events'} found
                    </p>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="popular">Most Popular</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Events Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <EventSkeleton key={i} />
                        ))}
                    </div>
                ) : sortedEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedEvents.map((event, index) => (
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
                        <div className={`inline-flex w-20 h-20 rounded-full bg-gradient-to-br ${category.color} items-center justify-center mb-4`}>
                            <CategoryIcon className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">No {category.name} Events Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Check back soon for upcoming {category.name.toLowerCase()} events!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
