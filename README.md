# MERN Fitness Tracker

A full-stack fitness tracking application built with the **MERN** stack. Log workouts, track meals and macros, record weight and body measurements, set goals with automatic progress, and export everything as CSV or PDF — all behind a secure JWT-authenticated API and a responsive single-page React app.

## Live Demo

🔗 **https://fitness-tracker-project-7ch5.vercel.app/**

## Features

- **Auth & profiles** — register, login, JWT session with refresh-token rotation, profile editing, change password, and full account deletion (cascade removes all user data).
- **Workouts** — log exercise, category (strength/cardio/flexibility/balance/sports/other), sets × reps, weight, duration, and notes; search, filter, and paginate.
- **Nutrition** — meal-type logging (breakfast/lunch/dinner/snack) with food items, calories, and macros; daily totals on the dashboard.
- **Progress** — weigh-ins, body measurements, and named performance metrics; weight-trend and measurement charts.
- **Goals** — active goals with targets, units, and deadlines; `progressPercent` auto-computed; achievements auto-archive the goal and fire an in-app notification (deduplicated).
- **Notifications** — goal-achievement alerts and lazy deadline reminders; mark single/all as read.
- **Dashboard & analytics** — live stat cards, weekly workout bar chart, weight-trend line chart, category distribution, top exercises, macro split, and more (Recharts).
- **Reports** — per-module summaries with one-click **CSV** and **PDF** export (pdfkit).
- **Support tickets** — log problems/feedback/questions and view/close them.
- **Settings** — light/dark/system theme, kg/lb units, and notification toggles.
- **Security & DX** — helmet, CORS allow-list, per-user data isolation (ownership 403s), rate limiting, input validation (zod → 422 field errors), structured logs (Winston + Morgan).

## Tech stack

| Layer     | Tech                                                                         |
|-----------|------------------------------------------------------------------------------|
| Frontend  | React 18, Vite 5, React Router 6, Axios, Recharts 3, Framer Motion, react-icons |
| Backend   | Node.js, Express 5, Mongoose 9, JWT, bcrypt, zod 4, pdfkit                    |
| Database  | MongoDB (local or Atlas via `MONGO_URI`)                                     |
| Logging   | Winston + Morgan (`backend/logs/`)                                           |

## Project structure

```
fitness-tracker/
├── backend/
│   ├── src/
│   │   ├── config/        # env validation, db connect, logger, CORS allowed origins
│   │   ├── middleware/    # protect, CSRF header check, validate, rate limit, error handling
│   │   ├── models/        # User, Session, Workout, Nutrition, Progress, Goal, Notification, SupportTicket
│   │   ├── services/      # business logic per module (incl. dashboard, analytics, reports)
│   │   ├── controllers/   # HTTP layer
│   │   ├── routes/        # /api/v1/* routers
│   │   ├── validators/    # zod schemas
│   │   ├── utils/         # ApiError, asyncHandler, JWT, refresh cookie, query helpers, response helpers
│   │   └── seed.js        # demo data seeder (npm run seed)
│   ├── nodemon.json       # dev watcher config (watches src/ and .env, ignores logs/)
│   └── logs/              # access.log, combined.log, error.log
└── frontend/
    └── src/
        ├── components/    # StatCard, Modal, Pagination, ProgressBar, badges, empty/error states…
        ├── layouts/       # PublicLayout (navbar+footer), MainLayout (sidebar)
        ├── pages/         # 20 pages incl. Dashboard, Workouts, Nutrition, Progress, Goals, Analytics, Reports…
        ├── services/      # axios instance + per-module API services
        ├── context/       # AuthProvider (user state, auto-logout on 401)
        └── hooks/ utils/  # useAuth, useDebounce, formatting helpers
```

## Getting started

Prerequisites: **Node 18+**, **MongoDB** running locally (or a remote `MONGO_URI`).

### 1. Backend

```bash
cd backend
cp .env.example .env       # Windows: copy .env.example .env  — then edit values
npm install
npm run dev                # nodemon → http://localhost:5000
```

> `backend/nodemon.json` watches `src/` and `.env` only and ignores `logs/`, so writing to `logs/*.log` will not trigger a restart loop.

### 2. Frontend

```bash
cd frontend
cp .env.example .env       # VITE_API_URL points at the backend
npm install
npm run dev                # Vite → http://localhost:5173
```

Open http://localhost:5173, create an account, and start logging.
In development, the browser calls `/api/v1` on Vite and Vite proxies requests to the host in `VITE_API_URL` (or `http://localhost:5000` when unset). In production, the frontend uses `VITE_API_URL` directly as its API base URL.

### 3. Demo data (optional)

Seed a demo account with about six weeks of realistic data (**10 Sep 2026 → 22 Oct 2026**): workouts (Sundays are rest days), meals with macros, weigh-ins with measurements and performance metrics, goals (completed and active), notifications, and support tickets.

```bash
cd backend
npm run seed               # wipes + reseeds the demo account below
```

**Login:** `fitnesstracker@gmail.com` / `fitness1234`

Re-running `npm run seed` clears that user's existing data first, so it is idempotent. To seed a different window/account, edit the `START`, `END`, `email`, and `username` constants at the top of `backend/src/seed.js`.

> These demo credentials are for local development only. Never seed or use them in production.

### Production build

```bash
cd frontend && npm run build   # outputs to dist/
```

## Environment variables

`backend/.env`

| Variable                | Default                  | Notes                                                  |
|-------------------------|--------------------------|--------------------------------------------------------|
| `PORT`                  | `5000`                   | API port                                               |
| `NODE_ENV`              | `development`            | `development` \| `production` \| `test`                |
| `MONGO_URI`             | (unset)                  | Mongo connection string; required in production        |
| `ACCESS_TOKEN_SECRET`   | development-only value   | Generate a unique random secret of at least 32 chars   |
| `REFRESH_TOKEN_SECRET`  | development-only value   | Must be different from the access-token secret         |
| `CLIENT_URL`            | `http://localhost:5173`  | Exact frontend origin allowed by CORS and CSRF checks  |
| `REDIS_URL`             | (unset)                  | Reserved for future use; currently not read by the app |
| `LOG_LEVEL`             | `http` (dev) / `info` (prod) | Winston level                                      |

Set both JWT secrets in production. For example, run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` twice and use each result for a different variable. The legacy `JWT_SECRET`/`JWT_EXPIRES_IN` values are no longer used.

`frontend/.env`

| Variable          | Default                              | Notes                                              |
|-------------------|--------------------------------------|----------------------------------------------------|
| `VITE_API_URL`    | `http://localhost:5000/api/v1`       | Backend API URL; Vite proxies requests to its host |

For Vercel, deploy the `frontend/` directory as the project root and set `VITE_API_URL` in the Vercel project environment variables to the backend API URL, including `/api/v1`. This is a build-time variable, so redeploy after changing it. The included `frontend/vercel.json` rewrites all routes to `index.html` so React Router deep links work. On Render, set `CLIENT_URL` to the exact Vercel frontend origin. The API allows that configured origin and uses credentialed CORS for the refresh cookie; because the frontend and API are on different sites, browsers that block third-party cookies may prevent persistent refresh sessions.

`.env` files are gitignored — never commit secrets.

## API overview

All routes are mounted under **`/api/v1`** and return the standard envelope:

```json
{ "success": true, "message": "...", "data": {} , "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
```

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`, `GET /auth/me` |
| Users | `GET/PUT /users/me`, `PUT /users/me/password`, `DELETE /users/me` (requires `password` in the body; deletes account + data cascade) |
| Workouts | `GET/POST /workouts`, `GET/PUT/DELETE /workouts/:id` (search, `category`, `from`/`to`, pagination) |
| Nutrition | `GET/POST /nutrition`, `GET/PUT/DELETE /nutrition/:id` (search, `mealType`, date range) |
| Progress | `GET/POST /progress`, `GET/PUT/DELETE /progress/:id` |
| Goals | `GET/POST /goals`, `GET/PUT/DELETE /goals/:id` (achievement auto-notifies) |
| Notifications | `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`, `DELETE /notifications/:id` |
| Dashboard | `GET /dashboard`, `GET /dashboard/workout-analytics`, `GET /dashboard/nutrition-analytics`, `GET /dashboard/progress-analytics` |
| Reports | `GET /reports/workouts`, `GET /reports/nutrition`, `GET /reports/progress`, `GET /reports/export/csv?type=workouts\|nutrition\|progress`, `GET /reports/export/pdf?type=workouts\|nutrition\|progress` |
| Support | `GET/POST /support`, `GET/PUT /support/:id` (send `{ "status": "closed" }` to close a ticket) |
| Health | `GET /health` |

**Status codes:** `200` success · `201` created · `400` bad request · `401` unauthenticated · `403` cross-user access · `404` not found · `409` duplicate/conflict · `422` validation (with per-field `errors`) · `429` rate limited.

## Testing

There is no automated test suite in the repository yet. The API is tested manually with Postman using the lifecycle described below, and the frontend by hand in the browser.

Planned: Jest + Supertest integration tests (auth, ownership isolation, validation errors) and Vitest + React Testing Library for the frontend.

## Authentication flow and API testing

Registration creates the account but does not log in. After login, the API returns a 15-minute `accessToken` and sets a 7-day `HttpOnly` refresh cookie. MongoDB stores only the SHA-256 hash of each refresh token, keyed to a distinct device session. Refresh rotates both tokens atomically; reuse of a rotated token revokes that session. The React app keeps the access token in memory and restores authentication after reload by calling `/auth/refresh`.

All POST authentication endpoints require `X-CSRF-Protection: 1`; browser requests must also use an allowed `Origin`. The Axios client sets this header automatically. Production uses a `Secure; SameSite=None` refresh cookie; development uses `SameSite=Lax`. In development, Vite proxies API calls through its own origin. In production, the frontend and API are usually on different sites, so the refresh cookie is cross-site and browsers that block third-party cookies may not keep users signed in after a reload. Production deployments must use HTTPS.

Postman lifecycle:

1. `POST {{baseUrl}}/auth/register` with JSON `{ "name": "Alex Doe", "username": "alex_doe", "email": "alex@example.com", "password": "a-strong-password" }`. Include `X-CSRF-Protection: 1`.
2. `POST {{baseUrl}}/auth/login` with `{ "email": "alex@example.com", "password": "a-strong-password" }` and the same header. Save `data.accessToken`; Postman stores the refresh cookie from `Set-Cookie`.
3. Call protected APIs with `Authorization: Bearer {{accessToken}}`.
4. `POST {{baseUrl}}/auth/refresh` with `X-CSRF-Protection: 1`. Postman sends the HttpOnly cookie and receives a rotated cookie plus a new access token.
5. `POST {{baseUrl}}/auth/logout` with the current access token and CSRF header, or call `/auth/logout-all` to revoke every device session. Logout-all also requires the current access token.

Set `baseUrl` to `http://localhost:5000/api/v1`. To test rotation, copy the prior cookie before refresh and attempt to refresh with that old value; the session should be revoked. The access token already issued before logout can remain usable for up to 15 minutes because protected requests validate its JWT and account, not the live session record.

## Security notes

- Passwords use bcrypt and are excluded from responses by schema-level `select: false`; refresh tokens are never returned to JavaScript or stored raw.
- Access and refresh JWTs use separate secrets and have `15m` and `7d` expirations, respectively.
- Refresh cookies are `HttpOnly`, scoped to `/api/v1/auth`, and cleared with matching cookie attributes.
- MongoDB sessions include a TTL index, and expiration/revocation is checked before rotation; session indexes are ensured at backend startup.
- Cookie-mutating routes use a required custom header and exact CORS-origin allow-list checks. Configure `CLIENT_URL` for the deployed frontend.
- Helmet and zod input validation protect the API.
- Rate limits (per IP, 15-minute window): `POST /auth/login` and `POST /auth/register` share a limit of 5 requests, `POST /auth/refresh` allows 60, and all other `/api` routes allow 300 (5000 in development so hot reloading does not trigger `429`). Limits are kept in memory, so they are per server instance.
- Every record is scoped to its owner; accessing another user's record returns `403`.

## Known limitations

- No automated tests yet (see Testing).
- Rate limiting is in-memory, so it does not share counters across multiple server instances.
- Access tokens stay valid for up to 15 minutes after logout (stateless JWT validation).

## License & roadmap

Built as a full-stack internship project. Backlog (per product vision): email/password reset, admin user-management UI, workout routine templates, external calendar sync, email notifications, and OAuth.

Author: [tashifshahid222](github.com/tashifshahid222)
