# FineTaste Restaurant — Backend API

REST API for **FineTaste Restaurant**. Handles authentication, table management, orders, dishes, reviews, staff attendance, contact forms, and email notifications.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Nodemailer | Email (OTP & order confirmations) |
| node-cron | Scheduled jobs (attendance) |

---

## Prerequisites

- **Node.js** v18 or higher — [https://nodejs.org](https://nodejs.org)
- **MongoDB** — local install or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster
- **Gmail account** (or SMTP provider) for sending emails
- **Stripe account** (optional — only if payment features are enabled)

---

## Installation

```bash
# 1. Go to the backend folder
cd Res-Backend/backend

# 2. Install dependencies
npm install
```

---

## Environment Variables

Create a `.env` file inside `Res-Backend/backend/`:

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/finetaste

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Email (Gmail example — use App Password, not regular password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (used in Stripe redirect & emails)
FRONTEND_URL=http://localhost:4004

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `5000`) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret key for JWT token signing |
| `EMAIL_USER` | **Yes** | Sender email address |
| `EMAIL_PASS` | **Yes** | Email app password / SMTP password |
| `FRONTEND_URL` | No | Frontend base URL (default: `http://localhost:4004`) |
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key for payments |

### Gmail Setup (for OTP & order emails)

1. Enable 2-Step Verification on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate an app password for "Mail"
4. Use that 16-character password as `EMAIL_PASS`

---

## Running the Server

### Development (with auto-restart)

```bash
npm run dev
```

### Production

```bash
npm start
```

Server runs at: **http://localhost:5000**

Health check: open **http://localhost:5000** — you should see `Restaurant API is running...`

---

## CORS Configuration

The API currently allows requests from:

```
http://localhost:4004
```

This is set in `server.js`. If the frontend runs on a different URL (e.g. production domain), update the `cors` origin accordingly.

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register new user (sends OTP email) |
| POST | `/login` | No | Login with email & password |
| POST | `/verify-otp` | No | Verify email with OTP code |
| POST | `/resend-otp` | No | Resend OTP to email |

### Dishes — `/api/dishes`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Get all menu dishes |
| GET | `/:id` | Yes | Get single dish |
| POST | `/` | Yes | Create dish (admin) |
| PUT | `/:id` | Yes | Update dish |
| DELETE | `/:id` | Yes | Delete dish |

### Tables — `/api/tables`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Get all tables |
| GET | `/:id` | Yes | Get table by ID |
| GET | `/user/:userId` | Yes | Get tables for a user |
| POST | `/` | Yes | Create table |
| POST | `/reserve` | Yes | Reserve a table |
| PUT | `/:id` | Yes | Update table |
| DELETE | `/:id` | Yes | Delete table |
| DELETE | `/cancel/:id` | Yes | Cancel reservation |

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Get all orders |
| POST | `/` | Yes | Create a new order |
| GET | `/by-id/:id` | Yes | Get order by ID |
| GET | `/user/:userId` | Yes | Get orders by user |
| GET | `/incomplete` | Yes | Get pending orders |
| PUT | `/complete/:id` | Yes | Mark order as completed |
| PUT | `/:id` | Yes | Update order |
| DELETE | `/:id` | Yes | Delete order |

**Order rules:**
- One order per user per day
- No duplicate pending order for same table + date/time
- Confirmation email sent on successful order

### Reviews — `/api/reviews`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Get all reviews |
| POST | `/:orderId` | Yes | Add review for an order |
| GET | `/my` | Yes | Get current user's reviews |
| DELETE | `/:reviewId` | Yes | Delete a review |

### Contact — `/api/contact`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | No | Submit contact form (supports file upload) |
| GET | `/` | No | Get all contact submissions |
| DELETE | `/:id` | No | Delete a contact entry |

### Attendance — `/api/attendance`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/mark` | No | Mark attendance |
| GET | `/` | No | Get all attendance records |
| GET | `/:userId` | Yes | Get attendance for a user |
| POST | `/apply-leave` | No | Apply for leave |
| GET | `/pending-leaves` | No | Get pending leave requests |
| PUT | `/decision/:attendanceId` | Yes | Approve/reject leave |
| DELETE | `/delete/:attendanceId` | Yes (admin) | Delete attendance record |

### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | Get all users |
| PATCH | `/users/:id` | Admin | Update user |
| DELETE | `/users/:id` | Admin | Delete user |

### Payments — `/api/payments` (optional)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/create-checkout-session` | Yes | Create Stripe checkout session |
| GET | `/verify-session/:sessionId` | Yes | Verify payment status |

> Payment at order time is currently **disabled** on the frontend. These endpoints remain available for future use.

---

## Authentication

Protected routes require a JWT token in the request header:

```
Authorization: Bearer <token>
```

The token is returned on successful login or OTP verification and is valid for **30 days**.

---

## User Roles

| Role | Description |
|---|---|
| `customer` | Regular restaurant guest |
| `admin` | Full admin access (`isAdmin: true` required) |
| `waiter` | Waiter panel access only |

---

## Email Notifications

The backend sends emails automatically for:

| Event | Recipient |
|---|---|
| User registration | OTP verification code |
| Order placed | Order confirmation with details (table, dishes, total) |

Email is sent via Nodemailer using the credentials in `.env`.

---

## Scheduled Jobs

A cron job runs automatically for **attendance tracking** (`cron/attendanceCron.js`). No manual setup is needed once the server is running.

---

## Project Structure

```
Res-Backend/backend/
├── Controllers/       # Business logic for each feature
├── Middleware/        # Auth, admin check, file upload
├── models/            # Mongoose schemas (User, Order, Table, Dish, etc.)
├── routes/            # Express route definitions
├── utils/             # Email helpers, OTP generator
├── cron/              # Scheduled background jobs
├── server.js          # App entry point
├── .env               # Environment variables (not committed to git)
└── package.json
```

---

## Database Models

| Model | Key Fields |
|---|---|
| **User** | name, email, password, role, isAdmin, isVerified, otp |
| **Order** | userId, tableId, dishes[], totalPrice, status, orderDate |
| **Table** | number, capacity, price, status, category, hours |
| **Dish** | name, price, category, image |
| **Review** | userId, orderId, rating, comment |
| **Contact** | name, email, message, file |
| **Attendance** | userId, date, status, leave requests |

---

## Running Frontend + Backend Together

**Terminal 1 — Backend:**
```bash
cd Res-Backend/backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:4004 |
| Backend API | http://localhost:5000/api |
| MongoDB | mongodb://127.0.0.1:27017 |

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `MongoDB error` on start | Check `MONGO_URI` in `.env`; ensure MongoDB is running |
| OTP email not received | Verify `EMAIL_USER` and `EMAIL_PASS`; check spam folder |
| `401 Unauthorized` | Token expired or missing — log in again |
| CORS blocked | Update `cors.origin` in `server.js` to match frontend URL |
| Port already in use | Change `PORT` in `.env` or stop the process using port 5000 |
| Stripe errors | `STRIPE_SECRET_KEY` is optional; only needed for payment features |

---

## Production Deployment Notes

When deploying to production:

1. Set strong values for `JWT_SECRET` and database credentials
2. Update `FRONTEND_URL` to your live domain
3. Update CORS origin in `server.js` to your production frontend URL
4. Update `Frontend/src/utils/api.js` baseURL to your production API URL
5. Use MongoDB Atlas or a managed MongoDB instance
6. Use environment variables on your hosting platform (never commit `.env`)

---

## Support

For frontend setup and page details, refer to:

**`Frontend/README.md`**
