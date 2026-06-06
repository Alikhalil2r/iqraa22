import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
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
      const path = window.location.pathname
      const isAuthPage = path === '/login' || path === '/parent/login' || path === '/parent-login'
      if (!isAuthPage) {
        localStorage.removeItem('token')
        window.location.href = path.startsWith('/parent') ? '/parent/login' : '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const authApi = {
  login: (data: { username: string; password: string; role: string; schoolSlug?: string }) =>
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
  students: (busId: string) => api.get(`/buses/${busId}/students`),
  assignStudent: (busId: string, studentId: string) => api.post(`/buses/${busId}/students`, { studentId }),
  removeStudent: (busId: string, studentId: string) => api.delete(`/buses/${busId}/students/${studentId}`),
}

// Messages
export const messagesApi = {
  list: (params?: any) => api.get('/messages', { params }),
  get: (id: string) => api.get(`/messages/${id}`),
  send: (data: any) => api.post('/messages', data),
  reply: (id: string, data: any) => api.post(`/messages/${id}/reply`, data),
  markRead: (id: string) => api.put(`/messages/${id}/read`),
  delete: (id: string) => api.delete(`/messages/${id}`),
  unreadCount: () => api.get('/messages/unread-count'),
  broadcast: (data: { title: string; body: string }) => api.post('/messages/broadcast', data),
  broadcasts: () => api.get('/messages/broadcasts'),
}

// News
export const newsApi = {
  list: (params?: any) => api.get('/news', { params }),
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

// Billing
export const billingApi = {
  get: () => api.get('/billing'),
  usage: () => api.get('/billing/usage'),
  changePlan: (plan: string, billingCycle?: 'monthly' | 'yearly') =>
    api.patch('/billing/plan', { plan, billingCycle }),
  cancel: () => api.post('/billing/cancel'),
  createInvoice: (data: { plan: string; amount: number; due_date?: string; notes?: string }) =>
    api.post('/billing/invoice', data),
  markPaid: (id: string) => api.patch(`/billing/invoice/${id}/pay`),
}

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  theme: () => api.get('/settings/theme'),
  updateTheme: (data: any) => api.put('/settings/theme', data),
}

// Backups
export const backupsApi = {
  status: () => api.get('/backups/status'),
  list: () => api.get('/backups'),
  create: () => api.post('/backups', {}, { timeout: 120000 }),
  downloadUrl: (filename: string) => `/api/backups/${encodeURIComponent(filename)}/download`,
  restore: (filename: string) =>
    api.post(`/backups/${encodeURIComponent(filename)}/restore`, { confirm: 'RESTORE' }, { timeout: 120000 }),
  remove: (filename: string) => api.delete(`/backups/${encodeURIComponent(filename)}`),
}

// Public
export const publicApi = {
  school: () => api.get('/public/school'),
  schoolBySlug: (slug: string) => api.get(`/public/school/${encodeURIComponent(slug)}`),
  news: (params?: { school?: string }) => api.get('/public/news', { params }),
  newsItem: (id: string, params?: { school?: string }) => api.get(`/public/news/${id}`, { params }),
  events: (params?: { school?: string }) => api.get('/public/events', { params }),
  gallery: (params?: { school?: string }) => api.get('/public/gallery', { params }),
  staff: () => api.get('/public/staff'),
  achievements: () => api.get('/public/achievements'),
  alerts: () => api.get('/public/alerts'),
  faqs: () => api.get('/public/faqs'),
  jobs: () => api.get('/public/jobs'),
  alumni: () => api.get('/public/alumni'),
  submitContact: (data: { name: string; phone?: string; email: string; subject?: string; message: string }) =>
    api.post('/public/contact', data),
  submitAdmission: (data: { parentName: string; studentName: string; grade: string; phone: string; email: string; notes?: string }) =>
    api.post('/public/admission', data),
  applyJob: (data: { job_id?: string; job_title: string; name: string; email: string; phone?: string; form_data?: Record<string, string> }) =>
    api.post('/public/jobs/apply', data),
  registerAlumni: (data: { name: string; year: string | number; job: string; city?: string; email: string; phone?: string; story: string; achievement?: string }) =>
    api.post('/public/alumni/register', data),
  videos: () => api.get('/public/videos'),
  articles: (params?: { type?: 'student' | 'teacher' }) => api.get('/public/articles', { params }),
  teams: () => api.get('/public/teams'),
  hallOfFame: () => api.get('/public/hall-of-fame'),
  learningSupport: () => api.get('/public/learning-support'),
}

// Site content admin (achievements, staff, alerts, faqs)
export const contentApi = {
  achievements: () => api.get('/content/achievements'),
  createAchievement: (data: any) => api.post('/content/achievements', data),
  updateAchievement: (id: string, data: any) => api.put(`/content/achievements/${id}`, data),
  deleteAchievement: (id: string) => api.delete(`/content/achievements/${id}`),
  staff: () => api.get('/content/staff'),
  createStaff: (data: any) => api.post('/content/staff', data),
  updateStaff: (id: string, data: any) => api.put(`/content/staff/${id}`, data),
  deleteStaff: (id: string) => api.delete(`/content/staff/${id}`),
  alerts: () => api.get('/content/alerts'),
  createAlert: (data: any) => api.post('/content/alerts', data),
  updateAlert: (id: string, data: any) => api.put(`/content/alerts/${id}`, data),
  deleteAlert: (id: string) => api.delete(`/content/alerts/${id}`),
  faqs: () => api.get('/content/faqs'),
  createFaq: (data: any) => api.post('/content/faqs', data),
  updateFaq: (id: string, data: any) => api.put(`/content/faqs/${id}`, data),
  deleteFaq: (id: string) => api.delete(`/content/faqs/${id}`),
  videos: () => api.get('/content/videos'),
  createVideo: (data: any) => api.post('/content/videos', data),
  deleteVideo: (id: string) => api.delete(`/content/videos/${id}`),
  articles: (params?: { type?: string }) => api.get('/content/articles', { params }),
  createArticle: (data: any) => api.post('/content/articles', data),
  deleteArticle: (id: string) => api.delete(`/content/articles/${id}`),
  teams: () => api.get('/content/teams'),
  createTeam: (data: any) => api.post('/content/teams', data),
  deleteTeam: (id: string) => api.delete(`/content/teams/${id}`),
  hallOfFame: () => api.get('/content/hall-of-fame'),
  createHallEntry: (data: any) => api.post('/content/hall-of-fame', data),
  deleteHallEntry: (id: string) => api.delete(`/content/hall-of-fame/${id}`),
  learningSupport: () => api.get('/content/learning-support'),
  updateLearningSettings: (data: { aboutText: string }) => api.put('/content/learning-support/settings', data),
  createLsService: (data: any) => api.post('/content/learning-support/services', data),
  deleteLsService: (id: string) => api.delete(`/content/learning-support/services/${id}`),
  createLsSpecialist: (data: any) => api.post('/content/learning-support/specialists', data),
  deleteLsSpecialist: (id: string) => api.delete(`/content/learning-support/specialists/${id}`),
  createLsArticle: (data: any) => api.post('/content/learning-support/articles', data),
  deleteLsArticle: (id: string) => api.delete(`/content/learning-support/articles/${id}`),
  createLsGallery: (data: any) => api.post('/content/learning-support/gallery', data),
  deleteLsGallery: (id: string) => api.delete(`/content/learning-support/gallery/${id}`),
}

// Public form submissions (admin)
export const submissionsApi = {
  counts: () => api.get('/submissions/counts'),
  contact: (params?: { status?: string }) => api.get('/submissions/contact', { params }),
  updateContact: (id: string, status: string) => api.patch(`/submissions/contact/${id}`, { status }),
  jobs: (params?: { status?: string }) => api.get('/submissions/jobs', { params }),
  updateJob: (id: string, status: string) => api.patch(`/submissions/jobs/${id}`, { status }),
  alumni: (params?: { status?: string }) => api.get('/submissions/alumni', { params }),
  updateAlumni: (id: string, status: string) => api.patch(`/submissions/alumni/${id}`, { status }),
}

// Parent portal
export const parentApi = {
  children: () => api.get('/parent/children'),
  dashboard: (params?: { childId?: string }) => api.get('/parent/dashboard', { params }),
  child: (params?: { childId?: string }) => api.get('/parent/child', { params }),
  grades: (params?: { childId?: string; term?: string; academicYear?: string }) => api.get('/parent/grades', { params }),
  attendance: (params?: { childId?: string; month?: string; year?: string }) => api.get('/parent/attendance', { params }),
  homework: (params?: { childId?: string }) => api.get('/parent/homework', { params }),
  fees: (params?: { childId?: string }) => api.get('/parent/fees', { params }),
  conduct: (params?: { childId?: string }) => api.get('/parent/conduct', { params }),
  bus: (params?: { childId?: string }) => api.get('/parent/bus', { params }),
  messages: () => api.get('/parent/messages'),
  messageRecipients: () => api.get('/parent/messages/recipients'),
  getMessage: (id: string) => api.get(`/parent/messages/${id}`),
  sendMessage: (data: any) => api.post('/parent/messages', data),
  replyMessage: (id: string, data: { body: string }) => api.post(`/parent/messages/${id}/reply`, data),
  markMessageRead: (id: string) => api.put(`/parent/messages/${id}/read`),
  schedule: (params?: { childId?: string }) => api.get('/parent/schedule', { params }),
  notifications: () => api.get('/parent/notifications'),
  markNotificationRead: (id: string) => api.put(`/parent/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/parent/notifications/read-all'),
  exams: (params?: { childId?: string }) => api.get('/parent/exams', { params }),
}

export const paymentsApi = {
  createSession: (data: { feeId: string; provider?: string }) => api.post('/payments/session', data),
  webhook: (data: any) => api.post('/payments/webhook', data),
  receipt: (id: string) => api.get(`/payments/receipt/${id}`),
}

// Reports
export const reportsApi = {
  attendance: (params?: any) => api.get('/reports/attendance-summary', { params }),
  grades: (params?: any) => api.get('/reports/grades-summary', { params }),
  students: (params?: any) => api.get('/reports/students-summary', { params }),
  fees: (params?: any) => api.get('/reports/fees-summary', { params }),
  hr: () => api.get('/reports/hr-summary'),
  summary: () => api.get('/reports/summary'),
}

// Fees
export const feesApi = {
  list: (params?: any) => api.get('/fees', { params }),
  create: (data: any) => api.post('/fees', data),
  update: (id: string, data: any) => api.put(`/fees/${id}`, data),
  delete: (id: string) => api.delete(`/fees/${id}`),
  stats: () => api.get('/fees/stats'),
}

// Schedule
export const scheduleApi = {
  list: (params?: any) => api.get('/schedule', { params }),
  create: (data: any) => api.post('/schedule', data),
  update: (id: string, data: any) => api.put(`/schedule/${id}`, data),
  delete: (id: string) => api.delete(`/schedule/${id}`),
}

// Users admin
export const usersAdminApi = {
  list: (params?: any) => api.get('/users', { params }),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  resetPassword: (id: string, data: any) => api.put(`/users/${id}/password`, data),
  getTeachingProfile: (id: string) => api.get(`/users/${id}/teaching-profile`),
  saveTeachingProfile: (id: string, data: { homeroomClassId?: string | null; subjects?: { name: string; classId?: string }[] }) =>
    api.put(`/users/${id}/teaching-profile`, data),
}

// Teacher
export const teacherApi = {
  dashboard: () => api.get('/teacher/dashboard'),
  myClasses: () => api.get('/teacher/my-classes'),
  mySchedule: () => api.get('/teacher/my-schedule'),
  subjectPerformance: () => api.get('/teacher/subject-performance'),
}

// Gallery admin
export const galleryApi = {
  list: (params?: any) => api.get('/gallery', { params }),
  create: (data: any) => api.post('/gallery', data),
  update: (id: string, data: any) => api.put(`/gallery/${id}`, data),
  delete: (id: string) => api.delete(`/gallery/${id}`),
}

// Exams admin
export const examsApi = {
  list: (params?: any) => api.get('/exams', { params }),
  create: (data: any) => api.post('/exams', data),
  update: (id: string, data: any) => api.put(`/exams/${id}`, data),
  delete: (id: string) => api.delete(`/exams/${id}`),
}

// Library
export const libraryApi = {
  books: (params?: any) => api.get('/library/books', { params }),
  createBook: (data: any) => api.post('/library/books', data),
  updateBook: (id: string, data: any) => api.put(`/library/books/${id}`, data),
  deleteBook: (id: string) => api.delete(`/library/books/${id}`),
  borrows: (params?: any) => api.get('/library/borrows', { params }),
  borrow: (data: any) => api.post('/library/borrows', data),
  returnBook: (id: string, data?: any) => api.put(`/library/borrows/${id}/return`, data || {}),
  updateBorrow: (id: string, data: any) => api.put(`/library/borrows/${id}`, data),
}

// Employee Leaves
export const leavesApi = {
  types: () => api.get('/leaves/types'),
  list: (params?: any) => api.get('/leaves', { params }),
  create: (data: any) => api.post('/leaves', data),
  approve: (id: string) => api.put(`/leaves/${id}/approve`),
  reject: (id: string, data: any) => api.put(`/leaves/${id}/reject`, data),
  update: (id: string, data: any) => api.put(`/leaves/${id}`, data),
  cancel: (id: string) => api.delete(`/leaves/${id}`),
  balance: (employeeId: string) => api.get(`/leaves/balance/${employeeId}`),
}

// Homework
export const homeworkApi = {
  list: (params?: any) => api.get('/homework', { params }),
  create: (data: any) => api.post('/homework', data),
  update: (id: string, data: any) => api.put(`/homework/${id}`, data),
  delete: (id: string) => api.delete(`/homework/${id}`),
  submissions: (id: string) => api.get(`/homework/${id}/submissions`),
  gradeSubmission: (id: string, data: any) => api.put(`/homework/submissions/${id}/grade`, data),
  updateSubmission: (id: string, data: any) => api.put(`/homework/submissions/${id}`, data),
}

// Conduct / Behavior
export const conductApi = {
  list: (params?: any) => api.get('/conduct', { params }),
  create: (data: any) => api.post('/conduct', data),
  update: (id: string, data: any) => api.put(`/conduct/${id}`, data),
  delete: (id: string) => api.delete(`/conduct/${id}`),
  studentSummary: (studentId: string) => api.get(`/conduct/student/${studentId}`),
}

// Generic admin API helper (for platform routes)
export const adminApi = {
  get:    (url: string, params?: any) => api.get(url.replace('/api',''), { params }).then(r => r.data),
  post:   (url: string, data?: any)   => api.post(url.replace('/api',''), data).then(r => r.data),
  put:    (url: string, data?: any)   => api.put(url.replace('/api',''), data).then(r => r.data),
  patch:  (url: string, data?: any)   => api.patch(url.replace('/api',''), data).then(r => r.data),
  delete: (url: string)               => api.delete(url.replace('/api','')).then(r => r.data),
}
