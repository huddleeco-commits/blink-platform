/**
 * Admin Dashboard Overview Page
 * Main dashboard with key metrics and recent activity
 */

import React, { useState, useEffect } from 'react';
import {
  Users, Layers, DollarSign, TrendingUp, AlertTriangle, Zap, Clock, Activity
} from 'lucide-react';
import {
  StatCard, StatusBadge, LoadingSpinner, Card, BarChart
} from '../../_shared/components/index.jsx';
import { adminFetch, formatCurrency, formatNumber, formatPercent, formatDuration, formatRelativeTime } from '../../_shared/index.js';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const result = await adminFetch('/overview');
      setData(result.overview);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <div className="admin-error">Error: {error}</div>;
  if (!data) return null;

  const { users, generations, costs, revenue, alerts, recentGenerations, trends, tierDistribution } = data;

  return (
    <div className="admin-page dashboard-page">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <button onClick={loadData} className="admin-btn secondary">
          Refresh
        </button>
      </div>

      {/* Key Metrics Row */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={formatNumber(users.total)}
          subtitle={`${users.paid} paid (${formatPercent(users.conversionRate)})`}
          icon={<Users size={24} />}
          color="#6366f1"
        />
        <StatCard
          title="Generations"
          value={formatNumber(generations.total)}
          subtitle={`${generations.today} today`}
          icon={<Layers size={24} />}
          color="#10b981"
        />
        <StatCard
          title="API Costs (Month)"
          value={formatCurrency(costs.thisMonth)}
          subtitle={`${formatCurrency(costs.perGeneration)} per generation`}
          icon={<DollarSign size={24} />}
          color="#f59e0b"
        />
        <StatCard
          title="MRR"
          value={formatCurrency(revenue.mrr)}
          subtitle={`${formatPercent(revenue.profitMargin)} margin`}
          icon={<TrendingUp size={24} />}
          color="#8b5cf6"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="stats-grid small">
        <StatCard
          title="Success Rate"
          value={formatPercent(generations.successRate)}
          icon={<Activity size={20} />}
          color="#10b981"
        />
        <StatCard
          title="Avg Gen Time"
          value={formatDuration(generations.avgTime)}
          icon={<Clock size={20} />}
          color="#6366f1"
        />
        <StatCard
          title="Signups Today"
          value={formatNumber(users.signupsToday)}
          icon={<Users size={20} />}
          color="#3b82f6"
        />
        <StatCard
          title="Active Alerts"
          value={alerts.active}
          icon={<AlertTriangle size={20} />}
          color={alerts.active > 0 ? '#ef4444' : '#10b981'}
        />
      </div>

      {/* Charts and Tables Row */}
      <div className="dashboard-row">
        {/* 7-Day Trends Chart */}
        <Card title="7-Day Generation Trends">
          {trends && trends.length > 0 ? (
            <BarChart
              data={trends}
              xKey="date"
              yKey="generations"
              color="#6366f1"
            />
          ) : (
            <div className="admin-empty">No trend data available</div>
          )}
        </Card>

        {/* Tier Distribution */}
        <Card title="User Tier Distribution">
          {tierDistribution && tierDistribution.length > 0 ? (
            <div className="tier-distribution">
              {tierDistribution.map(({ tier, count }) => (
                <div key={tier} className="tier-row">
                  <span className="tier-name">{tier}</span>
                  <div className="tier-bar">
                    <div
                      className="tier-fill"
                      style={{
                        width: `${(count / users.total) * 100}%`,
                        backgroundColor: tier === 'free' ? '#6b7280' : '#6366f1'
                      }}
                    />
                  </div>
                  <span className="tier-count">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-empty">No tier data available</div>
          )}
        </Card>
      </div>

      {/* Recent Generations */}
      <Card title="Recent Generations">
        {recentGenerations && recentGenerations.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Industry</th>
                <th>User</th>
                <th>Status</th>
                <th>Time</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentGenerations.map(gen => (
                <tr key={gen.id}>
                  <td>{gen.site_name || 'Untitled'}</td>
                  <td>{gen.industry}</td>
                  <td>{gen.user_email}</td>
                  <td><StatusBadge status={gen.status} /></td>
                  <td>{formatDuration(gen.generation_time_ms)}</td>
                  <td>{formatRelativeTime(gen.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty">No recent generations</div>
        )}
      </Card>
    </div>
  );
}
