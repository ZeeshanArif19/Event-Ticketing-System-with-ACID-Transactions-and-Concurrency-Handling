import axiosInstance from './axios';

export const bookSeat = async ({ seatId, eventId, mode = 'pessimistic' }) => {
    const response = await axiosInstance.post(
        `/api/bookings/book?mode=${mode}`,
        { seatId, eventId }
    );
    return response.data;
};

export const getUserBookings = async () => {
    const response = await axiosInstance.get('/api/bookings/my-bookings');
    return response.data.bookings;
};

export const simulateLoad = async (seatId, eventId, attempts = 200) => {
    const response = await axiosInstance.post('/api/bookings/simulate', {
        seatId,
        eventId,
        attempts,
    });
    return response.data;
};
