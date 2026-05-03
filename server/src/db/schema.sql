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
  phone VARCHAR(50),
  email VARCHAR(200),
  address TEXT,
  qualification VARCHAR(200),
  specialization VARCHAR(200),
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
