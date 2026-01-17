/**
 * API Client - Handles all backend communication
 * Includes: fetch wrapper, error handling, auth headers
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get auth token from storage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Set auth token
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

/**
 * API fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Parse JSON response
    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Network error
    if (!error.status) {
      error.message = 'Network error. Please check your connection.';
    }
    throw error;
  }
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  async login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async register(userData) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async logout() {
    setAuthToken(null);
    localStorage.removeItem('pizza_cart');
  },

  async getProfile() {
    return apiFetch('/api/auth/me');
  },

  async updateProfile(updates) {
    return apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async forgotPassword(email) {
    return apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(token, password) {
    return apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  }
};

// ============================================
// MENU API
// ============================================

export const menuApi = {
  async getMenu() {
    return apiFetch('/api/menu');
  },

  async getItem(id) {
    return apiFetch(`/api/menu/item/${id}`);
  },

  // Admin
  async createItem(itemData) {
    return apiFetch('/api/menu/items', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  },

  async updateItem(id, updates) {
    return apiFetch(`/api/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteItem(id) {
    return apiFetch(`/api/menu/items/${id}`, {
      method: 'DELETE'
    });
  },

  async createCategory(categoryData) {
    return apiFetch('/api/menu/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },

  async updateCategory(id, updates) {
    return apiFetch(`/api/menu/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
};

// ============================================
// ORDERS API
// ============================================

export const ordersApi = {
  async createOrder(orderData) {
    return apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async confirmPayment(orderId, paymentIntentId) {
    return apiFetch(`/api/orders/${orderId}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ payment_intent_id: paymentIntentId })
    });
  },

  async getOrder(idOrNumber) {
    return apiFetch(`/api/orders/${idOrNumber}`);
  },

  async getMyOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/orders${query ? `?${query}` : ''}`);
  },

  async cancelOrder(id, reason) {
    return apiFetch(`/api/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Staff
  async getKitchenQueue() {
    return apiFetch('/api/orders/kitchen/queue');
  },

  async updateStatus(id, status, notes) {
    return apiFetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    });
  }
};

// ============================================
// CUSTOMERS API
// ============================================

export const customersApi = {
  async getAddresses() {
    return apiFetch('/api/customers/addresses');
  },

  async addAddress(addressData) {
    return apiFetch('/api/customers/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData)
    });
  },

  async updateAddress(id, updates) {
    return apiFetch(`/api/customers/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteAddress(id) {
    return apiFetch(`/api/customers/addresses/${id}`, {
      method: 'DELETE'
    });
  },

  async setDefaultAddress(id) {
    return apiFetch(`/api/customers/addresses/${id}/default`, {
      method: 'PUT'
    });
  }
};

// ============================================
// PROMO API
// ============================================

export const promoApi = {
  async validateCode(code, subtotal) {
    return apiFetch('/api/promo/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    });
  }
};

// ============================================
// ADMIN API
// ============================================

export const adminApi = {
  async getDashboard() {
    return apiFetch('/api/admin/dashboard');
  },

  async getSalesAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/analytics/sales${query ? `?${query}` : ''}`);
  },

  async getItemAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/analytics/items${query ? `?${query}` : ''}`);
  },

  async getCustomerAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/analytics/customers${query ? `?${query}` : ''}`);
  },

  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/admin/orders${query ? `?${query}` : ''}`);
  },

  async getDailyReport(date) {
    return apiFetch(`/api/admin/reports/daily${date ? `?date=${date}` : ''}`);
  },

  async getSettings() {
    return apiFetch('/api/admin/settings');
  },

  async updateSettings(settings) {
    return apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};

export default apiFetch;
