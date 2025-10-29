import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SimulationDashboard from '../../pages/simulation/SimulationDashboard';

jest.mock('../../services/api');

describe('SimulationDashboard', () => {
  it('should render simulation dashboard', () => {
    render(
      <BrowserRouter>
        <SimulationDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Business Simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/Positive Scenario/i)).toBeInTheDocument();
    expect(screen.getByText(/Negative Scenario/i)).toBeInTheDocument();
  });
});
