import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// Public
import PublicLayout from './pages/Public/PublicLayout'
import HomePage from './pages/Public/HomePage'
import NewsPage from './pages/Public/NewsPage'
import AboutPage from './pages/Public/AboutPage'
import ContactPage from './pages/Public/ContactPage'

// Auth
import LoginPage from './pages/Auth/LoginPage'
import ParentLoginPage from './pages/Auth/ParentLoginPage'

// Admin
import AdminLayout from './pages/Admin/AdminLayout'
import Dashboard from './pages/Admin/Dashboard'
import Students from './pages/Admin/Students'
import Employees from './pages/Admin/Employees'
import Attendance from './pages/Admin/Attendance'
import Grades from './pages/Admin/Grades'
import Buses from './pages/Admin/Buses'
import Messages from './pages/Admin/Messages'
import NewsAdmin from './pages/Admin/NewsAdmin'
import Events from './pages/Admin/Events'
import ThemeSettings from './pages/Admin/ThemeSettings'
import SchoolSettings from './pages/Admin/SchoolSettings'
import UsersAdmin from './pages/Admin/UsersAdmin'
import Reports from './pages/Admin/Reports'

// Parent
import ParentLayout from './pages/Parent/ParentLayout'
import ParentDashboard from './pages/Parent/ParentDashboard'
import ParentGrades from './pages/Parent/ParentGrades'
import ParentAttendance from './pages/Parent/ParentAttendance'
import ParentMessages from './pages/Parent/ParentMessages'
import ParentSchedule from './pages/Parent/ParentSchedule'

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role && !(role === 'admin' && user.role === 'teacher')) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function RedirectIfAuthed() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (user?.role === 'parent') return <Navigate to="/parent" replace />
  if (user?.role === 'admin' || user?.role === 'teacher') return <Navigate to="/admin" replace />
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RedirectCheck />
      </ThemeProvider>
    </AuthProvider>
  )
}

function RedirectCheck() {
  return (
    <Routes>
      {/* Public site */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/parent-login" element={<ParentLoginPage />} />

      {/* Admin */}
      <Route path="/admin" element={
        <RequireAuth role="admin">
          <AdminLayout />
        </RequireAuth>
      }>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="employees" element={<Employees />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="grades" element={<Grades />} />
        <Route path="buses" element={<Buses />} />
        <Route path="messages" element={<Messages />} />
        <Route path="news" element={<NewsAdmin />} />
        <Route path="events" element={<Events />} />
        <Route path="theme" element={<ThemeSettings />} />
        <Route path="settings" element={<SchoolSettings />} />
        <Route path="users" element={<UsersAdmin />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Parent Portal */}
      <Route path="/parent" element={
        <RequireAuth role="parent">
          <ParentLayout />
        </RequireAuth>
      }>
        <Route index element={<ParentDashboard />} />
        <Route path="grades" element={<ParentGrades />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="messages" element={<ParentMessages />} />
        <Route path="schedule" element={<ParentSchedule />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
