# Quick Start Guide

Get up and running with SnapReview in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- NVIDIA API key (provided in env.example)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

```bash
cp env.example .env.local
```

Edit `.env.local` and add:
- Your Supabase URL and keys
- NVIDIA API key (already provided)
- Other configuration as needed

## Step 3: Set Up Database

1. Go to your Supabase project dashboard
2. Open SQL Editor
3. Copy contents of `database/schema.sql`
4. Paste and run

## Step 4: Start Development Servers

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:3001

## Step 5: Test It Out

1. Open http://localhost:8080
2. Sign up for an account
3. Submit a code task
4. View the AI evaluation

## That's It! 🎉

Your SnapReview app is now running locally.

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [SETUP.md](SETUP.md) for detailed setup
- See [src/lib/README.md](src/lib/README.md) for API client usage

## Troubleshooting

**Backend won't start?**
- Check `.env.local` has all required variables
- Verify Supabase credentials
- Check port 3001 is available

**Database errors?**
- Make sure you ran `database/schema.sql`
- Verify RLS policies are enabled
- Check Supabase connection

**Frontend can't connect?**
- Verify backend is running on port 3001
- Check `VITE_API_URL` in `.env.local`
- Check browser console for errors

