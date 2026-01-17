/**
 * Order Tracking Page - Real-time order status tracking with polling
 * Features: Live status updates, order timeline, estimated delivery time
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrder } from '../hooks/useApi';
import { ordersApi } from '../lib/api';

// ============================================
// ORDER STATUS CONFIGURATION
// ============================================

const STATUS_CONFIG = {
  pending: {
    label: 'Order Received',
    description: 'Your order has been received and is awaiting confirmation',
    icon: '📋',
    color: 'gray',
    progress: 0
  },
  confirmed: {
    label: 'Order Confirmed',
    description: 'Your order has been confirmed and will be prepared soon',
    icon: '✅',
    color: 'blue',
    progress: 20
  },
  preparing: {
    label: 'Preparing',
    description: 'Our chefs are crafting your delicious order',
    icon: '👨‍🍳',
    color: 'yellow',
    progress: 40
  },
  ready: {
    label: 'Ready',
    description: 'Your order is ready',
    icon: '🍕',
    color: 'green',
    progress: 60
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    description: 'Your order is on its way to you',
    icon: '🚗',
    color: 'purple',
    progress: 80
  },
  delivered: {
    label: 'Delivered',
    description: 'Your order has been delivered. Enjoy!',
    icon: '🎉',
    color: 'green',
    progress: 100
  },
  picked_up: {
    label: 'Picked Up',
    description: 'You have picked up your order. Enjoy!',
    icon: '🎉',
    color: 'green',
    progress: 100
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This order has been cancelled',
    icon: '❌',
    color: 'red',
    progress: 0
  }
};

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const PICKUP_STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'];

// ============================================
// PROGRESS BAR COMPONENT
// ============================================

function ProgressBar({ progress, color = 'blue' }) {
  const colorClasses = {
    gray: 'bg-gray-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full transition-all duration-1000 ease-out ${colorClasses[color]}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ============================================
// STATUS TIMELINE
// ============================================

function StatusTimeline({ order }) {
  const statusOrder = order.order_type === 'pickup' ? PICKUP_STATUS_ORDER : STATUS_ORDER;
  const currentIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="py-6">
      <div className="space-y-0">
        {statusOrder.map((status, index) => {
          const config = STATUS_CONFIG[status];
          const isCompleted = !isCancelled && index < currentIndex;
          const isCurrent = !isCancelled && index === currentIndex;
          const isPending = !isCancelled && index > currentIndex;

          // Find the status history entry for this status
          const historyEntry = order.status_history?.find(h => h.status === status);

          return (
            <div key={status} className="flex">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center mr-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? '✓' : config.icon}
                </div>
                {index < statusOrder.length - 1 && (
                  <div
                    className={`w-0.5 h-16 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Status info */}
              <div className={`pb-8 ${isPending ? 'opacity-50' : ''}`}>
                <h3 className={`font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>
                  {config.label}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
                {historyEntry && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(historyEntry.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ESTIMATED TIME DISPLAY
// ============================================

function EstimatedTime({ order }) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTime = () => {
      if (!order.estimated_delivery_time) {
        setTimeRemaining('');
        return;
      }

      const estimated = new Date(order.estimated_delivery_time);
      const now = new Date();
      const diff = estimated - now;

      if (diff <= 0) {
        setTimeRemaining('Any moment now');
        return;
      }

      const minutes = Math.ceil(diff / (1000 * 60));
      if (minutes < 60) {
        setTimeRemaining(`${minutes} min`);
      } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        setTimeRemaining(`${hours}h ${mins}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [order.estimated_delivery_time]);

  if (!timeRemaining) return null;

  return (
    <div className="text-center">
      <p className="text-sm text-gray-500">Estimated {order.order_type === 'delivery' ? 'Delivery' : 'Ready'}</p>
      <p className="text-3xl font-bold text-gray-900">{timeRemaining}</p>
    </div>
  );
}

// ============================================
// ORDER ITEMS LIST
// ============================================

function OrderItems({ items }) {
  return (
    <div className="space-y-3">
      {items?.map((item, idx) => (
        <div key={idx} className="flex justify-between items-start py-2">
          <div className="flex gap-3">
            <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-sm font-medium">
              {item.quantity}
            </span>
            <div>
              <p className="font-medium text-gray-900">{item.name}</p>
              {item.variant_name && (
                <p className="text-sm text-gray-500">{item.variant_name}</p>
              )}
              {item.toppings?.length > 0 && (
                <p className="text-sm text-gray-500">
                  + {item.toppings.map(t => t.name).join(', ')}
                </p>
              )}
            </div>
          </div>
          <span className="font-medium">${(item.unit_price * item.quantity).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// ORDER LOOKUP FORM
// ============================================

function OrderLookup({ onOrderFound }) {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await ordersApi.getOrder(orderNumber.trim().toUpperCase());
      if (response.order) {
        onOrderFound(response.order);
      } else {
        setError('Order not found. Please check the order number.');
      }
    } catch (err) {
      setError(err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🍕</div>
        <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
        <p className="text-gray-500 mt-2">Enter your order number to see real-time status</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Order Number
          </label>
          <input
            type="text"
            id="orderNumber"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="e.g., ABC123"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg uppercase tracking-wider"
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !orderNumber.trim()}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Looking up order...
            </span>
          ) : (
            'Track Order'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have your order number? Check your email or SMS confirmation.
      </p>
    </div>
  );
}

// ============================================
// CANCEL ORDER DIALOG
// ============================================

function CancelDialog({ order, onCancel, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setLoading(true);
    setError('');

    try {
      await ordersApi.cancelOrder(order.id, reason);
      onCancel();
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Order?</h2>
        <p className="text-gray-500 mb-4">
          Are you sure you want to cancel order #{order.order_number}? This cannot be undone.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let us know why you're cancelling..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN ORDER TRACKING PAGE
// ============================================

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [manualOrder, setManualOrder] = useState(null);

  // Poll every 10 seconds for active orders
  const { order: fetchedOrder, loading, error, refetch } = useOrder(
    orderId || manualOrder?.id,
    { pollInterval: 10000 }
  );

  const order = fetchedOrder || manualOrder;

  const handleOrderFound = (foundOrder) => {
    setManualOrder(foundOrder);
    // Update URL to include order ID
    navigate(`/track/${foundOrder.order_number}`, { replace: true });
  };

  const handleCancelSuccess = () => {
    setShowCancelDialog(false);
    refetch();
  };

  // No order ID and no manual lookup - show lookup form
  if (!orderId && !manualOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <OrderLookup onOrderFound={handleOrderFound} />
      </div>
    );
  }

  // Loading state
  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading order...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-6">
            We couldn't find an order with that number. Please check and try again.
          </p>
          <Link
            to="/track"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isCompleted = ['delivered', 'picked_up'].includes(order.status);
  const isCancelled = order.status === 'cancelled';
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">🍕</Link>
            <div className="text-center">
              <p className="text-sm text-gray-500">Order</p>
              <p className="font-bold text-lg">#{order.order_number}</p>
            </div>
            <button
              onClick={refetch}
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Status Hero */}
        <div className={`rounded-2xl p-8 mb-8 text-center ${
          isCancelled
            ? 'bg-red-50 border border-red-200'
            : isCompleted
              ? 'bg-green-50 border border-green-200'
              : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="text-6xl mb-4">{statusConfig.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{statusConfig.label}</h1>
          <p className="text-gray-600 mb-6">{statusConfig.description}</p>

          {!isCancelled && !isCompleted && (
            <>
              <ProgressBar progress={statusConfig.progress} color={statusConfig.color} />
              <div className="mt-6">
                <EstimatedTime order={order} />
              </div>
            </>
          )}

          {/* Live indicator */}
          {!isCancelled && !isCompleted && (
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live tracking enabled
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Order Type & Time */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-gray-900 capitalize">
                  {order.order_type === 'delivery' ? '🚗 Delivery' : '🏃 Pickup'}
                </h2>
                {order.order_type === 'delivery' && order.delivery_address && (
                  <div className="text-sm text-gray-500 mt-1">
                    <p>{order.delivery_address.street}</p>
                    {order.delivery_address.apt && <p>Apt {order.delivery_address.apt}</p>}
                    <p>{order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip}</p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Placed</p>
                <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Order Progress</h3>
            <StatusTimeline order={order} />
          </div>

          {/* Items */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Your Order</h3>
            <OrderItems items={order.items} />
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="p-6 border-b border-gray-100 bg-yellow-50">
              <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
              <p className="text-gray-600">{order.special_instructions}</p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-2">
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
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${order.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Payment</span>
                <span className="capitalize">{order.payment_method?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {canCancel && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="flex-1 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50"
            >
              Cancel Order
            </button>
          )}
          <Link
            to="/menu"
            className="flex-1 py-3 bg-blue-600 text-white text-center rounded-lg font-medium hover:bg-blue-700"
          >
            Order Again
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help with your order?</p>
          <p className="mt-1">
            Call us at <a href="tel:+15551234567" className="text-blue-600 hover:underline">(555) 123-4567</a>
          </p>
        </div>
      </main>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <CancelDialog
          order={order}
          onCancel={handleCancelSuccess}
          onClose={() => setShowCancelDialog(false)}
        />
      )}
    </div>
  );
}
