// Add wishlist functions
export const addToWishlist = (eventId) => {
    try {
        const wishlist = getWishlist();
        if (!wishlist.includes(eventId)) {
            wishlist.push(eventId);
            localStorage.setItem('event_ticketing_wishlist', JSON.stringify(wishlist));
            // Dispatch custom event for navbar to update
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
        localStorage.setItem('event_ticketing_wishlist', JSON.stringify(filtered));
        // Dispatch custom event for navbar to update
        window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: filtered }));
        return filtered;
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return [];
    }
};
