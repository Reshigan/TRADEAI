# Standard State Components

## Overview

Standard state components provide consistent UI patterns for common states across the TRADEAI platform: empty states, error states, and loading states.

## Components

### EmptyState

Displays when there's no data to show.

```jsx
import { EmptyState } from '../components/states';

<EmptyState
  title="No products found"
  description="Get started by creating your first product"
  action={<Button onClick={handleCreate}>Create Product</Button>}
/>
```

**Props:**
- `icon` - Custom icon (ReactNode)
- `iconColor` - Icon color (string, default: 'text.secondary')
- `title` - Title text (string, default: 'No data found')
- `description` - Description text (string)
- `action` - Primary action button (ReactNode)
- `secondaryAction` - Secondary action button (ReactNode)
- `variant` - Preset variant ('default' | 'search' | 'filter' | 'error')
- `sx` - Custom styles (object)
- `elevation` - Paper elevation (number, default: 0)
- `bordered` - Show border (boolean, default: true)

**Variants:**
- `default` - Inbox icon, general empty state
- `search` - Search icon, no search results
- `filter` - Filter icon, no filtered results
- `error` - Error icon, error empty state

### ErrorState

Displays when an error occurs.

```jsx
import { ErrorState } from '../components/states';

<ErrorState
  title="Failed to load products"
  message="Unable to connect to the server. Please try again."
  error={error}
  onRetry={handleRetry}
/>
```

**Props:**
- `title` - Error title (string, default: 'Something went wrong')
- `message` - Error message (string, default: 'An unexpected error occurred...')
- `error` - Error object for detailed message (Error)
- `onRetry` - Retry callback (function)
- `onGoHome` - Go home callback (function)
- `showRetry` - Show retry button (boolean, default: true)
- `showGoHome` - Show go home button (boolean, default: false)
- `sx` - Custom styles (object)
- `elevation` - Paper elevation (number, default: 0)
- `bordered` - Show border (boolean, default: true)
- `severity` - Error severity ('error' | 'warning', default: 'error')

### SkeletonList

Displays loading skeleton while data is being fetched.

```jsx
import { SkeletonList } from '../components/states';

<SkeletonList rows={5} variant="table" />
```

**Props:**
- `rows` - Number of skeleton rows (number, default: 5)
- `variant` - Skeleton variant ('table' | 'card' | 'list', default: 'table')
- `showHeader` - Show table header (boolean, default: true)
- `sx` - Custom styles (object)

**Variants:**
- `table` - Table-style skeleton with header and rows
- `card` - Card-style skeleton with avatar and content
- `list` - List-style skeleton with items

## Usage Patterns

### Loading → Empty → Data Flow

```jsx
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Loading state
  if (loading) {
    return (
      <PageLayout title="Products">
        <SkeletonList rows={8} variant="table" />
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout title="Products">
        <ErrorState
          title="Failed to load products"
          error={error}
          onRetry={loadProducts}
        />
      </PageLayout>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <PageLayout title="Products">
        <EmptyState
          title="No products yet"
          description="Get started by creating your first product"
          action={<Button onClick={handleCreate}>Create Product</Button>}
        />
      </PageLayout>
    );
  }

  // Data state
  return (
    <PageLayout title="Products">
      <ProductTable products={products} />
    </PageLayout>
  );
}
```

### Search Results Empty State

```jsx
<EmptyState
  variant="search"
  title="No results found"
  description={`No products match "${searchQuery}". Try adjusting your search.`}
  action={<Button onClick={handleClearSearch}>Clear Search</Button>}
/>
```

### Filtered Results Empty State

```jsx
<EmptyState
  variant="filter"
  title="No matching products"
  description="No products match the selected filters. Try adjusting your filters."
  action={<Button onClick={handleClearFilters}>Clear Filters</Button>}
/>
```

### Error with Retry and Go Home

```jsx
<ErrorState
  title="Failed to load data"
  message="The server is temporarily unavailable. Please try again later."
  error={error}
  onRetry={handleRetry}
  onGoHome={() => navigate('/dashboard')}
  showGoHome
/>
```

### Warning Severity Error

```jsx
<ErrorState
  severity="warning"
  title="Partial data loaded"
  message="Some data could not be loaded. The page may be incomplete."
  onRetry={handleRetry}
/>
```

### Card Skeleton

```jsx
<SkeletonList rows={4} variant="card" />
```

### List Skeleton

```jsx
<SkeletonList rows={6} variant="list" />
```

## Best Practices

1. **Always show loading state** - Use SkeletonList while fetching data
2. **Provide helpful empty states** - Include description and action button
3. **Make errors actionable** - Always provide a retry button
4. **Use appropriate variants** - Match the variant to the context (search, filter, etc.)
5. **Keep messages user-friendly** - Avoid technical jargon in user-facing messages
6. **Show error details in development** - ErrorState automatically shows stack traces in dev mode

## Examples

### Complete Page with All States

```jsx
function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll({ search: searchQuery });
      setProducts(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery]);

  const renderContent = () => {
    if (loading) {
      return <SkeletonList rows={8} variant="table" />;
    }

    if (error) {
      return (
        <ErrorState
          title="Failed to load products"
          error={error}
          onRetry={loadProducts}
          onGoHome={() => navigate('/dashboard')}
          showGoHome
        />
      );
    }

    if (products.length === 0) {
      if (searchQuery) {
        return (
          <EmptyState
            variant="search"
            title="No results found"
            description={`No products match "${searchQuery}"`}
            action={<Button onClick={() => setSearchQuery('')}>Clear Search</Button>}
          />
        );
      }

      return (
        <EmptyState
          title="No products yet"
          description="Get started by creating your first product"
          action={<Button onClick={handleCreate}>Create Product</Button>}
        />
      );
    }

    return <ProductTable products={products} />;
  };

  return (
    <PageLayout
      title="Products"
      subtitle={!loading && !error ? `${products.length} products` : undefined}
      toolbar={
        <Button variant="contained" onClick={handleCreate}>
          Add Product
        </Button>
      }
    >
      {renderContent()}
    </PageLayout>
  );
}
```

## Benefits

- **Consistency**: Same look and feel across all modules
- **User Experience**: Clear feedback for all states
- **Accessibility**: Built-in semantic HTML and ARIA attributes
- **Developer Experience**: Simple API, less boilerplate code
- **Maintainability**: Changes apply across all usages

## Related Components

- `PageLayout` - For consistent page structure
- `FilterBar` - For filtering UI (coming soon)
- `TablePro` - For data tables (coming soon)
