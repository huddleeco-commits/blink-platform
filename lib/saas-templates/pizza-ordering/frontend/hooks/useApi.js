/**
 * API Hooks - React hooks for data fetching
 * Handles: loading states, errors, caching, refetch
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { menuApi, ordersApi, adminApi, customersApi } from '../lib/api';

/**
 * Generic fetch hook with loading/error states
 */
export function useFetch(fetchFn, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(...args);
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
      throw err;
    }
  }, [fetchFn]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, deps);

  const refetch = useCallback(() => execute(), [execute]);

  return { data, loading, error, refetch, execute };
}

// ============================================
// MENU HOOKS
// ============================================

/**
 * Fetch full menu with categories, items, toppings
 */
export function useMenu() {
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const response = await menuApi.getMenu();
      return response.menu;
    },
    []
  );

  return {
    menu: data,
    categories: data?.categories || [],
    toppings: data?.toppings || [],
    featured: data?.featured || [],
    popular: data?.popular || [],
    loading,
    error,
    refetch
  };
}

/**
 * Fetch single menu item with details
 */
export function useMenuItem(itemId) {
  const { data, loading, error, refetch } = useFetch(
    async () => {
      if (!itemId) return null;
      const response = await menuApi.getItem(itemId);
      return response.item;
    },
    [itemId],
    { immediate: !!itemId }
  );

  return { item: data, loading, error, refetch };
}

// ============================================
// ORDER HOOKS
// ============================================

/**
 * Fetch user's order history
 */
export function useMyOrders(params = {}) {
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const response = await ordersApi.getMyOrders(params);
      return response;
    },
    [JSON.stringify(params)]
  );

  return {
    orders: data?.orders || [],
    total: data?.total || 0,
    loading,
    error,
    refetch
  };
}

/**
 * Fetch single order details with polling
 */
export function useOrder(orderId, options = {}) {
  const { pollInterval = 0 } = options; // ms, 0 = no polling
  const pollRef = useRef(null);

  const { data, loading, error, refetch } = useFetch(
    async () => {
      if (!orderId) return null;
      const response = await ordersApi.getOrder(orderId);
      return response.order;
    },
    [orderId],
    { immediate: !!orderId }
  );

  // Polling for real-time updates
  useEffect(() => {
    if (pollInterval > 0 && orderId) {
      pollRef.current = setInterval(refetch, pollInterval);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [pollInterval, orderId, refetch]);

  // Stop polling when order is delivered/picked up/cancelled
  useEffect(() => {
    const terminalStatuses = ['delivered', 'picked_up', 'cancelled'];
    if (data?.status && terminalStatuses.includes(data.status)) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [data?.status]);

  return { order: data, loading, error, refetch };
}

/**
 * Order creation hook
 */
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ordersApi.createOrder(orderData);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const confirmPayment = useCallback(async (orderId, paymentIntentId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ordersApi.confirmPayment(orderId, paymentIntentId);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return { createOrder, confirmPayment, loading, error };
}

// ============================================
// ADMIN HOOKS
// ============================================

/**
 * Admin dashboard data
 */
export function useAdminDashboard() {
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const response = await adminApi.getDashboard();
      return response.dashboard;
    },
    []
  );

  return { dashboard: data, loading, error, refetch };
}

/**
 * Sales analytics with date range
 */
export function useSalesAnalytics(params = {}) {
  const { data, loading, error, refetch, execute } = useFetch(
    async () => {
      const response = await adminApi.getSalesAnalytics(params);
      return response.analytics;
    },
    [JSON.stringify(params)]
  );

  return { analytics: data, loading, error, refetch, execute };
}

/**
 * Admin orders with filters
 */
export function useAdminOrders(params = {}) {
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const response = await adminApi.getOrders(params);
      return response;
    },
    [JSON.stringify(params)]
  );

  return {
    orders: data?.orders || [],
    total: data?.total || 0,
    loading,
    error,
    refetch
  };
}

/**
 * Kitchen order queue with auto-refresh
 */
export function useKitchenQueue(refreshInterval = 10000) {
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const response = await ordersApi.getKitchenQueue();
      return response.orders;
    },
    []
  );

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(refetch, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refetch]);

  return { orders: data || [], loading, error, refetch };
}

// ============================================
// CUSTOMER HOOKS
// ============================================

/**
 * Customer addresses
 */
export function useAddresses() {
  const { data, loading, error, refetch } = useFetch(
    async () => {
      const response = await customersApi.getAddresses();
      return response.addresses;
    },
    []
  );

  const addAddress = useCallback(async (addressData) => {
    await customersApi.addAddress(addressData);
    refetch();
  }, [refetch]);

  const updateAddress = useCallback(async (id, updates) => {
    await customersApi.updateAddress(id, updates);
    refetch();
  }, [refetch]);

  const deleteAddress = useCallback(async (id) => {
    await customersApi.deleteAddress(id);
    refetch();
  }, [refetch]);

  const setDefault = useCallback(async (id) => {
    await customersApi.setDefaultAddress(id);
    refetch();
  }, [refetch]);

  return {
    addresses: data || [],
    loading,
    error,
    refetch,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault
  };
}

export default useFetch;
