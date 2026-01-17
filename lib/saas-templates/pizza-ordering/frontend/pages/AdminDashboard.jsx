/**
 * Admin Dashboard - Full admin interface for pizza ordering system
 * Connects to: /api/admin/dashboard, /api/admin/orders, /api/admin/analytics
 */

import React, { useState, useCallback } from 'react';
import {
  useAdminDashboard,
  useAdminOrders,
  useSalesAnalytics,
  useKitchenQueue
} from '../hooks/useApi';
import { ordersApi, adminApi } from '../lib/api';

// ============================================
// STAT CARD COMPONENT
// ============================================

function StatCard({ title, value, change, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs yesterday
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ORDER STATUS BADGE
// ============================================

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
    preparing: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Preparing' },
    ready: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' },
    out_for_delivery: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Out for Delivery' },
    delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
    picked_up: { bg: 'bg-green-100', text: 'text-green-700', label: 'Picked Up' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

// ============================================
// ORDERS TABLE
// ============================================

function OrdersTable({ orders, onStatusUpdate, onViewOrder }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await onStatusUpdate(orderId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatuses = (currentStatus, orderType) => {
    const transitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: orderType === 'delivery' ? ['out_for_delivery'] : ['picked_up'],
      out_for_delivery: ['delivered'],
    };
    return transitions[currentStatus] || [];
  };

  if (!orders.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No orders found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="py-4 px-4">
                <button
                  onClick={() => onViewOrder(order)}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  #{order.order_number}
                </button>
              </td>
              <td className="py-4 px-4">
                <div>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-500">{order.customer_phone}</p>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="capitalize text-sm">{order.order_type.replace('_', ' ')}</span>
              </td>
              <td className="py-4 px-4 text-sm text-gray-600">
                {order.item_count} items
              </td>
              <td className="py-4 px-4 font-medium">
                ${order.total.toFixed(2)}
              </td>
              <td className="py-4 px-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="py-4 px-4 text-sm text-gray-500">
                {new Date(order.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="py-4 px-4">
                {updatingId === order.id ? (
                  <span className="text-sm text-gray-400">Updating...</span>
                ) : (
                  <div className="flex gap-2">
                    {getNextStatuses(order.status, order.order_type).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(order.id, status)}
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          status === 'cancelled'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// KITCHEN QUEUE
// ============================================

function KitchenQueue({ orders, onStatusUpdate }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleBump = async (order) => {
    setUpdatingId(order.id);
    const nextStatus = order.status === 'confirmed' ? 'preparing' : 'ready';
    try {
      await onStatusUpdate(order.id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Incoming Orders */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          Incoming ({confirmedOrders.length})
        </h3>
        <div className="space-y-3">
          {confirmedOrders.map(order => (
            <div key={order.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-bold text-lg">#{order.order_number}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {order.order_type === 'delivery' ? '🚗 Delivery' : '🏃 Pickup'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium">{item.quantity}x</span> {item.name}
                    {item.variant_name && <span className="text-gray-500"> ({item.variant_name})</span>}
                    {item.toppings?.length > 0 && (
                      <div className="text-xs text-gray-500 ml-4">
                        {item.toppings.map(t => t.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {order.special_instructions && (
                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded mb-3">
                  📝 {order.special_instructions}
                </div>
              )}
              <button
                onClick={() => handleBump(order)}
                disabled={updatingId === order.id}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {updatingId === order.id ? 'Starting...' : 'Start Preparing'}
              </button>
            </div>
          ))}
          {confirmedOrders.length === 0 && (
            <div className="text-center py-8 text-gray-400">No incoming orders</div>
          )}
        </div>
      </div>

      {/* In Progress */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
          In Progress ({preparingOrders.length})
        </h3>
        <div className="space-y-3">
          {preparingOrders.map(order => (
            <div key={order.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-bold text-lg">#{order.order_number}</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {order.order_type === 'delivery' ? '🚗 Delivery' : '🏃 Pickup'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  Started {getElapsedTime(order.updated_at)}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium">{item.quantity}x</span> {item.name}
                    {item.variant_name && <span className="text-gray-500"> ({item.variant_name})</span>}
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleBump(order)}
                disabled={updatingId === order.id}
                className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {updatingId === order.id ? 'Marking...' : 'Mark Ready'}
              </button>
            </div>
          ))}
          {preparingOrders.length === 0 && (
            <div className="text-center py-8 text-gray-400">No orders in progress</div>
          )}
        </div>
      </div>
    </div>
  );
}

function getElapsedTime(timestamp) {
  const elapsed = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (elapsed < 60) return `${elapsed}s ago`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
  return `${Math.floor(elapsed / 3600)}h ago`;
}

// ============================================
// SALES CHART (Simple Bar Chart)
// ============================================

function SalesChart({ data }) {
  if (!data?.daily_sales?.length) {
    return <div className="text-center py-12 text-gray-400">No sales data</div>;
  }

  const maxSales = Math.max(...data.daily_sales.map(d => d.total_sales));

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>Last 7 Days</span>
        <span>Total: ${data.daily_sales.reduce((sum, d) => sum + d.total_sales, 0).toFixed(2)}</span>
      </div>
      <div className="flex items-end justify-between gap-2 h-40">
        {data.daily_sales.map((day, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              style={{
                height: `${(day.total_sales / maxSales) * 100}%`,
                minHeight: day.total_sales > 0 ? '8px' : '2px'
              }}
              title={`$${day.total_sales.toFixed(2)} - ${day.order_count} orders`}
            ></div>
            <span className="text-xs text-gray-500">
              {new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// TOP ITEMS LIST
// ============================================

function TopItems({ items }) {
  if (!items?.length) {
    return <div className="text-center py-8 text-gray-400">No data</div>;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item, idx) => (
        <div key={item.id} className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
            {idx + 1}
          </span>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-500">{item.quantity_sold} sold</p>
          </div>
          <span className="font-medium text-gray-900">${item.revenue.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// ORDER DETAIL MODAL
// ============================================

function OrderDetailModal({ order, onClose, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus);
      onClose();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Order #{order.order_number}</h2>
              <p className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status</span>
            <StatusBadge status={order.status} />
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Customer</h3>
            <p className="text-gray-900">{order.customer_name}</p>
            <p className="text-gray-600">{order.customer_phone}</p>
            <p className="text-gray-600">{order.customer_email}</p>
          </div>

          {/* Order Type & Address */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2 capitalize">{order.order_type.replace('_', ' ')}</h3>
            {order.order_type === 'delivery' && order.delivery_address && (
              <div className="text-gray-600">
                <p>{order.delivery_address.street}</p>
                {order.delivery_address.apt && <p>Apt {order.delivery_address.apt}</p>}
                <p>{order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip}</p>
              </div>
            )}
            {order.scheduled_time && (
              <p className="text-blue-600 mt-2">
                Scheduled: {new Date(order.scheduled_time).toLocaleString()}
              </p>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="font-medium mb-3">Items</h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <span className="font-medium">{item.quantity}x</span> {item.name}
                    {item.variant_name && (
                      <span className="text-gray-500"> ({item.variant_name})</span>
                    )}
                    {item.toppings?.length > 0 && (
                      <p className="text-sm text-gray-500 ml-4">
                        + {item.toppings.map(t => t.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-800 mb-1">Special Instructions</h3>
              <p className="text-orange-700">{order.special_instructions}</p>
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${order.subtotal?.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>${order.tax?.toFixed(2)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>${order.delivery_fee.toFixed(2)}</span>
              </div>
            )}
            {order.tip > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tip</span>
                <span>${order.tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>${order.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          {!['delivered', 'picked_up', 'cancelled'].includes(order.status) && (
            <div className="flex gap-3">
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={updating}
                className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Cancel Order
              </button>
              {order.status === 'ready' && order.order_type === 'delivery' && (
                <button
                  onClick={() => handleStatusChange('out_for_delivery')}
                  disabled={updating}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Out for Delivery
                </button>
              )}
              {order.status === 'ready' && order.order_type === 'pickup' && (
                <button
                  onClick={() => handleStatusChange('picked_up')}
                  disabled={updating}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Mark Picked Up
                </button>
              )}
              {order.status === 'out_for_delivery' && (
                <button
                  onClick={() => handleStatusChange('delivered')}
                  disabled={updating}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Mark Delivered
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN ADMIN DASHBOARD
// ============================================

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [orderFilters, setOrderFilters] = useState({ status: '', page: 1 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dateRange, setDateRange] = useState('7d');

  // API hooks
  const { dashboard, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useAdminDashboard();
  const { orders, total: totalOrders, loading: ordersLoading, refetch: refetchOrders } = useAdminOrders(orderFilters);
  const { analytics, loading: analyticsLoading } = useSalesAnalytics({ range: dateRange });
  const { orders: kitchenOrders, refetch: refetchKitchen } = useKitchenQueue(5000); // 5s refresh

  // Handle order status update
  const handleStatusUpdate = useCallback(async (orderId, newStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      refetchOrders();
      refetchDashboard();
      refetchKitchen();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update order status');
    }
  }, [refetchOrders, refetchDashboard, refetchKitchen]);

  // Tab navigation
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'kitchen', label: 'Kitchen', icon: '👨‍🍳' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">🍕 Pizza Admin</h1>
              <nav className="hidden md:flex gap-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { refetchDashboard(); refetchOrders(); refetchKitchen(); }}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Refresh"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {dashboardLoading && activeTab === 'overview' && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        )}

        {/* Error State */}
        {dashboardError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{dashboardError}</p>
            <button onClick={refetchDashboard} className="text-red-600 underline mt-2">Try again</button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Today's Orders"
                value={dashboard.today_orders || 0}
                change={dashboard.orders_change}
                icon={<span className="text-xl">📦</span>}
                color="blue"
              />
              <StatCard
                title="Today's Revenue"
                value={`$${(dashboard.today_revenue || 0).toFixed(2)}`}
                change={dashboard.revenue_change}
                icon={<span className="text-xl">💰</span>}
                color="green"
              />
              <StatCard
                title="Avg Order Value"
                value={`$${(dashboard.avg_order_value || 0).toFixed(2)}`}
                icon={<span className="text-xl">📈</span>}
                color="purple"
              />
              <StatCard
                title="Active Orders"
                value={dashboard.active_orders || 0}
                icon={<span className="text-xl">🔥</span>}
                color="yellow"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Recent Orders</h2>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {dashboard.recent_orders?.slice(0, 5).map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div>
                        <span className="font-medium">#{order.order_number}</span>
                        <span className="text-gray-500 ml-2">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">${order.total.toFixed(2)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))}
                  {!dashboard.recent_orders?.length && (
                    <p className="text-center py-4 text-gray-400">No recent orders</p>
                  )}
                </div>
              </div>

              {/* Top Items */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold mb-4">Top Selling Items</h2>
                <TopItems items={dashboard.top_items} />
              </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4">Sales This Week</h2>
              <SalesChart data={analytics} />
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-wrap gap-4">
                <select
                  value={orderFilters.status}
                  onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value, page: 1 })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span className="text-gray-500 flex items-center">
                  {totalOrders} orders
                </span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : (
                <OrdersTable
                  orders={orders}
                  onStatusUpdate={handleStatusUpdate}
                  onViewOrder={setSelectedOrder}
                />
              )}
            </div>

            {/* Pagination */}
            {totalOrders > 20 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setOrderFilters({ ...orderFilters, page: orderFilters.page - 1 })}
                  disabled={orderFilters.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {orderFilters.page} of {Math.ceil(totalOrders / 20)}
                </span>
                <button
                  onClick={() => setOrderFilters({ ...orderFilters, page: orderFilters.page + 1 })}
                  disabled={orderFilters.page >= Math.ceil(totalOrders / 20)}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Kitchen Tab */}
        {activeTab === 'kitchen' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Kitchen Display</h2>
              <span className="text-sm text-gray-500">
                Auto-refreshes every 5 seconds
              </span>
            </div>
            <KitchenQueue orders={kitchenOrders} onStatusUpdate={handleStatusUpdate} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex gap-2">
                {[
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: '90d', label: 'Last 90 Days' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setDateRange(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      dateRange === option.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {analyticsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : analytics ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Revenue"
                    value={`$${(analytics.total_revenue || 0).toFixed(2)}`}
                    icon={<span className="text-xl">💵</span>}
                    color="green"
                  />
                  <StatCard
                    title="Total Orders"
                    value={analytics.total_orders || 0}
                    icon={<span className="text-xl">📦</span>}
                    color="blue"
                  />
                  <StatCard
                    title="Avg Order Value"
                    value={`$${(analytics.avg_order_value || 0).toFixed(2)}`}
                    icon={<span className="text-xl">📊</span>}
                    color="purple"
                  />
                  <StatCard
                    title="Unique Customers"
                    value={analytics.unique_customers || 0}
                    icon={<span className="text-xl">👥</span>}
                    color="yellow"
                  />
                </div>

                {/* Sales Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold mb-4">Daily Sales</h3>
                  <SalesChart data={analytics} />
                </div>

                {/* Order Type Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold mb-4">Order Types</h3>
                    <div className="space-y-3">
                      {analytics.order_types?.map(type => (
                        <div key={type.order_type} className="flex justify-between items-center">
                          <span className="capitalize">{type.order_type.replace('_', ' ')}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500">{type.count} orders</span>
                            <span className="font-medium">${type.revenue.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold mb-4">Peak Hours</h3>
                    <div className="space-y-2">
                      {analytics.peak_hours?.slice(0, 5).map(hour => (
                        <div key={hour.hour} className="flex justify-between items-center">
                          <span>{hour.hour}:00 - {hour.hour + 1}:00</span>
                          <span className="font-medium">{hour.order_count} orders</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
