import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ─── Users ────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// ─── Halls ────────────────────────────────────────────────────────────────
export const hallsAPI = {
  getAll: () => api.get('/halls'),
  create: (data) => api.post('/halls', data),
  update: (id, data) => api.put(`/halls/${id}`, data),
  delete: (id) => api.delete(`/halls/${id}`),
};

// ─── Rooms ────────────────────────────────────────────────────────────────
export const roomsAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

// ─── Applications ─────────────────────────────────────────────────────────
export const applicationsAPI = {
  getAll: (params) => api.get('/applications', { params }),
  submit: (data) => api.post('/applications', data),
  review: (id, data) => api.put(`/applications/${id}/review`, data),
};

// ─── Allocations ──────────────────────────────────────────────────────────
export const allocationsAPI = {
  getAll: (params) => api.get('/allocations', { params }),
};

// ─── Payments ─────────────────────────────────────────────────────────────
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getSummary: () => api.get('/payments/summary'),
  generate: (data) => api.post('/payments/generate', data),
  markOverdue: () => api.put('/payments/mark-overdue'),
  confirm: (id, data) => api.put(`/payments/${id}/confirm`, data),
};

// ─── Complaints ───────────────────────────────────────────────────────────
export const complaintsAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getStats: () => api.get('/complaints/stats'),
  submit: (data) => api.post('/complaints', data),
  update: (id, data) => api.put(`/complaints/${id}/update`, data),
};

// ─── Reports ──────────────────────────────────────────────────────────────
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getOccupancy: () => api.get('/reports/occupancy'),
  getPayments: (params) => api.get('/reports/payments', { params }),
  getComplaints: () => api.get('/reports/complaints'),
};

export default api;
