# Northstar University Management System — Frontend

> **Production:** https://university-management-system-fronte-five.vercel.app  
> **Backend API:** https://university-management-system-peach.vercel.app  
> **API Docs:** https://university-management-system-peach.vercel.app/api-docs  
> **GitHub:** https://github.com/Roisul-Shohan/University-Management-System-frontend

---

## Overview

A modern, responsive admin dashboard for university management built with **Next.js 16 (App Router)**, **React 19**, **TypeScript 5**, and **TanStack Query v5**. Features role-based UI, real-time data fetching, and a polished dark-theme interface.

Designed for **Super Admins**, **Teachers**, and **Students** with tailored dashboards and navigation.

---

## Key Features

### Authentication
- JWT-based login with httpOnly cookie + localStorage token
- Demo one-click login for all three roles
- Protected routes via Next.js 16 middleware (`proxy.ts`)
- Auto-redirect to login on session expiry

### Role-Based Dashboards
| Role | Dashboard Highlights |
|------|---------------------|
| **Super Admin** | University stats, admissions, teachers, programs, fees, departments |
| **Teacher** | My courses, students, exams, pending grades, schedule |
| **Student** | Enrolled courses, credits, upcoming exams, payments, attendance |

### Core Modules (Route Groups under `(dashboard)`)
- **Admissions** — Application review, status transitions
- **Courses** — Catalog, offerings, curriculum mapping
- **Exams** — Management, questions, attempts, grading
- **Attendance** — Session tracking, reports
- **Payments** — Fee collection, bKash integration, history
- **Students/Teachers** — CRUD, profiles, enrollment
- **Academic Periods** — Semesters, registration windows
- **Notifications** — Real-time badge, list, mark-read

### UI/UX
- Dark theme with indigo/purple accent system
- Responsive sidebar navigation (mobile drawer)
- Data tables with sorting, pagination, loading states
- Accessible forms with React Hook Form + Zod validation
- Toast notifications, loading skeletons, empty states

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| React | 19 (RC) |
| State | TanStack Query v5 (server state) + React Context (auth) |
| Forms | React Hook Form + Zod |
| Styling | CSS Modules + Tailwind CSS 4 |
| Icons | Lucide React |
| Charts | Custom SVG (enrollment trends) |
| Auth | Custom JWT flow + TanStack Query |
| Deployment | Vercel |

---

## Live Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `university@gmail.com` | `aaaaaaaa` |
| **Teacher** | `roisul192@gmail.com` | `aaaaaa` |
| **Student** | `raychabegum@gmail.com` | `aaaaaa` |

**One-click demo buttons** on `/login` page.

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/Roisul-Shohan/University-Management-System-frontend.git
cd University-Management-System-frontend
npm install

# 2. Environment
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL if needed

# 3. Development
npm run dev       # http://localhost:3000
```

### Environment Variables (`.env.local` / Vercel)

```bash
# Required - Backend API URL
NEXT_PUBLIC_API_URL=https://university-management-system-peach.vercel.app

# Optional - Demo credentials (fallbacks in demo-accounts.ts)
NEXT_PUBLIC_DEMO_ADMIN_EMAIL=university@gmail.com
NEXT_PUBLIC_DEMO_ADMIN_PASSWORD=aaaaaaaa
NEXT_PUBLIC_DEMO_TEACHER_EMAIL=roisul192@gmail.com
NEXT_PUBLIC_DEMO_TEACHER_PASSWORD=aaaaaa
NEXT_PUBLIC_DEMO_STUDENT_EMAIL=raychabegum@gmail.com
NEXT_PUBLIC_DEMO_STUDENT_PASSWORD=aaaaaa
```

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/           # Protected route group
│   │   ├── layout.tsx         # Sidebar + header shell
│   │   ├── page.tsx           # Role-based dashboard
│   │   ├── admissions/        # Admission review
│   │   ├── attendance/        # Attendance tracking
│   │   ├── courses/           # Course catalog
│   │   ├── exams/             # Exam mgmt + attempts
│   │   ├── payments/          # Fee collection
│   │   ├── students/          # Student management
│   │   ├── teachers/          # Teacher management
│   │   └── ...                # Other modules
│   ├── login/                 # Public login page
│   │   └── _components/       # LoginForm
│   ├── register/              # Public registration
│   ├── verify-email/          # Email verification
│   ├── api/                   # Next.js API routes (proxy)
│   │   └── auth/              # Auth proxy routes
│   ├── auth-provider.tsx      # React Context + TanStack Query
│   ├── providers.tsx          # QueryClient + Auth providers
│   ├── page.tsx               # Public landing page
│   ├── layout.tsx             # Root layout
│   ├── globals.css            # Global styles + CSS variables
│   └── proxy.ts               # Next.js 16 middleware (route guards)
├── lib/
│   ├── api.ts                 # Core API client (fetch + auth)
│   ├── demo-accounts.ts       # Demo login credentials
│   ├── dashboard-api.ts       # Dashboard endpoints
│   ├── notifications-api.ts
│   ├── exam-questions-api.ts
│   ├── admission-fees-api.ts
│   ├── attendance-api.ts
│   ├── class-sessions-api.ts
│   └── *.ts                   # Module-specific API clients
└── middleware.ts              # Legacy (replaced by proxy.ts)
```

---

## Authentication Flow

```
1. User submits /login form
2. Frontend → POST /api/auth/login (proxied to backend)
3. Backend validates → returns accessToken + refreshToken (httpOnly cookies)
4. Frontend stores accessToken in localStorage
4. Frontend sets client cookies: northstar-session, northstar-role
5. Redirect to / (dashboard)
6. useAuth() hook → GET /api/auth/me (Bearer token)
7. Proxy middleware (proxy.ts) validates northstar-session on each route
8. Subsequent API calls include Authorization: Bearer <token>
9. Token refresh: POST /api/auth/refresh-token (httpOnly cookie)
10. Logout: POST /api/auth/logout → clears cookies + localStorage
```

### Route Protection (`proxy.ts`)

```typescript
const publicPaths = new Set(["/login", "/"]);
const roleRules = {
  "/admissions": ["STUDENT"],
  "/course-offerings": ["SUPER_ADMIN", "TEACHER"],
  "/payments": ["STUDENT"],
  // ...
};
```

---

## API Layer (`lib/api.ts`)

```typescript
// Base client with auth handling
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function requestEnvelope<T>(path, options) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  // ... error handling, returns { data, message, meta }
}

export const authApi = {
  login: async (email, password) => { /* stores token, sets cookies */ },
  me: () => apiRequest<User>("/api/auth/me"),
  logout: async () => { /* clears token, cookies */ },
};

export const dashboardApi = {
  stats: () => apiRequest<DashboardStats>("/api/dashboard/stats"),
  activity: () => apiRequest<DashboardActivity[]>("/api/dashboard/activity"),
  schedule: () => apiRequest<DashboardSchedule[]>("/api/dashboard/schedule"),
};
// ... module-specific APIs
```

---

## State Management

### TanStack Query (Server State)
```typescript
// Dashboard stats
const statsQuery = useQuery({
  queryKey: ["dashboard", "stats"],
  queryFn: dashboardApi.stats,
  enabled: !!currentUser,
});
```

### React Context (Auth State)
```typescript
// auth-provider.tsx
const sessionQuery = useQuery({
  queryKey: ["auth", "me"],
  queryFn: () => authApi.me().catch(() => null),
  retry: false,
});
// Exposes: user, loading, refreshUser, logout, login
```

---

## Styling System

- **CSS Modules** for component-scoped styles
- **Tailwind CSS 4** for utilities (via `@import "tailwindcss"` in globals.css)
- **CSS Variables** for theming (indigo/purple accent system)
- **Dark mode only** (slate-950 base)
- **Responsive breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)

---

## Scripts

```bash
npm run dev          # next dev (Turbopack)
npm run build        # next build (production)
npm run start        # next start
npm run lint         # Biome + ESLint
npm run typecheck    # tsc --noEmit
```

---

## Deployment (Vercel)

```bash
# Automatic via Git push (connected repo)
# Or manual:
vercel --prod

# Required env var in Vercel dashboard:
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

**vercel.json:**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": { "maxDuration": 30 }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 16)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  (dashboard)│  │   Auth      │  │      API Layer          │ │
│  │  Route Group│  │  Context    │  │  (lib/api.ts)           │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│         └────────────────┴──────────────────────┘               │
│                          │                                      │
│                    ┌─────┴─────┐                                │
│                    │  Proxy    │  (Next.js 16 Middleware)       │
│                    │ (proxy.ts)│                                │
│                    └─────┬─────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTPS + CORS
┌──────────────────────────┼──────────────────────────────────────┐
│                    ┌─────┴─────┐                                │
│                    │  Backend  │  (Express + Prisma)            │
│                    │  (API)    │                                │
│  ┌─────────────────┼───────────┼─────────────────────────────┐ │
│  │ Auth            │ Modules   │ Database                      │ │
│  │ - JWT           │ - Admission│ - PostgreSQL                 │ │
│  │ - Roles         │ - Courses │ - Prisma ORM                  │ │
│  │ - Sessions      │ - Exams   │ - Migrations                  │ │
│  │                 │ - Payments│                               │ │
│  │                 │ - ...     │                               │ │
│  └─────────────────┴───────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Contributing

1. Fork → `git checkout -b feature/your-feature`
2. Conventional commits: `feat: add your feature`
3. Run checks: `npm run lint && npm run typecheck`
4. Push & open PR

---

## License

MIT — see [LICENSE](LICENSE) file.