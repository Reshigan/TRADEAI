# TRADEAI Enhanced Components Usage Guide

## 📚 Overview

This guide provides comprehensive documentation for using the enhanced UI components and templates in the TRADEAI platform.

---

## 🎨 Design System

### Theme Configuration

The enhanced theme (`src/theme.js`) provides:

```javascript
import theme from './theme';

// Access theme values
theme.palette.primary.main      // #2563EB
theme.palette.success.main      // #059669
theme.typography.h1             // Font styles
theme.shadows.lg                // Shadow definitions
theme.gradients.primary         // Gradient utilities
theme.status.active             // Status colors
```

### Color Palette

| Color | Usage | Example |
|-------|-------|---------|
| Primary (#2563EB) | Main actions, links | Buttons, active states |
| Secondary (#7C3AED) | AI features, accents | AI badges, special features |
| Success (#059669) | Positive metrics | ROI, growth indicators |
| Warning (#F59E0B) | Caution states | Pending approvals |
| Error (#DC2626) | Negative states | Declines, errors |
| Info (#0284C7) | Informational | Tips, notifications |

---

## 📦 Component Library

### 1. KPICard

**Purpose:** Display key metrics with professional styling

**Basic Usage:**
```jsx
import { KPICard } from './components/enhanced-index';

<KPICard
  title="Total Budget"
  value={fmt(budget)}
  trend={8.2}
  icon={DollarSign}
  color="#2563EB"
  subtitle="Annual allocation"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Card title/label |
| value | string\|number | - | Main value to display |
| trend | number | - | Percentage change |
| icon | Component | - | Lucide icon component |
| color | string | #2563EB | Primary color |
| subtitle | string | - | Additional context |
| loading | boolean | false | Loading state |
| onClick | function | - | Click handler |
| variant | string | 'default' | 'default', 'outlined', 'filled' |

**Variants:**
```jsx
// Compact KPI
<KPICompact title="Budget" value="$1M" trend={5} icon={DollarSign} />

// KPI with Sparkline
<KPIWithSparkline 
  title="Revenue" 
  value="$2.5M" 
  trend={12} 
  data={[100, 150, 200, 180, 250]} 
/>
```

---

### 2. PageHeader

**Purpose:** Consistent page headers with breadcrumbs and actions

**Basic Usage:**
```jsx
import { PageHeader } from './components/enhanced-index';

<PageHeader
  title="Promotions"
  subtitle="Manage all trade promotions"
  breadcrumbs={[
    { label: 'Execute', href: '/execute' },
    { label: 'Promotions', href: '/promotions' }
  ]}
  icon={Megaphone}
  actions={[
    { 
      label: 'Create New', 
      onClick: onCreate, 
      variant: 'contained',
      icon: <Plus size={18} />
    }
  ]}
/>
```

**With Tabs:**
```jsx
<PageHeader
  title="Budget Details"
  tabs={[
    { label: 'Overview', icon: <BarChart3 /> },
    { label: 'Transactions', icon: <FileText />, badge: 12 },
    { label: 'Reports', icon: <Download /> },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

---

### 3. EmptyState

**Purpose:** Friendly empty states for various scenarios

**Basic Usage:**
```jsx
import { EmptyState } from './components/enhanced-index';

<EmptyState
  variant="inbox"
  title="No items yet"
  description="Get started by creating your first item"
  action={{
    label: 'Create New',
    onClick: handleCreate,
    icon: <Plus size={18} />
  }}
/>
```

**Available Variants:**
- `default` - Generic empty state
- `search` - No search results
- `inbox` - Empty inbox/list
- `success` - Success state
- `error` - Error state
- `warning` - Warning state
- `data` - No data available
- `users` - No users
- `money` - Financial data empty
- `calendar` - No events
- `settings` - Configuration needed
- `upload` - Upload prompt
- `download` - Download available
- `filter` - No filtered results
- `ai` - AI features empty

**Specialized Components:**
```jsx
import { SearchEmptyState, FilterEmptyState } from './components/enhanced-index';

<SearchEmptyState query={searchQuery} onClear={clearSearch} />
<FilterEmptyState onClearFilters={clearFilters} />
```

---

### 4. LoadingState

**Purpose:** Professional loading indicators

**Full Page Loader:**
```jsx
import { PageLoader } from './components/enhanced-index';

<PageLoader 
  message="Loading dashboard..." 
  showProgress 
  progress={75} 
/>
```

**Skeleton Loaders:**
```jsx
import { CardSkeleton, DashboardSkeleton, TableSkeleton } from './components/enhanced-index';

// KPI skeleton
<CardSkeleton variant="kpi" />

// Dashboard skeleton
<DashboardSkeleton />

// Table skeleton
<TableSkeleton rows={10} />

// Form skeleton
<FormSkeleton fields={5} />
```

**Inline Loader:**
```jsx
import { InlineLoader } from './components/enhanced-index';

<InlineLoader size="small" text="Saving..." />
```

---

### 5. ListPageTemplate

**Purpose:** Complete list page with search, filters, sorting, pagination

**Basic Usage:**
```jsx
import { ListPageTemplate } from './components/enhanced-index';

<ListPageTemplate
  title="Customers"
  subtitle="Manage customer accounts"
  items={customers}
  loading={loading}
  totalItems={total}
  columns={[
    { 
      key: 'name', 
      label: 'Name', 
      type: 'avatar',
      sortable: true 
    },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'chip',
      filterable: true 
    },
    { 
      key: 'revenue', 
      label: 'Revenue',
      render: (value) => fmt(value)
    },
  ]}
  onCreate={handleCreate}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Column Types:**
- `text` - Default text display
- `avatar` - With avatar image
- `chip` - Status chip
- `progress` - Progress bar
- `currency` - Formatted currency
- `date` - Formatted date
- Custom render function

**Column Options:**
```javascript
{
  key: 'name',
  label: 'Customer Name',
  type: 'avatar',
  sortable: true,
  filterable: true,
  filterOptions: [...],
  align: 'left',
  render: (value, item) => <CustomComponent />,
  avatarValue: (item) => item.name,
  avatarLabel: (item) => item.email,
  chipMap: { active: 'Active', inactive: 'Inactive' },
  chipColors: { active: '#059669', inactive: '#94A3B8' },
}
```

---

### 6. DetailPageTemplate

**Purpose:** Professional detail view with tabs and actions

**Basic Usage:**
```jsx
import { DetailPageTemplate, StatsGrid } from './components/enhanced-index';

<DetailPageTemplate
  item={promotion}
  loading={loading}
  titleField="name"
  subtitleField="description"
  statusField="status"
  tabs={[
    { label: 'Overview', icon: <FileText /> },
    { label: 'Performance', icon: <BarChart3 />, badge: 3 },
    { label: 'Documents', icon: <FileText /> },
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onDuplicate={handleDuplicate}
>
  <StatsGrid stats={[
    { label: 'Budget', value: '$50K', icon: DollarSign, color: '#2563EB' },
    { label: 'Spend', value: '$35K', icon: Target, color: '#059669' },
    { label: 'ROI', value: '2.4x', icon: TrendingUp, color: '#F59E0B' },
  ]} />
</DetailPageTemplate>
```

**Helper Components:**
```jsx
import { InfoRow, StatsGrid, ActivityTimeline } from './components/enhanced-index';

<InfoRow label="Created" value={date} icon={Calendar} copyable />
<StatsGrid stats={stats} />
<ActivityTimeline activities={activities} />
```

---

### 7. FormPageTemplate

**Purpose:** Professional forms with validation and sections

**Basic Usage:**
```jsx
import { FormPageTemplate, FieldGroup } from './components/enhanced-index';

<FormPageTemplate
  title="Promotion"
  subtitle="Create a new trade promotion"
  mode="create"
  initialValues={{ name: '', budget: 0, status: 'draft' }}
  sections={[
    {
      title: 'Basic Information',
      icon: FileText,
      description: 'Enter the basic details of the promotion',
      fields: [
        { 
          name: 'name', 
          label: 'Promotion Name', 
          type: 'text', 
          required: true,
          xs: 12,
          md: 6,
        },
        { 
          name: 'type', 
          label: 'Type', 
          type: 'select',
          options: [
            { value: 'discount', label: 'Discount' },
            { value: 'bogo', label: 'BOGO' },
          ],
          xs: 12,
          md: 6,
        },
        {
          name: 'budget',
          label: 'Budget',
          type: 'currency',
          required: true,
          xs: 12,
          md: 4,
        },
      ],
    },
    {
      title: 'Dates',
      icon: Calendar,
      fields: [
        { 
          name: 'start_date', 
          label: 'Start Date', 
          type: 'date',
          required: true,
        },
        { 
          name: 'end_date', 
          label: 'End Date', 
          type: 'date',
          required: true,
        },
      ],
    },
  ]}
  validate={(values) => {
    const errors = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.budget) errors.budget = 'Budget is required';
    return errors;
  }}
  onSubmit={handleSubmit}
  onCancel={() => navigate(-1)}
/>
```

**Field Types:**
- `text` - Text input
- `textarea` - Multi-line text
- `select` - Dropdown select
- `autocomplete` - Searchable select
- `checkbox` - Checkbox
- `switch` - Toggle switch
- `radio` - Radio buttons
- `date` - Date picker
- `datetime` - Date-time picker
- `number` - Number input
- `currency` - Currency input with $ icon
- `percentage` - Percentage input with % icon
- `email` - Email input
- `url` - URL input
- `file` - File upload
- `password` - Password input

**Multi-Step Forms:**
```jsx
<FormPageTemplate
  title="New Promotion"
  steps={[
    {
      title: 'Basic Info',
      description: 'Enter basic promotion details',
      fields: [...],
    },
    {
      title: 'Budget & Dates',
      description: 'Set budget and timeline',
      fields: [...],
    },
    {
      title: 'Review',
      description: 'Review and submit',
      fields: [...],
    },
  ]}
/>
```

**Field Group:**
```jsx
<FieldGroup label="Contact Information" icon={User}>
  <TextField name="email" label="Email" type="email" />
  <TextField name="phone" label="Phone" type="tel" />
</FieldGroup>
```

---

## 🎯 Best Practices

### 1. Consistent Patterns

```jsx
// ✅ Good: Use templates for consistency
<ListPageTemplate {...listProps} />
<DetailPageTemplate {...detailProps} />
<FormPageTemplate {...formProps} />

// ❌ Avoid: Recreating similar layouts
<div className="custom-list">...</div>
```

### 2. Loading States

```jsx
// ✅ Good: Show skeletons
{loading ? <CardSkeleton variant="kpi" /> : <KPICard {...props} />}

// ❌ Avoid: Just spinners
{loading && <Spinner />}
```

### 3. Empty States

```jsx
// ✅ Good: Helpful empty states
{items.length === 0 ? (
  <EmptyState 
    title="No items" 
    action={{ label: 'Create', onClick: handleCreate }} 
  />
) : (
  <List items={items} />
)}

// ❌ Avoid: Blank pages
{items.length === 0 ? null : <List items={items} />}
```

### 4. Error Handling

```jsx
// ✅ Good: Clear error messages
{error && (
  <Alert severity="error">
    <AlertTitle>Error</AlertTitle>
    {error.message}
  </Alert>
)}

// ❌ Avoid: Silent failures
```

### 5. Responsive Design

```jsx
// ✅ Good: Responsive grid
<Grid container spacing={2.5}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    <KPICard {...props} />
  </Grid>
</Grid>

// ❌ Avoid: Fixed widths
<div style={{ width: '300px' }}>...</div>
```

---

## 📋 Migration Checklist

### For Existing Pages:

- [ ] Replace standard cards with `KPICard`
- [ ] Use `PageHeader` for consistent headers
- [ ] Add `EmptyState` for empty conditions
- [ ] Implement `ListPageTemplate` for list views
- [ ] Use `DetailPageTemplate` for detail views
- [ ] Apply `FormPageTemplate` for forms
- [ ] Add loading skeletons for all async data
- [ ] Update color usage to theme values
- [ ] Add proper error states
- [ ] Test responsive layouts

---

## 🔧 Customization

### Overriding Styles

```jsx
<KPICard
  title="Custom Card"
  sx={{
    '&:hover': { transform: 'scale(1.02)' },
    bgcolor: 'custom.color',
  }}
/>
```

### Custom Variants

```jsx
// Create custom variant
const CustomCard = (props) => (
  <KPICard
    {...props}
    variant="filled"
    color="secondary"
  />
);
```

---

## 📞 Support

For questions or issues:
- Check component source files for detailed prop types
- Review usage examples in enhanced pages
- Refer to `UI_ENHANCEMENT_SUMMARY.md` for overview

---

## 📖 Related Documentation

- `UI_ENHANCEMENT_SUMMARY.md` - Complete enhancement overview
- `DESIGN_SYSTEM.md` - Design principles and guidelines
- `theme.js` - Theme configuration reference
