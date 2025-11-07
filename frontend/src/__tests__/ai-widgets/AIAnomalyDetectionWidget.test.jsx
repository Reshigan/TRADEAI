/**
 * Tests for AIAnomalyDetectionWidget
 * Tests anomaly detection display, severity levels, and auto-refresh
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AIAnomalyDetectionWidget from '../../components/ai-widgets/AIAnomalyDetectionWidget';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock axios
jest.mock('axios');

// Mock Material-UI icons
jest.mock('@mui/icons-material', () => ({
  NotificationsActive: () => <div>NotificationsActiveIcon</div>,
  Refresh: () => <div>RefreshIcon</div>,
  Warning: () => <div>WarningIcon</div>,
  Error: () => <div>ErrorIcon</div>,
  Info: () => <div>InfoIcon</div>,
  CheckCircle: () => <div>CheckCircleIcon</div>,
  TrendingDown: () => <div>TrendingDownIcon</div>,
  TrendingUp: () => <div>TrendingUpIcon</div>,
  InfoOutlined: () => <div>InfoOutlinedIcon</div>,
}));

const theme = createTheme();
const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('AIAnomalyDetectionWidget', () => {
  const mockAnomalyData = {
    detectedAnomalies: 3,
    warning: false,
    anomalies: [
      {
        id: 'ANO-001',
        metricType: 'sales',
        severity: 'critical',
        description: 'Sales dropped 45% below expected levels',
        date: '2025-11-07T10:00:00Z',
        actualValue: 55000,
        expectedValue: 100000,
        deviation: -45
      },
      {
        id: 'ANO-002',
        metricType: 'demand',
        severity: 'high',
        description: 'Unusual spike in demand for Product ABC',
        date: '2025-11-07T09:00:00Z',
        actualValue: 2500,
        expectedValue: 1000,
        deviation: 150
      },
      {
        id: 'ANO-003',
        metricType: 'revenue',
        severity: 'medium',
        description: 'Revenue trending below forecast',
        date: '2025-11-07T08:00:00Z',
        actualValue: 75000,
        expectedValue: 85000,
        deviation: -12
      }
    ],
    summary: {
      high: 1,
      medium: 1,
      low: 1
    }
  };

  const mockNoAnomaliesData = {
    detectedAnomalies: 0,
    warning: false,
    anomalies: [],
    summary: {
      high: 0,
      medium: 0,
      low: 0
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-token-123');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ===== LOADING STATE TESTS =====

  test('should show loading state initially', () => {
    axios.post.mockImplementation(() => new Promise(() => {}));

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // ===== SUCCESS STATE TESTS =====

  test('should render anomaly data successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: mockAnomalyData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Anomaly Detection')).toBeInTheDocument();
    });
  });

  test('should display anomaly count', async () => {
    // Mock anomalies.detected for the component
    const dataWithDetected = {
      ...mockAnomalyData,
      detected: [
        { title: 'Sales Drop', category: 'sales', severity: 'critical', description: 'Sales dropped', confidence: 95 },
        { title: 'Demand Spike', category: 'demand', severity: 'high', description: 'Demand increased', confidence: 88 },
        { title: 'Revenue Issue', category: 'revenue', severity: 'medium', description: 'Revenue down', confidence: 75 }
      ]
    };

    axios.post.mockResolvedValueOnce({ data: dataWithDetected });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/3 Anomalies/)).toBeInTheDocument();
    });
  });

  test('should display "Last 24 hours" indicator', async () => {
    const dataWithDetected = {
      ...mockAnomalyData,
      detected: []
    };

    axios.post.mockResolvedValueOnce({ data: dataWithDetected });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Last 24 hours')).toBeInTheDocument();
    });
  });

  test('should show degraded status indicator when applicable', async () => {
    const degradedData = {
      ...mockAnomalyData,
      warning: true,
      detected: []
    };

    axios.post.mockResolvedValueOnce({ data: degradedData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Simulated Data')).toBeInTheDocument();
    });
  });

  test('should display "no anomalies" message when count is 0', async () => {
    axios.post.mockResolvedValueOnce({ data: mockNoAnomaliesData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/No anomalies detected/)).toBeInTheDocument();
      expect(screen.getByText(/All systems operating normally/)).toBeInTheDocument();
    });
  });

  test('should display anomaly list items', async () => {
    const dataWithDetected = {
      ...mockAnomalyData,
      detected: [
        { 
          title: 'Critical Sales Drop',
          category: 'sales',
          severity: 'critical',
          description: 'Sales dropped 45% below expected',
          confidence: 95,
          impact: 'High'
        },
        {
          title: 'Demand Anomaly',
          category: 'demand',
          severity: 'high',
          description: 'Unusual demand pattern detected',
          confidence: 88
        }
      ]
    };

    axios.post.mockResolvedValueOnce({ data: dataWithDetected });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Critical Sales Drop')).toBeInTheDocument();
      expect(screen.getByText('Demand Anomaly')).toBeInTheDocument();
    });
  });

  test('should display anomaly descriptions', async () => {
    const dataWithDetected = {
      ...mockAnomalyData,
      detected: [
        { 
          title: 'Sales Issue',
          category: 'sales',
          severity: 'critical',
          description: 'Sales dropped 45% below expected levels',
          confidence: 95
        }
      ]
    };

    axios.post.mockResolvedValueOnce({ data: dataWithDetected });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Sales dropped 45% below expected levels')).toBeInTheDocument();
    });
  });

  test('should display confidence levels', async () => {
    const dataWithDetected = {
      ...mockAnomalyData,
      detected: [
        { 
          title: 'Test Anomaly',
          category: 'sales',
          severity: 'medium',
          description: 'Test description',
          confidence: 92
        }
      ]
    };

    axios.post.mockResolvedValueOnce({ data: dataWithDetected });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Confidence: 92%/)).toBeInTheDocument();
    });
  });

  test('should display impact when provided', async () => {
    const dataWithDetected = {
      ...mockAnomalyData,
      detected: [
        { 
          title: 'Test Anomaly',
          category: 'sales',
          severity: 'critical',
          description: 'Test description',
          confidence: 95,
          impact: '$50,000'
        }
      ]
    };

    axios.post.mockResolvedValueOnce({ data: dataWithDetected });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Impact: \$50,000/)).toBeInTheDocument();
    });
  });

  test('should limit display to 5 anomalies', async () => {
    const dataWithManyAnomalies = {
      ...mockAnomalyData,
      detected: Array.from({ length: 10 }, (_, i) => ({
        title: `Anomaly ${i + 1}`,
        category: 'sales',
        severity: 'medium',
        description: `Description ${i + 1}`,
        confidence: 80
      }))
    };

    axios.post.mockResolvedValueOnce({ data: dataWithManyAnomalies });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Anomaly 1')).toBeInTheDocument();
      expect(screen.getByText('Anomaly 5')).toBeInTheDocument();
      expect(screen.queryByText('Anomaly 6')).not.toBeInTheDocument();
    });
  });

  test('should show "View All" button when more than 5 anomalies', async () => {
    const dataWithManyAnomalies = {
      ...mockAnomalyData,
      detected: Array.from({ length: 8 }, (_, i) => ({
        title: `Anomaly ${i + 1}`,
        category: 'sales',
        severity: 'medium',
        description: `Description ${i + 1}`,
        confidence: 80
      }))
    };

    axios.post.mockResolvedValueOnce({ data: dataWithManyAnomalies });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/View All 8 Anomalies/)).toBeInTheDocument();
    });
  });

  test('should display summary with severity counts', async () => {
    const dataWithSummary = {
      ...mockAnomalyData,
      detected: [],
      summary: {
        high: 3,
        medium: 5,
        low: 2
      }
    };

    axios.post.mockResolvedValueOnce({ data: dataWithSummary });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('High: 3')).toBeInTheDocument();
      expect(screen.getByText('Medium: 5')).toBeInTheDocument();
      expect(screen.getByText('Low: 2')).toBeInTheDocument();
    });
  });

  test('should not display zero counts in summary', async () => {
    const dataWithPartialSummary = {
      ...mockAnomalyData,
      detected: [],
      summary: {
        high: 2,
        medium: 0,
        low: 0
      }
    };

    axios.post.mockResolvedValueOnce({ data: dataWithPartialSummary });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('High: 2')).toBeInTheDocument();
      expect(screen.queryByText('Medium: 0')).not.toBeInTheDocument();
      expect(screen.queryByText('Low: 0')).not.toBeInTheDocument();
    });
  });

  // ===== ERROR HANDLING TESTS =====

  test('should display error message on API failure', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Anomaly detection service unavailable' } }
    });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Anomaly detection service unavailable')).toBeInTheDocument();
    });
  });

  test('should display generic error on network failure', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load anomalies')).toBeInTheDocument();
    });
  });

  // ===== REFRESH FUNCTIONALITY TESTS =====

  test('should refetch data when refresh button is clicked', async () => {
    const dataWithDetected = { ...mockAnomalyData, detected: [] };
    axios.post.mockResolvedValue({ data: dataWithDetected });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Anomaly Detection')).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByRole('button', { name: /refresh anomalies/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  test('should auto-refresh every 5 minutes', async () => {
    const dataWithDetected = { ...mockAnomalyData, detected: [] };
    axios.post.mockResolvedValue({ data: dataWithDetected });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 5 minutes
    jest.advanceTimersByTime(300000);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  test('should disable refresh button while loading', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    axios.post.mockReturnValue(promise);

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Anomaly Detection')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh anomalies/i });
    fireEvent.click(refreshButton);

    // Button should be disabled while loading
    expect(refreshButton).toBeDisabled();

    // Resolve the promise
    resolvePromise({ data: { ...mockAnomalyData, detected: [] } });

    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
  });

  // ===== PROPS CHANGE TESTS =====

  test('should refetch when scope changes', async () => {
    const dataWithDetected = { ...mockAnomalyData, detected: [] };
    axios.post.mockResolvedValue({ data: dataWithDetected });

    const { rerender } = render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="sales" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    rerender(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="revenue" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });

  // ===== API CALL TESTS =====

  test('should call API with correct parameters', async () => {
    axios.post.mockResolvedValueOnce({ data: mockAnomalyData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="sales" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/ai/detect/anomalies'),
        {
          metricType: 'sales',
          threshold: 2.5
        },
        {
          headers: {
            Authorization: 'Bearer mock-token-123'
          }
        }
      );
    });
  });

  test('should use "sales" as metricType when scope is "all"', async () => {
    axios.post.mockResolvedValueOnce({ data: mockAnomalyData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metricType: 'sales'
        }),
        expect.any(Object)
      );
    });
  });

  test('should include authorization header from localStorage', async () => {
    localStorage.setItem('token', 'test-jwt-token');
    axios.post.mockResolvedValueOnce({ data: mockAnomalyData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
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

  // ===== DEFAULT PROPS TESTS =====

  test('should use default scope when not provided', async () => {
    axios.post.mockResolvedValueOnce({ data: mockAnomalyData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metricType: 'sales'
        }),
        expect.any(Object)
      );
    });
  });

  // ===== DATA TRANSFORMATION TESTS =====

  test('should transform anomaly data correctly', async () => {
    axios.post.mockResolvedValueOnce({ data: mockAnomalyData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Anomaly Detection')).toBeInTheDocument();
    });
  });

  // ===== EDGE CASES =====

  test('should handle missing summary gracefully', async () => {
    const noSummaryData = {
      ...mockAnomalyData,
      detected: [],
      summary: undefined
    };

    axios.post.mockResolvedValueOnce({ data: noSummaryData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Anomaly Detection')).toBeInTheDocument();
    });
  });

  test('should handle anomalies without impact field', async () => {
    const noImpactData = {
      ...mockAnomalyData,
      detected: [
        { 
          title: 'Test Anomaly',
          category: 'sales',
          severity: 'medium',
          description: 'Test without impact',
          confidence: 85
        }
      ]
    };

    axios.post.mockResolvedValueOnce({ data: noImpactData });

    render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Anomaly')).toBeInTheDocument();
      expect(screen.queryByText(/Impact:/)).not.toBeInTheDocument();
    });
  });

  test('should clean up interval on unmount', async () => {
    const dataWithDetected = { ...mockAnomalyData, detected: [] };
    axios.post.mockResolvedValue({ data: dataWithDetected });

    const { unmount } = render(
      <Wrapper>
        <AIAnomalyDetectionWidget scope="all" />
      </Wrapper>
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Fast-forward 5 minutes after unmount
    jest.advanceTimersByTime(300000);

    // Should not make another call after unmount
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});
