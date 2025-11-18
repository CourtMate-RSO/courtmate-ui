# CourtMate UI

Modern web application for booking and managing sports courts built with Next.js 16 and NextAuth v5.

## Features

- 🔐 **Authentication**
  - Email/Password login and registration
  - Google OAuth integration
  - Email verification flow
  - Protected routes with middleware

- 👤 **User Onboarding**
  - First-time user onboarding modal
  - Profile setup (full name, phone, role)
  - Role selection (Player/Manager)

- 🗺️ **Nearby Courts**
  - Find courts near your location using geolocation
  - Interactive Google Maps integration
  - Adjustable search radius (5-50 km)
  - List and map view of nearby facilities
  - Real-time distance calculations

- 📱 **Responsive UI**
  - Modern gradient design
  - Dark mode support
  - Tailwind CSS styling
  - Mobile-friendly interface

## Tech Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **Authentication**: NextAuth v5 (beta.30)
- **UI**: React 19.2.0, Tailwind CSS 4
- **Icons**: React Icons 5.5.0
- **Backend**: FastAPI User Service
- **Database/Auth**: Supabase

## Prerequisites

- Node.js 18+ and pnpm
- Running User Service backend on port 8000
- Supabase project with authentication enabled

## Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

## Environment Variables

Create a `.env.local` file with the following:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-secret-key-here-please-change-this-to-random-string
AUTH_TRUST_HOST=true

# Google OAuth (Optional)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# User Service API
USER_SERVICE_URL=http://127.0.0.1:8000/
NEXT_PUBLIC_USER_SERVICE_URL=http://127.0.0.1:8000/

# Facilities Service API
FACILITIES_SERVICE_URL=http://127.0.0.1:8001/
NEXT_PUBLIC_FACILITIES_SERVICE_URL=http://127.0.0.1:8001/

# API Version
API_VERSION=v1

# Google Maps API Key (Required for nearby courts feature)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
courtmate-ui/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth API routes
│   │   │   └── register/  # Registration endpoint
│   │   └── facilities/
│   │       └── nearby/    # Nearby courts API endpoint
│   ├── auth/
│   │   └── callback/      # Email verification callback
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

## Protected Routes

The following routes require authentication:
- `/dashboard` - Main dashboard

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

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Run `pnpm install` to ensure dependencies are up to date

### Authentication Issues
- Verify backend is running on correct port
- Check `USER_SERVICE_URL` matches backend address
- Ensure Supabase redirect URLs are configured

### Google OAuth Not Working
- Verify OAuth credentials in Google Console
- Check redirect URIs match exactly
- Ensure `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set

## License

MIT
