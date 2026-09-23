// NEST Web Dashboard API Service Layer
// Connects directly to the backend for ultra-fast response times (< 5ms)

export const DEFAULT_REMOTE_API = 'https://owner-managemat.onrender.com/api';

export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('onrender.com')) {
      return `${window.location.origin}/api`;
    }
    const host = window.location.hostname || '127.0.0.1';
    // If on localhost OR on local Wi-Fi: connect directly
    if (host === 'localhost' || host === '127.0.0.1' || /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) {
      return `http://${host}:5000/api`;
    }
    const custom = localStorage.getItem('nest_api_url');
    if (custom && custom.trim() && !custom.includes('undefined')) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  return DEFAULT_REMOTE_API;
};

export const setCustomApiBase = (url) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('nest_api_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('nest_api_url');
    }
  }
};

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('nest_auth_token');
  }
  return null;
}

export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('nest_auth_token', token);
    } else {
      localStorage.removeItem('nest_auth_token');
      localStorage.removeItem('nest_auth_owner');
    }
  }
}

export function getAuthOwner() {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('nest_auth_owner');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function setAuthOwner(owner) {
  if (typeof window !== 'undefined') {
    if (owner) {
      localStorage.setItem('nest_auth_owner', JSON.stringify(owner));
    } else {
      localStorage.removeItem('nest_auth_owner');
    }
  }
}

async function request(url, options = {}) {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const base = getApiBase();
    const res = await fetch(`${base}${url}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        setAuthToken(null);
        setAuthOwner(null);
        window.location.href = '/login';
      }
      const err = new Error(data.error || 'Network request failed');
      err.data = data;
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  signup: (data) => request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  verifyOtp: (email, otp) => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  }),
  resendOtp: (email) => request('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  getMe: () => request('/auth/me'),
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    } finally {
      setAuthToken(null);
      setAuthOwner(null);
    }
  },

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Flats
  getFlats: (sort = 'date', search = '') => request(`/flats?sort=${encodeURIComponent(sort)}&search=${encodeURIComponent(search)}`),
  getFlat: (id) => request(`/flats/${id}`),
  addFlat: (flatData) => request('/flats', { method: 'POST', body: JSON.stringify(flatData) }),
  updateFlat: (id, flatData) => request(`/flats/${id}`, { method: 'PUT', body: JSON.stringify(flatData) }),
  deleteFlat: (id) => request(`/flats/${id}`, { method: 'DELETE' }),

  // Tenants & Bookings
  checkCnic: (cnic) => request(`/tenants/check-cnic/${encodeURIComponent(cnic)}`),
  checkInTenant: (data) => request('/tenants/check-in', { method: 'POST', body: JSON.stringify(data) }),
  checkoutTenant: (flatId) => request(`/tenants/checkout/${flatId}`, { method: 'POST' }),

  // Payments
  getPayments: (status = '', flatId = '') => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    if (flatId) params.append('flat_id', flatId);
    return request(`/payments?${params.toString()}`);
  },
  markPaymentPaid: (id, paymentMethod = 'Cash') => request(`/payments/${id}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify({ payment_method: paymentMethod })
  }),
  updatePaymentStatus: (id, data) => request(`/payments/${id}/update-status`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getReceipt: (id) => request(`/payments/${id}/receipt`),

  // Expenses
  getExpenses: (flatId = '') => request(`/expenses${flatId ? `?flat_id=${flatId}` : ''}`),
  addExpense: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (search = '') => request(`/customers?search=${encodeURIComponent(search)}`),
  getCustomer: (id) => request(`/customers/${id}`),

  // Owner Profile
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) })
};
