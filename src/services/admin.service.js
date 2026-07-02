import { api } from '../lib/apiClient';

export const adminService = {
  // Dashboard
  getDashboard:  ()                    => api.get('/admin/dashboard'),
  getHealth:     ()                    => api.get('/admin/health'),
  globalSearch:  (q)                   => api.get('/admin/search', { params: { q } }),

  // Users
  getUsers:      (page, limit, filters) => api.get('/admin/users', { params: { page, limit, ...filters } }),
  getUserStats:  ()                    => api.get('/admin/users/stats'),
  updateStatus:  (id, status)          => api.patch(`/admin/users/${id}/status`, { status }),
  verifySeller:  (id, approved)        => api.patch(`/admin/users/${id}/verify-seller`, { approved }),

  // Products
  getPending:    ()                    => api.get('/admin/products/pending'),
  getProductStats: ()                  => api.get('/admin/products/stats'),
  moderateProduct: (id, action, reason) => api.patch(`/admin/products/${id}/moderate`, { action, reason }),
  setFeatured:   (id, featured, badge) => api.patch(`/admin/products/${id}/feature`, { featured, badge }),

  // Orders
  getOrders:     (page, limit, filters) => api.get('/admin/orders', { params: { page, limit, ...filters } }),
  getOrderStats: ()                    => api.get('/admin/orders/stats'),
  advanceOrder:  (id, note)            => api.patch(`/admin/orders/${id}/advance`, { note }),
};
