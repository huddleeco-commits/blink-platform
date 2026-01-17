/**
 * BLINK Admin Dashboard - Comprehensive 16-Tab Admin Interface
 * Modeled after SlabTrack admin system
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  DollarSign,
  TrendingUp,
  Building2,
  Package,
  AlertTriangle,
  Gauge,
  FileCode,
  Mail,
  Gift,
  Bell,
  CheckCircle2,
  Settings,
  Server,
  LogOut,
  Download,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Zap,
  Activity,
  Clock
} from 'lucide-react';

// ============================================
// CONTEXT & API
// ============================================

const AdminContext = createContext(null);
export function useAdmin() {
  return useContext(AdminContext);
}

const API_URL = window.location.origin;

async function adminFetch(endpoint, options = {}) {
  const token = localStorage.getItem('blink_admin_token');
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

// ============================================
// SHARED COMPONENTS
// ============================================

function StatCard({ title, value, subtitle, icon, color, trend }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statTitle}>{title}</div>
        {subtitle && <div style={styles.statSubtitle}>{subtitle}</div>}
      </div>
      {trend !== undefined && (
        <div style={{ color: trend >= 0 ? '#10b981' : '#ef4444', fontSize: '14px', fontWeight: 600 }}>
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
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
    <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

function TierBadge({ tier }) {
  const colors = {
    admin: { bg: '#8b5cf620', text: '#8b5cf6' },
    dealer: { bg: '#6366f120', text: '#6366f1' },
    power: { bg: '#10b98120', text: '#10b981' },
    free: { bg: '#6b728020', text: '#6b7280' }
  };
  const c = colors[tier] || colors.free;
  return (
    <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.text }}>
      {tier}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div style={styles.loading}>
      <div style={styles.spinner} />
      <span>Loading...</span>
    </div>
  );
}

function DataTable({ columns, data, loading }) {
  if (loading) return <LoadingSpinner />;
  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={styles.th}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={styles.tr}>
              {columns.map((col, j) => (
                <td key={j} style={styles.td}>
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

function Pagination({ page, setPage, total, limit }) {
  const totalPages = Math.ceil(total / limit);
  return (
    <div style={styles.pagination}>
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        style={styles.paginationBtn}
      >
        <ChevronLeft size={16} />
      </button>
      <span style={styles.paginationText}>
        Page {page} of {totalPages || 1} ({total} total)
      </span>
      <button
        onClick={() => setPage(p => p + 1)}
        disabled={page >= totalPages}
        style={styles.paginationBtn}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={styles.searchContainer}>
      <Search size={18} style={{ color: '#888' }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.searchInput}
      />
      {value && (
        <button onClick={() => onChange('')} style={styles.clearBtn}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function DateFilter({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div style={styles.dateFilter}>
      <input
        type="date"
        value={startDate}
        onChange={e => onStartChange(e.target.value)}
        style={styles.dateInput}
      />
      <span style={{ color: '#888' }}>to</span>
      <input
        type="date"
        value={endDate}
        onChange={e => onEndChange(e.target.value)}
        style={styles.dateInput}
      />
    </div>
  );
}

function ExportButton({ onClick, label = 'Export CSV' }) {
  return (
    <button onClick={onClick} style={styles.exportBtn}>
      <Download size={16} />
      {label}
    </button>
  );
}

// ============================================
// TAB 1: OVERVIEW DASHBOARD
// ============================================

function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/overview')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const stats = data || {};

  return (
    <div>
      <h1 style={styles.pageTitle}>Dashboard Overview</h1>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          subtitle={`${stats.activeToday || 0} active today`}
          icon={<Users size={24} />}
          color="#6366f1"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${(stats.mrr || 0).toLocaleString()}`}
          subtitle={`ARR: $${((stats.mrr || 0) * 12).toLocaleString()}`}
          icon={<DollarSign size={24} />}
          color="#10b981"
        />
        <StatCard
          title="API Costs (MTD)"
          value={`$${parseFloat(stats.apiCostThisMonth || 0).toFixed(2)}`}
          subtitle={`${(parseFloat(stats.tokensThisMonth || 0) / 1000).toFixed(0)}K tokens`}
          icon={<Activity size={24} />}
          color="#f59e0b"
        />
        <StatCard
          title="Generations"
          value={stats.totalGenerations || 0}
          subtitle={`${stats.generationsToday || 0} today`}
          icon={<Layers size={24} />}
          color="#8b5cf6"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Stats</h2>
          <div style={styles.quickStats}>
            <div style={styles.quickStatRow}>
              <span>Success Rate</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>{stats.successRate || 0}%</span>
            </div>
            <div style={styles.quickStatRow}>
              <span>Avg Generation Time</span>
              <span>{(parseFloat(stats.avgGenerationTime || 0) / 1000).toFixed(1)}s</span>
            </div>
            <div style={styles.quickStatRow}>
              <span>Conversion Rate</span>
              <span>{stats.conversionRate || 0}%</span>
            </div>
            <div style={styles.quickStatRow}>
              <span>Profit Margin</span>
              <span style={{ color: (stats.profitMargin || 0) > 50 ? '#10b981' : '#ef4444' }}>
                {stats.profitMargin || 0}%
              </span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Tier Distribution</h2>
          <div style={styles.quickStats}>
            {(stats.tierDistribution || []).map((tier, i) => (
              <div key={i} style={styles.quickStatRow}>
                <span><TierBadge tier={tier.tier} /></span>
                <span>{tier.count} users</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB 2: USERS
// ============================================

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminFetch(`/users?page=${page}&limit=25&search=${encodeURIComponent(search)}`)
      .then(data => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleExport = () => {
    window.open(`${API_URL}/api/admin/export/users`, '_blank');
  };

  const handleTierChange = async (userId, newTier) => {
    try {
      await adminFetch(`/users/${userId}/tier`, {
        method: 'PUT',
        body: JSON.stringify({ tier: newTier })
      });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBan = async (userId, banned) => {
    if (!confirm(`Are you sure you want to ${banned ? 'ban' : 'unban'} this user?`)) return;
    try {
      await adminFetch(`/users/${userId}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ banned })
      });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Users ({total})</h1>
        <ExportButton onClick={handleExport} />
      </div>

      <div style={styles.toolbar}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by email..." />
      </div>

      <DataTable
        loading={loading}
        data={users}
        columns={[
          { header: 'ID', key: 'id' },
          { header: 'Email', key: 'email', render: v => <strong>{v}</strong> },
          { header: 'Tier', key: 'subscription_tier', render: v => <TierBadge tier={v} /> },
          { header: 'Gens Used', key: 'generations_used', render: v => v || 0 },
          { header: 'Gens Limit', key: 'generations_limit', render: v => v || '-' },
          { header: 'Last Active', key: 'last_active_at', render: v => v ? new Date(v).toLocaleDateString() : 'Never' },
          { header: 'Joined', key: 'created_at', render: v => new Date(v).toLocaleDateString() },
          { header: 'Actions', key: 'id', render: (id, row) => (
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={row.subscription_tier}
                onChange={e => handleTierChange(id, e.target.value)}
                style={styles.miniSelect}
              >
                <option value="free">Free</option>
                <option value="power">Power</option>
                <option value="dealer">Dealer</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => handleBan(id, !row.banned)}
                style={{ ...styles.miniBtn, color: row.banned ? '#10b981' : '#ef4444' }}
              >
                {row.banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          )}
        ]}
      />

      <Pagination page={page} setPage={setPage} total={total} limit={25} />
    </div>
  );
}

// ============================================
// TAB 3: GENERATIONS
// ============================================

function GenerationsPage() {
  const [generations, setGenerations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminFetch(`/generations?page=${page}&limit=25`)
      .then(data => {
        setGenerations(data.generations || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const handleExport = () => {
    window.open(`${API_URL}/api/admin/export/generations`, '_blank');
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Generations ({total})</h1>
        <ExportButton onClick={handleExport} />
      </div>

      <DataTable
        loading={loading}
        data={generations}
        columns={[
          { header: 'ID', key: 'id' },
          { header: 'Site Name', key: 'site_name', render: (v, row) => (
            row.deployed_url ? (
              <a href={row.deployed_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                <strong>{v || 'Unnamed'}</strong>
              </a>
            ) : (
              <strong>{v || 'Unnamed'}</strong>
            )
          )},
          { header: 'Industry', key: 'industry' },
          { header: 'User', key: 'user_email', render: v => v || '-' },
          { header: 'Status', key: 'status', render: v => <StatusBadge status={v} /> },
          { header: 'Pages', key: 'pages_generated', render: v => v || 0 },
          { header: 'Cost', key: 'total_cost', render: v => `$${parseFloat(v || 0).toFixed(4)}` },
          { header: 'Time', key: 'generation_time_ms', render: v => v ? `${(v / 1000).toFixed(1)}s` : '-' },
          { header: 'Links', key: 'deployed_url', render: (v, row) => (
            <div style={{ display: 'flex', gap: '8px' }}>
              {v && (
                <a href={v} target="_blank" rel="noopener noreferrer" style={styles.linkBtn} title="View Live Site">
                  Live
                </a>
              )}
              {row.download_url && (
                <a href={row.download_url} target="_blank" rel="noopener noreferrer" style={styles.downloadBtn} title="Download">
                  DL
                </a>
              )}
              {!v && !row.download_url && '-'}
            </div>
          )},
          { header: 'Created', key: 'created_at', render: v => new Date(v).toLocaleDateString() }
        ]}
      />

      <Pagination page={page} setPage={setPage} total={total} limit={25} />
    </div>
  );
}

// ============================================
// TAB 4: API COSTS
// ============================================

function CostAnalyticsPage() {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminFetch(`/cost-analytics?startDate=${startDate}&endDate=${endDate}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>API Cost Analytics</h1>

      <div style={styles.toolbar}>
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total API Cost"
          value={`$${parseFloat(data?.summary?.totalCost || 0).toFixed(2)}`}
          icon={<DollarSign size={24} />}
          color="#ef4444"
        />
        <StatCard
          title="Total Tokens"
          value={`${(parseFloat(data?.summary?.totalTokens || 0) / 1000).toFixed(0)}K`}
          icon={<Zap size={24} />}
          color="#f59e0b"
        />
        <StatCard
          title="Total Calls"
          value={(data?.summary?.totalCalls || 0).toLocaleString()}
          icon={<Activity size={24} />}
          color="#6366f1"
        />
        <StatCard
          title="Avg Cost/Call"
          value={`$${parseFloat(data?.summary?.avgCostPerCall || 0).toFixed(4)}`}
          icon={<TrendingUp size={24} />}
          color="#10b981"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Cost by Operation</h2>
          <DataTable
            data={data?.byOperation || []}
            columns={[
              { header: 'Operation', key: 'operation_type', render: v => <strong>{v}</strong> },
              { header: 'Calls', key: 'count', render: v => parseInt(v).toLocaleString() },
              { header: 'Tokens', key: 'total_tokens', render: v => parseInt(v).toLocaleString() },
              { header: 'Cost', key: 'total_cost', render: v => `$${parseFloat(v).toFixed(2)}` }
            ]}
          />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Cost by Model</h2>
          <DataTable
            data={data?.byModel || []}
            columns={[
              { header: 'Model', key: 'model_used', render: v => <strong>{v}</strong> },
              { header: 'Calls', key: 'count', render: v => parseInt(v).toLocaleString() },
              { header: 'Cost', key: 'total_cost', render: v => `$${parseFloat(v).toFixed(2)}` }
            ]}
          />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Daily Cost Trend</h2>
        <div style={styles.chartArea}>
          {(data?.dailyCosts || []).slice(-14).map((d, i) => (
            <div key={i} style={styles.barRow}>
              <span style={styles.barLabel}>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.bar,
                  width: `${Math.min(100, (parseFloat(d.total_cost) / Math.max(...(data?.dailyCosts || []).map(x => parseFloat(x.total_cost) || 0.01))) * 100)}%`,
                  backgroundColor: '#6366f1'
                }} />
              </div>
              <span style={styles.barValue}>${parseFloat(d.total_cost).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB 5: REVENUE
// ============================================

function RevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/revenue')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Revenue Analytics</h1>

      <div style={styles.statsGrid}>
        <StatCard
          title="Monthly Revenue (MRR)"
          value={`$${(data?.mrr || 0).toLocaleString()}`}
          icon={<DollarSign size={24} />}
          color="#10b981"
        />
        <StatCard
          title="Annual Run Rate (ARR)"
          value={`$${(data?.arr || 0).toLocaleString()}`}
          icon={<TrendingUp size={24} />}
          color="#6366f1"
        />
        <StatCard
          title="Total Lifetime Revenue"
          value={`$${(data?.totalRevenue || 0).toLocaleString()}`}
          icon={<DollarSign size={24} />}
          color="#8b5cf6"
        />
        <StatCard
          title="Net Profit (MTD)"
          value={`$${parseFloat(data?.netProfit || 0).toFixed(2)}`}
          subtitle={`Margin: ${data?.profitMargin || 0}%`}
          icon={<TrendingUp size={24} />}
          color={(data?.netProfit || 0) >= 0 ? '#10b981' : '#ef4444'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Revenue by Tier</h2>
          <DataTable
            data={data?.byTier || []}
            columns={[
              { header: 'Tier', key: 'tier', render: v => <TierBadge tier={v} /> },
              { header: 'Users', key: 'count', render: v => parseInt(v).toLocaleString() },
              { header: 'MRR', key: 'mrr', render: v => `$${parseFloat(v || 0).toFixed(2)}` }
            ]}
          />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Monthly Trend</h2>
          <DataTable
            data={(data?.monthly || []).slice(-6)}
            columns={[
              { header: 'Month', key: 'month', render: v => new Date(v).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
              { header: 'Revenue', key: 'revenue', render: v => `$${parseFloat(v || 0).toFixed(2)}` },
              { header: 'New Users', key: 'new_users', render: v => parseInt(v || 0) },
              { header: 'Churn', key: 'churned', render: v => parseInt(v || 0) }
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB 6: INDUSTRIES
// ============================================

function IndustriesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/industries')
      .then(res => setData(res.industries || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const total = data.reduce((sum, d) => sum + parseInt(d.count), 0);

  return (
    <div>
      <h1 style={styles.pageTitle}>Industry Analytics</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Generations by Industry</h2>
        <div style={styles.chartArea}>
          {data.map((d, i) => {
            const pct = total > 0 ? (parseInt(d.count) / total * 100).toFixed(1) : 0;
            return (
              <div key={i} style={styles.barRow}>
                <span style={{ ...styles.barLabel, width: '150px' }}>{d.industry}</span>
                <div style={styles.barTrack}>
                  <div style={{
                    ...styles.bar,
                    width: `${pct}%`,
                    backgroundColor: `hsl(${i * 30}, 70%, 50%)`
                  }} />
                </div>
                <span style={styles.barValue}>{d.count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      <DataTable
        data={data}
        columns={[
          { header: 'Industry', key: 'industry', render: v => <strong>{v}</strong> },
          { header: 'Generations', key: 'count', render: v => parseInt(v).toLocaleString() },
          { header: 'Avg Pages', key: 'avg_pages', render: v => parseFloat(v || 0).toFixed(1) },
          { header: 'Total Cost', key: 'total_cost', render: v => `$${parseFloat(v || 0).toFixed(2)}` },
          { header: 'Success Rate', key: 'success_rate', render: v => `${parseFloat(v || 0).toFixed(1)}%` }
        ]}
      />
    </div>
  );
}

// ============================================
// TAB 7: MODULES
// ============================================

function ModulesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/modules')
      .then(res => setData(res.modules || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Module Usage Analytics</h1>

      <DataTable
        data={data}
        columns={[
          { header: 'Module', key: 'module_name', render: v => <strong>{v}</strong> },
          { header: 'Usage Count', key: 'usage_count', render: v => parseInt(v).toLocaleString() },
          { header: 'Industries', key: 'industries_used', render: v => v || '-' },
          { header: 'Avg Cost', key: 'avg_cost', render: v => `$${parseFloat(v || 0).toFixed(4)}` }
        ]}
      />
    </div>
  );
}

// ============================================
// TAB 8: ERRORS
// ============================================

function ErrorsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/errors')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Error Monitoring</h1>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total Errors (24h)"
          value={data?.errorsToday || 0}
          icon={<AlertTriangle size={24} />}
          color="#ef4444"
        />
        <StatCard
          title="Error Rate"
          value={`${parseFloat(data?.errorRate || 0).toFixed(2)}%`}
          icon={<Activity size={24} />}
          color="#f59e0b"
        />
        <StatCard
          title="Avg Response Time"
          value={`${(data?.avgResponseTime || 0)}ms`}
          icon={<Clock size={24} />}
          color="#6366f1"
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Error Patterns</h2>
        <DataTable
          data={data?.patterns || []}
          columns={[
            { header: 'Error Type', key: 'error_type', render: v => <strong>{v}</strong> },
            { header: 'Count', key: 'count', render: v => parseInt(v) },
            { header: 'Last Occurrence', key: 'last_occurred', render: v => v ? new Date(v).toLocaleString() : '-' },
            { header: 'Affected Users', key: 'affected_users', render: v => v || 0 }
          ]}
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Errors</h2>
        <DataTable
          data={data?.recent || []}
          columns={[
            { header: 'Time', key: 'timestamp', render: v => new Date(v).toLocaleString() },
            { header: 'Operation', key: 'operation_type' },
            { header: 'Error', key: 'error_message', render: v => <span style={{ color: '#ef4444' }}>{v}</span> },
            { header: 'User', key: 'user_email', render: v => v || 'Anonymous' }
          ]}
        />
      </div>
    </div>
  );
}

// ============================================
// TAB 9: PERFORMANCE
// ============================================

function PerformancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/performance')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Performance Metrics</h1>

      <div style={styles.statsGrid}>
        <StatCard
          title="Avg Generation Time"
          value={`${(parseFloat(data?.avgGenerationTime || 0) / 1000).toFixed(1)}s`}
          icon={<Clock size={24} />}
          color="#6366f1"
        />
        <StatCard
          title="P95 Response Time"
          value={`${(parseFloat(data?.p95ResponseTime || 0) / 1000).toFixed(1)}s`}
          icon={<Gauge size={24} />}
          color="#f59e0b"
        />
        <StatCard
          title="Throughput"
          value={`${data?.throughput || 0}/hr`}
          icon={<Activity size={24} />}
          color="#10b981"
        />
        <StatCard
          title="Success Rate"
          value={`${parseFloat(data?.successRate || 0).toFixed(1)}%`}
          icon={<CheckCircle2 size={24} />}
          color="#10b981"
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Performance by Operation</h2>
        <DataTable
          data={data?.byOperation || []}
          columns={[
            { header: 'Operation', key: 'operation_type', render: v => <strong>{v}</strong> },
            { header: 'Avg Time', key: 'avg_duration', render: v => `${parseInt(v)}ms` },
            { header: 'P95 Time', key: 'p95_duration', render: v => `${parseInt(v)}ms` },
            { header: 'Count', key: 'count', render: v => parseInt(v).toLocaleString() }
          ]}
        />
      </div>
    </div>
  );
}

// ============================================
// TAB 10: TEMPLATES
// ============================================

function TemplatesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/templates')
      .then(res => setData(res.templates || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Template Analytics</h1>

      <DataTable
        data={data}
        columns={[
          { header: 'Template', key: 'template_name', render: v => <strong>{v}</strong> },
          { header: 'Usage Count', key: 'usage_count', render: v => parseInt(v).toLocaleString() },
          { header: 'Industries', key: 'industries_used', render: v => v || '-' },
          { header: 'Avg Pages', key: 'avg_pages', render: v => parseFloat(v || 0).toFixed(1) },
          { header: 'Success Rate', key: 'success_rate', render: v => `${parseFloat(v || 0).toFixed(1)}%` }
        ]}
      />
    </div>
  );
}

// ============================================
// TAB 11: EMAIL CAMPAIGNS
// ============================================

function EmailPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    adminFetch('/email/campaigns')
      .then(res => setCampaigns(res.campaigns || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Email Campaigns</h1>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}>
          + New Campaign
        </button>
      </div>

      <DataTable
        data={campaigns}
        columns={[
          { header: 'Name', key: 'name', render: v => <strong>{v}</strong> },
          { header: 'Subject', key: 'subject' },
          { header: 'Status', key: 'status', render: v => <StatusBadge status={v} /> },
          { header: 'Target', key: 'target_tier', render: v => <TierBadge tier={v || 'all'} /> },
          { header: 'Sent', key: 'sent_count', render: v => v || 0 },
          { header: 'Opened', key: 'opened_count', render: v => v || 0 },
          { header: 'Open Rate', key: 'open_rate', render: (_, row) =>
            `${row.sent_count ? ((row.opened_count / row.sent_count) * 100).toFixed(1) : 0}%`
          },
          { header: 'Created', key: 'created_at', render: v => new Date(v).toLocaleDateString() }
        ]}
      />
    </div>
  );
}

// ============================================
// TAB 12: REFERRALS
// ============================================

function ReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', discount_percent: 20, max_uses: 100 });

  const fetchReferrals = () => {
    setLoading(true);
    adminFetch('/referrals')
      .then(res => setReferrals(res.referrals || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReferrals(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminFetch('/referrals', {
        method: 'POST',
        body: JSON.stringify(newCode)
      });
      setShowCreate(false);
      setNewCode({ code: '', discount_percent: 20, max_uses: 100 });
      fetchReferrals();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Referral Codes</h1>
        <button onClick={() => setShowCreate(true)} style={styles.primaryBtn}>
          + New Code
        </button>
      </div>

      {showCreate && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ color: '#fff', marginBottom: '16px' }}>Create Referral Code</h3>
            <form onSubmit={handleCreate}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Code</label>
                <input
                  type="text"
                  value={newCode.code}
                  onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                  style={styles.input}
                  placeholder="SAVE20"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Discount %</label>
                <input
                  type="number"
                  value={newCode.discount_percent}
                  onChange={e => setNewCode({ ...newCode, discount_percent: parseInt(e.target.value) })}
                  style={styles.input}
                  min="1"
                  max="100"
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Max Uses</label>
                <input
                  type="number"
                  value={newCode.max_uses}
                  onChange={e => setNewCode({ ...newCode, max_uses: parseInt(e.target.value) })}
                  style={styles.input}
                  min="1"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" style={styles.primaryBtn}>Create</button>
                <button type="button" onClick={() => setShowCreate(false)} style={styles.secondaryBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DataTable
        data={referrals}
        columns={[
          { header: 'Code', key: 'code', render: v => <strong>{v}</strong> },
          { header: 'Discount', key: 'discount_percent', render: v => `${v}%` },
          { header: 'Uses', key: 'times_used', render: (v, row) => `${v || 0} / ${row.max_uses}` },
          { header: 'Status', key: 'is_active', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
          { header: 'Revenue', key: 'total_revenue', render: v => `$${parseFloat(v || 0).toFixed(2)}` },
          { header: 'Created', key: 'created_at', render: v => new Date(v).toLocaleDateString() }
        ]}
      />
    </div>
  );
}

// ============================================
// TAB 13: ALERTS
// ============================================

function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      adminFetch('/alerts'),
      adminFetch('/alerts/rules')
    ]).then(([alertsRes, rulesRes]) => {
      setAlerts(alertsRes.alerts || []);
      setRules(rulesRes.rules || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleResolve = async (alertId) => {
    try {
      await adminFetch(`/alerts/${alertId}/resolve`, { method: 'PUT' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>System Alerts</h1>

      <div style={styles.statsGrid}>
        <StatCard
          title="Active Alerts"
          value={alerts.filter(a => !a.resolved).length}
          icon={<Bell size={24} />}
          color="#ef4444"
        />
        <StatCard
          title="Critical"
          value={alerts.filter(a => !a.resolved && a.severity === 'critical').length}
          icon={<AlertTriangle size={24} />}
          color="#ef4444"
        />
        <StatCard
          title="Warnings"
          value={alerts.filter(a => !a.resolved && a.severity === 'warning').length}
          icon={<AlertTriangle size={24} />}
          color="#f59e0b"
        />
        <StatCard
          title="Alert Rules"
          value={rules.length}
          icon={<Settings size={24} />}
          color="#6366f1"
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Alerts</h2>
        <DataTable
          data={alerts.slice(0, 20)}
          columns={[
            { header: 'Severity', key: 'severity', render: v => <StatusBadge status={v} /> },
            { header: 'Title', key: 'title', render: v => <strong>{v}</strong> },
            { header: 'Message', key: 'message' },
            { header: 'Time', key: 'created_at', render: v => new Date(v).toLocaleString() },
            { header: 'Status', key: 'resolved', render: v => <StatusBadge status={v ? 'resolved' : 'active'} /> },
            { header: 'Action', key: 'id', render: (id, row) => (
              !row.resolved && (
                <button onClick={() => handleResolve(id)} style={styles.miniBtn}>
                  Resolve
                </button>
              )
            )}
          ]}
        />
      </div>
    </div>
  );
}

// ============================================
// TAB 14: DATA QUALITY
// ============================================

function DataQualityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/data-quality')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Data Quality</h1>

      <div style={styles.statsGrid}>
        <StatCard
          title="Data Quality Score"
          value={`${data?.overallScore || 0}%`}
          icon={<CheckCircle2 size={24} />}
          color={(data?.overallScore || 0) >= 90 ? '#10b981' : '#f59e0b'}
        />
        <StatCard
          title="Issues Found"
          value={data?.issuesCount || 0}
          icon={<AlertTriangle size={24} />}
          color="#ef4444"
        />
        <StatCard
          title="Last Check"
          value={data?.lastCheck ? new Date(data.lastCheck).toLocaleTimeString() : 'Never'}
          icon={<RefreshCw size={24} />}
          color="#6366f1"
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quality Checks</h2>
        <DataTable
          data={data?.checks || []}
          columns={[
            { header: 'Check', key: 'check_name', render: v => <strong>{v}</strong> },
            { header: 'Status', key: 'passed', render: v => <StatusBadge status={v ? 'passed' : 'failed'} /> },
            { header: 'Records Affected', key: 'affected_count', render: v => parseInt(v || 0).toLocaleString() },
            { header: 'Last Run', key: 'last_run', render: v => v ? new Date(v).toLocaleString() : '-' }
          ]}
        />
      </div>
    </div>
  );
}

// ============================================
// TAB 15: CONFIG
// ============================================

function ConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchConfigs = () => {
    setLoading(true);
    adminFetch('/config')
      .then(res => setConfigs(res.configs || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleSave = async (key, value) => {
    try {
      await adminFetch('/config', {
        method: 'PUT',
        body: JSON.stringify({ key, value })
      });
      setEditing(null);
      fetchConfigs();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Platform Configuration</h1>

      <div style={styles.section}>
        <DataTable
          data={configs}
          columns={[
            { header: 'Key', key: 'config_key', render: v => <strong>{v}</strong> },
            { header: 'Value', key: 'config_value', render: (v, row) =>
              editing === row.config_key ? (
                <input
                  type="text"
                  defaultValue={v}
                  onBlur={e => handleSave(row.config_key, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave(row.config_key, e.target.value)}
                  style={styles.input}
                  autoFocus
                />
              ) : (
                <span onClick={() => setEditing(row.config_key)} style={{ cursor: 'pointer' }}>
                  {v}
                </span>
              )
            },
            { header: 'Category', key: 'category' },
            { header: 'Updated', key: 'updated_at', render: v => v ? new Date(v).toLocaleString() : '-' }
          ]}
        />
      </div>
    </div>
  );
}

// ============================================
// TAB 16: SYSTEM HEALTH
// ============================================

function SystemPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    adminFetch('/health')
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>System Health</h1>
        <button onClick={fetchHealth} style={styles.secondaryBtn}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          title="System Status"
          value={data?.status || 'Unknown'}
          icon={<Server size={24} />}
          color={data?.status === 'healthy' ? '#10b981' : '#ef4444'}
        />
        <StatCard
          title="Uptime"
          value={data?.uptime || '0h'}
          icon={<Clock size={24} />}
          color="#6366f1"
        />
        <StatCard
          title="Memory Usage"
          value={`${data?.memoryUsage || 0}%`}
          icon={<Gauge size={24} />}
          color={(data?.memoryUsage || 0) < 80 ? '#10b981' : '#ef4444'}
        />
        <StatCard
          title="Database Pool"
          value={`${data?.dbPoolUsed || 0}/${data?.dbPoolMax || 0}`}
          icon={<Server size={24} />}
          color="#f59e0b"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Services</h2>
          <div style={styles.quickStats}>
            {(data?.services || []).map((svc, i) => (
              <div key={i} style={styles.quickStatRow}>
                <span>{svc.name}</span>
                <StatusBadge status={svc.status} />
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <div style={styles.quickStats}>
            <div style={styles.quickStatRow}>
              <span>API Requests (1h)</span>
              <span>{data?.recentRequests || 0}</span>
            </div>
            <div style={styles.quickStatRow}>
              <span>Errors (1h)</span>
              <span style={{ color: '#ef4444' }}>{data?.recentErrors || 0}</span>
            </div>
            <div style={styles.quickStatRow}>
              <span>Active Sessions</span>
              <span>{data?.activeSessions || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LOGIN PAGE
// ============================================

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (!data.user?.is_admin) throw new Error('Admin access required');

      localStorage.setItem('blink_admin_token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <Zap size={48} color="#6366f1" />
          <h1 style={styles.loginTitle}>BLINK Admin</h1>
          <p style={styles.loginSubtitle}>Sign in to your admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              placeholder="admin@blink.be1st.io"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" style={styles.loginBtn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================
// SIDEBAR
// ============================================

function Sidebar({ currentPage, setPage, onLogout }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'generations', label: 'Generations', icon: <Layers size={20} /> },
    { id: 'costs', label: 'API Costs', icon: <DollarSign size={20} /> },
    { id: 'revenue', label: 'Revenue', icon: <TrendingUp size={20} /> },
    { id: 'industries', label: 'Industries', icon: <Building2 size={20} /> },
    { id: 'modules', label: 'Modules', icon: <Package size={20} /> },
    { id: 'errors', label: 'Errors', icon: <AlertTriangle size={20} /> },
    { id: 'performance', label: 'Performance', icon: <Gauge size={20} /> },
    { id: 'templates', label: 'Templates', icon: <FileCode size={20} /> },
    { id: 'email', label: 'Email', icon: <Mail size={20} /> },
    { id: 'referrals', label: 'Referrals', icon: <Gift size={20} /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell size={20} /> },
    { id: 'data-quality', label: 'Data Quality', icon: <CheckCircle2 size={20} /> },
    { id: 'config', label: 'Config', icon: <Settings size={20} /> },
    { id: 'system', label: 'System', icon: <Server size={20} /> }
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <Zap size={28} color="#6366f1" />
        <span style={styles.sidebarTitle}>BLINK Admin</span>
      </div>

      <nav style={styles.nav}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              ...styles.navItem,
              ...(currentPage === item.id ? styles.navItemActive : {})
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div style={styles.sidebarFooter}>
        <button onClick={onLogout} style={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

export default function AdminApp() {
  const [admin, setAdmin] = useState(null);
  const [currentPage, setCurrentPage] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('blink_admin_token');
    if (token) {
      adminFetch('/me')
        .then(data => setAdmin(data.admin || data.user))
        .catch(() => localStorage.removeItem('blink_admin_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('blink_admin_token');
    setAdmin(null);
  };

  if (loading) return <LoadingSpinner />;

  if (!admin) {
    return <LoginPage onLogin={setAdmin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <OverviewPage />;
      case 'users': return <UsersPage />;
      case 'generations': return <GenerationsPage />;
      case 'costs': return <CostAnalyticsPage />;
      case 'revenue': return <RevenuePage />;
      case 'industries': return <IndustriesPage />;
      case 'modules': return <ModulesPage />;
      case 'errors': return <ErrorsPage />;
      case 'performance': return <PerformancePage />;
      case 'templates': return <TemplatesPage />;
      case 'email': return <EmailPage />;
      case 'referrals': return <ReferralsPage />;
      case 'alerts': return <AlertsPage />;
      case 'data-quality': return <DataQualityPage />;
      case 'config': return <ConfigPage />;
      case 'system': return <SystemPage />;
      default: return <OverviewPage />;
    }
  };

  return (
    <AdminContext.Provider value={{ admin }}>
      <div style={styles.container}>
        <Sidebar currentPage={currentPage} setPage={setCurrentPage} onLogout={handleLogout} />
        <main style={styles.main}>
          {renderPage()}
        </main>
      </div>
    </AdminContext.Provider>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#0a0a0f'
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#12121a',
    borderRight: '1px solid #2a2a3a',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto'
  },
  sidebarHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #2a2a3a'
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#fff'
  },
  nav: {
    padding: '12px',
    flex: 1
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    marginBottom: '2px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  navItemActive: {
    backgroundColor: '#6366f120',
    color: '#6366f1'
  },
  sidebarFooter: {
    padding: '12px',
    borderTop: '1px solid #2a2a3a'
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer'
  },
  main: {
    flex: 1,
    marginLeft: '240px',
    padding: '24px'
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '24px'
  },
  toolbar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: '#12121a',
    border: '1px solid #2a2a3a',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#fff'
  },
  statTitle: {
    fontSize: '13px',
    color: '#888'
  },
  statSubtitle: {
    fontSize: '11px',
    color: '#666',
    marginTop: '2px'
  },
  section: {
    backgroundColor: '#12121a',
    border: '1px solid #2a2a3a',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '14px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    borderBottom: '1px solid #2a2a3a'
  },
  tr: {
    borderBottom: '1px solid #1a1a2a'
  },
  td: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#ccc'
  },
  badge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'capitalize'
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '20px'
  },
  paginationBtn: {
    padding: '6px 12px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  paginationText: {
    color: '#888',
    fontSize: '13px'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    flex: 1,
    maxWidth: '300px'
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '13px',
    outline: 'none'
  },
  clearBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '0',
    display: 'flex'
  },
  dateFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  dateInput: {
    padding: '8px 12px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px'
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer'
  },
  primaryBtn: {
    padding: '10px 20px',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer'
  },
  miniSelect: {
    padding: '4px 8px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3a',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px'
  },
  miniBtn: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a3a',
    borderRadius: '4px',
    fontSize: '11px',
    cursor: 'pointer'
  },
  quickStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  quickStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #1a1a2a',
    color: '#ccc',
    fontSize: '13px'
  },
  chartArea: {
    padding: '16px',
    backgroundColor: '#0a0a0f',
    borderRadius: '8px'
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  barLabel: {
    width: '80px',
    fontSize: '11px',
    color: '#888',
    flexShrink: 0
  },
  barTrack: {
    flex: 1,
    height: '20px',
    backgroundColor: '#1a1a2e',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  bar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  barValue: {
    width: '70px',
    fontSize: '12px',
    color: '#ccc',
    textAlign: 'right',
    flexShrink: 0
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#12121a',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#ccc',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#0a0a0f',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '14px',
    color: '#888'
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #2a2a3a',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0f',
    padding: '20px'
  },
  loginCard: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#12121a',
    border: '1px solid #2a2a3a',
    borderRadius: '14px',
    padding: '36px'
  },
  loginHeader: {
    textAlign: 'center',
    marginBottom: '28px'
  },
  loginTitle: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#fff',
    marginTop: '14px'
  },
  loginSubtitle: {
    fontSize: '13px',
    color: '#888',
    marginTop: '6px'
  },
  loginBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px'
  },
  error: {
    padding: '10px',
    backgroundColor: '#ef444420',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '16px'
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  linkBtn: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: '#10b98120',
    border: '1px solid #10b981',
    borderRadius: '4px',
    color: '#10b981',
    fontSize: '11px',
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer'
  },
  downloadBtn: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: '#6366f120',
    border: '1px solid #6366f1',
    borderRadius: '4px',
    color: '#6366f1',
    fontSize: '11px',
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer'
  }
};
