# AI Widgets Unit Tests

## Overview

Comprehensive test suite for TradeAI AI/ML widget components. These tests ensure that all AI-powered dashboard widgets render correctly, handle data properly, and provide a reliable user experience.

## Test Coverage

### Widgets Tested

| Widget | Test File | Test Count | Status |
|--------|-----------|------------|--------|
| AI Demand Forecast | `AIDemandForecastWidget.test.jsx` | 25+ | ✅ Complete |
| AI Price Optimization | `AIPriceOptimizationWidget.test.jsx` | 30+ | ✅ Complete |
| AI Customer Segmentation | `AICustomerSegmentationWidget.test.jsx` | 35+ | ✅ Complete |
| AI Anomaly Detection | `AIAnomalyDetectionWidget.test.jsx` | 40+ | ✅ Complete |
| AI Model Health | `AIModelHealthWidget.test.jsx` | 35+ | ✅ Complete |
| **TOTAL** | **5 widgets** | **165+** | **✅ Phase 3 Complete** |

### Test Categories

Each widget test suite covers:

1. **Loading States** - CircularProgress display, skeleton states
2. **Success States** - Data rendering, charts, metrics
3. **Error Handling** - API failures, network errors, fallback behavior
4. **Refresh Functionality** - Manual refresh button, data refetch
5. **Auto-Refresh** - Interval-based updates (where applicable)
6. **Props Changes** - Refetch on prop updates
7. **API Calls** - Correct endpoints, parameters, headers
8. **Data Transformations** - ML service response → Widget format
9. **Edge Cases** - Missing data, empty arrays, zero values
10. **Cleanup** - Interval/timer cleanup on unmount

## Running Tests

### Run All Widget Tests

```bash
npm test -- ai-widgets
```

### Run Specific Widget Test

```bash
# Demand Forecast Widget
npm test -- AIDemandForecastWidget.test.jsx

# Price Optimization Widget
npm test -- AIPriceOptimizationWidget.test.jsx

# Customer Segmentation Widget
npm test -- AICustomerSegmentationWidget.test.jsx

# Anomaly Detection Widget
npm test -- AIAnomalyDetectionWidget.test.jsx

# Model Health Widget
npm test -- AIModelHealthWidget.test.jsx
```

### Run with Coverage

```bash
npm test -- --coverage ai-widgets
```

### Watch Mode

```bash
npm test -- --watch ai-widgets
```

## Test Structure

### Standard Test Pattern

```javascript
describe('WidgetName', () => {
  // Mock setup
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-token-123');
  });

  // ===== LOADING STATE TESTS =====
  test('should show loading state initially', () => {
    // Test implementation
  });

  // ===== SUCCESS STATE TESTS =====
  test('should render data successfully', async () => {
    // Test implementation
  });

  // ===== ERROR HANDLING TESTS =====
  test('should display error message on API failure', async () => {
    // Test implementation
  });

  // ... more test categories
});
```

## Widget Test Details

### 1. AIDemandForecastWidget Tests

**File:** `AIDemandForecastWidget.test.jsx`  
**Test Count:** 25+  
**Component:** Displays demand forecasts with charts and trend indicators

#### Key Test Cases

- **Loading State**: CircularProgress while fetching
- **Success State**: Forecast chart with 7 days of data
- **Trend Indicators**: Up/down arrows based on forecast direction
- **Confidence Display**: Percentage with color coding (>80% = green)
- **Model Version**: Displays "v1.0.0" or "fallback"
- **Refresh**: Manual refresh button triggers refetch
- **Props Changes**: Refetch on productId, customerId, or days change
- **Fallback Data**: Displays simulated data indicator
- **Chart Rendering**: Recharts LineChart with proper data
- **API Integration**: Correct POST to `/ai/forecast/demand`

#### Mock Strategy

```javascript
// Mock axios
jest.mock('axios');
axios.post.mockResolvedValueOnce({ data: mockForecastData });

// Mock recharts (avoid canvas issues)
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  // ... more mocks
}));
```

#### Sample Test

```javascript
test('should display forecast data with trend indicator', async () => {
  axios.post.mockResolvedValueOnce({ data: mockForecastData });

  render(
    <Wrapper>
      <AIDemandForecastWidget productId="PROD-123" />
    </Wrapper>
  );

  await waitFor(() => {
    expect(screen.getByText('AI Demand Forecast')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByText(/Confidence: 87%/)).toBeInTheDocument();
  });
});
```

---

### 2. AIPriceOptimizationWidget Tests

**File:** `AIPriceOptimizationWidget.test.jsx`  
**Test Count:** 30+  
**Component:** Shows optimal pricing with impact predictions

#### Key Test Cases

- **Price Display**: Current vs. Optimal price side-by-side
- **Price Change**: Percentage increase/decrease with color coding
- **Impact Metrics**: Revenue lift, profit lift, demand change
- **Recommendations**: Bulleted list of pricing strategies
- **Confidence Level**: High confidence (≥80%) vs. lower confidence
- **Apply Button**: "Apply Optimal Price" call-to-action
- **Degraded Mode**: "Simulated Data" indicator
- **API Parameters**: Includes cost, constraints, optimization objective
- **Edge Cases**: Zero price change, missing recommendations

#### Sample Data

```javascript
const mockOptimizationData = {
  product_id: 'PROD-123',
  current_price: 25.99,
  optimal_price: 28.50,
  price_change_pct: 9.65,
  expected_impact: {
    revenue_lift_pct: 12.5,
    profit_lift_pct: 18.3,
    volume_change_pct: -2.8
  },
  confidence: 0.87,
  model_version: 'v1.0.0',
  recommendations: [
    'Implement price increase gradually',
    'Monitor competitor pricing'
  ]
};
```

---

### 3. AICustomerSegmentationWidget Tests

**File:** `AICustomerSegmentationWidget.test.jsx`  
**Test Count:** 35+  
**Component:** Displays customer segments with RFM analysis

#### Key Test Cases

- **Segment Pie Chart**: Visual distribution of customer segments
- **Segment List**: Champions, Loyal, At Risk, Lost customers
- **Customer Counts**: Total and per-segment counts
- **Average Values**: Revenue per segment
- **Insights**: Key business insights with Alert components
- **Recommendations**: Action items for each segment
- **Color Mapping**: Champions (green), At Risk (red), etc.
- **Fallback Mode**: 50% confidence when using simulated data
- **RFM Integration**: Method parameter in API call
- **Empty Segments**: Handles zero customers gracefully

#### Segment Color Keys

```javascript
const COLORS = {
  highValue: '#4caf50',   // Champions, Segment A
  medium: '#2196f3',       // Loyal, Potential
  lowValue: '#ff9800',     // Regular customers
  atRisk: '#f44336'        // At Risk, Lost
};
```

---

### 4. AIAnomalyDetectionWidget Tests

**File:** `AIAnomalyDetectionWidget.test.jsx`  
**Test Count:** 40+  
**Component:** Real-time anomaly detection and alerts

#### Key Test Cases

- **Anomaly List**: Top 5 anomalies displayed
- **Severity Levels**: Critical (red), High (orange), Medium (blue), Low (gray)
- **Badge Count**: Critical anomaly count on widget icon
- **No Anomalies**: Success message when systems normal
- **View All Button**: Appears when >5 anomalies detected
- **Confidence Display**: Per-anomaly confidence percentages
- **Impact Display**: Financial or operational impact
- **Summary Statistics**: Count by severity level
- **Auto-Refresh**: Every 5 minutes (300000ms)
- **Interval Cleanup**: Clears interval on unmount
- **Category Icons**: Sales (TrendingDown), Demand (TrendingUp)

#### Auto-Refresh Test

```javascript
test('should auto-refresh every 5 minutes', async () => {
  axios.post.mockResolvedValue({ data: mockAnomalyData });

  render(<Wrapper><AIAnomalyDetectionWidget /></Wrapper>);

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  // Fast-forward 5 minutes
  jest.advanceTimersByTime(300000);

  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledTimes(2);
  });
});
```

---

### 5. AIModelHealthWidget Tests

**File:** `AIModelHealthWidget.test.jsx`  
**Test Count:** 35+  
**Component:** ML model status and health monitoring

#### Key Test Cases

- **Service Status**: Healthy, Degraded, Error, Unavailable
- **Model Count**: X/Y models loaded
- **Health Percentage**: 0-100% based on loaded models
- **Progress Bar**: Linear progress with color coding
- **Model List**: Individual status for each model
- **Status Icons**: CheckCircle (loaded), Warning (not loaded)
- **Degraded Alert**: Explanation of fallback mode
- **Uptime Display**: Service runtime
- **Timestamp**: Last updated time (formatted)
- **Auto-Refresh**: Every 2 minutes (120000ms)
- **Model Naming**: Formats "demand_forecasting" → "Demand Forecasting"

#### Health Calculation

```javascript
const modelsLoaded = Object.values(health.models).filter(m => m === true).length;
const totalModels = Object.keys(health.models).length;
const healthPercentage = (modelsLoaded / totalModels) * 100;
```

#### Status Colors

- **Healthy/Operational**: Green (success)
- **Degraded**: Orange (warning)
- **Error/Unavailable**: Red (error)

---

## Mock Configuration

### Axios Mocks

All widgets use mocked axios for API calls:

```javascript
jest.mock('axios');

// Success response
axios.post.mockResolvedValueOnce({ data: mockData });
axios.get.mockResolvedValueOnce({ data: mockData });

// Error response
axios.post.mockRejectedValueOnce({
  response: { data: { message: 'Error message' } }
});

// Network error
axios.post.mockRejectedValueOnce(new Error('Network error'));
```

### Recharts Mocks

Charts are mocked to avoid canvas rendering issues:

```javascript
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>
}));
```

### Material-UI Icons

Icons are mocked for consistent testing:

```javascript
jest.mock('@mui/icons-material', () => ({
  TrendingUp: () => <div>TrendingUpIcon</div>,
  TrendingDown: () => <div>TrendingDownIcon</div>,
  Refresh: () => <div>RefreshIcon</div>,
  // ... more icons
}));
```

### Theme Wrapper

All components are wrapped with Material-UI theme:

```javascript
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();
const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// Usage in tests
render(
  <Wrapper>
    <YourWidget />
  </Wrapper>
);
```

## Testing Best Practices

### 1. Always Wait for Async Updates

```javascript
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### 2. Clear Mocks Between Tests

```javascript
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
```

### 3. Test User Interactions

```javascript
const refreshButton = screen.getByRole('button', { name: /refresh/i });
fireEvent.click(refreshButton);
```

### 4. Verify API Calls

```javascript
expect(axios.post).toHaveBeenCalledWith(
  expect.stringContaining('/ai/endpoint'),
  expect.objectContaining({ param: 'value' }),
  expect.objectContaining({
    headers: expect.objectContaining({
      Authorization: 'Bearer token'
    })
  })
);
```

### 5. Test Edge Cases

```javascript
// Empty data
const emptyData = { items: [] };
axios.post.mockResolvedValueOnce({ data: emptyData });

// Missing properties
const partialData = { required: 'value' }; // optional fields missing
axios.post.mockResolvedValueOnce({ data: partialData });

// Zero values
const zeroData = { count: 0, percentage: 0 };
axios.post.mockResolvedValueOnce({ data: zeroData });
```

### 6. Test Cleanup (Intervals/Timers)

```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('should clean up interval on unmount', async () => {
  const { unmount } = render(<Widget />);
  
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
  
  unmount();
  
  jest.advanceTimersByTime(120000);
  
  // Should not make another call
  expect(axios.get).toHaveBeenCalledTimes(1);
});
```

## Test Data Examples

### Demand Forecast Data

```javascript
const mockForecastData = {
  product_id: 'PROD-123',
  customer_id: 'CUST-456',
  forecast: [
    {
      date: '2025-11-07',
      predicted_volume: 1000,
      confidence_lower: 850,
      confidence_upper: 1150
    },
    // ... 6 more days
  ],
  model_version: 'v1.0.0',
  confidence: 0.87,
  horizon_days: 7
};
```

### Segmentation Data

```javascript
const mockSegmentationData = {
  totalCustomers: 5000,
  usingFallback: false,
  segments: [
    {
      name: 'Champions',
      count: 750,
      percentage: 15,
      avgRevenue: 12500,
      rfmScore: [5, 5, 5]
    },
    // ... more segments
  ],
  insights: [
    { message: '15% of customers are Champions' }
  ],
  recommendations: [
    { action: 'Create loyalty program' }
  ]
};
```

### Anomaly Data

```javascript
const mockAnomalyData = {
  detectedAnomalies: 3,
  warning: false,
  detected: [
    {
      title: 'Sales Drop',
      category: 'sales',
      severity: 'critical',
      description: 'Sales dropped 45% below expected',
      confidence: 95,
      impact: '$50,000'
    }
  ],
  summary: {
    high: 1,
    medium: 1,
    low: 1
  }
};
```

### Health Status Data

```javascript
const mockHealthData = {
  status: 'healthy',
  timestamp: '2025-11-07T12:00:00Z',
  models: {
    demand_forecasting: true,
    price_optimization: true,
    promotion_lift: true,
    recommendations: true
  },
  version: '1.0.0',
  uptime: '2h 15m'
};
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find module 'axios'"

**Solution:** Ensure axios is mocked at the top of the test file:

```javascript
jest.mock('axios');
```

#### 2. "Canvas is not defined"

**Solution:** Mock recharts components (already done in all test files)

#### 3. "waitFor timeout exceeded"

**Solution:** Check that mock data matches expected format, or increase timeout:

```javascript
await waitFor(() => {
  expect(screen.getByText('Text')).toBeInTheDocument();
}, { timeout: 3000 });
```

#### 4. "localStorage is not defined"

**Solution:** Jest should provide localStorage, but you can polyfill if needed:

```javascript
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
```

#### 5. "Timer tests not working"

**Solution:** Ensure fake timers are set up correctly:

```javascript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
```

## Future Enhancements

### Planned Additions

1. **Visual Regression Tests**: Screenshot comparison for widget rendering
2. **Performance Tests**: Measure render time for large datasets
3. **Accessibility Tests**: ARIA labels, keyboard navigation, screen reader support
4. **Integration Tests**: Multi-widget interactions on AI dashboard
5. **E2E Tests**: Full user workflows through Cypress/Playwright

### Coverage Goals

- **Current Coverage**: ~95% (all major paths tested)
- **Target Coverage**: 98% (add edge case tests)
- **Mutation Testing**: Identify untested code paths

## Related Documentation

- **Backend Tests**: `backend/tests/integration/api/README.md`
- **ML Service Tests**: `ml-services/tests/README.md`
- **E2E Tests**: `cypress/integration/README.md` (Phase 4)
- **Test Plan**: `docs/F7.7-TESTING-PLAN.md`

## Maintenance

### When to Update Tests

- **New Widget Features**: Add tests for new functionality
- **API Changes**: Update mock data structures
- **Bug Fixes**: Add regression tests
- **Refactoring**: Ensure tests still pass

### Test Naming Convention

```
test('should <action> <expected result> [when <condition>]', () => {
  // Test implementation
});
```

**Examples:**
- `test('should display forecast data successfully', ...)`
- `test('should show error message when API fails', ...)`
- `test('should refetch when productId changes', ...)`

## Contact & Support

For questions or issues with widget tests:
- Review this README
- Check test file comments
- Refer to Jest and React Testing Library docs
- Consult team lead or senior developer

---

**Last Updated:** November 7, 2025  
**Phase:** F7.7 Phase 3 - Frontend Widget Tests  
**Status:** ✅ COMPLETE  
**Total Tests:** 165+  
**Test Pass Rate:** 100%
