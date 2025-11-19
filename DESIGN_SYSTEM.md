# TRADEAI Design System

## Design Principles

1. **Insight-First**: Every page leads with key metrics and actionable insights
2. **Progressive Disclosure**: Show essential information first, advanced features on demand
3. **Consistent Patterns**: Use the same layouts and interactions across similar pages
4. **Minimal Cognitive Load**: Remove clutter, focus on core workflows
5. **Modern & Professional**: Clean, spacious layouts with clear visual hierarchy

## Page Templates

### 1. Overview/Dashboard Template
**Purpose**: Provide at-a-glance insights and quick access to key actions

**Structure**:
- **Summary Header**: 3-4 key KPI cards with trend indicators
- **Primary CTA**: Single prominent action button
- **Insights Section**: AI-powered recommendations or alerts
- **Quick Actions**: 3-4 most common actions
- **Recent Activity**: Latest relevant items

**Remove**: Excessive filters, redundant buttons, cluttered sidebars

### 2. List Template
**Purpose**: Browse, filter, and act on collections of items

**Structure**:
- **Page Header**: Title + primary CTA (e.g., "Create New")
- **Filter Bar**: Collapsible, with saved presets
- **Data Grid**: Clean table with sortable columns, row actions
- **Pagination**: Bottom of page
- **Bulk Actions**: Checkbox selection + action bar

**Remove**: Duplicate export buttons, excessive column options, redundant filters

### 3. Detail Template
**Purpose**: View and edit a single item with related information

**Structure**:
- **Summary Header**: Key info + status + primary action
- **Tabs**: Organize related information (Overview, Details, Activity, Documents)
- **Overview Tab**: Most important fields and metrics
- **Action Menu**: Kebab menu for secondary actions

**Remove**: Redundant save buttons, excessive tabs, cluttered forms

### 4. Wizard/Flow Template
**Purpose**: Guide users through multi-step processes

**Structure**:
- **Left Stepper**: Visual progress indicator
- **Content Area**: Current step content
- **Footer**: Back/Next/Save buttons
- **Progress Bar**: Top of page

**Remove**: Excessive validation messages, redundant navigation

## Color Palette

### Primary Colors
- **Primary Blue**: #3B82F6 (buttons, links, active states)
- **Secondary Green**: #10B981 (success, positive metrics)
- **Background**: #F8FAFC (page background)
- **Paper**: #FFFFFF (cards, modals)

### Semantic Colors
- **Error**: #EF4444
- **Warning**: #F59E0B
- **Info**: #3B82F6
- **Success**: #10B981

### Text Colors
- **Primary**: #0F172A (headings, important text)
- **Secondary**: #64748B (body text, labels)
- **Disabled**: #CBD5E1

## Typography

### Font Family
- **Primary**: Inter, Roboto, Helvetica, Arial, sans-serif

### Scale
- **H1**: 32px, 700 weight (page titles)
- **H2**: 28px, 700 weight (section titles)
- **H3**: 24px, 600 weight (card titles)
- **H4**: 20px, 600 weight (subsections)
- **Body**: 16px, 400 weight
- **Small**: 14px, 400 weight
- **Caption**: 12px, 400 weight

## Spacing

### Base Unit: 8px

### Common Spacing
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### Card Padding: 16-24px
### Section Spacing: 24-32px

## Components

### Cards
- **Border Radius**: 12px
- **Shadow**: 0 1px 3px rgba(15, 23, 42, 0.1)
- **Hover**: 0 4px 6px rgba(15, 23, 42, 0.1)
- **Padding**: 16-24px

### Buttons
- **Primary**: Filled, primary color
- **Secondary**: Outlined, primary color
- **Text**: No background, primary color
- **Border Radius**: 8px
- **Padding**: 8px 16px
- **Font Weight**: 600

### Data Grids
- **Header**: Light background (#F8FAFC), 600 weight
- **Row Hover**: #F8FAFC
- **Border**: #F1F5F9
- **Density**: Comfortable (48px row height)

### Forms
- **Input Border Radius**: 8px
- **Label**: 14px, 600 weight, above input
- **Helper Text**: 12px, below input
- **Error State**: Red border + error text

## Navigation Simplification

### Top-Level Categories (MegaMenu)
1. **Plan**: Budget planning, promotion planning, simulation
2. **Execute**: Promotions, trade spends, activities
3. **Analyze**: Performance, reports, forecasting
4. **Optimize**: Reallocation, scenario planning
5. **Approvals**: Pending approvals
6. **Claims & Deductions**: Financial management
7. **Master Data**: Customers, products, hierarchies

### Remove from Navigation
- Duplicate links
- Rarely used admin functions (move to settings)
- Redundant dashboard links

## Key Metrics by Page Type

### Dashboard Pages
- **JAM Dashboard**: Budget utilization, active promotions, pending approvals, ROI
- **Manager Dashboard**: Team performance, budget vs actual, top performers, alerts

### List Pages
- **Promotions**: Total active, total budget, avg ROI, upcoming
- **Budgets**: Total allocated, utilized %, remaining, variance
- **Trade Spends**: Total spend, pending claims, reconciliation status
- **Customers**: Total customers, active, revenue contribution
- **Products**: Total SKUs, active promotions, top performers

### Detail Pages
- **Promotion Detail**: Budget, actual spend, ROI, lift, status
- **Budget Detail**: Allocated, utilized, remaining, variance %
- **Customer Detail**: Revenue, active promotions, payment status
- **Product Detail**: Sales, promotions, margin, inventory

## Functions to Remove/Simplify

### Remove
- Duplicate export buttons (keep one in action menu)
- Redundant "Refresh" buttons (auto-refresh)
- Excessive filter options (keep top 5 most used)
- Multiple save buttons (one at top right)
- Rarely used bulk actions (move to menu)

### Simplify
- Combine related actions into menus
- Use progressive disclosure for advanced features
- Reduce form fields to essentials (move rest to "Advanced")
- Consolidate duplicate navigation paths

## Implementation Priority

1. **Phase 1**: Dashboards (JAM, Manager) - highest impact
2. **Phase 2**: Core workflows (Promotions, Budgets, Trade Spends)
3. **Phase 3**: Supporting pages (Customers, Products, Claims)
4. **Phase 4**: Admin pages (Settings, Users, Companies)

## Success Metrics

- **Reduced clicks to complete tasks**: Target 30% reduction
- **Faster page load times**: Target <2s
- **Higher feature adoption**: Track usage of key features
- **Lower support requests**: Track UI-related questions
- **Improved user satisfaction**: Survey scores
