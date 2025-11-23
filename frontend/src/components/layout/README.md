# PageLayout Component

## Overview

`PageLayout` is the canonical page layout component that provides consistent structure across all modules in the TRADEAI platform. It ensures a cohesive user experience by standardizing page elements like headers, breadcrumbs, toolbars, and content areas.

## Features

- **Automatic Breadcrumbs**: Auto-generates breadcrumbs from the current route
- **Flexible Slots**: Title, Subtitle, Tabs, Toolbar, FilterBar, Content, Footer
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Theme Integration**: Uses MUI theme for consistent spacing and styling
- **Customizable**: Extensive props for customization while maintaining consistency

## Basic Usage

```jsx
import PageLayout from '../components/layout/PageLayout';

function MyPage() {
  return (
    <PageLayout
      title="Products"
      subtitle="Manage your product catalog"
    >
      <YourContent />
    </PageLayout>
  );
}
```

## Props

### Content
- `children` - Main page content (required)

### Header
- `title` - Page title (string)
- `subtitle` - Page subtitle/description (string)
- `titleAction` - Action button/component next to title (ReactNode)

### Navigation
- `breadcrumbs` - Array of breadcrumb items: `[{ label: string, path?: string }]`
- `showBreadcrumbs` - Show/hide breadcrumbs (boolean, default: true)

### Layout Slots
- `tabs` - Tab navigation component (ReactNode)
- `toolbar` - Toolbar with action buttons (ReactNode)
- `filterBar` - Filter bar component (ReactNode)
- `footer` - Footer content (ReactNode)

### Container Settings
- `maxWidth` - Container max width ('xs' | 'sm' | 'md' | 'lg' | 'xl', default: 'xl')
- `disableGutters` - Disable container padding (boolean, default: false)

### Styling
- `sx` - Custom styles for root container (object)
- `contentSx` - Custom styles for content area (object)
- `background` - Background color ('default' | 'paper', default: 'default')

## Examples

### Simple Page

```jsx
<PageLayout title="Dashboard">
  <DashboardContent />
</PageLayout>
```

### Page with Toolbar

```jsx
<PageLayout
  title="Products"
  subtitle="Manage your product catalog"
  toolbar={
    <Button variant="contained" startIcon={<AddIcon />}>
      Add Product
    </Button>
  }
>
  <ProductList />
</PageLayout>
```

### Page with Tabs

```jsx
<PageLayout
  title="Product Details"
  tabs={
    <Tabs value={activeTab} onChange={handleTabChange}>
      <Tab label="Overview" value="overview" />
      <Tab label="Promotions" value="promotions" />
      <Tab label="Sales" value="sales" />
    </Tabs>
  }
>
  {activeTab === 'overview' && <Overview />}
  {activeTab === 'promotions' && <Promotions />}
  {activeTab === 'sales' && <Sales />}
</PageLayout>
```

### Page with Custom Breadcrumbs

```jsx
<PageLayout
  title="Product Details"
  breadcrumbs={[
    { label: 'Home', path: '/dashboard' },
    { label: 'Products', path: '/products' },
    { label: 'Product XYZ' }
  ]}
>
  <ProductDetails />
</PageLayout>
```

### Page with Filter Bar

```jsx
<PageLayout
  title="Products"
  toolbar={
    <Button variant="contained">Add Product</Button>
  }
  filterBar={
    <FilterBar
      filters={filters}
      onFilterChange={handleFilterChange}
    />
  }
>
  <ProductList />
</PageLayout>
```

### Full Example

```jsx
<PageLayout
  title="Products"
  subtitle="Manage your product catalog"
  breadcrumbs={[
    { label: 'Home', path: '/dashboard' },
    { label: 'Products' }
  ]}
  toolbar={
    <>
      <Button variant="outlined">Import</Button>
      <Button variant="outlined">Export</Button>
      <Button variant="contained" startIcon={<AddIcon />}>
        Add Product
      </Button>
    </>
  }
  filterBar={
    <FilterBar
      filters={filters}
      onFilterChange={handleFilterChange}
      onSaveView={handleSaveView}
    />
  }
  footer={
    <Typography variant="caption" color="text.secondary">
      Last updated: {lastUpdated}
    </Typography>
  }
>
  <ProductList />
</PageLayout>
```

## Best Practices

1. **Always use PageLayout** for all page-level components to ensure consistency
2. **Use automatic breadcrumbs** when possible (they're generated from the route)
3. **Keep titles concise** - use subtitle for longer descriptions
4. **Group related actions** in the toolbar
5. **Use standard spacing** - don't add custom margins/padding to children
6. **Leverage slots** - use the provided slots (toolbar, filterBar, etc.) rather than custom layouts

## Migration Guide

### Before (Old Pattern)

```jsx
function ProductList() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your product catalog
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained">Add Product</Button>
      </Box>
      <ProductTable />
    </Container>
  );
}
```

### After (New Pattern)

```jsx
function ProductList() {
  return (
    <PageLayout
      title="Products"
      subtitle="Manage your product catalog"
      toolbar={
        <Button variant="contained">Add Product</Button>
      }
    >
      <ProductTable />
    </PageLayout>
  );
}
```

## Benefits

- **Consistency**: All pages have the same structure and spacing
- **Maintainability**: Changes to layout apply across all pages
- **Accessibility**: Built-in semantic HTML and ARIA attributes
- **Responsive**: Mobile-friendly by default
- **Developer Experience**: Simple API, less boilerplate code

## Related Components

- `EmptyState` - For empty data states
- `ErrorState` - For error states
- `SkeletonList` - For loading states
- `FilterBar` - For filtering UI
- `TablePro` - For data tables (coming soon)
