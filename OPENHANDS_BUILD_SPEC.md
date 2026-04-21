# TRADEAI Shell v4 — OpenHands Build Spec

**Agent:** OpenHands + MiniMax 2.7
**Target repo:** `TRADEAI-main-7`
**Build strategy:** New shell at `frontend/src/shell-v4/` behind a feature flag. Existing app keeps running. Module-by-module cutover.
**Prime directive:** Do not delete or rename existing files in Sprints 1–6. Old code must keep working until cutover.

---

## How to use this spec with OpenHands

Each **Task** below is a self-contained unit of work sized for one OpenHands session. Run them in order. Each task has:

- **Goal** — one sentence outcome
- **Inputs** — the files/APIs the agent needs to read first
- **Deliverable** — the exact files to create or modify
- **Acceptance** — how the agent knows it's done (must be verifiable by running a command or checking a file)
- **Prompt template** — paste-ready prompt block for OpenHands

When prompting MiniMax via OpenHands, always prepend this system context:

```
You are modifying the TRADEAI repo. Rules:
1. Never delete or rename existing files unless the Task explicitly says so.
2. New frontend code goes in frontend/src/shell-v4/ only.
3. Use the existing apiClient from frontend/src/services/apiClient.js — do not create a new HTTP client.
4. Use existing MUI v5 + @mui/x-data-grid that are already in package.json. Do not add new UI libraries.
5. Before writing code, read the "Inputs" files listed in the Task. Quote the relevant section in your plan.
6. After writing code, run the Acceptance commands and paste the output.
7. If a backend endpoint is missing, stub the UI call against a mock and flag the missing endpoint in a `TODO-BACKEND.md` file at the repo root — do not invent backend code in frontend tasks.
```

---

# Part 1 — Shell Architecture

## Sprint 1: Foundation

### Task 1.1 — Create shell-v4 skeleton and feature flag

**Goal:** Boot the new shell behind `?shell=v4` without touching the old app.

**Inputs to read first:**
- `frontend/src/App.js` (lines 1–120 — the route structure)
- `frontend/src/index.js`
- `frontend/src/theme.js` (the exported MUI theme)
- `frontend/src/contexts/AuthContext.js`

**Deliverable — create these files:**
```
frontend/src/shell-v4/
├── index.jsx              # Shell entry — mounts ShellRoot when flag is on
├── ShellRoot.jsx          # Top-level <Router>-free component (consumes host router)
├── shell.config.js        # Runtime config: feature flags, tile registry path
├── theme/
│   └── tokens.js          # ONE source of design tokens (see §Design Tokens below)
├── layout/
│   ├── ShellLayout.jsx    # Grid: LaunchRail | ProcessRail | ObjectArea | InsightDock
│   ├── LaunchRail.jsx     # 56px always-on icon rail (left)
│   ├── ProcessRail.jsx    # 240px contextual rail (appears on process pages)
│   ├── TopBar.jsx         # Search + ⌘K trigger + notifications + user menu
│   └── InsightDock.jsx    # 320px collapsible right panel for AI findings
├── primitives/
│   ├── Tile.jsx           # Launchpad tile component (see §Tile Spec)
│   ├── ObjectHeader.jsx   # Standard header for object pages
│   ├── FacetTabs.jsx      # Tabbed facets (use existing MUI Tabs)
│   ├── Timeline.jsx       # Audit trail rail
│   └── AIAdvisoryStrip.jsx # Inline AI findings bar (see Part 2)
└── pages/
    └── Launchpad.jsx      # The home screen (replaces seven Cockpits)
```

**Modify `frontend/src/index.js`:**

```jsx
// Add at top of file, after existing imports
const useV4Shell = new URLSearchParams(window.location.search).get('shell') === 'v4'
  || localStorage.getItem('tradeai_shell') === 'v4';

if (useV4Shell) {
  import('./shell-v4').then(({ default: ShellRoot }) => {
    ReactDOM.createRoot(document.getElementById('root')).render(<ShellRoot />);
  });
} else {
  // ...existing render call stays unchanged
}
```

**Design tokens (`shell-v4/theme/tokens.js`) — single source of truth:**

```js
export const tokens = {
  // Spacing: 4px base, all components use multiples
  space: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 },

  // Semantic colors only — no hex in component files
  color: {
    bg: { base: '#FFFFFF', subtle: '#F8FAFC', muted: '#F1F5F9', inverse: '#0B1220' },
    fg: { default: '#0F172A', muted: '#475569', subtle: '#94A3B8', inverse: '#F8FAFC' },
    border: { default: '#E2E8F0', strong: '#CBD5E1', focus: '#2563EB' },
    accent: { default: '#047857', hover: '#065F46', subtle: '#ECFDF5' },
    status: {
      draft:     { bg: '#F1F5F9', fg: '#475569' },
      pending:   { bg: '#FEF3C7', fg: '#92400E' },
      approved:  { bg: '#D1FAE5', fg: '#065F46' },
      active:    { bg: '#DBEAFE', fg: '#1E40AF' },
      completed: { bg: '#E0E7FF', fg: '#3730A3' },
      rejected:  { bg: '#FEE2E2', fg: '#991B1B' },
      overdue:   { bg: '#FEE2E2', fg: '#991B1B' },
    },
    signal: { positive: '#047857', negative: '#B91C1C', neutral: '#475569', attention: '#B45309' },
  },

  // Type scale — 6 sizes, no more
  type: {
    display: { size: 24, weight: 600, line: 1.25 }, // page titles
    title:   { size: 18, weight: 600, line: 1.3 },  // card/section
    body:    { size: 14, weight: 400, line: 1.5 },  // default
    small:   { size: 13, weight: 400, line: 1.45 }, // secondary
    micro:   { size: 11, weight: 500, line: 1.3, upper: true, track: 0.04 }, // labels
    mono:    { size: 13, family: 'ui-monospace, SFMono-Regular, monospace' },
  },

  radius: { sm: 4, md: 6, lg: 10, pill: 999 },

  shadow: {
    1: '0 1px 2px rgba(15,23,42,0.06)',
    2: '0 2px 8px rgba(15,23,42,0.08)',
    3: '0 8px 24px rgba(15,23,42,0.12)',
  },

  // Animation — fast and linear. No spring bounces.
  motion: { fast: '120ms ease-out', base: '180ms ease-out', slow: '240ms ease-out' },
};
```

**Acceptance:**
```bash
cd frontend && npm run build
# must succeed with zero errors
grep -r "shell-v4" src/index.js
# must show the dynamic import block
# Open the app with ?shell=v4 and see the new Launchpad; without it, old app loads.
```

**OpenHands prompt:**
> Read the files under "Inputs" and implement Task 1.1 from `OPENHANDS_BUILD_SPEC.md`. Create the shell-v4 directory structure and wire the feature flag in index.js. Do not modify any file outside `frontend/src/shell-v4/` and `frontend/src/index.js`. When done, run `npm run build` and paste the output.

---

### Task 1.2 — Layout grid with LaunchRail + ProcessRail + TopBar

**Goal:** Fixed three-region layout; ProcessRail appears only on process routes.

**Layout contract:**

```
┌──┬──────┬─────────────────────────────────────┬───────┐
│  │      │ TopBar (56px)                        │       │
│L │ P    ├─────────────────────────────────────┤ I     │
│R │ R    │                                      │ D     │
│56│ 240  │        Object / Launchpad area       │ 320   │
│px│ px   │                                      │ px    │
│  │      │                                      │ (drw) │
└──┴──────┴─────────────────────────────────────┴───────┘
```

- **LaunchRail (56px, always on)**: 7 icons — Home, Plan, Execute, Approve, Settle, Analyze, Data. Hover reveals label tooltip. Click navigates to the default route of that process group. The icon of the active process is highlighted with a 2px left accent bar in `color.accent.default`.

- **ProcessRail (240px, contextual)**: Appears when the user is inside a process (`/plan/*`, `/execute/*`, `/approve`, `/settle/*`, `/analyze/*`, `/data/*`). Shows (a) a stage stepper specific to that process, (b) sub-nav items. On the Launchpad (`/`), the ProcessRail is hidden and the main area fills its space.

- **TopBar (56px)**: Logo (left, tucked against LaunchRail), universal search (center, 480px max-width, press `/` to focus, ⌘K opens palette), notifications bell, user menu. Height fixed at 56px.

- **InsightDock (320px, collapsible)**: Right-side drawer. Closed by default. Opens when there are ≥1 AI findings for the current object, or when the user clicks the "Insights" bell in the object header. Persists open/closed state per user in `localStorage` as `shell_insight_dock`.

**ProcessRail stage data contract:**

The ProcessRail reads a per-process config. Create `shell-v4/layout/processStages.js`:

```js
// Each stage: { id, label, route, countKey, statusFilter }
// countKey maps to a key in the /api/dashboard/counts response (Task 1.5)
export const processStages = {
  plan: [
    { id: 'budgets',    label: 'Budgets',    route: '/plan/budgets',    countKey: 'budgets.draft',      statusFilter: 'draft' },
    { id: 'calendar',   label: 'Calendar',   route: '/plan/calendar',   countKey: null },
    { id: 'scenarios',  label: 'Scenarios',  route: '/plan/scenarios',  countKey: 'scenarios.open' },
    { id: 'forecast',   label: 'Forecast',   route: '/plan/forecasting', countKey: null },
  ],
  execute: [
    { id: 'promotions', label: 'Promotions', route: '/execute/promotions', countKey: 'promotions.active', statusFilter: 'active' },
    { id: 'tradespend', label: 'Trade Spend', route: '/execute/trade-spends', countKey: 'tradespend.inflight' },
    { id: 'campaigns',  label: 'Campaigns',  route: '/execute/campaigns',  countKey: 'campaigns.live' },
  ],
  settle: [
    { id: 'claims',     label: 'Claims',     route: '/settle/claims',         countKey: 'claims.review',      statusFilter: 'under_review' },
    { id: 'deductions', label: 'Deductions', route: '/settle/deductions',     countKey: 'deductions.pending', statusFilter: 'pending' },
    { id: 'disputes',   label: 'Disputes',   route: '/settle/disputes',       countKey: 'disputes.open',      statusFilter: 'open' },
    { id: 'accruals',   label: 'Accruals',   route: '/settle/accruals',       countKey: null },
    { id: 'settle',     label: 'Settlements', route: '/settle/settlements',   countKey: 'settlements.processing' },
  ],
  analyze: [
    { id: 'pnl',        label: 'P&L',           route: '/analyze/pnl' },
    { id: 'c360',       label: 'Customer 360',  route: '/analyze/customer-360' },
    { id: 'reports',    label: 'Reports',       route: '/analyze/reports' },
    { id: 'waste',      label: 'Waste Detection', route: '/analyze/waste', countKey: 'waste.flags' },
  ],
  data: [
    { id: 'customers', label: 'Customers', route: '/data/customers' },
    { id: 'products',  label: 'Products',  route: '/data/products' },
    { id: 'vendors',   label: 'Vendors',   route: '/data/vendors' },
    { id: 'terms',     label: 'Trading Terms', route: '/data/trading-terms' },
    { id: 'baselines', label: 'Baselines', route: '/data/baselines' },
    { id: 'hierarchy', label: 'Hierarchy', route: '/data/hierarchy' },
  ],
};
```

**Acceptance:**
- Navigate to `/?shell=v4` → LaunchRail visible, no ProcessRail, Launchpad renders in main area.
- Navigate to `/execute/promotions?shell=v4` → LaunchRail active on Execute, ProcessRail shows 3 stages, counts populate.
- Navigate to `/settle/claims?shell=v4` → Settle highlighted, ProcessRail shows 5 stages.
- Resize window below 1280px → ProcessRail collapses to icons only; below 960px → ProcessRail becomes an overlay drawer.

**OpenHands prompt:**
> Implement Task 1.2. Build `ShellLayout.jsx`, `LaunchRail.jsx`, `ProcessRail.jsx`, `TopBar.jsx` using the layout contract and `processStages.js` config. Use CSS Grid for the outer layout (no MUI Grid). Counts can stub to `0` for now — Task 1.5 wires them.

---

### Task 1.3 — Launchpad tiles

**Goal:** Replace the 7 Cockpit files with one data-driven Launchpad.

**Inputs to read first:**
- `frontend/src/pages/dashboards/cockpits/KAMCockpit.jsx`
- `frontend/src/pages/dashboards/cockpits/FinanceCockpit.jsx`
- `frontend/src/pages/dashboards/cockpits/ManagerCockpit.jsx`
- `backend/src/routes/dashboard.js` (find the KPI endpoints)
- `frontend/src/services/dashboardService.js`

**Tile schema (`shell-v4/primitives/Tile.jsx` props):**

```ts
type Tile = {
  id: string;                      // unique, e.g. "promotions-active"
  title: string;                   // "Active Promotions"
  process: 'plan'|'execute'|'approve'|'settle'|'analyze'|'data';
  route: string;                   // click-through destination
  metric?: {                       // live KPI — optional
    endpoint: string;              // e.g. "/api/promotions/stats?status=active"
    valuePath: string;             // JSONPath into response, e.g. "data.count"
    format: 'number'|'currency'|'percent'|'duration';
    target?: number;               // for progress tiles
  };
  trend?: {                        // sparkline — optional
    endpoint: string;
    valuesPath: string;            // array path
    window: '7d'|'30d'|'90d'|'ytd';
  };
  personas: string[];              // ['kam','analyst','manager','finance','admin'] — show only for these
  priority: number;                // lower = higher on page (1–10)
  size: 'S'|'M'|'L';              // S=1col, M=2col, L=3col on a 6-col grid
};
```

**Tile registry (`shell-v4/pages/launchpadTiles.js`):**

The registry is a flat array of Tile objects. The Launchpad filters by `personas` based on `authContext.user.role`, sorts by `priority`, and renders responsively (6 columns desktop, 3 tablet, 1 mobile).

Seed it with 18 tiles minimum — these personas × these KPIs:

| Persona | Tiles (priority order) |
|---|---|
| KAM | My Promotions (active count), My Wallet Balance, Pending Approvals (mine), Upcoming Events (next 14 days), Top 5 Customers by Spend, ROI Last 90d |
| Analyst | Forecast Accuracy (last month), Open Scenarios, Waste Flags (count), Cannibalization Alerts, Baseline Drift |
| Manager | Team Budget Utilization, Team Pipeline Value, Team Pending Approvals, Team ROI vs Target |
| Finance | Unreconciled Deductions ($), Open Disputes, Accrual Balance, Settlements This Week, Aging AR |
| Admin | Users Online, Failed Jobs (24h), Integration Health, Audit Events Today |

Empty state: if a tile's metric endpoint 404s, render the tile with a dash (`—`) and a small "Not configured" caption; do NOT hide it silently.

**Acceptance:**
- Logging in as each persona shows the correct subset of tiles.
- Clicking a tile navigates to its `route`.
- A network error on one tile does not break the grid — that tile shows the error state only.

**OpenHands prompt:**
> Implement Task 1.3. Build `Launchpad.jsx`, `Tile.jsx`, and `launchpadTiles.js`. Use the existing `apiClient` from `src/services/apiClient.js`. Implement the tile schema exactly. Render in a CSS Grid (no MUI Grid). Persona filtering reads from `useAuth()`.

---

### Task 1.4 — Command palette (⌘K)

**Goal:** One keystroke access to any object, any create action, any saved report.

**Inputs to read first:**
- `frontend/src/components/command/CommandBar.jsx` (existing — read, then supersede)

**Palette sections (in order of results):**

1. **Recents** — last 10 objects the user opened, stored in `localStorage` as `shell_recents`.
2. **Actions** — static list: "New Promotion", "New Claim", "New Budget", "New Customer", "New Scenario", "Submit my pending claims", "Open my approvals".
3. **Objects** — live search against `/api/search?q=<query>&types=promotion,customer,claim,budget,product,vendor` (if this endpoint doesn't exist, create `TODO-BACKEND.md` entry, fall back to client-side filtering of recents).
4. **Navigate** — static list of every ProcessRail stage from `processStages.js`.

**Keyboard contract:**
- `⌘K` / `Ctrl+K` opens the palette from anywhere
- `Esc` closes
- `↑/↓` moves selection, `Enter` executes
- `?` opens a keyboard cheatsheet modal
- `g` then `p` → go to Promotions; `g` then `c` → Claims; `g` then `b` → Budgets; `g` then `d` → Dashboard
- `n` then `p` → New Promotion; `n` then `c` → New Claim

**Performance contract:**
- Input → first results visible in ≤ 60ms (recents+actions+navigate are instant; objects debounce 150ms).
- Results list is virtualized (use `@mui/x-data-grid` which is already installed, or a simple windowing with CSS).

**Acceptance:**
- `⌘K` on any page opens palette within 100ms.
- Typing "acme" with an Acme Corp customer in the DB shows it under Objects within 300ms.
- `g p` navigates to `/execute/promotions` without opening the palette.

**OpenHands prompt:**
> Implement Task 1.4. Build `shell-v4/primitives/CommandPalette.jsx` and wire it to a global keyboard listener in `ShellRoot.jsx`. If `/api/search` returns 404 on first call, disable the Objects section and write a note to `TODO-BACKEND.md` at the repo root listing the missing endpoint.

---

### Task 1.5 — Object page template

**Goal:** Every detail page (Promotion, Budget, Claim, Deduction, Customer, Product, Campaign) uses the exact same three-zone layout.

**Inputs to read first:**
- `frontend/src/pages/promotions/PromotionDetailWithTabs.jsx` (the current best effort — we're formalizing this)
- `frontend/src/pages/promotions/tabs/PromotionOverview.jsx`

**Three-zone layout contract:**

```
┌──────────────────────────────────────────────────────┐
│ ObjectHeader                                         │
│  ├─ breadcrumb                                       │
│  ├─ identity (type icon | name | ID)    primary btns │
│  ├─ status chip + key metadata line                  │
│  └─ AIAdvisoryStrip (if findings exist)              │
├──────────────────────────────────────────────────────┤
│ FacetTabs — horizontal tabs, sticky on scroll        │
│  [Overview] [Products] [Customers] [Budget] [Perf]…  │
├──────────────────────────────────────────────────────┤
│ Active facet content                                 │
└──────────────────────────────────────────────────────┘

Timeline rail appears in InsightDock (right side) when opened.
```

**Create `shell-v4/primitives/ObjectPage.jsx`:**

```jsx
// Props
{
  objectType: 'promotion'|'budget'|'claim'|'deduction'|'customer'|'product'|'campaign',
  id: string,
  fetchUrl: string,                // e.g. `/api/promotions/${id}`
  facets: [{ id, label, component, lazy: true }],
  primaryActions: [{ label, handler, variant, enabledWhen: (obj) => bool }],
  secondaryActions: [...],         // shown in overflow menu
  statusField: 'status',           // path into the object for the status chip
  titleField: 'name',
  subtitleFields: ['promotionId', 'promotionType'],
  timelineEndpoint: `/api/promotions/${id}/history`,
  aiAdvisoryEndpoint: `/api/ai/findings?objectType=promotion&objectId=${id}`, // see Part 2
}
```

**ObjectHeader rules:**
- Type icon sits left of the name, 20px, color = `color.accent.default`.
- Name is `type.display`, ID is `type.small` in `color.fg.muted` next to it.
- Status chip uses `tokens.color.status[statusValue]`. If status not in the map, use `status.draft` colors and log a console warning.
- Primary actions: max 2 buttons. 3+ actions overflow into a "More" menu. Enabled states come from `enabledWhen(obj)` — disabled buttons show a tooltip explaining why.

**Migrate these pages to use ObjectPage in Sprint 2** (do NOT delete the old files; wrap them):

| Entity | New route handler | Old file (keep running in v1) |
|---|---|---|
| Promotion | `shell-v4/objects/PromotionPage.jsx` | `pages/promotions/PromotionDetailWithTabs.jsx` |
| Budget | `shell-v4/objects/BudgetPage.jsx` | `pages/budgets/BudgetDetailWithTabs.jsx` |
| Claim | `shell-v4/objects/ClaimPage.jsx` | `pages/claims/*` (new) |
| Deduction | `shell-v4/objects/DeductionPage.jsx` | `pages/deductions/*` (new) |
| Customer | `shell-v4/objects/CustomerPage.jsx` | `pages/customers/CustomerDetailWithTabs.jsx` |

**Acceptance:**
- `/execute/promotions/:id?shell=v4` renders in the new ObjectPage.
- Same URL without `?shell=v4` renders the old page. Both work.
- Tab switching updates URL (`?tab=performance`) and uses browser history.

**OpenHands prompt:**
> Implement Task 1.5. Build `ObjectPage.jsx`, `ObjectHeader.jsx`, `FacetTabs.jsx`. Then build `objects/PromotionPage.jsx` as the first consumer, reusing the existing tab components from `pages/promotions/tabs/*` as the `component` for each facet. Do not touch the old `PromotionDetailWithTabs.jsx`.

---

## Sprint 2: Process rails and object migration

### Task 2.1 — Wire live counts on the ProcessRail

**Backend — new endpoint:** `GET /api/dashboard/counts`

Returns:
```json
{
  "budgets": { "draft": 4, "submitted": 2 },
  "promotions": { "draft": 7, "pending_approval": 3, "approved": 12, "active": 18 },
  "claims": { "under_review": 5, "approved": 8, "disputed": 2 },
  "deductions": { "pending": 23, "matched": 14, "disputed": 4 },
  "disputes": { "open": 6 },
  "settlements": { "processing": 2 },
  "waste": { "flags": 11 },
  "tradespend": { "inflight": 9 },
  "scenarios": { "open": 5 },
  "campaigns": { "live": 4 }
}
```

Implementation path: `backend/src/routes/dashboard.js` — add a new route that runs a single aggregation per model filtered by `tenantId`. Target p95 under 200ms, so one round-trip to MongoDB with `$facet` across all collections. Cache in Redis for 30 seconds per tenant.

**Frontend:** `ProcessRail.jsx` fetches `/api/dashboard/counts` on mount and every 60s, stores in a React Context (`CountsContext`), displays a small numeric badge next to each stage in its `color.status` badge style.

**Acceptance:**
- Curl the endpoint with a valid token → returns JSON matching schema.
- Badge updates within 60s of a new promotion being created in a second browser window.

---

### Task 2.2 — Migrate Promotions to ObjectPage + facets

Use the existing tab components; just slot them into the new ObjectPage. The facets array is:

```js
[
  { id: 'overview',    label: 'Overview',    component: PromotionOverview },
  { id: 'products',    label: 'Products',    component: PromotionProducts },
  { id: 'customers',   label: 'Customers',   component: PromotionCustomers },
  { id: 'budget',      label: 'Budget',      component: PromotionBudget },
  { id: 'approvals',   label: 'Approvals',   component: PromotionApprovals },
  { id: 'conflicts',   label: 'Conflicts',   component: PromotionConflicts },
  { id: 'performance', label: 'Performance', component: PromotionPerformance },
  { id: 'history',     label: 'History',     component: PromotionHistory },
]
```

Primary actions by status (read `backend/src/models/Promotion.js` enum):
- `draft` → [Edit, Submit for Approval]
- `pending_approval` → [View approvers, Recall] (if current user isn't approver) / [Approve, Reject] (if they are)
- `approved` → [Activate, Clone]
- `active` → [Pause, View performance]
- `completed` → [Post-mortem report, Clone]
- `cancelled` → [Clone]

### Task 2.3 — Migrate Budgets, Claims, Deductions, Customers to ObjectPage

Same pattern as 2.2. For Claims, Deductions, Customers — if the tab components don't exist, create minimal stubs that display JSON of the object in a `<pre>` block. They will be fleshed out by domain tasks in Part 3.

---

## Sprint 3: List pages and smart tables

### Task 3.1 — `SmartTable` component

**Goal:** One table component used on every list page.

**Contract:**
```ts
<SmartTable
  endpoint="/api/promotions"
  columns={[
    { field: 'promotionId', label: 'ID', width: 140, sticky: true },
    { field: 'name', label: 'Name', flex: 2, render: NameCell },
    { field: 'status', label: 'Status', width: 120, render: StatusChipCell },
    { field: 'period.startDate', label: 'Start', width: 120, render: DateCell },
    { field: 'performance.roi', label: 'ROI', width: 100, render: ROICell, numeric: true },
  ]}
  defaultSort={{ field: 'period.startDate', dir: 'desc' }}
  savedViews={true}          // users can save filter+sort combos per-table
  bulkActions={[
    { label: 'Submit for approval', handler, eligibleWhen: (row) => row.status === 'draft' },
    { label: 'Archive', handler, confirm: true },
  ]}
  rowActions={[
    { label: 'Open', handler: (row) => navigate(`/execute/promotions/${row._id}`) },
    { label: 'Clone', handler },
  ]}
  aiInsightsColumn={true}    // renders a special leftmost column showing AI flag icons — see Part 2
/>
```

Implementation uses `@mui/x-data-grid` (already in package.json). Saved views are stored server-side at `GET/POST /api/user/saved-views/:table` (new endpoint — add to `TODO-BACKEND.md` if missing; fall back to `localStorage` for MVP).

### Task 3.2 — Migrate list pages

Using SmartTable, rebuild: Promotions List, Budgets List, Claims List, Deductions List, Customers List, Products List, Trade Spends List, Campaigns List. Each list page is now ~30 lines.

---

# Part 2 — Embedded AI Layer

**Principle:** AI is not a chatbot in the corner. AI findings appear *on the object* they're about, *at the moment* the user is looking at it, with an explanation one click away.

## The AI Findings contract

Every AI service in the backend produces findings through one unified interface:

```ts
type Finding = {
  id: string;                       // stable, deduped across re-runs
  objectType: 'promotion'|'budget'|'claim'|'deduction'|'customer'|'product';
  objectId: string;
  severity: 'info'|'attention'|'warning'|'critical';
  category: 'forecast'|'cannibalization'|'forward_buy'|'anomaly'|'match_suggestion'
           | 'compliance'|'opportunity'|'budget_risk'|'data_quality';
  title: string;                    // "Forecast 18% above baseline"
  detail: string;                   // one paragraph, plain English
  source: {
    service: string;                // e.g. "cannibalizationService"
    method: string;                 // e.g. "analyzePromotion"
    modelVersion?: string;
    confidence: number;             // 0..1
  };
  evidence: Array<{                 // for the explainability drawer
    label: string;
    value: string|number;
    link?: string;                  // URL to the underlying record
  }>;
  actions: Array<{                  // what the user can do about it
    label: string;                  // "Adjust forecast"
    kind: 'navigate'|'run_action'|'dismiss'|'ack';
    target: string;                 // route or API endpoint
  }>;
  createdAt: string;
  expiresAt?: string;
  dismissedBy?: string;
  ackedBy?: string;
};
```

## Task A — Backend Finding Aggregator

**New service:** `backend/src/services/findingsService.js`

**Responsibility:** Single place that runs all AI checks for an object and returns a normalized `Finding[]`. Do NOT rewrite the existing services — just adapt their outputs.

**Adapters to implement** (one per source service — these services already exist in `backend/src/services/`):

| Source service | Method called | Produces finding category | Triggers on |
|---|---|---|---|
| `aiPromotionValidationService` | `validatePromotionUplift(promotion)` | `forecast` | Promotion open in UI |
| `cannibalizationService` | `analyzePromotion({ promotionId, tenantId })` | `cannibalization` | Promotion open, status != completed |
| `forwardBuyService` | `predictForwardBuyRisk({ promotionId })` | `forward_buy` | Promotion status in [draft, pending_approval, approved] |
| `anomalyDetectionService` | (live stream) | `anomaly` | All objects — subscribe to events |
| `deductionMatchingService` | `matchDeduction(deduction, candidateTxns)` | `match_suggestion` | Deduction status = pending |
| `threeWayMatchingService` | `matchInvoiceToPO(invoiceId, poId)` | `match_suggestion` | Claim open |
| `forecastingService` | `predictPromotionPerformance(tenantId, promo)` | `forecast` | Promotion open |
| `customerSegmentationService` | `predictChurn(tenant)` | `opportunity`, `compliance` | Customer open |
| `automatedInsightsService` | `generateInsights(tenantId, { objectId })` | varies | All objects |
| `advancedBudgetService` (custom check) | depletion check | `budget_risk` | Budget utilization > 95% |

**New endpoint:** `GET /api/ai/findings?objectType=:type&objectId=:id`

Behavior:
1. Check Redis cache with key `findings:${tenant}:${type}:${id}` (TTL 5 min).
2. On miss, run all applicable adapters in parallel with `Promise.allSettled` — individual failures don't fail the request, they just get logged and skipped.
3. Merge results, dedupe by `id`, sort by severity (`critical > warning > attention > info`), then `confidence desc`.
4. Return `{ findings: Finding[], generatedAt, partial: boolean }`. `partial = true` if any adapter errored.

**New endpoint:** `POST /api/ai/findings/:findingId/ack` — records acknowledgement, returns updated finding.
**New endpoint:** `POST /api/ai/findings/:findingId/dismiss` — records dismissal with optional reason.

**Event stream:** Hook `socketService` so new findings push to clients on the channel `findings:${userId}` as they're detected by `anomalyDetectionService` and `insightScanner`.

**Acceptance:**
- `GET /api/ai/findings?objectType=promotion&objectId=<id>` returns valid Findings in under 800ms p95 on cache hit, under 3s on cache miss.
- Killing `cannibalizationService` (simulate error) still returns findings from the other adapters with `partial: true`.

**OpenHands prompt:**
> Implement Task A. Read each service file listed in the adapters table to learn its actual method signature and return shape. Write one adapter function per service in `findingsService.js` that calls the real method and maps its output to the `Finding` schema. Register the route in `backend/src/routes/ai.js` (or create a new `aiFindings.js` route file). Add Redis caching using the existing `cacheService.js`.

---

## Task B — Frontend AI Advisory Strip

**Component:** `shell-v4/primitives/AIAdvisoryStrip.jsx`

**Appearance:** Horizontal band, full-width, 48px tall, sits directly under the ObjectHeader. If no findings, the strip is not rendered (no empty state).

**Content rules:**
- Shows up to 3 findings at once, cycling the highest severity first.
- Layout per finding: `[severity icon] [title text, 1 line, ellipsis] [primary action button] [ⓘ explain] [× dismiss]`
- Severity colors use `tokens.color.status` / `tokens.color.signal`:
  - `critical` → status.rejected background (light red)
  - `warning` → status.pending background (light amber)
  - `attention` → color.bg.muted
  - `info` → color.accent.subtle
- Cycling: if >3 findings, show a "`+N more`" chip at the right. Clicking it opens the full InsightDock panel.
- Animations: slide-in on first appearance (`tokens.motion.base`), fade-out on dismiss.

**Dismiss vs Ack:**
- `ack` = "I've seen this, don't show it prominently again but keep it in history". Finding fades to info severity.
- `dismiss` = "Not relevant, hide it." Requires a reason for `critical` findings.

**Explainability drawer** (`shell-v4/primitives/ExplainDrawer.jsx`):
Opens when user clicks ⓘ. Shows:
1. **What we saw** — `finding.detail`
2. **Evidence** — table of `finding.evidence`, each row clickable to the underlying record
3. **How confident** — visual confidence bar (0–100%), with a plain-English interpretation ("high confidence", "moderate", "low")
4. **Model & version** — `finding.source.service`, `finding.source.modelVersion`
5. **What you can do** — the actions list as buttons
6. **Feedback** — thumbs up / thumbs down → POSTs to `/api/ai/findings/:id/feedback` (new endpoint)

**Acceptance:**
- Open a promotion that has a cannibalization >10% → strip appears red with the cannibalization finding, primary action "View affected products" navigates to the Conflicts tab.
- Click ⓘ → drawer shows the affected products and confidence score.
- Click dismiss → strip disappears; refresh the page → it stays dismissed for 24h (read from `finding.dismissedBy` field).

---

## Task C — Submit-time AI guardrails

**Goal:** The AI doesn't just advise, it gates.

**Rule matrix** (implement in `shell-v4/objects/PromotionPage.jsx` for the Submit action):

| Condition | Behavior |
|---|---|
| Forecasted ROI < 0 | Block submission. Error: "This promotion forecasts a loss of $X. Override requires Finance approval." Provide an "Override" button that routes through a new `POST /api/promotions/:id/submit-with-override` with `justification` field. |
| Cannibalization > 15% | Warning (yellow). Allow submission but auto-escalate the approval chain by one level. |
| Forward-buy risk = high | Warning. Suggest moving dates. Show "adjust dates" quick action. |
| Budget utilization would exceed 100% | Block. Must resolve first. |
| Date range overlaps with existing promotion on same SKU + customer | Warning with conflict details and a button to open the conflict in a side panel. |
| Discount > 40% on product with margin < 20% | Block. |

For each gate that blocks or warns, show the AI's reasoning in the submission modal — don't just throw an error. The user should see *why* and *what the AI found*.

**Acceptance:**
- Try to submit a promotion with ROI = -5% → modal shows the error, the forecast details, and the "Override with justification" flow.
- Try to submit with 12% cannibalization → modal warns, explains, allows submit but logs the escalation.

---

## Task D — AI insights in list pages

The `aiInsightsColumn` prop on `SmartTable` (Task 3.1) renders a leftmost column, 40px wide, with up to 3 stacked severity dots for each row. Hover reveals a popover listing the findings. Clicking any dot opens the object and auto-expands the InsightDock on that finding.

Backend: batch endpoint `POST /api/ai/findings/batch` takes `{ objectType, objectIds: string[] }` and returns a map `{ [objectId]: Finding[] }`. Required because fetching individually on list pages would be slow.

---

# Part 3 — Feature Gap Closure (Market-Leader Capabilities)

Each capability below maps to existing code you already have, what's missing, and a bounded build.

## Capability 1: Scenario Workspace

**Why it matters:** This is the #1 demo-winner vs SAP TPM, Vistex, Exceedra. They all have simulation; none have a *workspace* where scenarios live as first-class artifacts that can be compared, shared, commented on, and promoted to actual plans.

**What you have:**
- `models/Simulation.js` and `services/simulationEngine.js` with `simulatePromotionImpact`, `whatIfAnalysis`, `compareScenarios`, `performSensitivityAnalysis`.
- `routes/simulations.js` has `/promotion` and `/compare` endpoints.

**What's missing:**
- Persistent scenarios (the engine is stateless).
- A scenario list page.
- Side-by-side comparison UI.
- "Promote to plan" action.
- Sharing + commenting.

**Build — Task P3-1:**

**Backend:**
- Extend `Simulation.js` model with: `name`, `description`, `createdBy`, `sharedWith: [userId]`, `status: draft|shared|promoted|archived`, `inputs` (the scenario params), `outputs` (the engine result), `tags`, `parentScenarioId` (for forks), `comments: [{ user, text, at }]`.
- New routes in `routes/simulations.js`:
  - `POST /api/simulations` — create and run, persist both input and output
  - `GET /api/simulations` — list with filters (mine, shared, tags)
  - `GET /api/simulations/:id` — fetch single
  - `PUT /api/simulations/:id` — update inputs, re-run, store new output
  - `POST /api/simulations/:id/fork` — clone with `parentScenarioId`
  - `POST /api/simulations/compare` — takes `[scenarioIds]`, calls `simulationEngine.compareScenarios`
  - `POST /api/simulations/:id/promote` — creates a real Promotion or Budget from the scenario

**Frontend:** `shell-v4/workspaces/ScenarioWorkspace.jsx` — a dedicated full-page view accessible from `/plan/scenarios`:
- Left rail: list of scenarios with search/filter/tag chips
- Main area: 1-up detail OR 2/3/4-up comparison mode (toggle)
- Each scenario card shows: inputs panel (editable), outputs panel (KPIs + chart), "Fork" / "Share" / "Promote to plan" buttons
- Comments thread at the bottom (uses existing notification/comment patterns)

**Acceptance:**
- User creates scenario "Q2 Promo +15% discount", it persists.
- User forks it to "Q2 Promo +20% discount", changes one input, re-runs.
- Comparison view shows both side-by-side with deltas highlighted.
- "Promote to plan" creates an actual Promotion in `draft` status, pre-filled with the scenario inputs.

---

## Capability 2: Joint Business Planning (JBP) Workspace

**Why it matters:** No TPM vendor ships a good shared manufacturer ↔ retailer workspace. This is category-defining.

**What you have:**
- `Customer`, `TradingTerm`, `KAMWallet` models.
- Customer hierarchy in `StoreHierarchy.js`.

**What's missing:**
- Multi-party access control (retailer user sees a limited view).
- Shared artifact (the JBP plan).
- Negotiation log.

**Build — Task P3-2:**

**Backend:**
- New model `JBPPlan.js`: `manufacturerTenantId`, `retailerCustomerId`, `retailerContactEmail`, `period: {start, end}`, `status: drafting|in_negotiation|agreed|active|closed`, `objectives: [{ metric, target, owner }]`, `programs: [{ type, budget, kpis }]`, `terms` (reference TradingTerm), `revisions: [{ by, at, diff, comment }]`, `signoffs: [{ party, user, at }]`.
- New routes `/api/jbp-plans/*` — CRUD + revision tracking + signoff workflow.
- Invite system: `POST /api/jbp-plans/:id/invite` emails the retailer contact a magic link (use existing `emailService.js`) that provisions a scoped external user with read+comment access to only that plan.

**Frontend:** `shell-v4/workspaces/JBPWorkspace.jsx`
- Table of objectives (editable inline)
- Program cards (each links to a Promotion or TradeSpend)
- Revisions sidebar showing full diff history
- Signoff panel with e-signature-style confirm (simple for v1 — just a checkbox + name + date)

**Acceptance:**
- KAM creates a JBP for Customer X, adds 3 objectives and 5 programs.
- Invites retailer — retailer gets email, clicks link, sees only that JBP.
- Retailer comments on an objective. KAM gets notification.
- Both parties sign off → status flips to `agreed`, record becomes immutable (only status changes allowed).

---

## Capability 3: Deduction Recovery Product

**Why it matters:** Package what you already have as a named, revenue-generating sub-product. CPGs lose 0.5–2% of gross revenue to unresolved deductions. Customers will pay for a tool that *measurably* reduces that.

**What you have:**
- `Deduction`, `Dispute`, `Claim`, `Invoice`, `PurchaseOrder`, `Payment` models.
- `deductionMatchingService.js`, `threeWayMatchingService.js`, `disputeManagementService.js`.

**What's missing:**
- A dedicated deduction workspace with aging, bucketing, and AI-prioritized queue.
- Recovery KPIs dashboard.
- Bulk actions on deductions.

**Build — Task P3-3:**

**Frontend:** `shell-v4/workspaces/DeductionRecoveryHub.jsx`
- Top: KPI strip — "Unresolved $", "Avg age (days)", "Recovery rate last 30d", "Predicted recoverable $" (uses AI).
- Middle: AI-prioritized queue — deductions sorted by `(potential_recovery × match_confidence) / age_days`. Each row shows:
  - Deduction identity (ID, customer, amount, reason code, date)
  - AI match suggestion (top candidate transaction with confidence %)
  - Recommended action ("Accept auto-match", "Dispute", "Write off")
  - One-click bulk actions
- Bottom tab: Aging buckets (0–30, 31–60, 61–90, >90 days) — clicking a bucket filters the queue.
- Right side: "Disputes in progress" with SLA countdowns.

**Backend:** `GET /api/deductions/recovery-hub` — single endpoint that aggregates all of the above in one call. Use `Promise.allSettled` so a slow sub-query doesn't block the dashboard.

**Acceptance:**
- Hub loads in under 2s on a tenant with 5000+ open deductions.
- Bulk accept 20 auto-matches → all 20 deductions move to `matched`, a single audit event is logged.
- Recovery rate KPI updates within 30s.

---

## Capability 4: Self-Writing Promo Post-Mortem

**Why it matters:** Every promo ends with a meeting where someone manually compiles a slide deck. Automate it — it becomes both a retention feature and a data flywheel (the write-ups become training data).

**What you have:**
- `Promotion.analysisWindows` (baseline, promotion, post — already modeled with 6-week windows).
- `services/baselineService.js`, `services/forecastingService.js`, `cannibalizationService.js`, `forwardBuyService.js`.

**What's missing:**
- A report generator.
- LLM summarization.
- A standardized post-mortem view.

**Build — Task P3-4:**

**Backend:** New service `promoPostMortemService.js`. Entry point: `async generate(promotionId)`. Steps:
1. Load the promotion with populated products, customers, budget.
2. Pull actuals from `SalesTransaction` inside the promotion window.
3. Compute: planned vs actual volume, planned vs actual uplift %, incremental revenue, cannibalization loss, forward-buy dip, halo gain, net ROI.
4. Call `aiOrchestratorService.orchestrate` with the computed metrics and ask for a plain-English narrative (~300 words) covering: headline verdict, top 3 drivers of success/failure, top 3 recommendations for next time.
5. Persist as `PromoPostMortem` (new model): `promotionId`, `metrics`, `narrative`, `recommendations`, `generatedAt`, `generatedBy`, `approvedBy`.

**Endpoints:**
- `POST /api/promotions/:id/post-mortem/generate` — kicks off generation (async, returns job ID)
- `GET /api/promotions/:id/post-mortem` — fetch the latest
- `POST /api/promotions/:id/post-mortem/regenerate` — force re-run
- `GET /api/promotions/:id/post-mortem/export?format=pdf|pptx` — (leverage existing `exportService.js`)

**Frontend:** Add a `PostMortem` facet to the Promotion ObjectPage. Only visible when `status === 'completed'`. Shows the narrative, metrics table, recommendations, and Export button.

**Acceptance:**
- On a completed promotion with actuals in DB, clicking "Generate post-mortem" produces a structured report in under 20s.
- Report includes at least 5 quantitative KPIs and a coherent narrative.
- PDF export is downloadable and readable.

---

## Capability 5: Retail Execution Loop

**Why it matters:** Closes the gap from "promo planned" to "promo actually happened at shelf." You have `computerVisionService.js` but it isn't wired to anything in the UI.

**Build — Task P3-5 (MVP scope — full shelf-share scanning is a separate product):**

**Backend:**
- Extend `Promotion` with `executionChecks: [{ storeId, checkedAt, checkedBy, complianceScore, imageUrl, issues: [] }]`.
- New route `POST /api/promotions/:id/execution-check` — accepts an image upload, calls `computerVisionService` to extract shelf state, computes compliance score against promotion's expected display (feature/display flags on the Promotion), persists the check.
- New route `GET /api/promotions/:id/execution-compliance` — returns rolled-up compliance % across all stores checked.

**Frontend:**
- New facet `Execution` on Promotion ObjectPage.
- Shows a map (or list) of stores, each with last-checked date + compliance score.
- Field users (KAMs, reps) can submit checks from mobile via the existing PWA layer.

**Acceptance:**
- KAM submits a store photo against an active promotion.
- System returns compliance score within 10s.
- Compliance roll-up KPI appears on the Promotion's performance tab.

*(Full shelf-share and planogram compliance is out of scope here — this MVP just proves the loop. If traction warrants it, build out in a later sprint.)*

---

## Capability 6: TradeAI Connect (Integration Marketplace)

**Why it matters:** Sales motion differentiator. Every RFP asks "what does it integrate with?" Turn scattered code into a named product surface.

**What you have:**
- `integrationHubService.js`, `erpIntegrationService.js`, `sapService.js`, `webhookService.js`, models for `ERPSettings`, `AzureADConfig`, `Webhook`.

**Build — Task P3-6:**

**Backend:** New model `ConnectorInstance.js`: `tenantId`, `connectorKey` (e.g. "sap-s4", "shopify", "nielsen", "iri", "shoprite-edi"), `status: disconnected|connecting|active|error`, `config` (encrypted), `lastSync`, `errorLog`.

**Connector registry:** `backend/src/integrations/connectors/` — one file per connector, each exporting:
```js
module.exports = {
  key: 'sap-s4',
  name: 'SAP S/4HANA',
  category: 'erp',
  logoUrl: '/connectors/sap.svg',
  configSchema: { /* JSON schema for the config form */ },
  async testConnection(config) { ... },
  async sync(instance) { ... },          // pull data
  async push(instance, entity, payload) { ... }, // push data
};
```

Seed with 8 connectors at minimum: `sap-s4`, `sap-ecc`, `oracle-netsuite`, `microsoft-d365`, `nielsen`, `iri-circana`, `shopify`, `generic-webhook`, `generic-sftp-edi`. For the ones you can't actually implement now, ship them as "Coming Soon" tiles — they're visible in the gallery but not installable.

**Frontend:** `shell-v4/pages/ConnectMarketplace.jsx` at `/admin/connect`:
- Tile grid, each connector = one tile with logo, name, category, status
- Click a tile → detail page with: description, config form (auto-generated from `configSchema`), "Test connection" button, sync history, last errors
- Separate tab: "Installed" shows only active connectors
- Separate tab: "Activity" shows a cross-connector event log

**Acceptance:**
- Gallery shows 8+ connectors.
- Admin configures a `generic-webhook` connector with a URL → Test connection succeeds → on next promotion approval, webhook fires and is logged.

---

## Capability 7: Terminology as a Sales Feature

You already have `TerminologyContext` and `/admin/terminology`. Promote it.

**Build — Task P3-7 (small):**

- On first-run onboarding (`components/onboarding/OnboardingWizard`), add a step: "What do you call a promotion?" / "A budget?" / "A claim?" with common defaults (Promotion, Deal, Activity, Campaign, Offer) as suggested values.
- Show the chosen terminology throughout the UI — this already works via context.
- Add a **small "customized for you" badge** on the Launchpad that reads "Configured for [Company Name]'s language" — makes the customization visible.

---

# Part 4 — What to cut (after Sprint 6 cutover)

Only do this *after* every production user is on shell-v4 and the old shell has been dark for 30 days.

**Delete:**
- `frontend/src/_archived/frontend-v2/`
- `frontend/src/_archived/frontend-v3/`
- `frontend/src/theme.backup.js`
- `frontend/src/theme.professional.js` (keep `theme.js` as legacy-only; shell-v4 uses tokens)
- `frontend/src/pages/Dashboard.original.jsx`
- `frontend/src/pages/Dashboard.enhanced.jsx`
- `frontend/src/pages/dashboards/cockpits/*` (all 7 files — replaced by Launchpad)
- `frontend/src/components/Dashboard.js` (replaced)
- `frontend/src/components/worldclass-dashboard/` (replaced)
- Root-level: merge all `DEPLOYMENT_*.md`, `WORLD_CLASS_*.md`, `GO_LIVE_*.md` files into three docs: `ARCHITECTURE.md`, `DEPLOY.md`, `ROADMAP.md`. Delete the rest.

---

# Part 5 — Definition of Done (per sprint)

Every task must satisfy:

1. **Builds clean:** `cd frontend && npm run build` — zero errors, zero new warnings beyond baseline
2. **Lints clean:** `npm run lint` — zero new errors
3. **Types check (where applicable):** `npx tsc --noEmit` on any `.ts`/`.tsx` files
4. **Unit tests:** Added for any new service or reducer. `npm test` passes.
5. **Manual smoke test:** The Acceptance criteria in the Task are demonstrably met — paste curl output or a screenshot in the PR.
6. **No regression:** `?shell=v4` off → old app still loads and every route still works.
7. **Accessibility floor:** Every new interactive component has keyboard focus states and `aria-label`s. Tab order is sensible. Command palette is fully keyboard-navigable.
8. **No leaked secrets or hardcoded URLs:** All API calls go through `apiClient`.
9. **TODO-BACKEND.md updated:** If any missing endpoint was stubbed, it's listed with its contract.

---

# Part 6 — Suggested sprint sequence

| Sprint | Weeks | Deliverable |
|---|---|---|
| 1 | 1–2 | Task 1.1, 1.2 — shell, layout, flag |
| 2 | 3 | Task 1.3, 1.4 — Launchpad + ⌘K |
| 3 | 4 | Task 1.5, 2.1 — ObjectPage + counts |
| 4 | 5–6 | Task 2.2, 2.3, 3.1, 3.2 — migration + SmartTable |
| 5 | 7–8 | Task A, B, C, D — AI layer end-to-end |
| 6 | 9–10 | Task P3-1 Scenarios, P3-3 Deduction Hub |
| 7 | 11–12 | Task P3-2 JBP, P3-4 Post-Mortem |
| 8 | 13 | Task P3-6 Connect, P3-7 Terminology, P3-5 Execution MVP |
| 9 | 14 | Cutover, decommission old shell, delete archived code |

Total: ~14 weeks with one focused engineer using OpenHands + MiniMax. Double the throughput with two.

---

# Appendix: OpenHands runtime tips for MiniMax

- **Context window:** Each task's Inputs are ≤ 5 files. Keep it that way; MiniMax with OpenHands degrades fast past ~15k tokens of context.
- **Plan-first pattern:** Prefix every task prompt with "Before writing any code, produce a 5-step plan. Wait for 'go' before executing." This catches misunderstandings before code is written.
- **One Task = one PR:** Don't let the agent chain tasks. The review and Acceptance checkpoint between tasks is what keeps the build on-spec.
- **Regression guard:** After every task, OpenHands runs `npm run build` AND loads the old app without the flag. If either breaks, revert.
- **Keep TODO-BACKEND.md sacred:** It's the contract between frontend tasks and the backend work that needs to catch up. Don't let the agent silently work around missing endpoints.
