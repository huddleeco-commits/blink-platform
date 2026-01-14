/**
 * BLINK Admin Dashboard
 * Main admin application with routing
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Activity,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  X,
  Zap
} from 'lucide-react';

// Admin Context
const AdminContext = createContext(null);

export function useAdmin() {
  return useContext(AdminContext);
}

// API Helper
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
// PAGES
// ============================================

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/dashboard').then(data => {
      setStats(data.stats);
      setProjects(data.recentProjects);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Dashboard Overview</h1>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects || 0}
          subtitle={`${stats?.projectsThisMonth || 0} this month`}
          icon={<FolderKanban />}
          color="#6366f1"
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={`$${(stats?.mrr || 0).toLocaleString()}`}
          subtitle={`${stats?.activeSubscribers || 0} subscribers`}
          icon={<DollarSign />}
          color="#10b981"
        />
        <StatCard
          title="API Costs (MTD)"
          value={`$${(stats?.apiCostThisMonth || 0).toFixed(2)}`}
          subtitle={`${((stats?.tokensThisMonth || 0) / 1000).toFixed(0)}K tokens`}
          icon={<Activity />}
          color="#f59e0b"
        />
        <StatCard
          title="Profit Margin"
          value={`${stats?.profitMargin || 0}%`}
          subtitle="Revenue - API costs"
          icon={<BarChart3 />}
          color={stats?.profitMargin > 50 ? '#10b981' : '#ef4444'}
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Projects</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Industry</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Domain</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id} style={styles.tr}>
                  <td style={styles.td}>{project.name}</td>
                  <td style={styles.td}>{project.industry || '-'}</td>
                  <td style={styles.td}>
                    <StatusBadge status={project.status} />
                  </td>
                  <td style={styles.td}>
                    {project.domain ? (
                      <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer" style={styles.link}>
                        {project.domain}
                      </a>
                    ) : '-'}
                  </td>
                  <td style={styles.td}>{new Date(project.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>${(project.api_cost || 0).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminFetch(`/projects?page=${page}&limit=25`).then(data => {
      setProjects(data.projects);
      setTotal(data.total);
      setLoading(false);
    });
  }, [page]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>All Projects ({total})</h1>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Industry</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Domain</th>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Tokens</th>
              <th style={styles.th}>Cost</th>
              <th style={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={styles.tr}>
                <td style={styles.td}>{p.id}</td>
                <td style={styles.td}><strong>{p.name}</strong></td>
                <td style={styles.td}>{p.industry || '-'}</td>
                <td style={styles.td}><StatusBadge status={p.status} /></td>
                <td style={styles.td}>
                  {p.deploy_url ? (
                    <a href={p.deploy_url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      {p.domain || 'View'}
                    </a>
                  ) : '-'}
                </td>
                <td style={styles.td}>{p.user_email || '-'}</td>
                <td style={styles.td}>{(p.api_tokens_used || 0).toLocaleString()}</td>
                <td style={styles.td}>${(p.api_cost || 0).toFixed(4)}</td>
                <td style={styles.td}>{new Date(p.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.paginationBtn}>
          Previous
        </button>
        <span style={styles.paginationText}>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={projects.length < 25} style={styles.paginationBtn}>
          Next
        </button>
      </div>
    </div>
  );
}

function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminFetch(`/subscribers?page=${page}`).then(data => {
      setSubscribers(data.subscribers);
      setTotal(data.total);
      setLoading(false);
    });
  }, [page]);

  if (loading) return <LoadingSpinner />;

  const totalMrr = subscribers.reduce((sum, s) => sum + parseFloat(s.mrr || 0), 0);

  return (
    <div>
      <h1 style={styles.pageTitle}>Subscribers ({total})</h1>

      <div style={styles.statsGrid}>
        <StatCard title="Total Subscribers" value={total} icon={<Users />} color="#6366f1" />
        <StatCard title="Active" value={subscribers.filter(s => s.status === 'active').length} icon={<Activity />} color="#10b981" />
        <StatCard title="Total MRR" value={`$${totalMrr.toFixed(2)}`} icon={<DollarSign />} color="#f59e0b" />
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Plan</th>
              <th style={styles.th}>MRR</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Projects</th>
              <th style={styles.th}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(s => (
              <tr key={s.id} style={styles.tr}>
                <td style={styles.td}>{s.email}</td>
                <td style={styles.td}>{s.name || '-'}</td>
                <td style={styles.td}><PlanBadge plan={s.plan} /></td>
                <td style={styles.td}>${(s.mrr || 0).toFixed(2)}</td>
                <td style={styles.td}><StatusBadge status={s.status} /></td>
                <td style={styles.td}>{s.projects_created || 0}</td>
                <td style={styles.td}>{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsagePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/usage?days=30').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>API Usage (Last 30 Days)</h1>

      <div style={styles.statsGrid}>
        <StatCard title="Total Requests" value={data?.totals?.requests || 0} icon={<Activity />} color="#6366f1" />
        <StatCard title="Total Tokens" value={`${((data?.totals?.tokens || 0) / 1000).toFixed(0)}K`} icon={<Zap />} color="#f59e0b" />
        <StatCard title="Total Cost" value={`$${(data?.totals?.cost || 0).toFixed(2)}`} icon={<DollarSign />} color="#ef4444" />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Usage by Endpoint</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Endpoint</th>
                <th style={styles.th}>Requests</th>
                <th style={styles.th}>Tokens</th>
                <th style={styles.th}>Cost</th>
                <th style={styles.th}>Avg Duration</th>
              </tr>
            </thead>
            <tbody>
              {(data?.stats || []).map((s, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}><strong>{s.endpoint}</strong></td>
                  <td style={styles.td}>{parseInt(s.requests).toLocaleString()}</td>
                  <td style={styles.td}>{parseInt(s.total_tokens || 0).toLocaleString()}</td>
                  <td style={styles.td}>${parseFloat(s.total_cost || 0).toFixed(4)}</td>
                  <td style={styles.td}>{parseInt(s.avg_duration || 0)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CostsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/costs').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Cost Tracking</h1>

      <div style={styles.statsGrid}>
        <StatCard title="Fixed Costs" value={`$${(data?.totals?.fixed || 0).toFixed(2)}`} subtitle="Hosting, domains" icon={<DollarSign />} color="#6366f1" />
        <StatCard title="Variable Costs" value={`$${(data?.totals?.variable || 0).toFixed(2)}`} subtitle="API usage" icon={<Activity />} color="#f59e0b" />
        <StatCard title="Total Costs" value={`$${(data?.totals?.total || 0).toFixed(2)}`} subtitle="This month" icon={<BarChart3 />} color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Fixed Costs</h2>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Vendor</th>
                  <th style={styles.th}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(data?.fixed || []).map((c, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{c.category}</td>
                    <td style={styles.td}>{c.vendor || '-'}</td>
                    <td style={styles.td}>${parseFloat(c.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>API Costs</h2>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Service</th>
                  <th style={styles.th}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {(data?.variable || []).map((c, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{c.category}</td>
                    <td style={styles.td}>${parseFloat(c.total).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/analytics').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={styles.pageTitle}>Analytics</h1>

      <div style={styles.statsGrid}>
        <StatCard
          title="Project Growth"
          value={`${data?.growth?.projects > 0 ? '+' : ''}${data?.growth?.projects || 0}%`}
          subtitle="vs last month"
          icon={<FolderKanban />}
          color={data?.growth?.projects > 0 ? '#10b981' : '#ef4444'}
        />
        <StatCard
          title="Revenue Growth"
          value={`${data?.growth?.revenue > 0 ? '+' : ''}${data?.growth?.revenue || 0}%`}
          subtitle="vs last month"
          icon={<DollarSign />}
          color={data?.growth?.revenue > 0 ? '#10b981' : '#ef4444'}
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Monthly Stats</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>Projects</th>
                <th style={styles.th}>Deployed</th>
                <th style={styles.th}>Revenue</th>
                <th style={styles.th}>API Cost</th>
                <th style={styles.th}>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {(data?.monthly || []).map((m, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>{new Date(m.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                  <td style={styles.td}>{m.projects_generated || 0}</td>
                  <td style={styles.td}>{m.projects_deployed || 0}</td>
                  <td style={styles.td}>${(m.total_revenue || 0).toFixed(2)}</td>
                  <td style={styles.td}>${(m.total_api_cost || 0).toFixed(2)}</td>
                  <td style={{ ...styles.td, color: (m.net_profit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                    ${(m.net_profit || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Projects Over Time (90 Days)</h2>
        <div style={styles.chartPlaceholder}>
          {(data?.projects || []).slice(-30).map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '80px', fontSize: '12px', color: '#888' }}>
                {new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div style={{ height: '20px', width: `${Math.max(d.count * 20, 4)}px`, background: '#6366f1', borderRadius: '4px' }} />
              <span style={{ fontSize: '12px' }}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTS
// ============================================

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statTitle}>{title}</div>
        {subtitle && <div style={styles.statSubtitle}>{subtitle}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    deployed: { bg: '#10b98120', text: '#10b981' },
    active: { bg: '#10b98120', text: '#10b981' },
    building: { bg: '#f59e0b20', text: '#f59e0b' },
    pending: { bg: '#6366f120', text: '#6366f1' },
    failed: { bg: '#ef444420', text: '#ef4444' },
    cancelled: { bg: '#6b728020', text: '#6b7280' }
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

function PlanBadge({ plan }) {
  const colors = {
    enterprise: { bg: '#8b5cf620', text: '#8b5cf6' },
    pro: { bg: '#6366f120', text: '#6366f1' },
    starter: { bg: '#10b98120', text: '#10b981' },
    free: { bg: '#6b728020', text: '#6b7280' }
  };
  const c = colors[plan] || colors.free;
  return (
    <span style={{ ...styles.badge, backgroundColor: c.bg, color: c.text }}>
      {plan}
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

function Sidebar({ currentPage, setPage, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban size={20} /> },
    { id: 'subscribers', label: 'Subscribers', icon: <Users size={20} /> },
    { id: 'usage', label: 'API Usage', icon: <Activity size={20} /> },
    { id: 'costs', label: 'Costs', icon: <DollarSign size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> }
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
      const data = await adminFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('blink_admin_token', data.token);
      onLogin(data.admin);
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
// MAIN APP
// ============================================

export default function AdminApp() {
  const [admin, setAdmin] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('blink_admin_token');
    if (token) {
      adminFetch('/me')
        .then(data => setAdmin(data.admin))
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
      case 'dashboard': return <DashboardPage />;
      case 'projects': return <ProjectsPage />;
      case 'subscribers': return <SubscribersPage />;
      case 'usage': return <UsagePage />;
      case 'costs': return <CostsPage />;
      case 'analytics': return <AnalyticsPage />;
      default: return <DashboardPage />;
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
    width: '260px',
    backgroundColor: '#12121a',
    borderRight: '1px solid #2a2a3a',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh'
  },
  sidebarHeader: {
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #2a2a3a'
  },
  sidebarTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#fff'
  },
  nav: {
    padding: '16px',
    flex: 1
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    marginBottom: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  navItemActive: {
    backgroundColor: '#6366f120',
    color: '#6366f1'
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid #2a2a3a'
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer'
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    padding: '32px'
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '24px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  statCard: {
    backgroundColor: '#12121a',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff'
  },
  statTitle: {
    fontSize: '14px',
    color: '#888'
  },
  statSubtitle: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px'
  },
  section: {
    backgroundColor: '#12121a',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '16px'
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
    padding: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    borderBottom: '1px solid #2a2a3a'
  },
  tr: {
    borderBottom: '1px solid #1a1a2a'
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#ccc'
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'capitalize'
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px'
  },
  paginationBtn: {
    padding: '8px 16px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer'
  },
  paginationText: {
    color: '#888',
    fontSize: '14px'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '16px',
    color: '#888'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #2a2a3a',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  chartPlaceholder: {
    padding: '20px',
    backgroundColor: '#0a0a0f',
    borderRadius: '8px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  // Login styles
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
    maxWidth: '400px',
    backgroundColor: '#12121a',
    border: '1px solid #2a2a3a',
    borderRadius: '16px',
    padding: '40px'
  },
  loginHeader: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  loginTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    marginTop: '16px'
  },
  loginSubtitle: {
    fontSize: '14px',
    color: '#888',
    marginTop: '8px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#ccc',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#0a0a0f',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  loginBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px'
  },
  error: {
    padding: '12px',
    backgroundColor: '#ef444420',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '20px'
  }
};
