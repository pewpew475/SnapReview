## SnapReview – AI‑Powered Code Review Platform

SnapReview is an end‑to‑end code review application that uses NVIDIA’s Kimi K2 Instruct model to generate **deep, structured reviews**, with Supabase‑backed auth, real‑time progress, and an unlockable full report flow.

Built with **Vite + React (frontend)**, **Express (backend)**, and **Supabase (auth + DB)**.

---

## 1. Features

- **AI‑Powered Code Review**
  - Sends your full code (not token‑by‑token) to NVIDIA Kimi K2 Instruct.
  - Returns a rich JSON report: scores, strengths, improvements, refactored code, best practices, and resources.
- **Real‑Time Evaluation Progress**
  - Server‑Sent Events (SSE) progress UI (`EvaluationProgress` page) with status + elapsed time.
- **Supabase Authentication & RLS**
  - Email/password auth, JWT‑based API protection, and row‑level security on all tables.
- **Task & Evaluation Dashboard**
  - Submit code (paste or file upload), view evaluations, open detailed reports.
- **Unlockable Full Report (Demo Payment)**
  - “Unlock Full Report” button + dialog with realistic payment flow.
  - Backend records demo payments and unlocks the evaluation (no real charges).
- **Production‑oriented Backend**
  - Central error handler, rate limiting, request validation, and CORS configuration.
- **Export & Sharing**
  - Copy individual code snippets.
  - Download a **PDF report** of the full evaluation.
  - Share link support via Web Share API with clipboard fallback.

---

## 2. Tech Stack

- **Frontend**
  - React 18, TypeScript, Vite
  - shadcn/ui + TailwindCSS
  - React Router v6
  - `sonner` for toasts
- **Backend**
  - Node.js + Express
  - Supabase JS client (service role)
  - NVIDIA AI (OpenAI‑compatible client)
- **Database**
  - PostgreSQL via Supabase
  - RLS policies for multi‑tenant isolation

---

## 3. Project Structure

```text
.
├── server/                 # Express backend
│   ├── index.ts            # Server entry point
│   ├── routes/
│   │   ├── auth.ts         # Auth routes (signup/signin/signout)
│   │   ├── tasks.ts        # Task create/list
│   │   ├── evaluate.ts     # SSE evaluation endpoint
│   │   ├── evaluations.ts  # Evaluation data (preview + full)
│   │   └── payment.ts      # Demo payment + unlock
│   └── middleware/
│       ├── auth.ts         # JWT auth via Supabase
│       ├── errorHandler.ts # Centralized error handling
│       ├── rateLimiter.ts  # Basic rate limiting
│       └── validator.ts    # Request validation
├── lib/
│   └── ai/
│       ├── nvidia-client.ts # NVIDIA client + config
│       ├── prompts.ts       # System + user prompts
│       └── evaluator.ts     # Streaming + non‑streaming evaluation
├── src/                    # React frontend
│   ├── pages/              # Auth, Dashboard, Submit, Evaluation, etc.
│   ├── components/         # UI components + PaymentDialog
│   └── lib/
│       ├── api-client.ts   # Frontend API client (uses VITE_API_URL)
│       └── supabase-client.ts
├── database/
│   ├── schema.sql          # Supabase schema
│   └── README.md           # DB setup guide
├── env.example             # All required env vars
├── vite.config.ts          # Vite + dev proxy to backend
├── vercel.json             # Vercel (frontend) deployment config
└── README.md               # This file
```

---

## 4. Getting Started (Local Development)

### 4.1 Prerequisites

- **Node.js 18+**
- **Supabase project**
- **NVIDIA API key** (Kimi K2 Instruct model, OpenAI‑compatible)

### 4.2 Install dependencies

```bash
npm install
```

### 4.3 Configure environment variables

1. Copy the example file:

```bash
cp env.example .env.local
```

2. Edit `.env.local` and set at minimum:

- **Frontend**
  - `VITE_SUPABASE_URL` – Supabase URL
  - `VITE_SUPABASE_ANON_KEY` – Supabase anon key
  - `VITE_API_URL` – Backend base URL (for local: `http://localhost:3001`)
  - `VITE_APP_URL` – Frontend URL (for local: `http://localhost:8080`)
- **Backend**
  - `SUPABASE_URL` – Same as `VITE_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key (server‑only)
  - `NVIDIA_API_KEY` – Your NVIDIA API key
  - `NVIDIA_MODEL` – `moonshotai/kimi-k2-instruct-0905` (default)
  - `PORT` – Backend port (default: `3001`)

See `env.example` for the full list.

### 4.4 Set up the database

1. Open your Supabase project.
2. Go to **SQL Editor** → **New Query**.
3. Paste the contents of `database/schema.sql`.
4. Run the query.
5. Verify tables and RLS policies (see `database/README.md`).

### 4.5 Run in development

```bash
npm run dev
```

This starts:

- **Frontend (Vite)**: `http://localhost:8080`
- **Backend (Express)**: `http://localhost:3001`

Vite is configured to **proxy `/api` to the backend** in development.

You can also run them separately:

```bash
# Frontend only
npm run dev:client

# Backend only
npm run dev:server
```

---

## 5. Production Build & Self‑Hosted Deployment

### 5.1 Build

```bash
# Build frontend (Vite) and backend (TypeScript → JS)
npm run build

# Start production backend (serves only APIs; frontend is static)
npm start
```

This expects:

- Static frontend in `dist/` (served by your static host or CDN).
- Compiled backend in `dist/server/` (run with Node).

### 5.2 Recommended production layout

- **Frontend**: Host `dist/` on Vercel / Netlify / S3 + CloudFront / etc.
- **Backend**: Deploy `dist/server/index.js` on:
  - Railway, Render, Fly.io, or any Node host
  - Expose it over HTTPS (e.g. `https://api.yourdomain.com`)
- **Frontend → Backend**
  - Set `VITE_API_URL` in your frontend environment to the public backend URL.

---

## 6. Vercel Configuration (Frontend)

You can deploy the **React/Vite frontend** to Vercel using the included `vercel.json`.

### 6.1 `vercel.json`

```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build:client",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "https://your-backend-url.com"
  }
}
```

### 6.2 Steps

1. **Backend**
   - Deploy the Express server (`server/index.ts` → `dist/server/index.js`) to a Node host.
   - Set all backend env vars there (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`, etc.).

2. **Frontend (Vercel)**
   - Push this repo to GitHub.
   - Import the repo into Vercel.
   - Ensure `vercel.json` is present at the repo root.
   - In Vercel Project Settings → **Environment Variables**, set:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_API_URL` → your backend URL
   - Deploy.

The frontend will talk to your backend via `VITE_API_URL` in production; no proxy is used there.

---

## 7. API Overview

### 7.1 Auth

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `GET /api/auth/user`

### 7.2 Tasks & Evaluations

- `POST /api/tasks` – Create a new task (code submission)
- `GET /api/tasks` – List user tasks
- `POST /api/evaluate/stream` – Start evaluation (SSE progress)
- `GET /api/evaluations` – List evaluations
- `GET /api/evaluations/:id/preview` – Get locked preview
- `GET /api/evaluations/:id/full` – Get full unlocked report

### 7.3 Payment (Demo)

- `POST /api/payment/create-order` – Create a demo order
- `POST /api/payment/verify` – Verify demo payment & unlock report
- `POST /api/payment/webhook` – Webhook endpoint (for future real gateway)

> **Note:** Payment is intentionally a **demo**. It behaves like a real payment flow but does **not** charge real money. Replace this with a real gateway (Razorpay/Stripe/etc.) for production monetization.

---

## 8. Production Readiness Checklist

Use this before going live:

- **Environment & Secrets**
  - [ ] `NODE_ENV=production` on backend.
  - [ ] All Supabase keys set correctly and **service role key never exposed to the browser**.
  - [ ] `NVIDIA_API_KEY` configured and tested.
  - [ ] `VITE_API_URL` points to the public backend URL.
  - [ ] `VITE_APP_URL`/CORS origins match your production domains.
- **Database & Security**
  - [ ] Supabase RLS policies enabled for `profiles`, `tasks`, `evaluations`, `payments`.
  - [ ] Only service role key used on the server.
  - [ ] HTTPS enforced on frontend + backend.
- **AI & Limits**
  - [ ] NVIDIA quota & rate limits monitored.
  - [ ] Error messages for AI failures are user‑friendly but don’t leak secrets.
- **UI & Flows**
  - [ ] Evaluation progress and error states tested.
  - [ ] Unlock flow (payment demo) tested end‑to‑end.
  - [ ] PDF download verified with real evaluation data.

---

## 9. Troubleshooting

- **Backend fails to start**
  - Check `.env.local` or production env for missing vars.
  - Confirm Supabase URL + service role key are correct.
  - Make sure port `3001` isn’t in use.

- **Auth issues**
  - Confirm Supabase project credentials.
  - Verify RLS policies match `database/schema.sql`.
  - Ensure email confirmations are handled as per `SUPABASE_SETUP.md`.

- **AI evaluation errors**
  - Check server logs for messages like “NVIDIA API authentication failed”.
  - Verify `NVIDIA_API_KEY` matches the one you used to test locally (e.g. via `app.py` or `scripts/test-nvidia-ai.ts`).

---

## 10. Contributing

1. Fork this repository.
2. Create a feature branch.
3. Make your changes with tests where applicable.
4. Open a pull request with a clear description.

---

## 11. License

MIT License.
