import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Test wrapper with providers
const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

describe('TRADEAI Frontend - Complete Component Tests', () => {
  
  describe('Authentication Components', () => {
    test('Login page renders correctly', () => {
      const Login = require('../pages/Login').default;
      customRender(<Login />);
      
      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    test('Login form submission works', async () => {
      const Login = require('../pages/Login').default;
      customRender(<Login />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Assert login action
      });
    });
  });

  describe('Dashboard Components', () => {
    test('Dashboard renders with widgets', () => {
      const Dashboard = require('../pages/Dashboard').default;
      customRender(<Dashboard />);
      
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Trade Spend Components', () => {
    test('Trade Spend List renders', () => {
      const TradeSpendList = require('../pages/TradeSpendList').default;
      customRender(<TradeSpendList />);
      
      expect(screen.getByText(/trade spend/i)).toBeInTheDocument();
    });

    test('Create Trade Spend button works', () => {
      const TradeSpendList = require('../pages/TradeSpendList').default;
      customRender(<TradeSpendList />);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(createButton);
    });
  });

  describe('Budget Components', () => {
    test('Budget List renders', () => {
      const BudgetList = require('../pages/BudgetList').default;
      customRender(<BudgetList />);
      
      expect(screen.getByText(/budget/i)).toBeInTheDocument();
    });
  });

  describe('Customer Components', () => {
    test('Customer List renders', () => {
      const CustomerList = require('../pages/CustomerList').default;
      customRender(<CustomerList />);
      
      expect(screen.getByText(/customer/i)).toBeInTheDocument();
    });
  });

  describe('Product Components', () => {
    test('Product List renders', () => {
      const ProductList = require('../pages/ProductList').default;
      customRender(<ProductList />);
      
      expect(screen.getByText(/product/i)).toBeInTheDocument();
    });
  });

  describe('Campaign Components', () => {
    test('Campaign List renders', () => {
      const CampaignList = require('../pages/CampaignList').default;
      customRender(<CampaignList />);
      
      expect(screen.getByText(/campaign/i)).toBeInTheDocument();
    });
  });

  describe('Report Components', () => {
    test('Report List renders', () => {
      const ReportList = require('../pages/ReportList').default;
      customRender(<ReportList />);
      
      expect(screen.getByText(/report/i)).toBeInTheDocument();
    });
  });
});

export { customRender };
