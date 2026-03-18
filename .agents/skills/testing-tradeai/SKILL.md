# TRADEAI Testing Skill

## Environment Setup

### Frontend Dev Server
```bash
cd frontend
REACT_APP_API_URL=https://tradeai-api.reshigan-085.workers.dev/api PORT=12000 npx react-scripts start
```

### Backend Deployment
```bash
export CLOUDFLARE_API_KEY=<CLOUDFLARE_API_KEY>
export CLOUDFLARE_EMAIL=<CLOUDFLARE_EMAIL>
cd workers-backend && npx wrangler deploy
```

## Devin Secrets Needed
- `CLOUDFLARE_API_KEY` — Cloudflare Global API key for wrangler deploy
- `CLOUDFLARE_EMAIL` — Cloudflare account email

## Test Credentials
- Email: `admin@diplomatsa.co.za`
- Password: `DiplomatAdmin123!`
- Company: Diplomat SA (comp-diplomat-001), admin role

## Key Testing Notes

### Login Flow
- The app has TWO login pages:
  1. `/login` — original login form ("Access Your Dashboard")
  2. `/` (LandingPage) — marketing page with modal login ("Sign in to TradeAI")
- The LandingPage login parses the token from `response.data.token` (top level), NOT from nested `response.data.data.token`
- If login returns "Invalid response from server", check that the token extraction matches the backend response shape
- Auth uses SHA-256 password hashing (NOT bcrypt) — important for seed data
- JWT tokens expire after 15 minutes — get fresh tokens for API testing

### URL Routing
- Detail pages use flat routes, NOT nested under section prefixes:
  - Promotions: `/execute/promotions/:id` (has route)
  - Trade Spends: `/trade-spends/:id` (NOT `/execute/trade-spends/:id`)
  - Claims: `/settle/claims/:id`
  - Budgets: `/plan/budgets` (list only)
- Check `App.js` for exact route definitions before navigating

### Terminology Engine Testing
1. Navigate to Admin > Terminology (`/admin/terminology`)
2. Three company type presets: Distributor, Retailer, Custom
3. Distributor preset changes: Budget→AOP, Promotion→Deal, Trade Spend→Trade Investment, Campaign→Program, etc.
4. Custom type uses hardcoded defaults (Budget, Promotion, etc.)
5. Custom label overrides persist on top of presets (Layer 3 > Layer 2 > Layer 1)
6. Sidebar labels update immediately after save (no page refresh needed)
7. Reset to Defaults reverts to current company type preset

### Action Buttons on Detail Pages
- Action buttons (Submit, Approve, Reject, Settle, Process, Pay) only appear for non-terminal statuses
- Draft → shows Submit button
- Pending Approval → shows Approve/Reject buttons
- Completed/Approved → only Clone/Edit buttons
- Diplomat SA seed data mostly has terminal statuses — to test action buttons, create a new draft item first

### Common Issues
- If `wrangler deploy` fails with syntax error, check for malformed JS (e.g., `new Date(, x)` missing first arg)
- If terminology API returns 404, backend may not be deployed with latest code
- Browser cache can cause stale login state — use `localStorage.clear()` or Ctrl+Shift+Delete to clear
- Trade Spend list rows may not be clickable — navigate directly to `/trade-spends/:id` URL
- The frontend dev server hot-reloads on file changes but may need a hard refresh for some state changes

### CI/CD
- CI has 4 jobs: Backend Lint, Frontend Build (both run), Deploy Frontend, Deploy Workers Backend (both skip on PRs, only run on main merge)
- After merging to main, deploy manually with `npx wrangler deploy` if deploy jobs are skipped
- Frontend deploys to Cloudflare Pages automatically on merge
