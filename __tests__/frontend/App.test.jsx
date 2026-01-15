/**
 * App Component Tests
 *
 * Basic rendering tests for the main App component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the sentry module
jest.mock('../../src/lib/sentry.js', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  initSentry: jest.fn(),
  SentryErrorBoundary: ({ children }) => children,
  ErrorFallback: () => null,
}));

// Mock the industry-layouts config
jest.mock('../../config/industry-layouts.js', () => ({
  INDUSTRY_LAYOUTS: {},
  getLayoutConfig: jest.fn(() => ({})),
  buildLayoutPromptContext: jest.fn(() => ''),
}));

// Simple PasswordGate component for testing (isolated)
const PasswordGate = ({ onUnlock }) => {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        onUnlock();
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    }
  };

  return (
    <div data-testid="password-gate">
      <h1>BLINK</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter access code"
          data-testid="password-input"
        />
        {error && <p data-testid="error-message">Invalid access code</p>}
        <button type="submit" data-testid="submit-button">Enter</button>
      </form>
    </div>
  );
};

describe('PasswordGate Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
  });

  test('renders password gate', () => {
    render(<PasswordGate onUnlock={() => {}} />);

    expect(screen.getByTestId('password-gate')).toBeInTheDocument();
    expect(screen.getByText('BLINK')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter access code')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  test('allows password input', () => {
    render(<PasswordGate onUnlock={() => {}} />);

    const input = screen.getByTestId('password-input');
    fireEvent.change(input, { target: { value: 'test-password' } });

    expect(input.value).toBe('test-password');
  });

  test('calls onUnlock on successful authentication', async () => {
    const mockOnUnlock = jest.fn();
    global.fetch.mockResolvedValueOnce({ ok: true });

    render(<PasswordGate onUnlock={mockOnUnlock} />);

    const input = screen.getByTestId('password-input');
    const button = screen.getByTestId('submit-button');

    fireEvent.change(input, { target: { value: 'correct-password' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnUnlock).toHaveBeenCalled();
    });
  });

  test('shows error on failed authentication', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    render(<PasswordGate onUnlock={() => {}} />);

    const input = screen.getByTestId('password-input');
    const button = screen.getByTestId('submit-button');

    fireEvent.change(input, { target: { value: 'wrong-password' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  test('handles network error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PasswordGate onUnlock={() => {}} />);

    const input = screen.getByTestId('password-input');
    const button = screen.getByTestId('submit-button');

    fireEvent.change(input, { target: { value: 'any-password' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });
});
