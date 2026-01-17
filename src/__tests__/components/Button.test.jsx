/**
 * Button Component Tests
 *
 * Tests for common button patterns used in the application
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Simple button component for testing (mimics app patterns)
const Button = ({ children, onClick, disabled, variant = 'primary', loading }) => {
  const baseStyles = {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    fontWeight: '600',
    transition: 'all 0.2s'
  };

  const variants = {
    primary: { background: '#22c55e', color: '#fff' },
    secondary: { background: '#374151', color: '#fff' },
    danger: { background: '#ef4444', color: '#fff' },
    ghost: { background: 'transparent', color: '#22c55e', border: '1px solid #22c55e' }
  };

  return (
    <button
      style={{ ...baseStyles, ...variants[variant] }}
      onClick={onClick}
      disabled={disabled || loading}
      data-testid="button"
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

describe('Button Component', () => {
  describe('Rendering', () => {
    test('renders button with text', () => {
      render(<Button>Click Me</Button>);

      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    test('renders button with testid', () => {
      render(<Button>Test</Button>);

      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    test('renders loading state', () => {
      render(<Button loading>Submit</Button>);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      fireEvent.click(screen.getByTestId('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Click Me</Button>);

      fireEvent.click(screen.getByTestId('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    test('does not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Click Me</Button>);

      fireEvent.click(screen.getByTestId('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    test('button is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByTestId('button')).toBeDisabled();
    });

    test('button is disabled when loading', () => {
      render(<Button loading>Loading</Button>);

      expect(screen.getByTestId('button')).toBeDisabled();
    });
  });

  describe('Variants', () => {
    test('renders primary variant by default', () => {
      render(<Button>Primary</Button>);

      const button = screen.getByTestId('button');
      expect(button).toHaveStyle({ background: '#22c55e' });
    });

    test('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByTestId('button');
      expect(button).toHaveStyle({ background: '#374151' });
    });

    test('renders danger variant', () => {
      render(<Button variant="danger">Delete</Button>);

      const button = screen.getByTestId('button');
      expect(button).toHaveStyle({ background: '#ef4444' });
    });
  });
});
