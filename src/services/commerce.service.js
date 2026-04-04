import api from '../lib/apiClient';

// ── Cart ──────────────────────────────────────────────────────
export const cartService = {
  get:        ()              => api.get('/cart'),
  add:        (productId, qty=1) => api.post('/cart/items', { productId, quantity: qty }),
  updateQty:  (itemId, qty)   => api.patch(`/cart/items/${itemId}`, { quantity: qty }),
  remove:     (itemId)        => api.delete(`/cart/items/${itemId}`),
  clear:      ()              => api.delete('/cart'),
  merge:      (sessionId)     => api.post('/cart/merge', { sessionId }),
};

// ── Orders ────────────────────────────────────────────────────
export const ordersService = {
  place:       (dto)          => api.post('/orders', dto),
  getMyOrders: (p, l, status) => api.get('/orders/my', { params: { page: p, limit: l, status } }),
  getById:     (id)           => api.get(`/orders/${id}`),
  advance:     (id, note)     => api.patch(`/orders/${id}/advance`, { note }),
  cancel:      (id, reason)   => api.patch(`/orders/${id}/cancel`, { reason }),
  allAdmin:    (p, l, params) => api.get('/orders/admin/all', { params: { page: p, limit: l, ...params } }),
};

// ── Delivery ──────────────────────────────────────────────────
export const deliveryService = {
  getTracking: (orderId)   => api.get(`/delivery/order/${orderId}`),
  trackByCode: (code)      => api.get(`/delivery/track/${code}`),
  addEvent:    (orderId, dto) => api.post(`/delivery/order/${orderId}/event`, dto),
};

// ── Payments ──────────────────────────────────────────────────
export const paymentsService = {
  initiate: (orderId, currency, method) =>
    api.post('/payments/initiate', { orderId, currency, method }),
  verifyPaystack: (ref) => api.get(`/payments/verify/paystack/${ref}`),
  refund: (paymentId, amount, reason) =>
    api.post(`/payments/${paymentId}/refund`, { amount, reason }),
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
};
