import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookSeat, getUserBookings } from '../api/bookings';

export const useBookSeat = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: bookSeat,
        onSuccess: (data, variables) => {
            // Invalidate seats query to update UI
            queryClient.invalidateQueries({ queryKey: ['seats', variables.eventId] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
};

export const useUserBookings = () => {
    return useQuery({
        queryKey: ['bookings'],
        queryFn: getUserBookings,
    });
};
