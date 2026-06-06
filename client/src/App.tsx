import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import RoleGuard from './components/RoleGuard'
import { PublicSchoolProvider } from './context/PublicSchoolContext'
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
const ParentExams = lazy(() => import('./pages/Parent/ParentExams'))
const StudentLayout = lazy(() => import('./pages/Student/StudentLayout'))
const StudentDashboard = lazy(() => import('./pages/Student/StudentDashboard'))
const StudentGrades = lazy(() => import('./pages/Student/StudentGrades'))
const StudentHomework = lazy(() => import('./pages/Student/StudentHomework'))
const StudentSchedule = lazy(() => import('./pages/Student/StudentSchedule'))
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

const RG = RoleGuard

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
          <Route path="/school" element={<PublicSchoolProvider><PublicLayout /></PublicSchoolProvider>}>
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
            <Route index element={<RG roles={['super_admin','admin','librarian','hr_manager','guard']}><Dashboard /></RG>} />
            <Route path="accountant" element={<RG roles={['super_admin','admin','accountant']}><AccountantDashboard /></RG>} />
            <Route path="teacher" element={<RG roles={['super_admin','admin','teacher']}><TeacherDashboard /></RG>} />
            <Route path="reports" element={<RG roles={['super_admin','admin','accountant','hr_manager']}><Reports /></RG>} />
            <Route path="pdf-reports" element={<RG roles={['super_admin','admin','teacher','accountant','hr_manager']}><PDFReports /></RG>} />
            <Route path="students" element={<RG roles={['super_admin','admin','teacher','hr_manager']}><Students /></RG>} />
            <Route path="employees" element={<RG roles={['super_admin','admin','hr_manager']}><Employees /></RG>} />
            <Route path="attendance" element={<RG roles={['super_admin','admin','teacher','hr_manager','guard']}><Attendance /></RG>} />
            <Route path="grades" element={<RG roles={['super_admin','admin','teacher']}><Grades /></RG>} />
            <Route path="fees" element={<RG roles={['super_admin','admin','accountant']} permission="fees"><FeesAdmin /></RG>} />
            <Route path="buses" element={<RG roles={['super_admin','admin','guard']}><Buses /></RG>} />
            <Route path="messages" element={<RG roles={['super_admin','admin','teacher','hr_manager','librarian','guard']}><Messages /></RG>} />
            <Route path="announcements" element={<RG roles={['super_admin','admin']}><Announcements /></RG>} />
            <Route path="schedule" element={<RG roles={['super_admin','admin','teacher']}><ScheduleAdmin /></RG>} />
            <Route path="news" element={<RG roles={['super_admin','admin']}><NewsAdmin /></RG>} />
            <Route path="submissions" element={<RG roles={['super_admin','admin','hr_manager']}><SubmissionsAdmin /></RG>} />
            <Route path="events" element={<RG roles={['super_admin','admin']}><Events /></RG>} />
            <Route path="library" element={<RG roles={['super_admin','admin','librarian']}><LibraryAdmin /></RG>} />
            <Route path="homework" element={<RG roles={['super_admin','admin','teacher']}><HomeworkAdmin /></RG>} />
            <Route path="conduct" element={<RG roles={['super_admin','admin','teacher']}><ConductAdmin /></RG>} />
            <Route path="leaves" element={<RG roles={['super_admin','admin','hr_manager']}><LeavesAdmin /></RG>} />
            <Route path="gallery" element={<RG roles={['super_admin','admin']}><GalleryAdmin /></RG>} />
            <Route path="site-content" element={<RG roles={['super_admin','admin']}><SiteContentAdmin /></RG>} />
            <Route path="extended-content" element={<RG roles={['super_admin','admin']}><ExtendedContentAdmin /></RG>} />
            <Route path="exams" element={<RG roles={['super_admin','admin','teacher']}><ExamsAdmin /></RG>} />
            <Route path="id-cards" element={<RG roles={['super_admin','admin']}><StudentIdCards /></RG>} />
            <Route path="requests" element={<RG roles={['super_admin']}><RequestsAdmin /></RG>} />
            <Route path="clients" element={<RG roles={['super_admin']}><ClientsAdmin /></RG>} />
            <Route path="projects" element={<RG roles={['super_admin']}><ProjectsAdmin /></RG>} />
            <Route path="platform-analytics" element={<RG roles={['super_admin']}><PlatformAnalytics /></RG>} />
            <Route path="platform-content" element={<RG roles={['super_admin']}><PlatformContent /></RG>} />
            <Route path="blog" element={<RG roles={['super_admin']}><BlogAdmin /></RG>} />
            <Route path="ai-insights" element={<RG roles={['super_admin','admin','teacher','accountant','hr_manager']}><AIInsights /></RG>} />
            <Route path="theme" element={<RG roles={['super_admin','admin']}><ThemeSettings /></RG>} />
            <Route path="settings" element={<RG roles={['super_admin','admin']}><SchoolSettings /></RG>} />
            <Route path="users" element={<RG roles={['super_admin','admin']}><UsersAdmin /></RG>} />
            <Route path="billing" element={<RG roles={['super_admin','admin']}><BillingAdmin /></RG>} />
            <Route path="audit-log" element={<RG roles={['super_admin','admin']}><AuditLog /></RG>} />
            <Route path="2fa" element={<RG roles={['super_admin','admin','teacher','accountant','librarian','hr_manager','guard']}><TwoFactorSetup /></RG>} />
            <Route path="super" element={<RG roles={['super_admin']}><SuperAdmin /></RG>} />
          </Route>
          <Route path="/parent" element={<ParentGuard><ParentLayout /></ParentGuard>}>
            <Route index element={<ParentDashboard />} />
            <Route path="grades" element={<ParentGrades />} />
            <Route path="attendance" element={<ParentAttendance />} />
            <Route path="homework" element={<ParentHomework />} />
            <Route path="fees" element={<ParentFees />} />
            <Route path="exams" element={<ParentExams />} />
            <Route path="conduct" element={<ParentConduct />} />
            <Route path="bus" element={<ParentBus />} />
            <Route path="messages" element={<ParentMessages />} />
            <Route path="schedule" element={<ParentSchedule />} />
            <Route path="notifications" element={<ParentNotifications />} />
          </Route>
          <Route path="/student" element={<ParentGuard><StudentLayout /></ParentGuard>}>
            <Route index element={<StudentDashboard />} />
            <Route path="grades" element={<StudentGrades />} />
            <Route path="homework" element={<StudentHomework />} />
            <Route path="schedule" element={<StudentSchedule />} />
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
