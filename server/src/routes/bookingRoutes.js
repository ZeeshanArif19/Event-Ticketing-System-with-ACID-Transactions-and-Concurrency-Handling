import express from 'express';
import { bookSeat, bookSeats, getUserBookings } from '../controllers/bookingController.js';
import { simulateConcurrentBooking } from '../controllers/testController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/bookings/bulk - Book multiple seats in one transaction (protected)
router.post('/bulk', authenticate, bookSeats);

// POST /api/bookings/book?mode=pessimistic|optimistic - Book a seat (protected)
router.post('/book', authenticate, bookSeat);

// GET /api/bookings/my-bookings - Get user's bookings (protected)
router.get('/my-bookings', authenticate, getUserBookings);

// POST /api/bookings/simulate - Concurrency load test (protected)
router.post('/simulate', authenticate, simulateConcurrentBooking);

export default router;
