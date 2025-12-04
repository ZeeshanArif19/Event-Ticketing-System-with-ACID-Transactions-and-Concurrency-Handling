import axiosInstance from './axios';

export const getEvents = async () => {
    const response = await axiosInstance.get('/api/events');
    return response.data.events;
};

export const getEventById = async (id) => {
    const response = await axiosInstance.get(`/api/events/${id}`);
    return response.data.event;
};

export const getEventSeats = async (eventId) => {
    const response = await axiosInstance.get(`/api/events/${eventId}/seats`);
    return response.data.seats;
};

export const createEvent = async (eventData) => {
    const response = await axiosInstance.post('/api/events', eventData);
    return response.data.event;
};
