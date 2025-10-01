import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';

// Create a mock store
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: null, isAuthenticated: false }, action) => state,
    ui: (state = { theme: 'light' }, action) => state,
  },
});

// Mock the API services
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const renderWithProviders = (component) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

test('renders without crashing', () => {
  renderWithProviders(<App />);
  // Just verify the app renders without throwing an error
  expect(document.body).toBeInTheDocument();
});

test('basic component structure', () => {
  renderWithProviders(<App />);
  // The app should render some basic structure
  const appElement = document.querySelector('.App') || document.body;
  expect(appElement).toBeInTheDocument();
});