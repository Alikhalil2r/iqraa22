import api from './client'

/** طلبات منصة اكسبو — مسار موحّد عبر /api (بدون localhost) */
export const platformApi = {
  settings: () => api.get('/platform/settings'),
  services: () => api.get('/platform/services'),
  portfolio: (category?: string) => api.get('/platform/portfolio', { params: category ? { category } : {} }),
  testimonials: () => api.get('/platform/testimonials'),
  faq: () => api.get('/platform/faq'),
  pricing: () => api.get('/platform/pricing'),

  blog: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get('/platform/blog', { params }),
  blogPost: (slug: string) => api.get(`/platform/blog/${slug}`),

  submitRequest: (data: Record<string, unknown>) => api.post('/platform/request', data),

  trackTicket: (ticket: string, email: string) =>
    api.get(`/platform/track/${ticket}`, { params: { email } }),
  sendTicketMessage: (ticket: string, data: { email: string; name?: string; content: string }) =>
    api.post(`/platform/track/${ticket}/message`, data),
  rateTicket: (ticket: string, data: { email: string; rating: number; feedback?: string }) =>
    api.post(`/platform/track/${ticket}/rate`, data),
}

export function apiErrorMessage(err: unknown, fallback = 'حدث خطأ. حاول مجدداً.'): string {
  const e = err as { response?: { data?: { error?: string }; status?: number }; message?: string }
  if (e.response?.status === 429) return e.response?.data?.error || 'طلبات كثيرة — انتظر قليلاً ثم أعد المحاولة'
  return e.response?.data?.error || e.message || fallback
}
