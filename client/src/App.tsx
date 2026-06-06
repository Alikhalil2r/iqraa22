import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import RouteProgress from './components/ux/RouteProgress'
import ScrollToTop from './components/ux/ScrollToTop'
import SkipLink from './components/ux/SkipLink'

const HomePage = lazy(() => import('./pages/Public/HomePage'))
const OfferPage = lazy(() => import('./pages/Platform/OfferPage'))
const RequestForm = lazy(() => import('./pages/Platform/RequestForm'))
const PublicLayout = lazy(() => import('./pages/Public/PublicLayout'))
const SchoolHomePage = lazy(() => import('./pages/Public/SchoolHomePage'))
const AboutPage = lazy(() => import('./pages/Public/AboutPage'))
const NewsPage = lazy(() => import('./pages/Public/NewsPage'))
const NewsDetailPage = lazy(() => import('./pages/Public/NewsDetailPage'))
const ContactPage = lazy(() => import('./pages/Public/ContactPage'))
const GalleryPage = lazy(() => import('./pages/Public/GalleryPage'))
const JobsPage = lazy(() => import('./pages/Public/JobsPage'))
const AlumniPage = lazy(() => import('./pages/Public/AlumniPage'))
const HallOfFamePage = lazy(() => import('./pages/Public/HallOfFamePage'))
const AchievementsPage = lazy(() => import('./pages/Public/AchievementsPage'))
const ArticlesPage = lazy(() => import('./pages/Public/ArticlesPage'))
const CalendarPage = lazy(() => import('./pages/Public/CalendarPage'))
const VideosPage = lazy(() => import('./pages/Public/VideosPage'))
const LearningSupportPage = lazy(() => import('./pages/Public/LearningSupportPage'))
const AdmissionPage = lazy(() => import('./pages/Public/AdmissionPage'))
const PrivacyPage = lazy(() => import('./pages/Public/PrivacyPage'))
const TicketTrackPage = lazy(() => import('./pages/Public/TicketTrackPage'))
const BlogPage = lazy(() => import('./pages/Public/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/Public/BlogPostPage'))
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const ParentLoginPage = lazy(() => import('./pages/Auth/ParentLoginPage'))
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'))
const AccountantDashboard = lazy(() => import('./pages/Admin/AccountantDashboard'))
const TeacherDashboard = lazy(() => import('./pages/Admin/TeacherDashboard'))
const Students = lazy(() => import('./pages/Admin/Students'))
const Employees = lazy(() => import('./pages/Admin/Employees'))
const Attendance = lazy(() => import('./pages/Admin/Attendance'))
const Grades = lazy(() => import('./pages/Admin/Grades'))
const FeesAdmin = lazy(() => import('./pages/Admin/FeesAdmin'))
const Buses = lazy(() => import('./pages/Admin/Buses'))
const Messages = lazy(() => import('./pages/Admin/Messages'))
const Announcements = lazy(() => import('./pages/Admin/Announcements'))
const ScheduleAdmin = lazy(() => import('./pages/Admin/ScheduleAdmin'))
const NewsAdmin = lazy(() => import('./pages/Admin/NewsAdmin'))
const SubmissionsAdmin = lazy(() => import('./pages/Admin/SubmissionsAdmin'))
const Events = lazy(() => import('./pages/Admin/Events'))
const LibraryAdmin = lazy(() => import('./pages/Admin/LibraryAdmin'))
const HomeworkAdmin = lazy(() => import('./pages/Admin/HomeworkAdmin'))
const ConductAdmin = lazy(() => import('./pages/Admin/ConductAdmin'))
const LeavesAdmin = lazy(() => import('./pages/Admin/LeavesAdmin'))
const GalleryAdmin = lazy(() => import('./pages/Admin/GalleryAdmin'))
const SiteContentAdmin = lazy(() => import('./pages/Admin/SiteContentAdmin'))
const ExtendedContentAdmin = lazy(() => import('./pages/Admin/ExtendedContentAdmin'))
const ExamsAdmin = lazy(() => import('./pages/Admin/ExamsAdmin'))
const StudentIdCards = lazy(() => import('./pages/Admin/StudentIdCards'))
const RequestsAdmin = lazy(() => import('./pages/Admin/RequestsAdmin'))
const ClientsAdmin = lazy(() => import('./pages/Admin/ClientsAdmin'))
const ProjectsAdmin = lazy(() => import('./pages/Admin/ProjectsAdmin'))
const PlatformAnalytics = lazy(() => import('./pages/Admin/PlatformAnalytics'))
const PlatformContent = lazy(() => import('./pages/Admin/PlatformContent'))
const BlogAdmin = lazy(() => import('./pages/Admin/BlogAdmin'))
const AIInsights = lazy(() => import('./pages/Admin/AIInsights'))
const ThemeSettings = lazy(() => import('./pages/Admin/ThemeSettings'))
const SchoolSettings = lazy(() => import('./pages/Admin/SchoolSettings'))
const UsersAdmin = lazy(() => import('./pages/Admin/UsersAdmin'))
const BillingAdmin = lazy(() => import('./pages/Admin/BillingAdmin'))
const AuditLog = lazy(() => import('./pages/Admin/AuditLog'))
const TwoFactorSetup = lazy(() => import('./pages/Admin/TwoFactorSetup'))
const SuperAdmin = lazy(() => import('./pages/Admin/SuperAdmin'))
const Reports = lazy(() => import('./pages/Admin/Reports'))
const PDFReports = lazy(() => import('./pages/Admin/PDFReports'))
const ParentLayout = lazy(() => import('./pages/Parent/ParentLayout'))
const ParentDashboard = lazy(() => import('./pages/Parent/ParentDashboard'))
const ParentGrades = lazy(() => import('./pages/Parent/ParentGrades'))
const ParentAttendance = lazy(() => import('./pages/Parent/ParentAttendance'))
const ParentHomework = lazy(() => import('./pages/Parent/ParentHomework'))
const ParentFees = lazy(() => import('./pages/Parent/ParentFees'))
const ParentConduct = lazy(() => import('./pages/Parent/ParentConduct'))
const ParentBus = lazy(() => import('./pages/Parent/ParentBus'))
const ParentMessages = lazy(() => import('./pages/Parent/ParentMessages'))
const ParentSchedule = lazy(() => import('./pages/Parent/ParentSchedule'))
const ParentNotifications = lazy(() => import('./pages/Parent/ParentNotifications'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function PageLoader() {
  return <div className="min-h-[40vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user || user.role === 'parent') return <Navigate to="/login" replace />
  return <>{children}</>
}

function ParentGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user || user.role !== 'parent') return <Navigate to="/parent/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <>
      <SkipLink />
      <RouteProgress />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/platform/offer" element={<OfferPage />} />
          <Route path="/platform/request" element={<RequestForm />} />
          <Route path="/platform/track" element={<TicketTrackPage />} />
          <Route path="/platform/blog" element={<BlogPage />} />
          <Route path="/platform/blog/:slug" element={<BlogPostPage />} />
          <Route path="/school" element={<PublicLayout />}>
            <Route index element={<SchoolHomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="news/:id" element={<NewsDetailPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="alumni" element={<AlumniPage />} />
            <Route path="hall-of-fame" element={<HallOfFamePage />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="articles" element={<ArticlesPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="learning-support" element={<LearningSupportPage />} />
            <Route path="admission" element={<AdmissionPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/parent/login" element={<ParentLoginPage />} />
          <Route path="/parent-login" element={<Navigate to="/parent/login" replace />} />
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<Dashboard />} />
            <Route path="accountant" element={<AccountantDashboard />} />
            <Route path="teacher" element={<TeacherDashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="pdf-reports" element={<PDFReports />} />
            <Route path="students" element={<Students />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="grades" element={<Grades />} />
            <Route path="fees" element={<FeesAdmin />} />
            <Route path="buses" element={<Buses />} />
            <Route path="messages" element={<Messages />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="schedule" element={<ScheduleAdmin />} />
            <Route path="news" element={<NewsAdmin />} />
            <Route path="submissions" element={<SubmissionsAdmin />} />
            <Route path="events" element={<Events />} />
            <Route path="library" element={<LibraryAdmin />} />
            <Route path="homework" element={<HomeworkAdmin />} />
            <Route path="conduct" element={<ConductAdmin />} />
            <Route path="leaves" element={<LeavesAdmin />} />
            <Route path="gallery" element={<GalleryAdmin />} />
            <Route path="site-content" element={<SiteContentAdmin />} />
            <Route path="extended-content" element={<ExtendedContentAdmin />} />
            <Route path="exams" element={<ExamsAdmin />} />
            <Route path="id-cards" element={<StudentIdCards />} />
            <Route path="requests" element={<RequestsAdmin />} />
            <Route path="clients" element={<ClientsAdmin />} />
            <Route path="projects" element={<ProjectsAdmin />} />
            <Route path="platform-analytics" element={<PlatformAnalytics />} />
            <Route path="platform-content" element={<PlatformContent />} />
            <Route path="blog" element={<BlogAdmin />} />
            <Route path="ai-insights" element={<AIInsights />} />
            <Route path="theme" element={<ThemeSettings />} />
            <Route path="settings" element={<SchoolSettings />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="billing" element={<BillingAdmin />} />
            <Route path="audit-log" element={<AuditLog />} />
            <Route path="2fa" element={<TwoFactorSetup />} />
            <Route path="super" element={<SuperAdmin />} />
          </Route>
          <Route path="/parent" element={<ParentGuard><ParentLayout /></ParentGuard>}>
            <Route index element={<ParentDashboard />} />
            <Route path="grades" element={<ParentGrades />} />
            <Route path="attendance" element={<ParentAttendance />} />
            <Route path="homework" element={<ParentHomework />} />
            <Route path="fees" element={<ParentFees />} />
            <Route path="conduct" element={<ParentConduct />} />
            <Route path="bus" element={<ParentBus />} />
            <Route path="messages" element={<ParentMessages />} />
            <Route path="schedule" element={<ParentSchedule />} />
            <Route path="notifications" element={<ParentNotifications />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
