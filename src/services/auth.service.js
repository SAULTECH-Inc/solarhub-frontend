import api, { tokenStorage } from '../lib/apiClient';

export const authService = {
  register:       (dto)          => api.post('/auth/register', dto),
  verifyEmail:    (email, otp)   => api.post('/auth/verify-email', { email, otp }),
  resendOtp:      (email)        => api.post('/auth/resend-otp', { email }),
  login:          (dto)          => api.post('/auth/login', dto),
  refreshToken:   (token)        => api.post('/auth/refresh', { refreshToken: token }),
  logout:         ()             => api.post('/auth/logout'),
  forgotPassword: (email)        => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, pw)    => api.post('/auth/reset-password', { token, newPassword: pw }),
  changePassword: (old_, new_)   => api.patch('/auth/change-password', { oldPassword: old_, newPassword: new_ }),
  me:             ()             => api.get('/auth/me'),
  googleLoginUrl: ()             => `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google`,

  // Store tokens and return user
  async loginAndStore(dto) {
    const res = await authService.login(dto);
    const { accessToken, refreshToken, user } = res.data;
    tokenStorage.setTokens(accessToken, refreshToken);
    return user;
  },

  async handleGoogleCallback(accessToken, refreshToken) {
    tokenStorage.setTokens(accessToken, refreshToken);
    return authService.me().then(r => r.data);
  },
};
