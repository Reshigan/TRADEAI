# TRADEAI Frontend Testing

## Overview
Testing the TRADEAI frontend against the deployed Cloudflare Workers backend.

## Devin Secrets Needed
- `CLOUDFLARE_API_KEY` - Cloudflare Global API key for D1 database queries
- `GITHUB_TOKEN` - GitHub PAT for PR operations

## Environment Setup

### Backend
- Deployed at: `https://tradeai-api.reshigan-085.workers.dev/api`
- Health check: `GET /api/health` should return 200
- D1 Database ID: `adb1f315-140f-404d-a7bb-c3cbb6f3205a`
- Cloudflare Account: `be2e511e1ef077e505f543100e1f8e5c`

### Frontend Dev Server
- **CRITICAL**: Must run on port **12000** (`PORT=12000`). The backend CORS config only allows:
  - `*.pages.dev`
  - `https://tradeai.vantax.co.za`
  - `http://localhost:3000`
  - `http://localhost:12000`
- If port 12000 is busy, kill the existing process first (`ss -tlnp | grep 12000` to find PID, then `kill -9 <PID>`).
- Do NOT accept the "run on another port" prompt — the alternate port will be blocked by CORS.
- Start command: `cd frontend && PORT=12000 BROWSER=none npm start`
- `.env.development` should have: `REACT_APP_API_URL=https://tradeai-api.reshigan-085.workers.dev/api`

### Creating Test Users
- The D1 `users` table may be empty. The `/auth/register` endpoint does NOT require authentication.
- Create a test admin:
  ```bash
  curl -s -X POST https://tradeai-api.reshigan-085.workers.dev/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"testadmin@tradeai.com","password":"TestPass123!","firstName":"Test","lastName":"Admin","role":"admin","companyId":"comp-sunrise-001"}'
  ```
- If user already exists, just log in with the same credentials.
- Company ID for seeded data: `comp-sunrise-001` (Sunrise Foods SA)

## Testing API Path Fixes

### Verifying Double-Prefix Fixes
The frontend uses an axios instance with `baseURL` set to the API URL (which ends in `/api`). Pages using `apiClient` directly must NOT prefix paths with `/api/` — that would result in `/api/api/...` (404).

**How to verify**: Open DevTools Network tab, navigate to the page, click on the API request, and check the Request URL. It should be `https://tradeai-api.reshigan-085.workers.dev/api/<path>` NOT `https://tradeai-api.reshigan-085.workers.dev/api/api/<path>`.

**Key pages to test**:
- `/forgot-password` → should call `/api/auth/forgot-password`
- `/vendor-funds` → should call `/api/vendor-funds`
- `/waste-detection` → should call `/api/waste-detection` and `/api/waste-detection/summary`
- `/sap-export` → should call `/api/sap-export/templates`

### Verifying Service Method Aliases
Many components call service methods like `claimService.getAllClaims()` that are aliases for the base CRUD methods. If an alias is missing, the page will crash with a TypeError: "X is not a function".

**How to verify**: Open DevTools Console, navigate through pages, and check for zero TypeErrors. Key pages:
- `/claims` — uses `claimService.getAllClaims()`, `getClaimStatistics()`, `autoMatchClaims()`
- `/claims/:id` — uses `claimService.getById()`, `submit()`, `approve()`, `reject()`
- `/advanced-reporting` — uses `reportService.getAll()`
- `/workflow-engine` — uses `workflowService.getAll()`, `startWorkflow()`, `handleUserAction()`

### Verifying Path Mismatches
Some services had incorrect API base paths. Key remappings:
- `reportService`: `/reports/*` → `/reporting/*`
- `workflowService`: `/workflows/*` → `/workflow-engine/*`
- `securityService`: `/security/*` → `/system-config/*` + `/role-management/*`
- `aiOrchestratorService`: `/ai/*` → `/ai-orchestrator/*`

**How to verify**: Check Network tab for correct paths (e.g., `/api/reporting/...` not `/api/reports/...`).

## Known Backend Issues (Not Frontend Bugs)
- `/api/dashboard` returns 500 intermittently — backend handler issue
- `/api/pnl/calculate` returns 404 — may need specific query parameters
- Claim Detail page shows N/A values — data mapping mismatch between seed data structure and frontend expectations

## Architecture Notes
- `apiClient.js` is just a re-export from `api.js` — they share the same axios instance
- The axios instance has `baseURL` set from `REACT_APP_API_URL` env var
- Service objects are exported from `api.js` with method aliases for backward compatibility
- Backend uses Hono framework on Cloudflare Workers with D1 SQLite database
- Auth uses SHA-256 password hashing (not bcrypt) via Web Crypto API
- JWT tokens with 15-minute access token, 7-day refresh token
