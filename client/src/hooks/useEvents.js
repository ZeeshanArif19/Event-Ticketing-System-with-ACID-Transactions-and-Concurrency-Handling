import { useQuery } from '@tanstack/react-query';
import { getEvents, getEventById, getEventSeats } from '../api/events';

export const useEvents = () => {
    return useQuery({
        queryKey: ['events'],
        queryFn: getEvents,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useEvent = (id) => {
    return useQuery({
        queryKey: ['event', id],
        queryFn: () => getEventById(id),
        enabled: !!id,
    });
};

export const useEventSeats = (eventId, { refetchInterval } = {}) => {
    return useQuery({
        queryKey: ['seats', eventId],
        queryFn: () => getEventSeats(eventId),
        enabled: !!eventId,
        refetchInterval: refetchInterval || 5000, // Poll every 5 seconds for real-time updates
    });
};
