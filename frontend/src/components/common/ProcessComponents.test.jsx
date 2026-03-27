import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProcessStepper from './ProcessStepper.enhanced';
import ProcessTracker from './ProcessTracker';
import ProcessFlow from './ProcessFlow';
import ProcessWizard from './ProcessWizard';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ProcessStepper', () => {
  const mockSteps = [
    {
      id: 'step1',
      title: 'Planning',
      description: 'Plan your approach',
      status: 'completed',
      estimatedTime: '2 days',
      assignee: 'John',
    },
    {
      id: 'step2',
      title: 'Execution',
      description: 'Execute the plan',
      status: 'active',
      estimatedTime: '5 days',
      assignee: 'Jane',
    },
    {
      id: 'step3',
      title: 'Review',
      description: 'Review results',
      status: 'pending',
      estimatedTime: '1 day',
    },
  ];

  it('renders all steps correctly', () => {
    renderWithTheme(<ProcessStepper steps={mockSteps} activeStep={1} />);
    
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Execution')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('shows correct step count', () => {
    renderWithTheme(<ProcessStepper steps={mockSteps} activeStep={1} />);
    
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('displays step descriptions', () => {
    renderWithTheme(<ProcessStepper steps={mockSteps} activeStep={1} />);
    
    expect(screen.getByText('Plan your approach')).toBeInTheDocument();
    expect(screen.getByText('Execute the plan')).toBeInTheDocument();
    expect(screen.getByText('Review results')).toBeInTheDocument();
  });

  it('shows time estimates when enabled', () => {
    renderWithTheme(
      <ProcessStepper steps={mockSteps} activeStep={1} showTimeEstimates />
    );
    
    expect(screen.getByText('2 days')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
    expect(screen.getByText('1 day')).toBeInTheDocument();
  });

  it('shows confidence scores when enabled', () => {
    const stepsWithConfidence = mockSteps.map((s, i) => ({
      ...s,
      confidence: 80 + i * 5,
    }));

    renderWithTheme(
      <ProcessStepper steps={stepsWithConfidence} activeStep={1} showConfidence />
    );
    
    expect(screen.getByText(/80% confidence/)).toBeInTheDocument();
    expect(screen.getByText(/85% confidence/)).toBeInTheDocument();
  });

  it('handles step clicks when interactive', () => {
    const handleClick = jest.fn();
    
    renderWithTheme(
      <ProcessStepper
        steps={mockSteps}
        activeStep={1}
        interactive
        onStepClick={handleClick}
      />
    );
    
    fireEvent.click(screen.getByText('Planning'));
    expect(handleClick).toHaveBeenCalledWith(0);
  });

  it('renders compact mode correctly', () => {
    renderWithTheme(
      <ProcessStepper steps={mockSteps} activeStep={1} compact />
    );
    
    expect(screen.getByText('Execution')).toBeInTheDocument();
    expect(screen.getByText(/Step 2/)).toBeInTheDocument();
  });

  it('shows progress percentage in compact mode', () => {
    renderWithTheme(
      <ProcessStepper steps={mockSteps} activeStep={1} compact />
    );
    
    // Progress should be 50% (step 2 of 3, 0-indexed: 1/2)
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    renderWithTheme(<ProcessStepper steps={mockSteps} activeStep={1} />);
    
    const completedStep = screen.getByText('Planning').closest('.MuiBox-root');
    const activeStep = screen.getByText('Execution').closest('.MuiBox-root');
    
    expect(completedStep).toHaveStyle('color: success.main');
    expect(activeStep).toHaveStyle('color: primary.main');
  });
});

describe('ProcessTracker', () => {
  const mockProcess = {
    name: 'Test Process',
    description: 'Testing process tracking',
    activeStep: 1,
  };

  const mockSteps = [
    {
      title: 'Step 1',
      status: 'completed',
      estimatedMinutes: 30,
      actualMinutes: 25,
    },
    {
      title: 'Step 2',
      status: 'in_progress',
      estimatedMinutes: 60,
    },
    {
      title: 'Step 3',
      status: 'pending',
      estimatedMinutes: 45,
    },
  ];

  it('renders process name and description', () => {
    renderWithTheme(
      <ProcessTracker process={mockProcess} steps={mockSteps} />
    );
    
    expect(screen.getByText('Test Process')).toBeInTheDocument();
    expect(screen.getByText('Testing process tracking')).toBeInTheDocument();
  });

  it('shows overall progress', () => {
    renderWithTheme(
      <ProcessTracker process={mockProcess} steps={mockSteps} />
    );
    
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays status summary cards', () => {
    renderWithTheme(
      <ProcessTracker process={mockProcess} steps={mockSteps} />
    );
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();
  });

  it('shows estimated time remaining', () => {
    renderWithTheme(
      <ProcessTracker process={mockProcess} steps={mockSteps} />
    );
    
    expect(screen.getByText(/Est\. remaining:/)).toBeInTheDocument();
    expect(screen.getByText('105 min')).toBeInTheDocument(); // 60 + 45
  });

  it('handles pause/resume actions', () => {
    const handlePause = jest.fn();
    const handleResume = jest.fn();

    renderWithTheme(
      <ProcessTracker
        process={mockProcess}
        steps={mockSteps}
        onPause={handlePause}
        onResume={handleResume}
      />
    );
    
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    expect(handlePause).toHaveBeenCalled();
  });

  it('handles refresh action', () => {
    const handleRefresh = jest.fn();

    renderWithTheme(
      <ProcessTracker
        process={mockProcess}
        steps={mockSteps}
        onRefresh={handleRefresh}
      />
    );
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    expect(handleRefresh).toHaveBeenCalled();
  });

  it('shows current step details', () => {
    renderWithTheme(
      <ProcessTracker process={mockProcess} steps={mockSteps} />
    );
    
    expect(screen.getByText('Current Step')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('shows next step details', () => {
    renderWithTheme(
      <ProcessTracker process={mockProcess} steps={mockSteps} />
    );
    
    expect(screen.getByText('Next Step')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    renderWithTheme(
      <ProcessTracker process={mockProcess} steps={mockSteps} loading />
    );
    
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
  });
});

describe('ProcessFlow', () => {
  const mockNodes = [
    {
      id: 'node1',
      title: 'Start',
      description: 'Begin process',
      type: 'Manual',
      duration: '1 day',
    },
    {
      id: 'node2',
      title: 'Process',
      description: 'Execute tasks',
      type: 'Automated',
      duration: '2 days',
    },
    {
      id: 'node3',
      title: 'End',
      description: 'Complete process',
      type: 'Manual',
      duration: '1 day',
    },
  ];

  it('renders all nodes', () => {
    renderWithTheme(<ProcessFlow nodes={mockNodes} activeNode={0} />);
    
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Process')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
  });

  it('displays node descriptions', () => {
    renderWithTheme(<ProcessFlow nodes={mockNodes} activeNode={0} />);
    
    expect(screen.getByText('Begin process')).toBeInTheDocument();
    expect(screen.getByText('Execute tasks')).toBeInTheDocument();
    expect(screen.getByText('Complete process')).toBeInTheDocument();
  });

  it('shows node metadata badges', () => {
    renderWithTheme(<ProcessFlow nodes={mockNodes} activeNode={0} />);
    
    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('Automated')).toBeInTheDocument();
    expect(screen.getByText('1 day')).toBeInTheDocument();
    expect(screen.getByText('2 days')).toBeInTheDocument();
  });

  it('handles node clicks', () => {
    const handleClick = jest.fn();

    renderWithTheme(
      <ProcessFlow nodes={mockNodes} activeNode={0} onNodeClick={handleClick} />
    );
    
    fireEvent.click(screen.getByText('Start').closest('.MuiBox-root'));
    expect(handleClick).toHaveBeenCalledWith(0);
  });

  it('shows zoom controls', () => {
    renderWithTheme(<ProcessFlow nodes={mockNodes} activeNode={0} />);
    
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fit to screen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
  });

  it('displays process flow header', () => {
    renderWithTheme(<ProcessFlow nodes={mockNodes} activeNode={0} />);
    
    expect(screen.getByText('Process Flow')).toBeInTheDocument();
    expect(screen.getByText('Visual workflow representation')).toBeInTheDocument();
  });

  it('shows legend', () => {
    renderWithTheme(<ProcessFlow nodes={mockNodes} activeNode={0} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});

describe('ProcessWizard', () => {
  const mockSteps = [
    {
      id: 'step1',
      title: 'Basic Info',
      description: 'Enter basic information',
      content: ({ data, onChange }) => (
        <input
          data-testid="step1-input"
          value={data.value || ''}
          onChange={(e) => onChange({ value: e.target.value })}
        />
      ),
      validate: (data) => ({
        valid: !!data.value,
        errors: data.value ? [] : ['Value is required'],
      }),
    },
    {
      id: 'step2',
      title: 'Review',
      description: 'Review and submit',
      content: ({ data }) => <div data-testid="review-content">{data.value}</div>,
    },
  ];

  it('renders wizard title and subtitle', () => {
    renderWithTheme(
      <ProcessWizard
        steps={mockSteps}
        title="Test Wizard"
        subtitle="Testing wizard functionality"
      />
    );
    
    expect(screen.getByText('Test Wizard')).toBeInTheDocument();
    expect(screen.getByText('Testing wizard functionality')).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    renderWithTheme(<ProcessWizard steps={mockSteps} />);
    
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays step navigation', () => {
    renderWithTheme(<ProcessWizard steps={mockSteps} />);
    
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('renders step content', () => {
    renderWithTheme(<ProcessWizard steps={mockSteps} />);
    
    expect(screen.getByTestId('step1-input')).toBeInTheDocument();
  });

  it('navigates to next step', async () => {
    const onComplete = jest.fn();

    renderWithTheme(
      <ProcessWizard steps={mockSteps} onComplete={onComplete} />
    );
    
    // Enter value in first step
    fireEvent.change(screen.getByTestId('step1-input'), {
      target: { value: 'test value' },
    });

    // Click Next
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByTestId('review-content')).toBeInTheDocument();
    });
  });

  it('navigates back to previous step', async () => {
    renderWithTheme(<ProcessWizard steps={mockSteps} />);

    // Enter value and go to next step
    fireEvent.change(screen.getByTestId('step1-input'), {
      target: { value: 'test value' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByTestId('review-content')).toBeInTheDocument();
    });

    // Go back
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByTestId('step1-input')).toBeInTheDocument();
  });

  it('calls onComplete on final step submission', async () => {
    const onComplete = jest.fn();

    renderWithTheme(
      <ProcessWizard steps={mockSteps} onComplete={onComplete} />
    );
    
    // Enter value and navigate to last step
    fireEvent.change(screen.getByTestId('step1-input'), {
      target: { value: 'test value' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByTestId('review-content')).toBeInTheDocument();
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({ value: 'test value' });
    });
  });

  it('shows validation errors', async () => {
    renderWithTheme(<ProcessWizard steps={mockSteps} />);

    // Try to proceed without entering value
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText('Value is required')).toBeInTheDocument();
    });
  });

  it('displays AI suggestions button when enabled', () => {
    renderWithTheme(
      <ProcessWizard steps={mockSteps} enableAI={true} />
    );
    
    expect(
      screen.getByRole('button', { name: /get ai suggestions/i })
    ).toBeInTheDocument();
  });

  it('shows help button', () => {
    renderWithTheme(<ProcessWizard steps={mockSteps} />);
    
    expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
  });

  it('opens preview dialog', async () => {
    renderWithTheme(<ProcessWizard steps={mockSteps} />);

    const previewButton = screen.getByRole('button', { name: /preview/i });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Process Preview')).toBeInTheDocument();
    });
  });
});

// Integration tests
describe('Process Components Integration', () => {
  const mockProcessData = {
    name: 'Integration Test Process',
    steps: [
      {
        id: '1',
        title: 'Step 1',
        status: 'completed',
      },
      {
        id: '2',
        title: 'Step 2',
        status: 'active',
      },
      {
        id: '3',
        title: 'Step 3',
        status: 'pending',
      },
    ],
  };

  it('renders all components together without errors', () => {
    expect(() => {
      renderWithTheme(
        <div>
          <ProcessTracker
            process={mockProcessData}
            steps={mockProcessData.steps}
          />
          <ProcessStepper
            steps={mockProcessData.steps}
            activeStep={1}
          />
          <ProcessFlow
            nodes={mockProcessData.steps}
            activeNode={1}
          />
        </div>
      );
    }).not.toThrow();
  });

  it('maintains consistent state across components', () => {
    const { container } = renderWithTheme(
      <div>
        <ProcessTracker
          process={mockProcessData}
          steps={mockProcessData.steps}
        />
        <ProcessStepper
          steps={mockProcessData.steps}
          activeStep={1}
        />
      </div>
    );

    // Both components should show the same step count
    expect(container.querySelectorAll('.step')).toHaveLength(6); // 3 per component
  });
});
