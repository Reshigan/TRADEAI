# TRADEAI Icon System Spec

**Status:** Ready to implement.
**Base library:** Lucide React (already in `frontend/package.json` at `lucide-react@0.555.0`).
**Goal:** One coherent icon vocabulary across the app. Every TRADEAI concept has exactly one icon. Every new feature uses an existing token or commissions one through this spec.

---

## Why not all-custom

Before the cost: the single biggest UX risk of a custom icon set is *drift*. Within six months, five developers draw five different "Claim" icons in five different styles and the app looks like a ransom note. Lucide gives you 1,400+ icons drawn on the same 24px 2px-stroke grid by a dedicated icon designer. Use it as the spine. Commission custom icons only where Lucide has no adequate metaphor — and draw those on the same grid so they blend invisibly.

This spec does three things:

1. **Assigns every TRADEAI concept to a specific Lucide icon** — kills the "which icon for Promotion this week?" problem.
2. **Identifies the ~15 gaps** where Lucide doesn't have a good metaphor — the actual custom icon commission list.
3. **Specifies the drawing contract** so custom icons sit on the same grid as Lucide and can be extended without a designer present.

---

## Token architecture

Icons are never imported ad-hoc from Lucide in feature code. They come from one place:

```
frontend/src/shell-v4/icons/
├── index.js           # Single barrel export — every icon token
├── tokens.js          # The Map: TRADEAI concept → icon component
├── custom/            # Custom SVG components (for the ~15 gaps)
│   ├── TradeSpend.jsx
│   ├── Baseline.jsx
│   ├── Cannibalization.jsx
│   └── ...
└── Icon.jsx           # <Icon name="promotion" size={20} /> wrapper
```

**Single rule, lint-enforced:** Files in `shell-v4/**` may NOT import directly from `lucide-react` or from `custom/*.jsx`. They may only import from `shell-v4/icons`.

### `tokens.js` — the concept-to-icon map

Every token is a two-part key: **domain** and **concept**. This forces designers and devs to state the domain, which catches ambiguity (is this "target" an objective or a bullseye?).

```js
// shell-v4/icons/tokens.js
import {
  LayoutDashboard, CalendarRange, Zap, CheckSquare, Landmark, BarChart3, Database, Shield,
  Wallet, Receipt, FileText, FileSpreadsheet, Scale, BookOpen, PieChart, Layers,
  Users, Package, Store, Building2, Link2, Lock, Sun, Moon, Monitor, Settings,
  Plus, Search, Filter, SortAsc, Download, Upload, Share2, Copy, Trash2, Edit3, Eye, EyeOff,
  Bell, BellRing, MessageSquare, HelpCircle, LogOut, ChevronDown, ChevronRight, ChevronLeft,
  DollarSign, TrendingUp, TrendingDown, LineChart, Target, AlertTriangle, AlertCircle,
  CheckCircle2, XCircle, Clock, RefreshCw, Save, Undo2, History, Archive,
  ShoppingCart, Megaphone, Gift, Tag, Percent,
  Sparkles, Wand2, Brain, Lightbulb, Info,
  Activity, Workflow, GitBranch, GitMerge, Shuffle,
  Globe, Map, MapPin, Flag,
  Mail, Phone, Paperclip, Printer, Camera,
  ThumbsUp, ThumbsDown, Star, Bookmark,
  Keyboard, MousePointer2, HandMetal,
} from 'lucide-react';

// Custom — see §Custom Icons below
import TradeSpend         from './custom/TradeSpend';
import Baseline           from './custom/Baseline';
import Cannibalization    from './custom/Cannibalization';
import ForwardBuy         from './custom/ForwardBuy';
import Accrual            from './custom/Accrual';
import Deduction          from './custom/Deduction';
import Rebate             from './custom/Rebate';
import ThreeWayMatch      from './custom/ThreeWayMatch';
import KAMWallet          from './custom/KAMWallet';
import TradingTerm        from './custom/TradingTerm';
import PromoMechanic      from './custom/PromoMechanic';
import Halo               from './custom/Halo';
import Uplift             from './custom/Uplift';
import JBP                from './custom/JBP';
import TradeAILogo        from './custom/TradeAILogo';

export const icons = {
  // ————————————————————————————————————————————————————————
  // PROCESS GROUPS (navigation rails)
  // ————————————————————————————————————————————————————————
  'nav/home':          LayoutDashboard,
  'nav/plan':          CalendarRange,
  'nav/execute':       Zap,
  'nav/approve':       CheckSquare,
  'nav/settle':        Landmark,
  'nav/analyze':       BarChart3,
  'nav/data':          Database,
  'nav/admin':         Shield,

  // ————————————————————————————————————————————————————————
  // CORE OBJECTS — one canonical icon per business entity
  // ————————————————————————————————————————————————————————
  'object/promotion':      Megaphone,
  'object/budget':         DollarSign,
  'object/tradespend':     TradeSpend,          // CUSTOM
  'object/campaign':       Target,
  'object/scenario':       GitBranch,           // forks of possible futures
  'object/forecast':       TrendingUp,
  'object/customer':       Users,
  'object/product':        Package,
  'object/vendor':         Store,
  'object/claim':          FileText,
  'object/deduction':      Deduction,           // CUSTOM
  'object/dispute':        AlertCircle,
  'object/accrual':        Accrual,             // CUSTOM
  'object/settlement':     Landmark,
  'object/rebate':         Rebate,              // CUSTOM
  'object/invoice':        Receipt,
  'object/purchaseOrder':  FileSpreadsheet,
  'object/payment':        Wallet,
  'object/tradingTerm':    TradingTerm,         // CUSTOM
  'object/baseline':       Baseline,            // CUSTOM
  'object/report':         FileSpreadsheet,
  'object/user':           Users,
  'object/tenant':         Building2,
  'object/company':        Building2,
  'object/jbp':            JBP,                 // CUSTOM — retailer-manufacturer shared plan
  'object/kamWallet':      KAMWallet,           // CUSTOM
  'object/postMortem':     History,

  // ————————————————————————————————————————————————————————
  // ANALYTICAL CONCEPTS — these are the hardest to convey
  // ————————————————————————————————————————————————————————
  'concept/uplift':           Uplift,           // CUSTOM — rising step chart with arrow
  'concept/cannibalization':  Cannibalization,  // CUSTOM — one bar eating from another
  'concept/forwardBuy':       ForwardBuy,       // CUSTOM — bar pulled left from future
  'concept/halo':             Halo,             // CUSTOM — radiating ring from a product
  'concept/incremental':      TrendingUp,
  'concept/roi':              Percent,
  'concept/variance':         GitMerge,
  'concept/elasticity':       Activity,
  'concept/seasonality':      CalendarRange,
  'concept/substitution':     Shuffle,
  'concept/threeWayMatch':    ThreeWayMatch,    // CUSTOM — three arrows meeting
  'concept/promoMechanic':    PromoMechanic,    // CUSTOM — percentage inside a price tag

  // ————————————————————————————————————————————————————————
  // STATE & STATUS
  // ————————————————————————————————————————————————————————
  'status/draft':          Edit3,
  'status/pending':        Clock,
  'status/approved':       CheckCircle2,
  'status/active':         Activity,
  'status/completed':      CheckCircle2,
  'status/rejected':       XCircle,
  'status/cancelled':      XCircle,
  'status/overdue':        AlertTriangle,
  'status/locked':         Lock,
  'status/archived':       Archive,

  // ————————————————————————————————————————————————————————
  // ACTIONS — verb-first
  // ————————————————————————————————————————————————————————
  'action/create':       Plus,
  'action/edit':         Edit3,
  'action/delete':       Trash2,
  'action/duplicate':    Copy,
  'action/submit':       Upload,
  'action/approve':      CheckSquare,
  'action/reject':       XCircle,
  'action/export':       Download,
  'action/import':       Upload,
  'action/share':        Share2,
  'action/view':         Eye,
  'action/hide':         EyeOff,
  'action/search':       Search,
  'action/filter':       Filter,
  'action/sort':         SortAsc,
  'action/refresh':      RefreshCw,
  'action/save':         Save,
  'action/undo':         Undo2,
  'action/print':        Printer,
  'action/attach':       Paperclip,
  'action/comment':      MessageSquare,
  'action/favorite':     Star,
  'action/bookmark':     Bookmark,

  // ————————————————————————————————————————————————————————
  // AI — keep consistent so users learn "sparkles = AI"
  // ————————————————————————————————————————————————————————
  'ai/insight':        Sparkles,          // default "there's an AI finding here"
  'ai/suggest':        Wand2,             // AI suggestion affordance
  'ai/explain':        Info,              // open the explainability drawer
  'ai/model':          Brain,             // model metadata
  'ai/recommendation': Lightbulb,
  'ai/anomaly':        AlertTriangle,
  'ai/confidence':     Activity,

  // ————————————————————————————————————————————————————————
  // SIGNAL / TREND
  // ————————————————————————————————————————————————————————
  'signal/up':       TrendingUp,
  'signal/down':     TrendingDown,
  'signal/flat':     LineChart,
  'signal/positive': CheckCircle2,
  'signal/negative': XCircle,
  'signal/warning':  AlertTriangle,
  'signal/info':     Info,

  // ————————————————————————————————————————————————————————
  // UI CHROME
  // ————————————————————————————————————————————————————————
  'ui/menu':           Layers,
  'ui/chevronDown':    ChevronDown,
  'ui/chevronRight':   ChevronRight,
  'ui/chevronLeft':    ChevronLeft,
  'ui/notification':   Bell,
  'ui/notificationOn': BellRing,
  'ui/help':           HelpCircle,
  'ui/settings':       Settings,
  'ui/logout':         LogOut,
  'ui/themeLight':     Sun,
  'ui/themeDark':      Moon,
  'ui/themeAuto':      Monitor,
  'ui/keyboard':       Keyboard,
  'ui/integration':    Link2,
  'ui/workflow':       Workflow,
  'ui/globe':          Globe,
  'ui/location':       MapPin,

  // ————————————————————————————————————————————————————————
  // BRAND
  // ————————————————————————————————————————————————————————
  'brand/tradeai':     TradeAILogo,             // CUSTOM — wordmark + mark
};
```

### The `<Icon />` wrapper

```jsx
// shell-v4/icons/Icon.jsx
import React from 'react';
import { icons } from './tokens';

export default function Icon({ name, size = 20, color = 'currentColor', strokeWidth, className, title, ...rest }) {
  const Glyph = icons[name];
  if (!Glyph) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Icon] Unknown icon token: "${name}"`);
    }
    return null;
  }
  return (
    <Glyph
      size={size}
      color={color}
      strokeWidth={strokeWidth ?? 1.75}   // Lucide default is 2; 1.75 at 20px reads a touch cleaner
      className={className}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? 'img' : undefined}
      {...rest}
    />
  );
}
```

### Usage

```jsx
import Icon from '@shell-v4/icons';

<Icon name="object/promotion" size={20} />
<Icon name="ai/insight" size={16} color={tokens.color.accent.default} title="AI finding" />
<Icon name="status/approved" size={14} />
```

**Never** in feature code:
```jsx
// ❌ DO NOT DO THIS in shell-v4/**
import { Megaphone } from 'lucide-react';
<Megaphone size={20} />
```

### Lint rule

Add to `frontend/.eslintrc.js` (or the shell-v4 subproject's config):

```js
overrides: [{
  files: ['src/shell-v4/**/*.{js,jsx,ts,tsx}'],
  excludedFiles: ['src/shell-v4/icons/**'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        { name: 'lucide-react',
          message: 'Import icons from @shell-v4/icons, not lucide-react directly.' },
      ],
      patterns: [
        { group: ['**/icons/custom/*'],
          message: 'Import from @shell-v4/icons barrel, not from custom/*.' },
      ],
    }],
  },
}]
```

---

## Size scale — 4 sizes only

Keep it small. More sizes → more off-grid pixel rendering.

| Use | Size | Stroke |
|---|---|---|
| Dense list cells, chips, inline text | **14px** | 1.75 |
| Default UI — buttons, nav items, tabs | **20px** | 1.75 |
| Object-page headers, launchpad tiles | **24px** | 1.75 |
| Empty-state illustrations, onboarding | **32px** | 1.5 |

Icons rendered at any size NOT in this list should produce a lint warning. Exception: brand mark in TopBar may be 28px.

---

## Color scale — use semantic tokens

Icons inherit `color: currentColor` by default — set color on the parent via the design tokens from `shell-v4/theme/tokens.js`:

```jsx
// default nav icon
<span style={{ color: tokens.color.fg.muted }}><Icon name="object/promotion" /></span>
// active nav icon
<span style={{ color: tokens.color.accent.default }}><Icon name="object/promotion" /></span>
// destructive action
<span style={{ color: tokens.color.signal.negative }}><Icon name="action/delete" /></span>
```

**Never hardcode hex** on an icon. This is lint-enforceable: the `<Icon>` `color` prop accepts a token key, not a raw hex string.

---

## Custom Icons — the commission list

These are the 15 icons where Lucide has no adequate metaphor. **Do not freehand these.** Follow the contract below, or commission a designer.

### The drawing contract

Every custom icon must:

1. **Canvas:** 24 × 24 pixels. ViewBox `0 0 24 24`.
2. **Stroke:** 1.75px nominal (matches Lucide default at 20px rendering).
3. **Caps and joins:** `stroke-linecap="round"`, `stroke-linejoin="round"`.
4. **Fill:** `none`. Icons are stroked, not filled, to match Lucide.
5. **Color:** `stroke="currentColor"`. Never hardcode.
6. **Safe area:** All important strokes within 22 × 22. Outer 1px is padding.
7. **No text.** Glyphs must be recognizable without any letterforms.
8. **Test at 14, 20, 24px.** A glyph that works at 24 but mushes at 14 is rejected.
9. **Align to pixel grid** at 20px rendering (the default UI size). Stroke endpoints should land on half-pixel boundaries to avoid sub-pixel blur.
10. **Contrast in two colors.** The icon must read in both `color.fg.default` on `color.bg.base` AND `color.fg.inverse` on `color.bg.inverse`.

### React component shape

```jsx
// shell-v4/icons/custom/TradeSpend.jsx
import React from 'react';

export default function TradeSpend({ size = 24, color = 'currentColor', strokeWidth = 1.75, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {/* paths here */}
    </svg>
  );
}
```

### The 15 custom icons — brief, metaphor, notes

| Token | Brief | Metaphor | Starter concept |
|---|---|---|---|
| **object/tradespend** | Money flowing into the trade channel | A dollar sign inside a downward conveyor/funnel | `$` glyph nestled in a chevron-down funnel |
| **object/deduction** | Money being subtracted from an invoice | A minus sign in a document corner | Receipt with `−` overlaid on its corner |
| **object/accrual** | Value accumulating over time, not yet paid | Stacked coins with a dotted outline on top layer | Three stacked ellipses, topmost dashed |
| **object/rebate** | Money returning to the customer | A reverse arrow around a dollar sign | Circular arrow CCW around `$` |
| **object/tradingTerm** | A contractual term between parties | A handshake inside a bracket | `[ ]` bracket enclosing two overlapping arcs (hands) |
| **object/kamWallet** | A KAM's allocated spend budget | A wallet with a person silhouette tag | Lucide `Wallet` + a tiny badge-person overlay |
| **object/baseline** | The pre-promotion sales baseline | A flat dashed line under a peak | Two-segment line: dashed flat base, solid upward peak |
| **object/jbp** | Joint business plan — two parties, one plan | Two arrows meeting on a shared document | Document with two converging arrows at top edge |
| **concept/uplift** | Sales rising above baseline | Step-up bar chart with an upward arrow | Two bars, second taller, arrow springing from top of first to top of second |
| **concept/cannibalization** | One product's sale eating another | A larger bar with a bite taken out, crumbs as smaller bar | Rectangle with notched corner, adjacent smaller rectangle |
| **concept/forwardBuy** | Customer buying early, future demand pulled back | Bar with a leftward-pointing arrow pulling from a future position | Two dotted-outline future bars, solid bar on the left with arrow from dotted to solid |
| **concept/halo** | Promoted item's spillover to adjacent items | Central circle with radiating ring touching two smaller circles | Product dot with ring, two secondary dots on ring circumference |
| **concept/threeWayMatch** | Invoice + PO + Payment matching | Three arrows meeting at a point | Three arrows at 120° converging on central checkmark |
| **concept/promoMechanic** | The mechanic of a promotion (discount type) | A price tag with a percent sign | Lucide-style tag outline with `%` inside |
| **brand/tradeai** | TradeAI mark | A spark / ascending chart / abstract "TA" monogram | Separate spec — see §Brand Mark below |

### Acceptance bar for each custom icon

Each submitted icon must be checked against all 10 items in the drawing contract. A Figma template with pixel grid, safe area, and 14/20/24/32px preview should be created in the repo at `frontend/design-tokens/icon-template.fig` for designers to work in.

### Before commissioning — test with AI-generated starter SVGs

For the 15 icons, a competent dev can sketch starter SVGs using the contract above in about a day. Ship those to users, observe which get misread, commission a designer only for the ones that need refinement. This is much cheaper than a $5k full-set commission up front.

---

## Brand Mark

The TradeAI logo is its own asset, not an icon token in the usual sense. Spec:

- **Files:** `logo-mark.svg` (square, the "T" or spark alone), `logo-wordmark.svg` (TradeAI lockup), `logo-mark-inverse.svg`, `logo-wordmark-inverse.svg`.
- **Sizes used:** 24px (TopBar mark only), 32px (login screen), 64px+ (email/marketing — out of scope for UI).
- **The mark component** lives at `shell-v4/icons/custom/TradeAILogo.jsx` and accepts `variant='mark'|'wordmark'` and `tone='default'|'inverse'`.

The existing `assets/logo.svg` and `assets/logo-design.svg` in the repo should be audited against a designer's review before being canonized. Do not promote the current files to official brand without a designer's sign-off — signed-off assets get a version number (`logo-v1.svg`) and move into `frontend/src/shell-v4/brand/`.

---

## Migration plan

### Week 1 — Build the system
1. Create `shell-v4/icons/` with `tokens.js`, `Icon.jsx`, `index.js`.
2. Implement all 15 custom icons as starter SVGs following the contract (not a designer required — use the metaphors above).
3. Add the lint rule.
4. Add unit tests:
   - Every token in `tokens.js` renders without error at sizes 14/20/24.
   - Unknown token name logs a warning (non-prod) and returns null.

### Week 2 — Migrate shell-v4 call sites
As you build shell-v4 components (per the main build spec), use `<Icon name="..." />` from day one. Lint prevents regressions.

### Week 3–6 — Optional: migrate legacy
Do not force a big-bang migration of the existing `frontend/src/components/**` code. Old code keeps its `lucide-react` direct imports; the lint rule only applies to `shell-v4/`. When a legacy page is replaced by its shell-v4 equivalent, its imports die with it.

### Month 2+ — Designer polish pass
Commission a designer for a polish pass on the 15 custom icons. Brief: "make these blend with Lucide at 20px." Budget $3–5k. Get two rounds.

---

## Governance

### Adding a new icon

1. Check `tokens.js` first. If the concept exists under a different name, use that name.
2. If a Lucide icon works, add a new token to `tokens.js` pointing at the Lucide import. Done.
3. If no Lucide icon works, draft a custom SVG against the drawing contract. Open a PR with:
   - The new custom component in `shell-v4/icons/custom/`.
   - The registration in `tokens.js`.
   - A screenshot of the icon rendered at 14/20/24/32px on both light and dark backgrounds.
   - A one-sentence rationale: why no Lucide icon suffices.
4. At least one design-literate reviewer must approve.

### Deprecating an icon

Tokens never get deleted. They get marked deprecated and aliased to their replacement:

```js
'object/oldName': icons['object/newName'],   // @deprecated — use object/newName
```

Deprecated tokens emit a console warning in non-production. Delete after two release cycles.

### Audit cadence

Once per quarter, run a script that:
- Lists every distinct `<Icon name="...">` usage in the codebase.
- Flags tokens used exactly once (candidates for consolidation).
- Flags tokens defined in `tokens.js` but never used (dead code).

---

## Anti-patterns — refuse these in code review

1. **`<Sparkles />` imported directly from lucide-react in a feature file.** Use `<Icon name="ai/insight" />`.
2. **Hardcoded size like `<Icon size={18} />`.** Use the 14/20/24/32 scale.
3. **Hardcoded color like `<Icon color="#10B981" />`.** Inherit from a parent with a token color.
4. **Two different icons for the same concept in two different pages.** Promotion is `Megaphone` everywhere, always. The Launchpad tile for Promotions, the sidebar, the detail page header, the list page's type column — same glyph, same token.
5. **Decorative icon without `title` prop next to screen-readable text.** Fine — it's `aria-hidden` by default. But if the icon stands alone (icon-only button), it **must** have a `title`.
6. **Stacking multiple icons on top of each other to express compound meaning.** If the concept is compound, commission one icon that captures it.

---

## One-page cheatsheet (for devs to bookmark)

```
# TradeAI Icons — Quick Reference

Import:
  import Icon from '@shell-v4/icons';

Use:
  <Icon name="<domain>/<concept>" size={20} />

Sizes:   14 | 20 (default) | 24 | 32
Color:   from tokens.color.*, never hex
Stroke:  1.75 always (don't override)

Domains:
  nav/       process navigation
  object/    business entity (promotion, budget, customer…)
  concept/   analytical concept (uplift, halo, cannibalization…)
  status/    object state (draft, approved, rejected…)
  action/    verb (create, submit, export…)
  ai/        AI surfaces (insight, explain, suggest…)
  signal/    trend (up, down, warning…)
  ui/        chrome (menu, notification, theme…)
  brand/     logos and brand marks

Don't know the token?   Open shell-v4/icons/tokens.js.
Can't find a match?     Open a PR per §Governance — Adding.
```
