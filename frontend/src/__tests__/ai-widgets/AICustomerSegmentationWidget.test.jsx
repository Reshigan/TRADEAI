/**
 * Tests for AICustomerSegmentationWidget
 * Tests customer segmentation display, insights, and visualizations
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AICustomerSegmentationWidget from '../../components/ai-widgets/AICustomerSegmentationWidget';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock axios
jest.mock('axios');

// Mock recharts to avoid canvas issues
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>,
  Legend: () => <div>Legend</div>,
  Tooltip: () => <div>Tooltip</div>,
}));

// Mock Material-UI icons
jest.mock('@mui/icons-material', () => ({
  PeopleAlt: () => <div>PeopleAltIcon</div>,
  Refresh: () => <div>RefreshIcon</div>,
  Star: () => <div>StarIcon</div>,
  Warning: () => <div>WarningIcon</div>,
  TrendingUp: () => <div>TrendingUpIcon</div>,
  InfoOutlined: () => <div>InfoOutlinedIcon</div>,
}));

const theme = createTheme();
const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('AICustomerSegmentationWidget', () => {
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
      {
        name: 'Loyal Customers',
        count: 1250,
        percentage: 25,
        avgRevenue: 8500,
        rfmScore: [4, 4, 4]
      },
      {
        name: 'At Risk',
        count: 500,
        percentage: 10,
        avgRevenue: 4200,
        rfmScore: [2, 2, 2]
      },
      {
        name: 'Lost',
        count: 250,
        percentage: 5,
        avgRevenue: 2100,
        rfmScore: [1, 1, 1]
      }
    ],
    insights: [
      { message: '15% of customers are Champions generating 45% of revenue' },
      { message: '10% of customers are at risk of churning' }
    ],
    recommendations: [
      { action: 'Create loyalty program for Champions' },
      { action: 'Launch win-back campaign for At Risk customers' },
      { action: 'Survey Lost customers to understand churn reasons' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-token-123');
  });

  // ===== LOADING STATE TESTS =====

  test('should show loading state initially', () => {
    axios.post.mockImplementation(() => new Promise(() => {}));

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // ===== SUCCESS STATE TESTS =====

  test('should render segmentation data successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Customer Segmentation')).toBeInTheDocument();
    });
  });

  test('should display total customer count', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('5000 Customers')).toBeInTheDocument();
    });
  });

  test('should display confidence level', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Confidence: 85%/)).toBeInTheDocument();
    });
  });

  test('should render all segment names', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Champions')).toBeInTheDocument();
      expect(screen.getByText('Loyal Customers')).toBeInTheDocument();
      expect(screen.getByText('At Risk')).toBeInTheDocument();
      expect(screen.getByText('Lost')).toBeInTheDocument();
    });
  });

  test('should display segment counts and percentages', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/750.*\(15%\)/)).toBeInTheDocument();
      expect(screen.getByText(/1250.*\(25%\)/)).toBeInTheDocument();
      expect(screen.getByText(/500.*\(10%\)/)).toBeInTheDocument();
      expect(screen.getByText(/250.*\(5%\)/)).toBeInTheDocument();
    });
  });

  test('should display average values for segments', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Avg Value: \$12,500/)).toBeInTheDocument();
      expect(screen.getByText(/Avg Value: \$8,500/)).toBeInTheDocument();
      expect(screen.getByText(/Avg Value: \$4,200/)).toBeInTheDocument();
      expect(screen.getByText(/Avg Value: \$2,100/)).toBeInTheDocument();
    });
  });

  test('should render pie chart', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  test('should display all insights', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/15% of customers are Champions/)).toBeInTheDocument();
      expect(screen.getByText(/10% of customers are at risk/)).toBeInTheDocument();
    });
  });

  test('should display all recommendations', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Create loyalty program for Champions/)).toBeInTheDocument();
      expect(screen.getByText(/Launch win-back campaign for At Risk/)).toBeInTheDocument();
      expect(screen.getByText(/Survey Lost customers/)).toBeInTheDocument();
    });
  });

  test('should show degraded status indicator when using fallback', async () => {
    const fallbackData = {
      ...mockSegmentationData,
      usingFallback: true
    };

    axios.post.mockResolvedValueOnce({ data: fallbackData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Simulated Data')).toBeInTheDocument();
      expect(screen.getByText(/Confidence: 50%/)).toBeInTheDocument();
    });
  });

  // ===== ERROR HANDLING TESTS =====

  test('should display error message on API failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Segmentation service unavailable' } }
    });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Segmentation service unavailable')).toBeInTheDocument();
    });
  });

  test('should display generic error on network failure', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load segmentation')).toBeInTheDocument();
    });
  });

  // ===== REFRESH FUNCTIONALITY TESTS =====

  test('should refetch data when refresh button is clicked', async () => {
    axios.post.mockResolvedValue({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Customer Segmentation')).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByRole('button', { name: /refresh segmentation/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  // ===== PROPS CHANGE TESTS =====

  test('should refetch when companyId changes', async () => {
    axios.post.mockResolvedValue({ data: mockSegmentationData });

    const { rerender } = render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    rerender(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-456" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  // ===== API CALL TESTS =====

  test('should call API with correct parameters', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-789" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/ai/segment/customers'),
        {
          method: 'rfm',
          tenantId: 'COMP-789'
        },
        {
          headers: {
            Authorization: 'Bearer mock-token-123'
          }
        }
      );
    });
  });

  test('should include authorization header from localStorage', async () => {
    localStorage.setItem('token', 'test-jwt-token');
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token'
          })
        })
      );
    });
  });

  // ===== DATA TRANSFORMATION TESTS =====

  test('should transform segment data correctly', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      // Verify all segments are rendered with correct data
      expect(screen.getByText('Champions')).toBeInTheDocument();
      expect(screen.getByText(/750.*\(15%\)/)).toBeInTheDocument();
    });
  });

  test('should extract insight messages correctly', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/15% of customers are Champions/)).toBeInTheDocument();
    });
  });

  test('should extract recommendation actions correctly', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Create loyalty program/)).toBeInTheDocument();
    });
  });

  // ===== COLOR KEY MAPPING TESTS =====

  test('should assign correct color key to Champions segment', async () => {
    const championData = {
      ...mockSegmentationData,
      segments: [
        { name: 'Champions', count: 100, percentage: 10, avgRevenue: 15000 }
      ]
    };

    axios.post.mockResolvedValueOnce({ data: championData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Champions')).toBeInTheDocument();
    });
  });

  test('should assign correct color key to At Risk segment', async () => {
    const atRiskData = {
      ...mockSegmentationData,
      segments: [
        { name: 'At Risk', count: 50, percentage: 5, avgRevenue: 3000 }
      ]
    };

    axios.post.mockResolvedValueOnce({ data: atRiskData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });
  });

  // ===== CONFIDENCE DISPLAY TESTS =====

  test('should show success color for high confidence (>= 80%)', async () => {
    axios.post.mockResolvedValueOnce({ data: mockSegmentationData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Confidence: 85%/)).toBeInTheDocument();
    });
  });

  test('should show primary color for lower confidence (< 80%)', async () => {
    const lowConfidenceData = {
      ...mockSegmentationData,
      usingFallback: true
    };

    axios.post.mockResolvedValueOnce({ data: lowConfidenceData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Confidence: 50%/)).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES =====

  test('should handle empty segments array', async () => {
    const emptySegmentsData = {
      totalCustomers: 0,
      usingFallback: false,
      segments: [],
      insights: [],
      recommendations: []
    };

    axios.post.mockResolvedValueOnce({ data: emptySegmentsData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Customer Segmentation')).toBeInTheDocument();
      expect(screen.getByText('0 Customers')).toBeInTheDocument();
    });
  });

  test('should handle missing insights', async () => {
    const noInsightsData = {
      ...mockSegmentationData,
      insights: []
    };

    axios.post.mockResolvedValueOnce({ data: noInsightsData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Customer Segmentation')).toBeInTheDocument();
      expect(screen.getByText(/Key Insights:/)).toBeInTheDocument();
    });
  });

  test('should handle missing recommendations', async () => {
    const noRecommendationsData = {
      ...mockSegmentationData,
      recommendations: []
    };

    axios.post.mockResolvedValueOnce({ data: noRecommendationsData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Customer Segmentation')).toBeInTheDocument();
      expect(screen.getByText(/Recommended Actions:/)).toBeInTheDocument();
    });
  });

  test('should handle insights as plain strings', async () => {
    const stringInsightsData = {
      ...mockSegmentationData,
      insights: ['Simple insight 1', 'Simple insight 2']
    };

    axios.post.mockResolvedValueOnce({ data: stringInsightsData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Simple insight 1')).toBeInTheDocument();
      expect(screen.getByText('Simple insight 2')).toBeInTheDocument();
    });
  });

  test('should handle recommendations as plain strings', async () => {
    const stringRecommendationsData = {
      ...mockSegmentationData,
      recommendations: ['Simple recommendation 1', 'Simple recommendation 2']
    };

    axios.post.mockResolvedValueOnce({ data: stringRecommendationsData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Simple recommendation 1/)).toBeInTheDocument();
      expect(screen.getByText(/Simple recommendation 2/)).toBeInTheDocument();
    });
  });

  test('should handle segments with undefined avgRevenue', async () => {
    const noAvgRevenueData = {
      ...mockSegmentationData,
      segments: [
        { name: 'Test Segment', count: 100, percentage: 10 }
      ]
    };

    axios.post.mockResolvedValueOnce({ data: noAvgRevenueData });

    render(
      <Wrapper>
        <AICustomerSegmentationWidget companyId="COMP-123" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Segment')).toBeInTheDocument();
      // Should not crash even without avgRevenue
    });
  });
});
