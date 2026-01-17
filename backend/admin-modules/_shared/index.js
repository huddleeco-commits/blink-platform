/**
 * Shared Admin Module Utilities
 * Common functions and helpers for admin modules
 */

// API Fetch Helper
export async function adminFetch(endpoint, options = {}) {
  const API_URL = typeof window !== 'undefined' ? window.location.origin : '';
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('blink_admin_token') : '';

  const res = await fetch(`${API_URL}/api/admin${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Format currency
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// Format number with commas
export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

// Format date
export function formatDate(date, options = {}) {
  const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', { ...defaults, ...options });
}

// Format relative time
export function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

// Format file size
export function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

// Format percentage
export function formatPercent(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)}%`;
}

// Format duration (ms to human readable)
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// Debounce function
export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Get date range presets
export function getDateRangePresets() {
  const today = new Date();
  const formatForInput = (d) => d.toISOString().split('T')[0];

  return {
    today: {
      start: formatForInput(today),
      end: formatForInput(today)
    },
    last7Days: {
      start: formatForInput(new Date(today - 7 * 86400000)),
      end: formatForInput(today)
    },
    last30Days: {
      start: formatForInput(new Date(today - 30 * 86400000)),
      end: formatForInput(today)
    },
    thisMonth: {
      start: formatForInput(new Date(today.getFullYear(), today.getMonth(), 1)),
      end: formatForInput(today)
    },
    lastMonth: {
      start: formatForInput(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      end: formatForInput(new Date(today.getFullYear(), today.getMonth(), 0))
    }
  };
}

// Export all shared components
export * from './components/index.jsx';
