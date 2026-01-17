/**
 * Shared Admin Components
 * Common UI components used across all admin modules
 */

import React from 'react';
import {
  Search, X, ChevronLeft, ChevronRight, Download, RefreshCw
} from 'lucide-react';

// Stat Card - displays metrics with icons and trends
export function StatCard({ title, value, subtitle, icon, color, trend }) {
  return (
    <div className="admin-stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );
}

// Status Badge - renders status badges
export function StatusBadge({ status }) {
  const colors = {
    completed: { bg: '#10b98120', text: '#10b981' },
    active: { bg: '#10b98120', text: '#10b981' },
    generating: { bg: '#f59e0b20', text: '#f59e0b' },
    pending: { bg: '#6366f120', text: '#6366f1' },
    failed: { bg: '#ef444420', text: '#ef4444' },
    cancelled: { bg: '#6b728020', text: '#6b7280' },
    warning: { bg: '#f59e0b20', text: '#f59e0b' },
    critical: { bg: '#ef444420', text: '#ef4444' },
    info: { bg: '#3b82f620', text: '#3b82f6' },
    resolved: { bg: '#10b98120', text: '#10b981' }
  };
  const c = colors[status] || colors.pending;
  return (
    <span className="admin-badge" style={{ backgroundColor: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

// Tier Badge - renders subscription tier badges
export function TierBadge({ tier }) {
  const colors = {
    admin: { bg: '#8b5cf620', text: '#8b5cf6' },
    dealer: { bg: '#6366f120', text: '#6366f1' },
    power: { bg: '#10b98120', text: '#10b981' },
    free: { bg: '#6b728020', text: '#6b7280' },
    enterprise: { bg: '#f59e0b20', text: '#f59e0b' },
    pro: { bg: '#3b82f620', text: '#3b82f6' },
    standard: { bg: '#10b98120', text: '#10b981' },
    lite: { bg: '#6b728020', text: '#6b7280' }
  };
  const c = colors[tier] || colors.free;
  return (
    <span className="admin-badge" style={{ backgroundColor: c.bg, color: c.text }}>
      {tier}
    </span>
  );
}

// Loading Spinner
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="admin-loading">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
}

// Data Table with pagination support
export function DataTable({ columns, data, loading, emptyMessage = 'No data found' }) {
  if (loading) return <LoadingSpinner />;

  if (!data || data.length === 0) {
    return <div className="admin-empty">{emptyMessage}</div>;
  }

  return (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((col, j) => (
                <td key={j}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Pagination
export function Pagination({ page, setPage, total, limit = 20 }) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <div className="admin-pagination">
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="pagination-btn"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="pagination-text">
        Page {page} of {totalPages || 1} ({total} total)
      </span>
      <button
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page >= totalPages}
        className="pagination-btn"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// Search Bar
export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="admin-search">
      <Search size={18} className="search-icon" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && (
        <button onClick={() => onChange('')} className="clear-btn">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// Date Range Filter
export function DateFilter({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div className="admin-date-filter">
      <input
        type="date"
        value={startDate}
        onChange={e => onStartChange(e.target.value)}
        className="date-input"
      />
      <span>to</span>
      <input
        type="date"
        value={endDate}
        onChange={e => onEndChange(e.target.value)}
        className="date-input"
      />
    </div>
  );
}

// Export Button
export function ExportButton({ endpoint, filename, label = 'Export CSV' }) {
  const handleExport = async () => {
    const token = localStorage.getItem('blink_admin_token');
    const res = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport} className="admin-btn secondary">
      <Download size={16} />
      {label}
    </button>
  );
}

// Refresh Button
export function RefreshButton({ onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} className="admin-btn secondary">
      <RefreshCw size={16} className={loading ? 'spinning' : ''} />
      Refresh
    </button>
  );
}

// Card Container
export function Card({ title, children, actions }) {
  return (
    <div className="admin-card">
      {(title || actions) && (
        <div className="card-header">
          {title && <h3>{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}

// Simple Bar Chart
export function BarChart({ data, xKey, yKey, color = '#6366f1' }) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d[yKey]));

  return (
    <div className="admin-bar-chart">
      {data.map((item, i) => (
        <div key={i} className="bar-item">
          <div
            className="bar"
            style={{
              height: `${(item[yKey] / maxValue) * 100}%`,
              backgroundColor: color
            }}
          />
          <span className="bar-label">{item[xKey]}</span>
        </div>
      ))}
    </div>
  );
}

// Confirm Dialog
export function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="admin-btn secondary">Cancel</button>
          <button onClick={onConfirm} className="admin-btn primary">Confirm</button>
        </div>
      </div>
    </div>
  );
}
