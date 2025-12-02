# Migration from Next.js to Vite + Express

This document outlines the changes made to migrate from Next.js API routes to a Vite frontend with Express backend.

## Key Changes

### Architecture
- **Before**: Next.js with API routes (`app/api/`)
- **After**: Vite frontend + Express backend (`server/`)

### Backend Structure
- Express server with TypeScript
- Modular route handlers
- Middleware for auth, validation, rate limiting, error handling
- Production-ready error handling and logging

### Authentication
- Supabase Auth integration
- JWT token verification middleware
- Client-side auth helpers
- API client with automatic token injection

### Payment System
- **Demo mode**: Simulates real payment processing
- No actual charges
- Works exactly like a real payment system
- Creates transaction IDs and verifies payments

## File Changes

### New Files
- `server/index.ts` - Express server entry point
- `server/routes/` - All API route handlers
- `server/middleware/` - Express middleware
- `src/lib/api-client.ts` - Frontend API client
- `lib/supabase-client.ts` - Client-side Supabase helper
- `tsconfig.server.json` - Server TypeScript config

### Updated Files
- `package.json` - Added Express, CORS, dotenv, concurrently
- `vite.config.ts` - Added proxy to backend server
- `env.example` - Updated for Vite environment variables
- All documentation files

### Deprecated Files
- `app/api/` - Old Next.js API routes (can be removed)
- These are no longer used but kept for reference

## Environment Variables

### Client-side (Vite)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

### Server-side
- `NEXT_PUBLIC_SUPABASE_URL` (used by server)
- `SUPABASE_SERVICE_ROLE_KEY`
- `NVIDIA_API_KEY`
- `PORT`

## Running the Application

### Development
```bash
npm run dev  # Runs both frontend and backend
```

### Production
```bash
npm run build
npm start
```

## API Changes

### Endpoints (same functionality)
- All endpoints remain the same
- Authentication now uses Bearer tokens
- Request/response formats unchanged

### Authentication
- All protected endpoints require `Authorization: Bearer <token>` header
- Token obtained from Supabase session

## Migration Checklist

- [x] Create Express backend server
- [x] Convert all API routes to Express
- [x] Set up Supabase authentication
- [x] Create demo payment system
- [x] Add production-ready features
- [x] Update environment variables
- [x] Create API client for frontend
- [x] Update documentation
- [x] Add validation middleware
- [x] Add rate limiting
- [x] Add error handling

## Next Steps

1. Remove old `app/api/` directory if no longer needed
2. Update frontend components to use new API client
3. Test all endpoints
4. Deploy to production

