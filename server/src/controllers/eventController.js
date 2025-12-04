import Event from '../models/Event.js';
import Seat from '../models/Seat.js';
import logger from '../utils/logger.js';

/**
 * Get all events
 */
export const getAllEvents = async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json({ events });
    } catch (error) {
        logger.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

/**
 * Get event by ID
 */
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ event });
    } catch (error) {
        logger.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};

/**
 * Get seats for an event
 */
export const getEventSeats = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify event exists
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const seats = await Seat.findByEventId(id);

        res.json({ seats });
    } catch (error) {
        logger.error('Error fetching seats:', error);
        res.status(500).json({ error: 'Failed to fetch seats' });
    }
};

/**
 * Create a new event with seats (admin function)
 */
export const createEvent = async (req, res) => {
    try {
        const { name, description, venue, event_date, total_seats, image_url } = req.body;

        // Validate input
        if (!name || !venue || !event_date || !total_seats) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const eventData = {
            name,
            description,
            venue,
            event_date,
            total_seats,
            image_url
        };

        // Create event with seats and partition
        const event = await Event.createWithSeats(eventData, total_seats);

        logger.info(`Event created: ${event.id} - ${event.name}`);

        res.status(201).json({ event });
    } catch (error) {
        logger.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};
