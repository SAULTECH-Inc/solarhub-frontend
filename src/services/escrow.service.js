import api from '../lib/apiClient';

export const platformService = {
  getSettings: () => api.get('/platform/settings'),
};

export const escrowService = {
  // Bank account (sellers)
  registerBankAccount: (dto)      => api.post('/escrow/bank-account', dto),
  getBankAccounts:     ()          => api.get('/escrow/bank-account'),
  deleteBankAccount:   (id)        => api.delete(`/escrow/bank-account/${id}`),

  // Initiate
  initiate: (orderId, sellerId, amount, currency) =>
    api.post(`/escrow/orders/${orderId}/initiate`, { sellerId, amount, currency }),

  // Seller respond
  respond: (id, decision, reason) =>
    api.patch(`/escrow/${id}/respond`, { decision, reason }),

  // Fund
  fundEscrow:    (id, email, currency) => api.post(`/escrow/${id}/fund`, { email, currency }),
  verifyFunding: (reference)           => api.post(`/escrow/verify/${reference}`),

  // Seller ships
  markShipped: (id, trackingInfo) => api.patch(`/escrow/${id}/mark-shipped`, trackingInfo),

  // Buyer actions
  confirmDelivery: (id)                     => api.patch(`/escrow/${id}/confirm-delivery`),
  raiseDispute:    (id, reason, evidence)   => api.post(`/escrow/${id}/dispute`, { reason, evidence }),

  // Read
  getByOrder:    (orderId) => api.get(`/escrow/orders/${orderId}`),
  getOne:        (id)      => api.get(`/escrow/${id}`),
  myBuyerList:   (p, l)   => api.get('/escrow/me/buying',  { params: { page: p, limit: l } }),
  mySellerList:  (p, l)   => api.get('/escrow/me/selling', { params: { page: p, limit: l } }),
};
