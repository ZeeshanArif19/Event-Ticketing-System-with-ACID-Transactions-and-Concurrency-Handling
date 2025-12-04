// LocalStorage utility functions for wishlist and recently viewed

const WISHLIST_KEY = 'event_ticketing_wishlist';
const RECENTLY_VIEWED_KEY = 'event_ticketing_recently_viewed';

// Wishlist Functions
export const getWishlist = () => {
    try {
        const wishlist = localStorage.getItem(WISHLIST_KEY);
        return wishlist ? JSON.parse(wishlist) : [];
    } catch (error) {
        console.error('Error reading wishlist from localStorage:', error);
        return [];
    }
};


export const addToWishlist = (eventId) => {
    try {
        const wishlist = getWishlist();
        if (!wishlist.includes(eventId)) {
            wishlist.push(eventId);
            localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
            window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: wishlist }));
        }
        return wishlist;
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return [];
    }
};

export const removeFromWishlist = (eventId) => {
    try {
        const wishlist = getWishlist();
        const filtered = wishlist.filter(id => id !== eventId);
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: filtered }));
        return filtered;
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return [];
    }
};

export const isInWishlist = (eventId) => {
    const wishlist = getWishlist();
    return wishlist.includes(eventId);
};

// Recently Viewed Functions
export const getRecentlyViewed = () => {
    try {
        const recentlyViewed = localStorage.getItem(RECENTLY_VIEWED_KEY);
        return recentlyViewed ? JSON.parse(recentlyViewed) : [];
    } catch (error) {
        console.error('Error reading recently viewed from localStorage:', error);
        return [];
    }
};

export const addToRecentlyViewed = (eventId) => {
    try {
        let recentlyViewed = getRecentlyViewed();

        // Remove if already exists (to move it to front)
        recentlyViewed = recentlyViewed.filter(id => id !== eventId);

        // Add to front
        recentlyViewed.unshift(eventId);

        // Keep only last 10
        recentlyViewed = recentlyViewed.slice(0, 10);

        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
        return recentlyViewed;
    } catch (error) {
        console.error('Error adding to recently viewed:', error);
        return [];
    }
};

export const clearRecentlyViewed = () => {
    try {
        localStorage.removeItem(RECENTLY_VIEWED_KEY);
    } catch (error) {
        console.error('Error clearing recently viewed:', error);
    }
};
