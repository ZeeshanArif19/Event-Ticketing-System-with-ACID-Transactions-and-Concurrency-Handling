import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/EventCard';
import EventSkeleton from '../components/EventSkeleton';
import Breadcrumb from '../components/Breadcrumb';
import { Input } from '../ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';

const SearchResultsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';
    const { data: events, isLoading, isError, error } = useEvents();
    const [searchInput, setSearchInput] = React.useState(query);

    // Filter events based on search query
    const searchResults = useMemo(() => {
        if (!events || !query) return [];

        const searchTerm = query.toLowerCase();
        return events.filter(event =>
            event.name.toLowerCase().includes(searchTerm) ||
            event.description?.toLowerCase().includes(searchTerm) ||
            event.venue?.toLowerCase().includes(searchTerm)
        );
    }, [events, query]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setSearchParams({ q: searchInput.trim() });
        }
    };

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: 'Search Results' }
                    ]}
                />

                {/* Search Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">Search Events</h1>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by event name, description, or venue..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-10 pr-4 h-12 text-base"
                            />
                        </div>
                    </form>
                </div>

                {/* Results Summary */}
                {query && (
                    <div className="mb-6">
                        <p className="text-lg">
                            {isLoading ? (
                                <span className="text-muted-foreground">Searching...</span>
                            ) : (
                                <>
                                    <span className="text-muted-foreground">Search results for </span>
                                    <span className="font-semibold">"{query}"</span>
                                    <span className="text-muted-foreground">
                                        {' '}- {searchResults.length} {searchResults.length === 1 ? 'event' : 'events'} found
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                )}

                {/* Search Results */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <EventSkeleton key={i} />
                        ))}
                    </div>
                ) : query && searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.map((event, index) => (
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
                ) : query ? (
                    <div className="text-center py-20">
                        <div className="inline-flex w-20 h-20 rounded-full bg-muted items-center justify-center mb-4">
                            <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">No Results Found</h3>
                        <p className="text-muted-foreground mb-6">
                            We couldn't find any events matching "{query}"
                        </p>
                        <Button onClick={() => navigate('/')}>
                            Browse All Events
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-flex w-20 h-20 rounded-full bg-muted items-center justify-center mb-4">
                            <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">Start Your Search</h3>
                        <p className="text-muted-foreground">
                            Enter a search term to find your perfect event
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultsPage;
