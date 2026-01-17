/**
 * useWindowSize Hook Tests
 *
 * Tests for the responsive window size detection hook
 */

import { renderHook, act } from '@testing-library/react';

// Recreate the useWindowSize hook for testing
const useWindowSize = () => {
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Import React
const React = require('react');

describe('useWindowSize Hook', () => {
  // Store original window dimensions
  let originalInnerWidth;
  let originalInnerHeight;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    });
  });

  const setWindowSize = (width, height) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height
    });
    window.dispatchEvent(new Event('resize'));
  };

  test('should return initial window size', () => {
    setWindowSize(1024, 768);

    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  test('should update on window resize', () => {
    setWindowSize(1024, 768);

    const { result } = renderHook(() => useWindowSize());

    act(() => {
      setWindowSize(1440, 900);
    });

    expect(result.current.width).toBe(1440);
    expect(result.current.height).toBe(900);
  });

  test('should detect mobile viewport', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      setWindowSize(375, 667);
    });

    expect(result.current.width).toBeLessThan(768);
  });

  test('should detect tablet viewport', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      setWindowSize(768, 1024);
    });

    expect(result.current.width).toBeGreaterThanOrEqual(768);
    expect(result.current.width).toBeLessThan(1024);
  });

  test('should detect desktop viewport', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      setWindowSize(1440, 900);
    });

    expect(result.current.width).toBeGreaterThanOrEqual(1024);
  });

  test('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useWindowSize());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});

// Helper function tests
describe('Layout Mode Detection', () => {
  const getLayoutMode = (width) => {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1440) return 'desktop';
    return 'largeDesktop';
  };

  test('should return mobile for small screens', () => {
    expect(getLayoutMode(375)).toBe('mobile');
    expect(getLayoutMode(414)).toBe('mobile');
    expect(getLayoutMode(767)).toBe('mobile');
  });

  test('should return tablet for medium screens', () => {
    expect(getLayoutMode(768)).toBe('tablet');
    expect(getLayoutMode(834)).toBe('tablet');
    expect(getLayoutMode(1023)).toBe('tablet');
  });

  test('should return desktop for large screens', () => {
    expect(getLayoutMode(1024)).toBe('desktop');
    expect(getLayoutMode(1280)).toBe('desktop');
    expect(getLayoutMode(1439)).toBe('desktop');
  });

  test('should return largeDesktop for extra large screens', () => {
    expect(getLayoutMode(1440)).toBe('largeDesktop');
    expect(getLayoutMode(1920)).toBe('largeDesktop');
    expect(getLayoutMode(2560)).toBe('largeDesktop');
  });
});
