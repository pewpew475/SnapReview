# SnapReview Setup Guide

This guide will help you set up the complete SnapReview application with Vite frontend and Express backend.

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- NVIDIA API key (provided in specification)
- Razorpay account (for payments)

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- `express` - Backend server framework
- `openai` - For NVIDIA API integration
- `@supabase/supabase-js` - For Supabase client
- `cors` - CORS middleware
- `dotenv` - Environment variable management

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Update `.env.local` with your actual credentials:

   **NVIDIA API** (already provided):
   ```env
   NVIDIA_API_KEY=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
   NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
   NVIDIA_MODEL=moonshotai/kimi-k2-instruct-0905
   ```

   **Supabase** (get from your Supabase project):
   ```env
   # Client-side (Vite uses VITE_ prefix)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   
   # Server-side
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   **App Configuration**:
   ```env
   VITE_API_URL=http://localhost:3001
   PORT=3001
   NODE_ENV=development
   REPORT_UNLOCK_PRICE=99.00
   ```

## Step 3: Set Up Database

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `database/schema.sql`
4. Copy and paste the entire SQL into the editor
5. Click **Run** to execute

This will create:
- All required tables (profiles, tasks, evaluations, payments)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic profile creation

See `database/README.md` for detailed database setup instructions.

## Step 4: Start the Application

### Development Mode

Run both frontend and backend:
```bash
npm run dev
```

This starts:
- Frontend (Vite): http://localhost:8080
- Backend (Express): http://localhost:3001

Or run separately:
```bash
# Frontend only
npm run dev:client

# Backend only  
npm run dev:server
```

## Step 5: Test NVIDIA AI Integration

Test the AI integration with the provided test script:

```bash
npx tsx scripts/test-nvidia-ai.ts
```

This will:
1. Send a test code sample to the NVIDIA API
2. Receive and parse the evaluation response
3. Display the results in the console

## Step 6: API Endpoints

The following API endpoints are available:

### Authentication Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/user` - Get current user

### Evaluation Endpoints

- `POST /api/evaluate` - Complete evaluation (returns full result)
- `POST /api/evaluate/stream` - Streaming evaluation (Server-Sent Events)
- `GET /api/evaluations/:id/preview` - Get evaluation preview (free tier)
- `GET /api/evaluations/:id/full` - Get full evaluation (requires unlock)

### Payment Endpoints (Demo)

- `POST /api/payment/create-order` - Create demo payment order
- `POST /api/payment/verify` - Verify demo payment
- `POST /api/payment/webhook` - Payment webhook handler

## Step 7: Payment System (Demo)

The payment system is a **demo** that simulates real payment processing:
- No actual charges are made
- Works exactly like a real payment system
- Creates transaction IDs and verifies payments
- Unlocks evaluations after "payment"

## Testing Checklist

✅ NVIDIA API connection works with provided credentials
✅ Streaming responses working correctly
✅ Database schema created with all RLS policies
✅ User can submit code task
✅ AI evaluation completes successfully
✅ Preview shows limited data (score, summary, 3 strengths)
✅ Improvements are hidden until unlocked
✅ Payment integration working
✅ Report unlocks after successful payment
✅ Full evaluation data accessible after unlock
✅ Error handling for API failures

## Project Structure

```
├── server/                       # Express backend
│   ├── index.ts                 # Server entry point
│   ├── routes/                  # API route handlers
│   │   ├── auth.ts              # Authentication routes
│   │   ├── evaluate.ts          # Evaluation routes
│   │   ├── evaluations.ts       # Evaluation data routes
│   │   └── payment.ts           # Payment routes (demo)
│   └── middleware/              # Express middleware
│       ├── auth.ts               # Authentication middleware
│       ├── errorHandler.ts       # Error handling
│       ├── rateLimiter.ts        # Rate limiting
│       └── validator.ts         # Request validation
├── src/                          # React frontend (Vite)
│   ├── lib/
│   │   └── api-client.ts        # API client utility
│   └── ...
├── lib/                          # Shared libraries
│   ├── ai/                      # AI integration
│   │   ├── nvidia-client.ts     # NVIDIA API client
│   │   ├── prompts.ts           # AI prompt templates
│   │   └── evaluator.ts         # Evaluation logic
│   └── supabase-client.ts       # Client-side Supabase
├── database/
│   ├── schema.sql               # Database schema
│   └── README.md                # Database setup guide
└── scripts/
    └── test-nvidia-ai.ts        # Test script for AI integration
```

## Troubleshooting

### NVIDIA API Errors
- Verify `NVIDIA_API_KEY` is set correctly
- Check that the API key has access to the `moonshotai/kimi-k2-instruct-0905` model
- Ensure `NVIDIA_BASE_URL` is correct

### Database Errors
- Verify Supabase credentials are correct
- Check that RLS policies are set up correctly
- Ensure all tables were created successfully

### Payment Webhook Errors
- Verify webhook signature validation
- Check that `RAZORPAY_KEY_SECRET` matches your Razorpay account
- Ensure webhook URL is publicly accessible

## Next Steps

1. Set up authentication in your frontend
2. Implement task submission UI
3. Create payment flow UI
4. Add error handling and loading states
5. Deploy to production

## Support

For issues or questions:
- Check the database README: `database/README.md`
- Review API endpoint implementations in `app/api/`
- Test AI integration with `scripts/test-nvidia-ai.ts`

