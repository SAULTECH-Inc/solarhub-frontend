import api from '../lib/apiClient';

export const logisticsService = {
  // ── Provider registration & profile ──────────────────────
  register:      (dto)        => api.post('/logistics/register', dto),
  getMyProfile:  ()           => api.get('/logistics/me'),
  updateProfile: (dto)        => api.patch('/logistics/me', dto),
  getMyStats:    ()           => api.get('/logistics/me/stats'),

  // ── Public listing ───────────────────────────────────────
  listProviders: (params)     => api.get('/logistics/providers', { params }),
  getProvider:   (id)         => api.get(`/logistics/providers/${id}`),

  // ── Agents (company only) ────────────────────────────────
  addAgent:        (dto)      => api.post('/logistics/me/agents', dto),
  getMyAgents:     ()         => api.get('/logistics/me/agents'),
  updateAgent:     (id, dto)  => api.patch(`/logistics/me/agents/${id}`, dto),
  deactivateAgent: (id)       => api.delete(`/logistics/me/agents/${id}`),

  // ── Shipment assignments ─────────────────────────────────
  assignShipment:        (dto)       => api.post('/logistics/shipments', dto),
  getMyShipments:        (params)    => api.get('/logistics/shipments', { params }),
  getShipmentByOrder:    (orderId)   => api.get(`/logistics/shipments/order/${orderId}`),
  acceptShipment:        (id)        => api.patch(`/logistics/shipments/${id}/accept`),
  rejectShipment:        (id, dto)   => api.patch(`/logistics/shipments/${id}/reject`, dto),
  updateShipmentStatus:  (id, dto)   => api.patch(`/logistics/shipments/${id}/status`, dto),
  assignAgent:           (id, dto)   => api.patch(`/logistics/shipments/${id}/agent`, dto),
};
