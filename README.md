# Northstar University Management System

A comprehensive university management platform built with modern web technologies. Features role-based access control for students, teachers, and administrators with modules for admissions, courses, exams, attendance, payments, and more.

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript 5
- **Styling**: CSS Modules + Tailwind CSS 4
- **State Management**: TanStack Query (React Query) v5
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom components with Lucide React icons
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js 22+ (ESM)
- **Framework**: Express.js 5
- **Language**: TypeScript 5 (NodeNext module resolution)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (access + refresh tokens) with bcrypt
- **Validation**: Zod
- **Caching**: Redis (optional, for sessions/rate limiting)
- **Deployment**: Vercel / Docker / Any Node.js host

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
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

## Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL 15+
- Redis 7+ (optional)
- npm 10+ or pnpm 9+

### Backend Setup

```bash
cd university-management-system

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL, JWT secrets, etc.

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (creates super admin)
npm run db:seed

# Start development server
npm run dev
# Server runs at http://localhost:5000
```

### Frontend Setup

```bash
cd university-management-system-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000

# Start development server
npm run dev
# App runs at http://localhost:3000
```

---

## Environment Variables

### Backend (`.env`)
```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# Auth
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Seed Admin (run once via db:seed)
SEED_ADMIN_EMAIL="admin@university.edu"
SEED_ADMIN_PASSWORD="secure-password-here"

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=

# Email (optional)
SMTP_USER=
SMTP_PASSWORD=
EMAIL_SENDER=
RESEND_API_KEY=
EMAIL_FROM=

# bKash Payment Gateway (optional)
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_CALLBACK_URL=
```

### Frontend (`.env.local` / Vercel Environment Variables)
```bash
# Required - Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Optional - Demo account credentials for login page
NEXT_PUBLIC_DEMO_ADMIN_EMAIL=admin@university.edu
NEXT_PUBLIC_DEMO_ADMIN_PASSWORD=password123
NEXT_PUBLIC_DEMO_TEACHER_EMAIL=teacher@university.edu
NEXT_PUBLIC_DEMO_TEACHER_PASSWORD=password123
NEXT_PUBLIC_DEMO_STUDENT_EMAIL=student@university.edu
NEXT_PUBLIC_DEMO_STUDENT_PASSWORD=password123
```

---

## Project Structure

### Backend
```
src/
├── app.ts                 # Express app setup, middleware, routes
├── server.ts              # Entry point
├── config/
│   └── index.ts           # Environment config with validation
├── middlewares/
│   ├── auth.ts            # JWT authentication & role authorization
│   ├── validateRequest.ts # Zod request validation
│   └── notFound.ts        # 404 handler
├── utils/
│   ├── jwt.ts             # JWT token creation/verification
│   ├── catchAsync.ts      # Async error wrapper
│   ├── sendResponse.ts    # Standardized API responses
│   └── AppError.ts        # Custom error class
├── lib/
│   └── prisma.ts          # Prisma client singleton
├── modules/
│   ├── auth/              # Authentication (login, register, me, refresh)
│   ├── users/             # User management
│   ├── admission/         # Student admissions
│   ├── academicPeriod/    # Academic periods (semesters, terms)
│   ├── department/        # Departments
│   ├── programs/          # Academic programs
│   ├── courses/           # Courses
│   ├── courseOffering/    # Course offerings per semester
│   ├── courseRegistration/# Student course registration
│   ├── semesterFee/       # Semester fees
│   ├── creditFee/         # Credit-based fees
│   ├── payment/           # Payment processing (bKash)
│   ├── student/           # Student profiles
│   ├── studentSemester/   # Student-semester enrollment
│   ├── teacher/           # Teacher profiles
│   ├── classSession/      # Class sessions
│   ├── attendance/        # Attendance tracking
│   ├── exam/              # Exam management
│   ├── examAttempt/       # Student exam attempts
│   ├── examQuestion/      # Exam questions
│   └── notifications/     # Notifications
└── generated/prisma/      # Generated Prisma client types
```

### Frontend
```
src/
├── app/
│   ├── (dashboard)/       # Protected route group (requires auth)
│   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   ├── page.tsx       # Dashboard overview
│   │   ├── admissions/    # Admission management
│   │   ├── attendance/    # Attendance tracking
│   │   ├── courses/       # Course management
│   │   ├── exams/         # Exam management
│   │   ├── payments/      # Payment processing
│   │   ├── students/      # Student management
│   │   ├── teachers/      # Teacher management
│   │   └── ...            # Other modules
│   ├── login/             # Public login page
│   │   └── _components/   # Login form component
│   ├── register/          # Public registration page
│   ├── verify-email/      # Email verification page
│   ├── api/               # Next.js API routes (proxy to backend)
│   │   └── auth/          # Auth proxy routes
│   ├── auth-provider.tsx  # React Context + TanStack Query
│   ├── providers.tsx      # QueryClient + Auth providers
│   ├── page.tsx           # Home (redirects to dashboard/login)
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   └── proxy.ts           # Next.js 16 middleware (route guards)
├── lib/
│   ├── api.ts             # Core API client with auth handling
│   ├── demo-accounts.ts   # Demo login credentials
│   ├── notifications-api.ts
│   ├── exam-questions-api.ts
│   ├── admission-fees-api.ts
│   ├── attendance-api.ts
│   ├── class-sessions-api.ts
│   └── *.ts               # Module-specific API clients
└── middleware.ts          # (Legacy - replaced by proxy.ts)
```

---

## Authentication Flow

```
1. User submits login form
2. Frontend calls POST /api/auth/login (proxied to backend)
3. Backend validates credentials, creates JWT pair:
   - Access Token (15m): sent in httpOnly cookie + response body
   - Refresh Token (7d): sent in httpOnly cookie
4. Frontend stores access token in localStorage for Authorization header
5. Frontend sets client-side cookies: northstar-session, northstar-role
6. Proxy middleware (proxy.ts) validates northstar-session on each route
7. Authenticated routes access backend via Authorization: Bearer <token>
8. Token refresh: POST /api/auth/refresh-token (uses httpOnly cookie)
9. Logout: POST /api/auth/logout (clears cookies, localStorage)
```

### Role-Based Access Control

| Route Pattern | Allowed Roles |
|---------------|---------------|
| `/login`, `/register`, `/verify-email` | Public |
| `/admissions`, `/payments`, `/semester-registration`, `/course-registration`, `/exams`, `/exam-attempts`, `/student-semesters` | STUDENT |
| `/course-offerings`, `/courses`, `/programs`, `/curriculum-courses`, `/exam-management`, `/exam-questions`, `/teachers`, `/attendance` | SUPER_ADMIN, TEACHER |
| `/academic-periods`, `/departments`, `/students`, `/semester-fees`, `/credit-fees`, `/admission-fees`, `/admission-review` | SUPER_ADMIN |
| `/attendance` | SUPER_ADMIN, TEACHER, STUDENT |

---

## API Response Format

All backend responses follow a standardized envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}
```

**Success (200/201):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## Deployment

### Backend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd university-management-system
vercel --prod

# Set environment variables in Vercel dashboard:
# PORT, NODE_ENV, DATABASE_URL, JWT secrets, etc.
```

**Note**: For Vercel serverless functions, update `vercel.json`:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "node",
  "installCommand": "npm install",
  "functions": {
    "dist/server.js": { "maxDuration": 30 }
  }
}
```

### Frontend (Vercel)
```bash
cd university-management-system-frontend
vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
# NEXT_PUBLIC_DEMO_* (optional)
```

### Docker (Both)

**Backend Dockerfile:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma/
RUN npx prisma generate
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Development Workflow

### Adding a New Module (Backend)
1. Create module folder: `src/modules/your-module/`
2. Define Prisma schema in `prisma/schema/your-model.prisma`
3. Create interface, validation, service, controller, routes
4. Register routes in `src/app.ts`
4. Run `npx prisma migrate dev --name add-your-model`
5. Run `npx prisma generate`

### Adding a New Page (Frontend)
1. Create page under `src/app/(dashboard)/your-feature/page.tsx`
2. Create API client in `src/lib/your-feature-api.ts`
3. Add route to `proxy.ts` roleRules if auth required
4. Add navigation item in `src/app/page.tsx` (sidebar)

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name descriptive-name

# Deploy to production
npx prisma migrate deploy

# Reset (dev only)
npx prisma migrate reset
```

---

## Code Quality

### Linting & Formatting
```bash
# Backend
npm run lint          # Biome
npm run typecheck     # TypeScript

# Frontend
npm run lint          # ESLint + Biome
npm run typecheck     # TypeScript
```

### Git Hooks (Recommended)
```bash
# Install husky
npm install --save-dev husky lint-staged
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

---

## Security Considerations

- **JWT Secrets**: Use 32+ character random strings in production
- **HTTPS Only**: Set `secure: true` for cookies in production (`NODE_ENV=production`)
- **CORS**: Configured for specific frontend origin only
- **Rate Limiting**: Implement with Redis for production (not included)
- **Input Validation**: All endpoints validated with Zod
- **Password Hashing**: bcrypt with 12 rounds
- **SQL Injection**: Prevented by Prisma ORM
- **XSS Protection**: React auto-escapes, CSP headers recommended

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes with tests
4. Run lint/typecheck: `npm run lint && npm run typecheck`
5. Commit with conventional commits: `feat: add your feature`
6. Push and create Pull Request

### Commit Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

---

## License

MIT License - see LICENSE file for details.

---

## Support

For issues and feature requests, please use the GitHub issue tracker.