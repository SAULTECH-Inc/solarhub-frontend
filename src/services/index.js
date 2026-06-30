import api from '../lib/apiClient';

// ── Advisor ───────────────────────────────────────────────────
export const advisorService = {
  calculate:           (appliances, preferences) => api.post('/advisor/calculate', { appliances, preferences }),
  getSessions:         ()    => api.get('/advisor/sessions'),
  getSession:          (id)  => api.get(`/advisor/sessions/${id}`),
  saveSelection:       (id, recommendationId) => api.patch(`/advisor/sessions/${id}/select`, { recommendationId }),
  getMarketplaceItems: (sessionId, tier, preference = 'balanced') =>
    api.get(`/advisor/sessions/${sessionId}/marketplace-items`, { params: { tier, preference } }),
};

// ── Favourites ────────────────────────────────────────────────
export const favouritesService = {
  getAll:    (p, l)       => api.get('/favourites', { params: { page: p, limit: l } }),
  getIds:    ()           => api.get('/favourites/ids'),
  toggle:    (productId)  => api.post(`/favourites/${productId}`),
  check:     (productId)  => api.get(`/favourites/${productId}/check`),
  clearAll:  ()           => api.delete('/favourites'),
};

// ── Reviews ───────────────────────────────────────────────────
export const reviewsService = {
  getForProduct: (productId, p, l) =>
    api.get(`/reviews/product/${productId}`, { params: { page: p, limit: l } }),
  create:    (dto)                => api.post('/reviews', dto),
  reply:     (id, reply)          => api.patch(`/reviews/${id}/reply`, { reply }),
  markHelp:  (id)                 => api.patch(`/reviews/${id}/helpful`),
  delete:    (id)                 => api.delete(`/reviews/${id}`),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationsService = {
  getAll:        (p, l) => api.get('/notifications', { params: { page: p, limit: l } }),
  getUnread:     ()     => api.get('/notifications/unread-count'),
  markRead:      (ids)  => api.patch('/notifications/mark-read', { ids }),
  markAllRead:   ()     => api.patch('/notifications/mark-all-read'),
};

// ── Users ─────────────────────────────────────────────────────
export const usersService = {
  getProfile:        ()      => api.get('/users/profile'),
  updateProfile:     (dto)   => api.patch('/users/profile', dto),
  getAddresses:      ()      => api.get('/users/addresses'),
  addAddress:        (dto)   => api.post('/users/addresses', dto),
  updateAddress:     (id, dto) => api.patch(`/users/addresses/${id}`, dto),
  deleteAddress:     (id)    => api.delete(`/users/addresses/${id}`),
  becomeSeller:      (dto, config)   => api.post('/users/become-seller', dto, config),
  updateSeller:      (dto)   => api.patch('/users/seller-profile', dto),
  getPublicProfile:  (id)    => api.get(`/users/public/${id}`),
};

// ── Engineers ─────────────────────────────────────────────
export const engineersService = {
  search:       (params)  => api.get('/engineers', { params }),
  getPublic:    (id)      => api.get(`/engineers/${id}`),
  getMyProfile: ()        => api.get('/engineers/profile/me'),
  create:       (dto)     => api.post('/engineers/profile', dto),
  update:       (dto)     => api.patch('/engineers/profile', dto),
};

// ── Chat (REST) ───────────────────────────────────────────────
export const chatService = {
  getRooms:        (p, l) => api.get('/chat/rooms', { params: { page: p, limit: l } }),
  createRoom:      (dto)  => api.post('/chat/rooms', dto),
  getRoomById:     (id)   => api.get(`/chat/rooms/${id}`),
  getMessages:     (id, p, l) => api.get(`/chat/rooms/${id}/messages`, { params: { page: p, limit: l } }),
  closeRoom:       (id)   => api.patch(`/chat/rooms/${id}/close`),
  markRead:        (id)   => api.patch(`/chat/rooms/${id}/mark-read`),
};

// ── Categories ────────────────────────────────────────────────
export const categoriesService = {
  getAll:     () => api.get('/categories'),
  getBySlug:  (slug) => api.get(`/categories/${slug}`),
  getSchema:  (id)   => api.get(`/categories/${id}/spec-schema`),
};

// ── Subscriptions ─────────────────────────────────────────────
export const subscriptionsService = {
  getPlans:        ()              => api.get('/subscriptions/plans'),
  subscribe:       (plan, currency) => api.post('/subscriptions/subscribe', { plan, currency }),
  verifyPaystack:  (ref)           => api.get(`/subscriptions/verify/paystack/${ref}`),
  cancel:          ()              => api.post('/subscriptions/cancel'),
  getInvoices:     (p, l)          => api.get('/subscriptions/invoices', { params: { page: p, limit: l } }),
  getInvoice:      (id)            => api.get(`/subscriptions/invoices/${id}`),
};

// ── Logistics ────────────────────────────────────────────────
export { logisticsService } from './logistics.service';

// ── RFQs (Project Bidding) ──────────────────────────────────
export const rfqsService = {
  create:       (dto)          => api.post('/rfqs', dto),
  getMyRfqs:    (p, l)         => api.get('/rfqs/my', { params: { page: p, limit: l } }),
  acceptBid:    (bidId)        => api.patch(`/rfqs/bids/${bidId}/accept`),
  getBoard:     (state, city, p, l) => api.get('/rfqs/board', { params: { state, city, page: p, limit: l } }),
  submitBid:    (rfqId, dto)   => api.post(`/rfqs/${rfqId}/bids`, dto),
};
