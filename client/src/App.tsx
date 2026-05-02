import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import { DashboardSkeleton } from './components/Skeleton'

// ─── Lazy‑loaded pages (code splitting per route) ────────────────────────────
const PublicLayout        = lazy(() => import('./pages/Public/PublicLayout'))
const HomePage            = lazy(() => import('./pages/Public/HomePage'))
const NewsPage            = lazy(() => import('./pages/Public/NewsPage'))
const AboutPage           = lazy(() => import('./pages/Public/AboutPage'))
const ContactPage         = lazy(() => import('./pages/Public/ContactPage'))
const HallOfFamePage      = lazy(() => import('./pages/Public/HallOfFamePage'))
const AlumniPage          = lazy(() => import('./pages/Public/AlumniPage'))
const AchievementsPage    = lazy(() => import('./pages/Public/AchievementsPage'))
const GalleryPage         = lazy(() => import('./pages/Public/GalleryPage'))
const ArticlesPage        = lazy(() => import('./pages/Public/ArticlesPage'))
const LearningSupportPage = lazy(() => import('./pages/Public/LearningSupportPage'))
const CalendarPage        = lazy(() => import('./pages/Public/CalendarPage'))
const VideosPage          = lazy(() => import('./pages/Public/VideosPage'))
const JobsPage            = lazy(() => import('./pages/Public/JobsPage'))

const LoginPage        = lazy(() => import('./pages/Auth/LoginPage'))
const ParentLoginPage  = lazy(() => import('./pages/Auth/ParentLoginPage'))

const AdminLayout      = lazy(() => import('./pages/Admin/AdminLayout'))
const Dashboard        = lazy(() => import('./pages/Admin/Dashboard'))
const Students         = lazy(() => import('./pages/Admin/Students'))
const Employees        = lazy(() => import('./pages/Admin/Employees'))
const Attendance       = lazy(() => import('./pages/Admin/Attendance'))
const Grades           = lazy(() => import('./pages/Admin/Grades'))
const Buses            = lazy(() => import('./pages/Admin/Buses'))
const Messages         = lazy(() => import('./pages/Admin/Messages'))
const NewsAdmin        = lazy(() => import('./pages/Admin/NewsAdmin'))
const Events           = lazy(() => import('./pages/Admin/Events'))
const ThemeSettings    = lazy(() => import('./pages/Admin/ThemeSettings'))
const SchoolSettings   = lazy(() => import('./pages/Admin/SchoolSettings'))
const UsersAdmin       = lazy(() => import('./pages/Admin/UsersAdmin'))
const Reports          = lazy(() => import('./pages/Admin/Reports'))
const FeesAdmin        = lazy(() => import('./pages/Admin/FeesAdmin'))
const ScheduleAdmin    = lazy(() => import('./pages/Admin/ScheduleAdmin'))

const ParentLayout     = lazy(() => import('./pages/Parent/ParentLayout'))
const ParentDashboard  = lazy(() => import('./pages/Parent/ParentDashboard'))
const ParentGrades     = lazy(() => import('./pages/Parent/ParentGrades'))
const ParentAttendance = lazy(() => import('./pages/Parent/ParentAttendance'))
const ParentMessages   = lazy(() => import('./pages/Parent/ParentMessages'))
const ParentSchedule   = lazy(() => import('./pages/Parent/ParentSchedule'))

const NotFoundPage     = lazy(() => import('./pages/NotFoundPage'))

// ─── Suspense fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-gray-400 font-bold">جارٍ التحميل...</p>
      </div>
    </div>
  )
}

function DashPageLoader() {
  return (
    <div className="p-4 md:p-6">
      <DashboardSkeleton />
    </div>
  )
}

// ─── Route guards ─────────────────────────────────────────────────────────────
function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
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

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <RedirectCheck />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

function RedirectCheck() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public site */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about"            element={<AboutPage />} />
          <Route path="news"             element={<NewsPage />} />
          <Route path="contact"          element={<ContactPage />} />
          <Route path="hall-of-fame"     element={<HallOfFamePage />} />
          <Route path="alumni"           element={<AlumniPage />} />
          <Route path="achievements"     element={<AchievementsPage />} />
          <Route path="gallery"          element={<GalleryPage />} />
          <Route path="articles"         element={<ArticlesPage />} />
          <Route path="learning-support" element={<LearningSupportPage />} />
          <Route path="calendar"         element={<CalendarPage />} />
          <Route path="videos"           element={<VideosPage />} />
          <Route path="jobs"             element={<JobsPage />} />
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
          <Route index element={<Suspense fallback={<DashPageLoader />}><Dashboard /></Suspense>} />
          <Route path="students"  element={<Students />} />
          <Route path="employees" element={<Employees />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="grades"    element={<Grades />} />
          <Route path="buses"     element={<Buses />} />
          <Route path="messages"  element={<Messages />} />
          <Route path="news"      element={<NewsAdmin />} />
          <Route path="events"    element={<Events />} />
          <Route path="theme"     element={<ThemeSettings />} />
          <Route path="settings"  element={<SchoolSettings />} />
          <Route path="users"     element={<UsersAdmin />} />
          <Route path="reports"   element={<Reports />} />
          <Route path="fees"      element={<FeesAdmin />} />
          <Route path="schedule"  element={<ScheduleAdmin />} />
        </Route>

        {/* Parent Portal */}
        <Route path="/parent" element={
          <RequireAuth role="parent">
            <ParentLayout />
          </RequireAuth>
        }>
          <Route index element={<ParentDashboard />} />
          <Route path="grades"     element={<ParentGrades />} />
          <Route path="attendance" element={<ParentAttendance />} />
          <Route path="messages"   element={<ParentMessages />} />
          <Route path="schedule"   element={<ParentSchedule />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
