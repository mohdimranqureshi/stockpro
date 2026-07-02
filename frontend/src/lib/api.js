import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 → redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ── API helpers ──────────────────────────────────────────────

export const authApi = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

export const userApi = {
  list:          ()        => api.get('/users'),
  create:        (data)    => api.post('/users', data),
  toggleActive:  (id)      => api.patch(`/users/${id}/toggle-active`),
  changeRole:    (id, role)=> api.patch(`/users/${id}/role`, { role }),
  resetPassword: (id, password) => api.patch(`/users/${id}/reset-password`, { password }),
  delete:        (id)      => api.delete(`/users/${id}`),
}

export const dashboardApi = {
  summary: (userId) => api.get('/dashboard/summary', { params: userId ? { userId } : {} }),
}

export const stockApi = {
  list:   (params) => api.get('/stock', { params }),
  get:    (id)     => api.get(`/stock/${id}`),
  create: (data)   => api.post('/stock', data),
  update: (id, data) => api.put(`/stock/${id}`, data),
  delete: (id)     => api.delete(`/stock/${id}`),
}

export const transactionApi = {
  list:       (params) => api.get('/transactions', { params }),
  get:        (id)     => api.get(`/transactions/${id}`),
  create:     (data)   => api.post('/transactions', data),
  summary:    (userId) => api.get('/transactions/summary', { params: userId ? { userId } : {} }),
  monthlyPL:  (year, userId) => api.get('/transactions/profit-loss/monthly', { params: { year, ...(userId ? { userId } : {}) } }),
}

export const paymentApi = {
  list:   (params) => api.get('/payments', { params }),
  get:    (id)     => api.get(`/payments/${id}`),
  create: (data)   => api.post('/payments', data),
  delete: (id)     => api.delete(`/payments/${id}`),
  totals: (userId) => api.get('/payments/totals', { params: userId ? { userId } : {} }),
}

export const replacementApi = {
  list:   (params) => api.get('/replacements', { params }),
  get:    (id)     => api.get(`/replacements/${id}`),
  create: (data)   => api.post('/replacements', data),
  delete: (id)     => api.delete(`/replacements/${id}`),
}

export const scrapApi = {
  list:   (params)   => api.get('/scrap', { params }),
  get:    (id)       => api.get(`/scrap/${id}`),
  create: (data)     => api.post('/scrap', data),
  update: (id, data) => api.put(`/scrap/${id}`, data),
  delete: (id)       => api.delete(`/scrap/${id}`),
}
