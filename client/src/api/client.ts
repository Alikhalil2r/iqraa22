import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const authApi = {
  login: (data: { username: string; password: string; role: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
}

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  recentActivity: () => api.get('/dashboard/activity'),
}

// Students
export const studentsApi = {
  list: (params?: any) => api.get('/students', { params }),
  get: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  grades: (id: string) => api.get(`/students/${id}/grades`),
  attendance: (id: string, params?: any) => api.get(`/students/${id}/attendance`, { params }),
}

// Employees
export const employeesApi = {
  list: (params?: any) => api.get('/employees', { params }),
  get: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
}

// Attendance
export const attendanceApi = {
  list: (params?: any) => api.get('/attendance', { params }),
  mark: (data: any) => api.post('/attendance', data),
  bulkMark: (data: any) => api.post('/attendance/bulk', data),
  stats: (params?: any) => api.get('/attendance/stats', { params }),
}

// Grades
export const gradesApi = {
  list: (params?: any) => api.get('/grades', { params }),
  create: (data: any) => api.post('/grades', data),
  update: (id: string, data: any) => api.put(`/grades/${id}`, data),
  delete: (id: string) => api.delete(`/grades/${id}`),
  subjects: () => api.get('/grades/subjects'),
  report: (studentId: string) => api.get(`/grades/report/${studentId}`),
}

// Buses
export const busesApi = {
  list: () => api.get('/buses'),
  create: (data: any) => api.post('/buses', data),
  update: (id: string, data: any) => api.put(`/buses/${id}`, data),
  delete: (id: string) => api.delete(`/buses/${id}`),
  assignStudent: (busId: string, studentId: string) =>
    api.post(`/buses/${busId}/students`, { studentId }),
  removeStudent: (busId: string, studentId: string) =>
    api.delete(`/buses/${busId}/students/${studentId}`),
}

// Messages
export const messagesApi = {
  list: (params?: any) => api.get('/messages', { params }),
  get: (id: string) => api.get(`/messages/${id}`),
  send: (data: any) => api.post('/messages', data),
  reply: (id: string, data: any) => api.post(`/messages/${id}/reply`, data),
  markRead: (id: string) => api.put(`/messages/${id}/read`),
  unreadCount: () => api.get('/messages/unread/count'),
}

// News
export const newsApi = {
  list: (params?: any) => api.get('/news', { params }),
  get: (id: string) => api.get(`/news/${id}`),
  create: (data: any) => api.post('/news', data),
  update: (id: string, data: any) => api.put(`/news/${id}`, data),
  delete: (id: string) => api.delete(`/news/${id}`),
}

// Events
export const eventsApi = {
  list: (params?: any) => api.get('/events', { params }),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
}

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  updateTheme: (data: any) => api.put('/settings/theme', data),
  updateLogo: (formData: FormData) => api.put('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Parent Portal
export const parentApi = {
  dashboard: () => api.get('/parent/dashboard'),
  child: () => api.get('/parent/child'),
  grades: (params?: any) => api.get('/parent/grades', { params }),
  attendance: (params?: any) => api.get('/parent/attendance', { params }),
  schedule: () => api.get('/parent/schedule'),
  messages: () => api.get('/parent/messages'),
  sendMessage: (data: any) => api.post('/parent/messages', data),
  notifications: () => api.get('/parent/notifications'),
}

// Public website
export const publicApi = {
  school: () => api.get('/public/school'),
  news: () => api.get('/public/news'),
  staff: () => api.get('/public/staff'),
  achievements: () => api.get('/public/achievements'),
  gallery: () => api.get('/public/gallery'),
}
