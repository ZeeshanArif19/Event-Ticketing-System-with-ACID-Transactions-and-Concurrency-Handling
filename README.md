# Event Ticketing System

A production-grade event ticketing system built with the PERN stack, featuring ACID transactions, concurrency control, row-level locking, and a modern premium UI.

## 🎯 Features

### Backend
- ✅ **ACID Transactions** with PostgreSQL SERIALIZABLE isolation
- ✅ **Row-Level Locking** using `SELECT ... FOR UPDATE`
- ✅ **Dual Locking Modes**: Pessimistic & Optimistic (query parameter toggle)
- ✅ **Automatic Retry Logic** for serialization failures with exponential backoff
- ✅ **Payment Simulation** within transactions for rollback on failure
- ✅ **LIST Partitioning** for seats table by event_id
- ✅ **JWT Authentication** with bcrypt password hashing
- ✅ **Concurrency Load Testing** endpoint with Promise.allSettled()
- ✅ **Comprehensive Error Handling** for deadlocks and serialization failures

### Frontend
- ✅ **React + Vite** for fast development
- ✅ **TailwindCSS** with custom theme
- ✅ **ShadCN UI Components** for premium aesthetics
- ✅ **React Query** for data fetching with automatic polling
- ✅ **Dark Mode** support
- ✅ **Interactive Seat Map** with color-coded availability
- ✅ **Real-time Updates** via seat polling
- ✅ **Protected Routes** with authentication
- ✅ **Responsive Design** for all devices

## 🏗️ Architecture

```mermaid
graph TB
    Client[React Frontend]
    API[Express API]
    Auth[JWT Auth Middleware]
    DB[(PostgreSQL)]
    
    Client -->|HTTP/REST| API
    API -->|Verify Token| Auth
    Auth -->|Validated Request| API
    API -->|SQL Queries| DB
    
    subgraph "Concurrency Control"
        TX[Transaction Manager]
        LOCK[Locking Service]
        RETRY[Retry Logic]
    end
    
    API --> TX
    TX --> LOCK
    LOCK --> RETRY
    RETRY --> DB
```

## 🗄️ Database Schema

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : makes
    EVENTS ||--o{ SEATS : contains
    EVENTS ||--o{ BOOKINGS : has
    SEATS ||--o{ BOOKINGS : reserved_by
    BOOKINGS ||--|| PAYMENTS : includes
    
    USERS {
        int id PK
        string email UK
        string password_hash
        string name
        timestamp created_at
    }
    
    EVENTS {
        int id PK
        string name
        text description
        string venue
        timestamp event_date
        int total_seats
        string image_url
    }
    
    SEATS {
        int id PK
        int event_id FK
        string seat_number
        boolean is_booked
        int version
        timestamp locked_at
        int locked_by
    }
    
    BOOKINGS {
        int id PK
        int user_id FK
        int event_id FK
        int seat_id FK
        string status
        timestamp booking_date
    }
    
    PAYMENTS {
        int id PK
        int booking_id FK
        decimal amount
        string status
        timestamp payment_date
    }
```

## 🔐 Concurrency Control Explained

### SERIALIZABLE Isolation Level
Every booking transaction runs at the **SERIALIZABLE** isolation level, which provides the highest level of transaction isolation in PostgreSQL:

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- ... transaction operations ...
COMMIT;
```

This prevents:
- **Dirty Reads**: Reading uncommitted data
- **Non-repeatable Reads**: Same query returning different results
- **Phantom Reads**: New rows appearing in range queries
- **Serialization Anomalies**: Concurrent transactions producing inconsistent results

### Row-Level Locking (Pessimistic Mode)

When using pessimistic locking, we acquire an exclusive lock on the seat row:

```sql
SELECT * FROM seats WHERE id = $1 FOR UPDATE;
```

**How it works:**
1. Transaction A locks seat row with `FOR UPDATE`
2. Transaction B attempts to lock the same seat → **BLOCKED** until A commits/rolls back
3. Only one transaction can hold the lock at a time
4. Prevents double-booking automatically

### Optimistic Locking (Version-Based)

When using optimistic locking, we check the version number before updating:

```sql
UPDATE seats 
SET is_booked = TRUE, version = version + 1 
WHERE id = $1 AND version = $2 AND is_booked = FALSE;
```

**How it works:**
1. Transaction A reads seat with version = 5
2. Transaction B reads seat with version = 5
3. Transaction A updates → version becomes 6
4. Transaction B tries to update with version = 5 → **FAILS** (0 rows affected)
5. Transaction B retries with new version

### Retry Logic

Serialization failures are automatically retried up to 5 times with exponential backoff:

```javascript
for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    return await executeTransaction();
  } catch (error) {
    if (error.code === '40001') { // serialization_failure
      await sleep(100 * Math.pow(2, attempt));
      continue;
    }
    throw error;
  }
}
```

### Payment Simulation in Transaction

Payment simulation runs **inside the same transaction**, enabling automatic rollback:

```javascript
await client.query('BEGIN');
await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

// Lock and book seat
await client.query('SELECT * FROM seats WHERE id = $1 FOR UPDATE', [seatId]);
await client.query('UPDATE seats SET is_booked = TRUE WHERE id = $1', [seatId]);

// Simulate payment (70% success rate)
const paymentSuccess = await simulatePayment();

if (!paymentSuccess) {
  await client.query('ROLLBACK'); // Seat booking is rolled back!
  throw new Error('Payment failed');
}

await client.query('COMMIT'); // Everything is committed together
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Backend Setup

1. **Navigate to server directory:**
```bash
cd server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create PostgreSQL database:**
```bash
createdb event_ticketing
```

4. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DATABASE_URL=postgresql://username:password@localhost:5432/event_ticketing
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
NODE_ENV=development
```

5. **Setup database schema and seed data:**
```bash
npm run setup-db
```

6. **Start development server:**
```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory:**
```bash
cd client
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:5000
```

4. **Start development server:**
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `GET /api/events/:id/seats` - Get seats for event
- `POST /api/events` - Create new event (protected)

### Bookings
- **`POST /api/bookings/book?mode=pessimistic|optimistic`** - Book a seat (protected)
  - Query param `mode`: `pessimistic` (default) or `optimistic`
  - Body: `{ seatId, eventId }`
- `GET /api/bookings/my-bookings` - Get user's bookings (protected)
- `POST /api/bookings/simulate` - Run concurrency load test (protected)

### Example: Booking with Optimistic Locking

```bash
curl -X POST http://localhost:5000/api/bookings/book?mode=optimistic \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"seatId": 1, "eventId": 1}'
```

## 🧪 Testing Concurrency

### Load Test Endpoint

Test with 200 concurrent booking attempts:

```bash
curl -X POST http://localhost:5000/api/bookings/simulate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "seatId": 1,
    "eventId": 1,
    "attempts": 200
  }'
```

**Expected Response:**
```json
{
  "summary": {
    "totalAttempts": 200,
    "successful": 1,
    "failed": 199,
    "durationMs": 1234
  },
  "verification": {
    "seatIsBooked": true,
    "totalBookingsCreated": 1
  },
  "message": "✓ No overselling detected!"
}
```

### Manual Testing

1. Open the event details page in **2 browser tabs**
2. Select the **same seat** in both tabs
3. Click "Book" simultaneously
4. Only **1 booking succeeds**, the other gets an error
5. Seat becomes unavailable in real-time

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** (pg) - Database with ACID support
- **jsonwebtoken** - JWT authentication
- **bcrypt** - Password hashing
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logger

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Utility-first CSS
- **ShadCN UI** - Component library
- **React Router** - Client-side routing
- **React Query** - Data fetching & caching
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📂 Project Structure

```
event-ticketing/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # Database connection pool
│   │   │   ├── schema.sql         # Database schema
│   │   │   └── seed.js            # Seed script
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Event.js
│   │   │   ├── Seat.js
│   │   │   ├── Booking.js
│   │   │   └── Payment.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── eventController.js
│   │   │   ├── bookingController.js
│   │   │   └── testController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── eventRoutes.js
│   │   │   └── bookingRoutes.js
│   │   └── utils/
│   │       ├── logger.js
│   │       ├── transaction.js
│   │       └── locking.js
│   ├── index.js
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js
│   │   │   ├── auth.js
│   │   │   ├── events.js
│   │   │   └── bookings.js
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── SeatMap.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ThemeProvider.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useEvents.js
│   │   │   └── useBookings.js
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── EventDetailsPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── ui/
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── alert.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   └── badge.jsx
│   │   ├── lib/
│   │   │   └── utils.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## 🔑 Sample Credentials

After running `npm run setup-db`, use these credentials:

**User 1:**
- Email: `john@example.com`
- Password: `password123`

**User 2:**
- Email: `jane@example.com`
- Password: `testuser123`

## 🎨 UI Features

- **Premium Design** with gradients and modern aesthetics
- **Dark Mode** toggle with localStorage persistence
- **Responsive Layout** for mobile, tablet, and desktop
- **Smooth Animations** for better UX (CSS-based)
- **Color-Coded Seat Map**:
  - 🟢 Green = Available
  - 🔵 Blue = Selected
  - 🔴 Red = Booked
- **Real-time Updates** via polling (5-second intervals)
- **Loading States** and error handling throughout

## 🐛 Error Handling

The system handles various error scenarios:

- **Seat Already Booked**: Returns 409 Conflict
- **Payment Failure**: Automatic rollback, seat remains available
- **Serialization Failure**: Automatic retry (up to 5 attempts)
- **Deadlock Detection**: Automatic retry with exponential backoff
- **Authentication Failure**: Returns 401 Unauthorized
- **Database Connection Issues**: Graceful error messages

## 📊 Why This Architecture?

1. **SERIALIZABLE Isolation**: Prevents all concurrency anomalies
2. **Row-Level Locking**: Physical guarantee against double-booking
3. **Dual Locking Modes**: Flexibility for different use cases
4. **Payment in Transaction**: Atomicity - either everything succeeds or nothing does
5. **LIST Partitioning**: Better query performance for large datasets
6. **Retry Logic**: Resilience against transient failures
7. **React Query**: Automatic caching and real-time updates

## 📝 License

MIT

## 👨‍💻 Developer Notes

- All SQL queries use **PostgreSQL syntax** (not MySQL)
- Transactions use **per-transaction isolation**, not global
- Payment simulation has **70% success rate** for testing
- Load test uses **Promise.allSettled()** to avoid blocking
- Frontend does **not use Framer Motion** (as requested)

---

Built with ❤️ using PERN Stack + ACID Transactions + Concurrency Control
