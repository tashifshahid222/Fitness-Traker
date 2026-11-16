# Fitness Tracker API

Express + Mongoose backend.

```bash
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm install
npm run dev
```

- Dev: `npm run dev` (nodemon, port 5000)
- Prod: `npm run start`
- Seed: `npm run seed` (demo account `fitnesstracker@gmail.com` / `fitness1234`, data 1 Sep 2026 → 9 Oct 2026)
- Health: `GET /api/v1/health`

`nodemon.json` watches `src/` and `.env` and ignores `logs/`, so log writes do not trigger a restart loop.

Request flow: CORS → Helmet → JSON parser → Morgan/Winston logger → routes → 404 → global error handler.

Standard responses: `{ "success": true|false, "message": "...", "data"|"errors": ... }`.

Logs are written to `logs/` (`access.log`, `combined.log`, `error.log`). Sensitive data (passwords, JWTs) is never logged.
