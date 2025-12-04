import express from 'express';
import { getAllEvents, getEventById, getEventSeats, createEvent } from '../controllers/eventController.js';
import { getEventSeatTiers, getEventConfig } from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/events - Get all events (public)
router.get('/', getAllEvents);

// GET /api/events/:id - Get event by ID (public)
router.get('/:id', getEventById);

// GET /api/events/:id/seats - Get seats for an event (public)
router.get('/:id/seats', getEventSeats);

// GET /api/events/:id/tiers - Get seat tiers for an event (public)
router.get('/:id/tiers', getEventSeatTiers);

// GET /api/events/:id/config - Get event configuration (public)
router.get('/:id/config', getEventConfig);

// POST /api/events - Create new event (protected)
router.post('/', authenticate, createEvent);

export default router;

