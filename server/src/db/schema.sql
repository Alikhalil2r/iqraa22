-- Schools (multi-tenant)
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  tagline VARCHAR(300),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(200),
  website VARCHAR(200),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- School theme/branding
CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  primary_color VARCHAR(20) DEFAULT '#1e40af',
  primary_dark VARCHAR(20) DEFAULT '#1e3a8a',
  primary_light VARCHAR(20) DEFAULT '#3b82f6',
  accent_color VARCHAR(20) DEFAULT '#f59e0b',
  accent_dark VARCHAR(20) DEFAULT '#d97706',
  logo_url TEXT,
  hero_image TEXT,
  about_text TEXT,
  vision TEXT,
  mission TEXT,
  principal_name VARCHAR(200),
  principal_message TEXT,
  principal_image TEXT,
  show_parent_portal BOOLEAN DEFAULT true,
  show_jobs BOOLEAN DEFAULT true,
  custom_css TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id)
);

-- Users (admin, teacher, parent)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','teacher','parent')),
  email VARCHAR(200),
  phone VARCHAR(50),
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, username)
);

-- Grades/Classes (not academic grades)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  level VARCHAR(50),
  section VARCHAR(20),
  academic_year VARCHAR(20),
  teacher_id UUID REFERENCES users(id),
  capacity INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_number VARCHAR(50),
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  gender VARCHAR(10),
  date_of_birth DATE,
  nationality VARCHAR(100),
  class_id UUID REFERENCES classes(id),
  class_name VARCHAR(100),
  academic_year VARCHAR(20),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active',
  -- Parent info
  parent_id UUID REFERENCES users(id),
  parent_name VARCHAR(200),
  parent_phone VARCHAR(50),
  parent_email VARCHAR(200),
  parent_relation VARCHAR(50),
  -- Address
  address TEXT,
  -- Medical
  blood_type VARCHAR(10),
  medical_notes TEXT,
  -- Bus
  bus_id UUID,
  -- Photo
  photo TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  employee_number VARCHAR(50),
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  gender VARCHAR(10),
  date_of_birth DATE,
  nationality VARCHAR(100),
  position VARCHAR(200),
  department VARCHAR(200),
  employee_type VARCHAR(50) DEFAULT 'full-time',
  contract_type VARCHAR(50),
  join_date DATE,
  end_date DATE,
  salary DECIMAL(10,2),
  salary_currency VARCHAR(10) DEFAULT 'OMR',
  allowances DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  phone VARCHAR(50),
  email VARCHAR(200),
  address TEXT,
  qualification VARCHAR(200),
  specialization VARCHAR(200),
  experience INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  photo TEXT,
  civil_id VARCHAR(50),
  passport_number VARCHAR(50),
  notes TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buses
CREATE TABLE IF NOT EXISTS buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  bus_number VARCHAR(50) NOT NULL,
  plate_number VARCHAR(50),
  driver_name VARCHAR(200),
  driver_phone VARCHAR(50),
  supervisor_name VARCHAR(200),
  supervisor_phone VARCHAR(50),
  capacity INTEGER DEFAULT 40,
  route_name VARCHAR(200),
  route_description TEXT,
  morning_time TIME,
  afternoon_time TIME,
  is_active BOOLEAN DEFAULT true,
  gps_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student-Bus assignment
CREATE TABLE IF NOT EXISTS student_buses (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
  pickup_location TEXT,
  pickup_time TIME,
  dropoff_location TEXT,
  dropoff_time TIME,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, bus_id)
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  person_type VARCHAR(20) NOT NULL CHECK (person_type IN ('student','employee')),
  person_id UUID NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present','absent','late','excused')),
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_type, person_id, date)
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  code VARCHAR(50),
  class_id UUID REFERENCES classes(id),
  teacher_id UUID REFERENCES users(id),
  max_score DECIMAL(5,2) DEFAULT 100,
  pass_score DECIMAL(5,2) DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grades (academic results)
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  subject_name VARCHAR(200),
  class_name VARCHAR(100),
  academic_year VARCHAR(20),
  term VARCHAR(50),
  score DECIMAL(5,2),
  max_score DECIMAL(5,2) DEFAULT 100,
  grade_letter VARCHAR(5),
  percentage DECIMAL(5,2),
  status VARCHAR(20),
  teacher_notes TEXT,
  recorded_by UUID REFERENCES users(id),
  exam_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  subject_name VARCHAR(200),
  teacher_id UUID REFERENCES users(id),
  teacher_name VARCHAR(200),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME,
  end_time TIME,
  room VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  parent_message_id UUID REFERENCES messages(id),
  subject VARCHAR(300),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300),
  summary TEXT,
  content TEXT,
  image_url TEXT,
  category VARCHAR(100),
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  publish_date TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID REFERENCES users(id),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events/Calendar
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  event_type VARCHAR(100),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location VARCHAR(300),
  color VARCHAR(20),
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  title VARCHAR(300),
  body TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(300),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff (public-facing)
CREATE TABLE IF NOT EXISTS staff_public (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  position VARCHAR(200),
  department VARCHAR(200),
  bio TEXT,
  photo TEXT,
  email VARCHAR(200),
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(200),
  description TEXT,
  image_url TEXT NOT NULL,
  category VARCHAR(100),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  image_url TEXT,
  category VARCHAR(100),
  achievement_date DATE,
  student_name VARCHAR(200),
  class_name VARCHAR(100),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fees / Payments
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  fee_type VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  due_date DATE,
  paid_date DATE,
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid','unpaid','partial','waived')),
  academic_year VARCHAR(20),
  term VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Broadcasts (admin → all parents)
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  body TEXT NOT NULL,
  sent_by UUID REFERENCES users(id),
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_broadcasts_school ON broadcasts(school_id);

-- Exam Schedule
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  subject_name VARCHAR(200) NOT NULL,
  class_name VARCHAR(200),
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  room VARCHAR(100),
  exam_type VARCHAR(50) DEFAULT 'written',
  academic_year VARCHAR(20) DEFAULT '2024-2025',
  term VARCHAR(50),
  notes TEXT,
  max_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exams_school ON exams(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(exam_date);

-- Indexes
-- ═══════════════════════════════════════════════════════════
-- LIBRARY MANAGEMENT
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  author VARCHAR(200),
  isbn VARCHAR(50),
  category VARCHAR(100),
  publisher VARCHAR(200),
  published_year INTEGER,
  copies_total INTEGER DEFAULT 1,
  copies_available INTEGER DEFAULT 1,
  shelf_location VARCHAR(100),
  description TEXT,
  cover_url TEXT,
  language VARCHAR(50) DEFAULT 'العربية',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS library_borrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  book_id UUID REFERENCES library_books(id) ON DELETE CASCADE,
  borrower_type VARCHAR(20) DEFAULT 'student' CHECK (borrower_type IN ('student','employee')),
  borrower_id UUID NOT NULL,
  borrow_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status VARCHAR(20) DEFAULT 'borrowed' CHECK (status IN ('borrowed','returned','overdue','lost')),
  fine_amount DECIMAL(8,2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT false,
  notes TEXT,
  issued_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_library_books_school ON library_books(school_id);
CREATE INDEX IF NOT EXISTS idx_library_borrows_school ON library_borrows(school_id);
CREATE INDEX IF NOT EXISTS idx_library_borrows_book ON library_borrows(book_id);
CREATE INDEX IF NOT EXISTS idx_library_borrows_borrower ON library_borrows(borrower_id);

-- ═══════════════════════════════════════════════════════════
-- EMPLOYEE LEAVE MANAGEMENT
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  max_days_per_year INTEGER DEFAULT 15,
  requires_approval BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT true,
  color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS employee_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id),
  leave_type_name VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_school ON employee_leaves(school_id);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_employee ON employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_status ON employee_leaves(status);

-- ═══════════════════════════════════════════════════════════
-- HOMEWORK / ASSIGNMENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_name VARCHAR(100),
  subject_name VARCHAR(200),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  assigned_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  max_score INTEGER DEFAULT 10,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','closed','archived')),
  attachment_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID REFERENCES homework(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  submission_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','submitted','graded','late')),
  score INTEGER,
  feedback TEXT,
  attachment_url TEXT,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(homework_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_homework_school ON homework(school_id);
CREATE INDEX IF NOT EXISTS idx_homework_class ON homework(class_name);
CREATE INDEX IF NOT EXISTS idx_hw_submissions_hw ON homework_submissions(homework_id);
CREATE INDEX IF NOT EXISTS idx_hw_submissions_student ON homework_submissions(student_id);

-- ═══════════════════════════════════════════════════════════
-- STUDENT CONDUCT / BEHAVIOR
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS conduct_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('incident','reward','warning','note')),
  category VARCHAR(100),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  points INTEGER DEFAULT 0,
  action_taken TEXT,
  parent_notified BOOLEAN DEFAULT false,
  record_date DATE DEFAULT CURRENT_DATE,
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conduct_school ON conduct_records(school_id);
CREATE INDEX IF NOT EXISTS idx_conduct_student ON conduct_records(student_id);

CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_school ON fees(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_employees_school ON employees(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_person ON attendance(person_id, person_type);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_school ON grades(school_id);
CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_news_school ON news(school_id);

-- ═══════════════════════════════════════════
-- MIGRATIONS: SuperAdmin + RBAC + Email
-- ═══════════════════════════════════════════
ALTER TABLE schools ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'basic';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 500;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS max_employees INTEGER DEFAULT 100;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS allowances DECIMAL(10,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deductions DECIMAL(10,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS experience INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'OMR';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS civil_id VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);

ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(200);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(200);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS smtp_pass TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS email_from_name VARCHAR(100) DEFAULT 'نظام المدرسة';
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT false;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS notify_absence BOOLEAN DEFAULT true;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS notify_grades BOOLEAN DEFAULT true;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS notify_fees BOOLEAN DEFAULT true;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
  'super_admin','admin','teacher','parent','accountant','librarian','hr_manager','guard'
));

-- ═══════════════════════════════════════════
-- MIGRATIONS: Enterprise Security (Audit Log + 2FA) + Billing
-- ═══════════════════════════════════════════

-- Audit log for all admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID,
  user_name VARCHAR(200),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(200),
  description TEXT,
  ip_address VARCHAR(100),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_school ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- 2FA secrets per user
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address VARCHAR(100),
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);

-- Subscription / billing invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE,
  plan VARCHAR(30) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'OMR',
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_school ON invoices(school_id);

-- ═══════════════════════════════════════════════════════════════════
-- PLATFORM: Tech Company Business Engine
-- ═══════════════════════════════════════════════════════════════════

-- Services catalog
CREATE TABLE IF NOT EXISTS platform_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  title_en VARCHAR(200),
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(30) DEFAULT '#7c3aed',
  price_from DECIMAL(10,2),
  duration_days INTEGER,
  category VARCHAR(100),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio / Previous work
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  category VARCHAR(100),
  client_name VARCHAR(200),
  project_url TEXT,
  technologies TEXT[],
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(200) NOT NULL,
  client_position VARCHAR(200),
  company VARCHAR(200),
  avatar_url TEXT,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Pricing plans
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'OMR',
  period VARCHAR(50) DEFAULT 'شهرياً',
  description TEXT,
  features JSONB DEFAULT '[]',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Business clients (CRM)
CREATE TABLE IF NOT EXISTS business_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(50),
  company VARCHAR(200),
  avatar_url TEXT,
  status VARCHAR(30) DEFAULT 'active',
  client_type VARCHAR(30) DEFAULT 'individual',
  source VARCHAR(100),
  notes TEXT,
  user_id UUID REFERENCES users(id),
  total_projects INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service requests / Tickets
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE,
  client_id UUID REFERENCES business_clients(id),
  client_name VARCHAR(200) NOT NULL,
  client_email VARCHAR(200),
  client_phone VARCHAR(50),
  client_company VARCHAR(200),
  service_type VARCHAR(100),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  expected_date DATE,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(30) DEFAULT 'new',
  assigned_to UUID REFERENCES users(id),
  admin_notes TEXT,
  attachments JSONB DEFAULT '[]',
  source VARCHAR(50) DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects (approved from requests or direct)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number VARCHAR(50) UNIQUE,
  request_id UUID REFERENCES service_requests(id),
  client_id UUID REFERENCES business_clients(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'planning',
  progress INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  paid DECIMAL(12,2) DEFAULT 0,
  technologies TEXT[],
  milestones JSONB DEFAULT '[]',
  team_members JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project messages (client <-> team chat)
CREATE TABLE IF NOT EXISTS project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_name VARCHAR(200),
  sender_role VARCHAR(50),
  content TEXT NOT NULL,
  is_from_client BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) UNIQUE,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  author_name VARCHAR(200),
  status VARCHAR(20) DEFAULT 'draft',
  views INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public site: job postings
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  department VARCHAR(100),
  job_type VARCHAR(50) DEFAULT 'دوام كامل',
  deadline DATE,
  requirements TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public site: contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(200) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public site: job applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  job_title VARCHAR(300) NOT NULL,
  applicant_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  form_data JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','reviewing','shortlisted','rejected','hired','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public site: alumni story submissions
CREATE TABLE IF NOT EXISTS alumni_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  graduation_year INTEGER NOT NULL,
  job_title VARCHAR(300) NOT NULL,
  city VARCHAR(200),
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  story TEXT NOT NULL,
  achievement TEXT,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company settings (site config / CMS)
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(30) DEFAULT 'text'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created ON service_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_school ON contact_submissions(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_school ON job_applications(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alumni_registrations_school ON alumni_registrations(school_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_school ON job_postings(school_id, is_active);

-- Public site alerts (emergency banner)
CREATE TABLE IF NOT EXISTS public_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  alert_type VARCHAR(20) DEFAULT 'info' CHECK (alert_type IN ('success','warning','danger','info','urgent')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public site FAQs (contact page)
CREATE TABLE IF NOT EXISTS public_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_alerts_school ON public_alerts(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_public_faqs_school ON public_faqs(school_id, is_published);

-- Phase 3: extended school settings fields
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS founded_year VARCHAR(10);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'سلطنة عُمان';
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS phone2 VARCHAR(50);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS email2 VARCHAR(200);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS fax VARCHAR(50);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS map_embed TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS values_text TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS objectives TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS principal_title VARCHAR(200);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS principal_email VARCHAR(200);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS principal_phone VARCHAR(50);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS youtube TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS snapchat TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS banner_color VARCHAR(20);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS students_count VARCHAR(20);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS teachers_count VARCHAR(20);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS classrooms_count VARCHAR(20);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS years_experience VARCHAR(20);
ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS office_hours VARCHAR(200) DEFAULT 'الأحد – الخميس | 7:00 ص – 2:30 م';

-- Public videos library
CREATE TABLE IF NOT EXISTS public_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  video_url TEXT NOT NULL,
  category VARCHAR(100),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student & teacher articles
CREATE TABLE IF NOT EXISTS public_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  article_type VARCHAR(20) NOT NULL CHECK (article_type IN ('student','teacher')),
  author_name VARCHAR(200) NOT NULL,
  grade VARCHAR(100),
  subject VARCHAR(100),
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  publish_date DATE DEFAULT CURRENT_DATE,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- School teams (articles page)
CREATE TABLE IF NOT EXISTS school_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  members_count INTEGER DEFAULT 0,
  description TEXT,
  achievements TEXT,
  image_url TEXT,
  color_gradient VARCHAR(100) DEFAULT 'from-teal-500 to-teal-600',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hall of fame
CREATE TABLE IF NOT EXISTS hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  grade VARCHAR(100),
  year VARCHAR(10),
  achievement VARCHAR(300),
  category VARCHAR(100),
  rank INTEGER DEFAULT 1,
  image_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning support unit
CREATE TABLE IF NOT EXISTS learning_support_settings (
  school_id UUID PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
  about_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ls_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  icon VARCHAR(20) DEFAULT '📖',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ls_specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(200),
  image_url TEXT,
  bio TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ls_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  publish_date DATE DEFAULT CURRENT_DATE,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ls_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title VARCHAR(200),
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_videos_school ON public_videos(school_id, is_published);
CREATE INDEX IF NOT EXISTS idx_public_articles_school ON public_articles(school_id, article_type, is_published);
CREATE INDEX IF NOT EXISTS idx_school_teams_school ON school_teams(school_id, is_published);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_school ON hall_of_fame(school_id, is_published);

