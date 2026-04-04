import api from '../lib/apiClient';

export const productsService = {
  search: (params = {}) => api.get('/products', { params }),
  getFeatured: (limit = 12) => api.get('/products/featured', { params: { limit } }),
  getById:     (id)         => api.get(`/products/${id}`),
  getBySlug:   (slug)       => api.get(`/products/${slug}`),
  create:      (dto)        => api.post('/products', dto),
  update:      (id, dto)    => api.patch(`/products/${id}`, dto),
  delete:      (id)         => api.delete(`/products/${id}`),
  approve:     (id)         => api.patch(`/products/${id}/approve`),
  myProducts:  (p, l)       => api.get('/products/seller/my-products', { params: { page: p, limit: l } }),

  uploadImage: (id, file) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/products/${id}/upload-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  scanLabel: (file, category) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/products/scan-label', fd, {
      params: { category },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
