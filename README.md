# CourtMate UI

A modern, responsive web application for discovering, booking, and managing sports courts. Built with industry-leading technologies including Next.js 16, React 19, NextAuth v5, and Tailwind CSS, the CourtMate UI provides users with a seamless experience for finding nearby courts, managing bookings, and handling their profiles.

## Table of Contents

- [Application Purpose](#application-purpose)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Usage Examples](#usage-examples)

## Application Purpose

CourtMate UI is the frontend layer of the CourtMate platform—a comprehensive court management and booking system. It enables:

- **Players**: Discover and book available sports courts near their location
- **Managers**: Manage court information and availability
- **System Users**: Access a fully authenticated platform with role-based access control

The application is designed for both desktop and mobile devices, providing a responsive user experience across all screen sizes.

## Features

### 🔐 Authentication & Security
- Email/Password login and registration with secure password handling
- Google OAuth integration for quick sign-up and login
- Email verification flow with token-based confirmation
- Protected routes with session-based middleware protection
- JWT-based session management via NextAuth v5
- Secure credential handling with environment variables

### 👤 User Onboarding & Profile Management
- First-time user onboarding modal with guided setup
- Profile setup including full name, phone number, and role selection
- Role selection system (Player/Manager) for personalized experiences
- Profile update capabilities through dashboard

### 🗺️ Nearby Courts Discovery
- Location-based court discovery using browser geolocation API
- Interactive Google Maps integration for visual court browsing
- Adjustable search radius (5-50 km) for flexible discovery
- Dual list and map view for better user experience
- Real-time distance calculations from user location
- Court filtering and sorting capabilities

### 🎾 Court Booking & Reservations
- Direct court booking from map or list view
- Intuitive date and time selection interface
- Real-time availability checking against database
- Reservation management (view, modify, cancel bookings)
- Authentication-required booking flow for accountability
- Booking confirmation and status tracking

### 📱 Modern UI/UX
- Responsive design that works seamlessly on all devices
- Modern gradient design with contemporary aesthetics
- Dark mode support for reduced eye strain
- Tailwind CSS for efficient, maintainable styling
- Smooth animations and transitions
- Loading states and error handling
- Accessible component design (WCAG compliance)

## Technology Stack

### Frontend Technologies
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.0.3 | React framework with SSR/SSG and API routes |
| **UI Library** | React | 19.2.0 | Component-based UI development |
| **Styling** | Tailwind CSS | 4.0.0 | Utility-first CSS framework |
| **Icons** | React Icons | 5.5.0 | SVG icon library |
| **Authentication** | NextAuth | 5.0.0-beta.30 | Flexible authentication solution |
| **Maps** | @vis.gl/react-google-maps | 1.7.1 | Google Maps integration |
| **Language** | TypeScript | 5.x | Type-safe JavaScript |

### Backend Services Integration
- **User Service**: FastAPI microservice (Port 8000) - Handles authentication and user management
- **Booking Service**: FastAPI microservice (Port 8002) - Manages court reservations
- **Court Service**: FastAPI microservice (Port 8001) - Manages court information and geolocation
- **Database**: Supabase - PostgreSQL with real-time capabilities
- **Authentication**: Supabase Auth with JWT tokens

### Development Tools
- **Package Manager**: pnpm (faster, more efficient than npm)
- **Linter**: ESLint with Next.js configuration
- **Build Tool**: Next.js built-in webpack
- **Type Checking**: TypeScript


## Project Structure

```
courtmate-ui/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth API routes
│   │   │   └── register/  # Registration endpoint
│   │   ├── booking/       # Booking API endpoint
│   │   └── facilities/
│   │       └── nearby/    # Nearby courts API endpoint
│   ├── auth/
│   │   └── callback/      # Email verification callback
│   ├── booking/
│   │   └── [courtId]/     # Court booking page
│   ├── dashboard/         # Protected dashboard page
│   ├── login/             # Login page
│   ├── nearby-courts/     # Nearby courts with Google Maps
│   ├── register/          # Registration page
│   ├── verify-email/      # Email verification instructions
│   ├── layout.tsx         # Root layout with AuthProvider
│   └── page.tsx           # Landing page
├── components/
│   ├── onboarding-modal.tsx  # First-time user onboarding
│   └── providers/
│       └── auth-provider.tsx # Session provider wrapper
├── lib/
│   └── auth.ts            # Auth helper functions
├── types/
│   ├── booking.ts         # Booking type definitions
│   └── next-auth.d.ts     # TypeScript definitions
├── auth.ts                # NextAuth v5 configuration
└── middleware.ts          # Route protection middleware
```

## Authentication Flow

### Registration
1. User fills registration form (email, password)
2. Backend creates account in Supabase
3. Verification email sent automatically
4. User redirects to `/verify-email`
5. User clicks email link → `/auth/callback`
6. After verification, user can log in

### Login
1. User enters email/password or clicks Google sign-in
2. Credentials validated with backend at `/auth/login`
3. JWT session created with NextAuth
4. User redirects to `/dashboard`

### Onboarding
1. New users have `first_login: true` in database
2. Dashboard fetches user data from `/user/{id}`
3. Onboarding modal appears if `first_login: true`
4. User completes profile (name, phone, role)
5. Backend updates user with `first_login: false`

## API Endpoints Used

### User Service
- `POST /auth/login` - Email/password authentication
- `POST /auth/signup` - User registration
- `POST /auth/google` - Google OAuth authentication
- `GET /auth/me` - Get current user
- `GET /user/{user_id}` - Get user profile
- `PUT /user/{user_id}` - Update user profile

### Facilities Service
- `POST /api/{version}/facilities/nearby` - Get nearby courts based on location

### Booking Service
- `POST /reservation/` - Create a new court reservation
- `GET /reservation/{reservation_id}` - Get reservation details
- `PUT /reservation/{reservation_id}` - Cancel a reservation

## Protected Routes

The following routes require authentication:
- `/dashboard` - Main dashboard
- `/booking/[courtId]` - Court booking page (redirects to login if not authenticated)

Public routes:
- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/verify-email` - Email verification instructions
- `/auth/callback` - Email verification callback
- `/nearby-courts` - Find courts near your location (requires browser geolocation)

## Configuration

### Supabase Setup
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL: `http://localhost:3000`
3. Add Redirect URL: `http://localhost:3000/auth/callback`

### Google OAuth Setup
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

### Google Maps Setup
1. Go to Google Cloud Console
2. Enable Maps JavaScript API and Places API
3. Create API key (or use existing one)
4. Add API key restrictions:
   - HTTP referrers: `http://localhost:3000/*` (for development)
   - API restrictions: Maps JavaScript API, Places API
5. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local`

## Development Notes

- NextAuth v5 uses JWT strategy with custom callbacks
- Middleware uses NextAuth's `auth` function for session detection
- All client-side API calls use `NEXT_PUBLIC_` prefixed env vars
- TypeScript types extended for custom session fields
