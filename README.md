# Lead Intelligence Dashboard — ClickField AI

> An AI-powered B2B sales intelligence platform for tracking, scoring, and converting inbound and outbound leads.

---

## What is this platform?

ClickField AI's Lead Intelligence Dashboard solves a core pain point for B2B service companies: **not knowing which leads are worth pursuing**. Sales managers often have dozens of leads sitting in spreadsheets, CRMs, or inboxes with no clear signal on who is most likely to convert.

This platform centralises every lead in one place, logs every touchpoint (emails, calls, chats, notes), and uses AI to cut through the noise — automatically scoring each lead, summarising the history, and suggesting the best next action.

---

## How the platform works

### 1. Authentication
A sales manager registers an account and logs in. Sessions are secured with a JWT stored in an httpOnly cookie (meaning JavaScript on the page cannot access it, protecting against XSS). All protected pages and API routes reject unauthenticated requests.

### 2. Adding Leads
Leads are entered manually via the "Add Lead" form. Each lead captures:
- **Contact info** — name, email, phone, company
- **Lead source** — where the lead came from (Website, LinkedIn, Referral, Cold Outreach, Event, etc.)
- **Estimated deal value** — the potential revenue if the deal closes

### 3. Logging Interactions
Every time someone on the team interacts with a lead, it gets logged against that lead's timeline. Interaction types include:
- **Email** — outbound or inbound email threads
- **Call** — phone or video call notes
- **Chat** — live chat or messaging
- **Note** — internal notes, observations, or reminders

This builds a full history of every touchpoint with the prospect.

### 4. AI Lead Scoring
With one click, the manager can ask the AI to **score the lead**. The AI (`llama-3.3-70b-versatile` via Groq's OpenAI-compatible API) reads the lead's source, current pipeline status, estimated deal value, and the entire interaction history, then returns:
- A **score**: 🔥 Hot, 🌤 Warm, or ❄️ Cold
- A **reasoning**: a 1–2 sentence explanation of why
- A **follow-up suggestion**: a specific, actionable next step

This replaces gut-feel qualification with a consistent, data-driven signal.

### 5. AI Interaction Summary
For leads with a long history, the manager can generate an **AI summary** of the full interaction timeline. Instead of reading 20 logs, they get a 2–3 sentence briefing covering key discussion points, identified pain points, and deal stage.

### 6. Pipeline Management
Each lead has a **status** that the manager can update as the deal progresses:

```
New → Contacted → Qualified → Proposal → Won / Lost
```

When a lead is marked **Won**, the system records the conversion date. This feeds directly into analytics.

### 7. Analytics Dashboard
The manager dashboard gives a real-time overview of the sales pipeline:
- **Total Leads** — all leads in the system
- **Deals Won** — how many converted
- **Conversion Rate** — percentage of leads that became customers
- **Total Revenue** — sum of estimated value from won deals
- **Revenue by Lead Source** — bar chart showing which channels produce the most value (e.g. Referral vs LinkedIn vs Cold Outreach)
- **Lead Score Distribution** — pie chart of Hot / Warm / Cold across the pipeline
- **Recent Leads** — quick view of the latest 5 entries

---

## How the tech stack works

### Request lifecycle

```
Browser
  │
  ├─► Next.js Middleware (Edge Runtime)
  │     Reads JWT from cookie, redirects unauthenticated users to /login
  │
  ├─► Next.js App Router (React Server + Client Components)
  │     Page components fetch data from API routes on the server or client
  │
  └─► Next.js API Routes (Node.js Runtime)
        Validates JWT, runs business logic, queries the database
              │
        ├─► Supabase JS ──► Supabase Postgres
              └─► Groq OpenAI-compatible API (`llama-3.3-70b-versatile`) — only on /score and /summary routes
```

---

### Frontend — Next.js App Router + React + Tailwind CSS

The UI is built with the **Next.js 16 App Router**. Route groups are used to share layouts cleanly:

```
app/
  (auth)/          ← login, register pages — no sidebar
  (dashboard)/     ← all protected pages — shared sidebar + header layout
    dashboard/     → /dashboard
    leads/         → /leads
    leads/[id]/    → /leads/:id
```

- **Client components** (`'use client'`) handle interactivity: forms, modals, filter controls, AI button clicks, and live data fetching via `fetch`.
- **Tailwind CSS v4** handles all styling with utility classes. No CSS files are written manually beyond the global reset.
- **Recharts** renders the bar chart (revenue by source) and pie chart (score distribution) on the dashboard, both fully responsive.

### Authentication — JWT + httpOnly Cookies

User credentials are handled by **Supabase Auth** (email/password). The app uses Supabase Auth APIs for registration and login, then issues an app session JWT in an httpOnly cookie for middleware-protected routing.

On login, the server signs a **JWT** using the `jose` library and writes it into an **httpOnly, Secure, SameSite=Lax cookie**. This means:
- JavaScript cannot read the token (XSS-safe)
- The cookie is sent automatically on every request to the same origin
- CSRF is mitigated by SameSite=Lax

The JWT verification is split into two files:
- `auth-edge.ts` — uses only `jose` (Web Crypto API), safe for the **Edge Runtime** (middleware)
- `auth.ts` — server auth utilities used by API routes

### Middleware — Edge Runtime Protection

`middleware.ts` runs on **Cloudflare's V8 edge runtime** (not Node.js) before any request is processed. It:
1. Reads the JWT cookie
2. Verifies it using the edge-safe `auth-edge.ts`
3. Redirects unauthenticated users away from `/dashboard` and `/leads` to `/login`
4. Redirects already-authenticated users away from `/login` and `/register` to `/dashboard`

Because it runs at the edge, it adds near-zero latency to this auth check — no cold-start, no database query.

### Backend — REST API Routes

Each API route is a standard **Next.js Route Handler** (`route.ts`). All routes:
- Verify the JWT from the cookie before doing anything
- Validate request bodies with **Zod** schemas, returning structured 400 errors on bad input
- Use **Supabase JS** to query Supabase Postgres

Key design decisions:
- `PATCH /api/leads/:id` automatically sets `convertedAt` when status is changed to `WON`, and clears it on `LOST`
- `/api/leads` supports server-side pagination (`page`, `limit`) and filtering (`search`, `source`, `status`, `score`) — the database does the filtering, not the browser
- `/api/analytics` runs all aggregation queries in parallel with `Promise.all` to minimise response time

### Database — Supabase Postgres

The schema has three models:

```
User ─┐
      └──< Lead >──< Interaction
```

- **User** — manager profile table used by app relations (mirrored from Supabase Auth user identity).
- **Lead** — the core entity. Stores all contact info, pipeline state, AI-generated fields (`aiSummary`, `aiFollowUp`, `score`), and `estimatedValue` for revenue tracking.
- **Interaction** — append-only log of touchpoints. Each belongs to a Lead and has a type (EMAIL, CALL, CHAT, NOTE) and freetext content.

Supabase Postgres is the primary database. API routes query tables through `@supabase/supabase-js` using a server-side Supabase client.

### AI Integration — OpenAI SDK + Groq (Llama 3.3)

AI is invoked only on two explicit user actions (not automatically), keeping costs controlled:

**Lead Scoring** (`POST /api/leads/:id/score`):
- Fetches the full lead + all interactions from the database
- Assembles a structured prompt with all context
- Calls `llama-3.3-70b-versatile` with `response_format: { type: 'json_object' }` to guarantee parseable output
- Writes `score` and `aiFollowUp` back to the lead row

**Interaction Summary** (`POST /api/leads/:id/summary`):
- Formats all interactions as a chronological transcript
- Asks `llama-3.3-70b-versatile` to summarise in 2–3 sentences
- Writes the result to `aiSummary` on the lead row

Results are persisted in the database so the AI doesn't need to be called again unless the manager explicitly requests a refresh.

### Deployment — Vercel

The project deploys to **Vercel** with zero configuration:
- Vercel auto-detects Next.js and sets up the build pipeline
- API routes deploy as **serverless functions** (Node.js runtime)
- Middleware deploys to **Vercel Edge Network** (V8 runtime, globally distributed)
- Environment variables (`DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are set in the Vercel dashboard

---

## Issues Faced During Development (And How They Were Handled)

1. **Runtime mismatch between Edge middleware and Node API routes**
  **Product risk:** Login checks could fail in production if token verification relied on Node-only APIs at the edge.
  **What we changed:** Split JWT utilities into edge-safe and server-safe modules (`auth-edge.ts` and `auth.ts`).
  **Outcome:** Auth checks now run consistently in both environments with lower deployment risk.

2. **Identity sync across Supabase Auth and application user records**
  **Product risk:** Broken ownership/assignment data if an auth user existed without a matching app-level `User` row.
  **What we changed:** Added explicit upsert synchronization during register and login.
  **Outcome:** Auth identity and application relations stay aligned, reducing data integrity issues.

3. **Inconsistent AI output shape for scoring workflows**
  **Product risk:** Sales users could receive malformed responses, causing UI/API failures or unclear follow-up guidance.
  **What we changed:** Enforced JSON-formatted responses and added defensive parsing in the scoring pipeline.
  **Outcome:** AI outputs are more predictable, making the scoring feature production-usable.

4. **Analytics approach that is simple now but expensive later**
  **Product risk:** As lead volume increases, response time and API compute costs can rise.
  **What we changed:** Kept a fast-to-ship implementation while documenting the migration path to SQL-side aggregation.
  **Outcome:** The dashboard works reliably today and has a clear scalability plan.

5. **Documentation drift while iterating quickly on AI provider/model choices**
  **Product risk:** New contributors can misconfigure environment variables or expect incorrect model behavior.
  **What we changed:** Updated README stack and environment docs to match the current Groq-backed implementation.
  **Outcome:** Faster onboarding and fewer setup errors.

---

## Future Improvements

1. **Move analytics aggregation into SQL views/materialized views**
  Business impact: Lower response times on high lead volume and reduced serverless compute cost.

2. **Run AI tasks asynchronously (queue + worker)**
  Business impact: Better perceived performance because users are not blocked by model latency.

3. **Harden AI reliability (retries, timeouts, fallbacks, schema validation)**
  Business impact: Fewer failed AI actions and more consistent guidance quality for sales teams.

4. **Add route-level rate limits and abuse controls**
  Business impact: Better cost control and stronger protection on auth and AI endpoints.

5. **Expand automated testing (unit, integration, end-to-end)**
  Business impact: Faster, safer releases with lower regression risk.

6. **Improve observability (structured logs, tracing, alerting)**
  Business impact: Faster incident detection and shorter recovery time in production.

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd lead-intelligence-dashboard
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="a-random-secret-at-least-32-characters-long"
GROQ_API_KEY="your-groq-api-key"

# Required for Supabase integration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="your-supabase-publishable-key"

# Required for server-side API routes
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

- **DATABASE_URL** — any PostgreSQL-compatible connection string (Supabase, Neon, Prisma Postgres, Railway, etc.)
- **JWT_SECRET** — used to sign and verify session tokens; generate with `openssl rand -base64 32`
- **GROQ_API_KEY** — API key for Groq's OpenAI-compatible endpoint (used by AI scoring and summary routes)
- **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY** — required for Supabase client integration
- **SUPABASE_SERVICE_ROLE_KEY** — required for server-side Supabase operations in this project

### 3. Set up the database

```bash
npx prisma db push
```

This syncs the Prisma schema to your Supabase Postgres database, creating all tables and enums.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register a manager account to get started.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new manager account |
| `POST` | `/api/auth/login` | Log in, sets JWT cookie |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `DELETE` | `/api/auth/me` | Log out (clears cookie) |
| `GET` | `/api/leads` | List leads — supports `search`, `source`, `status`, `score`, `page`, `limit` |
| `POST` | `/api/leads` | Create a new lead |
| `GET` | `/api/leads/:id` | Get full lead detail + interaction history |
| `PATCH` | `/api/leads/:id` | Update lead fields |
| `DELETE` | `/api/leads/:id` | Delete lead and all interactions |
| `POST` | `/api/leads/:id/score` | Trigger AI scoring — saves score + follow-up suggestion |
| `POST` | `/api/leads/:id/summary` | Trigger AI summary — saves interaction history summary |
| `POST` | `/api/leads/:id/interactions` | Add an interaction log to a lead |
| `GET` | `/api/analytics` | Dashboard aggregates (overview, revenue by source, score/status breakdown) |

---

## Database Schema

```
User
  id, email, name, password, role (ADMIN | MANAGER)

Lead
  id, name, email, phone, company
  source   (WEBSITE | EMAIL | REFERRAL | LINKEDIN | COLD_OUTREACH | EVENT | OTHER)
  status   (NEW | CONTACTED | QUALIFIED | PROPOSAL | WON | LOST)
  score    (HOT | WARM | COLD)
  estimatedValue, convertedAt
  aiSummary, aiFollowUp        ← persisted AI outputs
  assignedToId → User

Interaction
  id, leadId → Lead
  type     (EMAIL | CALL | CHAT | NOTE)
  content, createdAt
```

---

## Deployment on Vercel

1. Push the repository to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add the required environment variables in **Project Settings → Environment Variables**:
  - DATABASE_URL
  - JWT_SECRET
  - GROQ_API_KEY
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  - SUPABASE_SERVICE_ROLE_KEY
4. Click **Deploy**

Vercel automatically handles the Next.js build, deploying API routes as serverless functions and middleware to the global edge network.
