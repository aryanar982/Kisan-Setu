const BASE_URL = '/api/v1';

export function getAuthToken() {
  return localStorage.getItem('kisan_auth_token') || '';
}

export function setAuthToken(token) {
  if (token) localStorage.setItem('kisan_auth_token', token);
  else localStorage.removeItem('kisan_auth_token');
}

export function getCurrentUser() {
  const data = localStorage.getItem('kisan_user_data');
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) localStorage.setItem('kisan_user_data', JSON.stringify(user));
  else localStorage.removeItem('kisan_user_data');
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  sendOtp: (body) => apiRequest('/auth/otp/send', { method: 'POST', body }),
  verifyOtp: (body) => apiRequest('/auth/otp/verify', { method: 'POST', body }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body }),
  staffLogin: (body) => apiRequest('/auth/staff/login', { method: 'POST', body }),
  getProfile: () => apiRequest('/auth/profile'),
  updateProfile: (body) => apiRequest('/auth/profile', { method: 'PUT', body }),

  // Crops
  getCrops: () => apiRequest('/crops/my'),
  registerCrop: (body) => apiRequest('/crops', { method: 'POST', body }),
  getMspRates: () => apiRequest('/crops/msp-rates'),

  // Centres & Slots
  getCentres: (params = '') => apiRequest(`/centres${params}`),
  getCentreDetails: (id, date = '') => apiRequest(`/centres/${id}${date ? `?date=${date}` : ''}`),
  getSlots: (centreId, date = '') => apiRequest(`/slots/centre/${centreId}${date ? `?date=${date}` : ''}`),

  // Bookings
  createBooking: (body) => apiRequest('/bookings', { method: 'POST', body }),
  getMyBookings: () => apiRequest('/bookings/me'),
  cancelBooking: (id) => apiRequest(`/bookings/${id}/cancel`, { method: 'PATCH' }),

  // Queue
  getQueue: (centreId) => apiRequest(`/queue/centre/${centreId}`),
  verifyToken: (body) => apiRequest('/queue/verify', { method: 'POST', body }),
  callNext: (centreId) => apiRequest(`/queue/call-next/${centreId}`, { method: 'POST' }),
  updateTokenStatus: (tokenId, body) => apiRequest(`/queue/${tokenId}/status`, { method: 'PATCH', body }),

  // Procurement & Payments
  recordProcurement: (body) => apiRequest('/procurement', { method: 'POST', body }),
  getMyPayments: () => apiRequest('/payments/my'),
  getAllPayments: (params = '') => apiRequest(`/payments${params}`),
  updatePaymentStatus: (id, body) => apiRequest(`/payments/${id}/status`, { method: 'PATCH', body }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),

  // Analytics & AI
  getAnalytics: () => apiRequest('/analytics/dashboard'),
  getAiRecommendations: (params = '') => apiRequest(`/ai/recommendations${params}`),
  processVoiceIntent: (body) => apiRequest('/ai/voice-intent', { method: 'POST', body }),
};
