import { query } from './index'

const SCHOOL_EN = {
  tagline: 'Illuminating the future through knowledge',
  about: 'Al-Noor International School is a private institution in Muscat offering integrated Omani and international curricula, with a focus on academic excellence, character building, and 21st-century skills.',
  vision: 'To be a leading educational beacon in Muscat that graduates a conscious, creative generation capable of competing globally.',
  mission: 'Deliver comprehensive education combining national values and international standards in a safe, inspiring environment.',
  principalMessage: 'Welcome to Al-Noor International School — we build our children\'s future through knowledge, values, and discipline. We welcome your visits and inquiries at any time.',
}

const NEWS_EN: [string, string, string, string][] = [
  ['افتتاح العام الدراسي', 'Opening of Academic Year 2025/2026 in Muscat', 'Al-Noor International School welcomed students at a special opening ceremony attended by parents.', 'Academic'],
  ['فوز فريق الروبوتيك', 'Robotics Team Wins First Place in Muscat', 'Grade 8 students achieved first place in the regional robotics competition.', 'Achievements'],
  ['برنامج القراءة الصيفية', 'Summer Reading Program — 50 Books in One Month', '120 students completed the summer reading program with a 95% completion rate.', 'Activities'],
  ['يوم المهنة المهني', 'Career Day — Visits to 12 Organizations', 'The school organized a career day for middle school students with experts from Muscat.', 'Events'],
  ['تخرج الدفعة العاشرة', 'Graduation of the Tenth Cohort — 48 Honors Graduates', 'The school celebrated a new cohort of outstanding graduates.', 'Graduation'],
  ['افتتاح مختبر العلوم', 'Opening of the Smart Science Laboratory', 'A state-of-the-art science lab opened to serve secondary students.', 'Facilities'],
]

const FAQ_EN: [string, string, string][] = [
  ['ما المناهج', 'What curricula does the school offer?', 'We offer the accredited Omani curriculum with international programs in English, science, and technology.'],
  ['مواعيد الدوام', 'What are the official school hours?', 'Sunday to Thursday, 7:00 AM to 2:30 PM.'],
  ['نقل مدرسي', 'Do you provide school transportation in Muscat?', 'Yes — our bus fleet covers Al Qurum, Al Khuwair, Al Mawalih, and other areas.'],
  ['أتابع أداء ابني', 'How can I track my child\'s progress?', 'Through the parent portal — log in with your account to view grades, attendance, homework, and fees.'],
  ['أتواصل مع المعلم', 'How can I contact the teacher?', 'Via portal messages or by contacting student affairs during office hours.'],
]

const GALLERY_EN: [string, string, string, string][] = [
  ['المبنى الرئيسي', 'Main Building', 'School facade in Al Qurum — Muscat', 'Buildings'],
  ['فصول دراسية', 'Smart Classrooms', 'Classrooms equipped with interactive screens', 'Classrooms'],
  ['مكتبة المدرسة', 'School Library', 'Comprehensive library with thousands of books', 'Facilities'],
  ['مختبر العلوم', 'Science Laboratory', 'Hands-on science experiments', 'Labs'],
  ['الملعب الرياضي', 'Sports Field', 'Multi-purpose sports ground', 'Sports'],
  ['ورشة الفنون', 'Arts Workshop', 'Creative activities for students', 'Activities'],
  ['حفل التخرج', 'Graduation Ceremony', 'Tenth cohort celebration', 'Events'],
  ['أنشطة صفية', 'Classroom Activities', 'Interactive and engaging learning', 'Education'],
]

/** تعبئة الحقول الإنجليزية للمحتوى العام */
export async function seedBilingualContent(schoolId: string) {
  await query(`UPDATE schools SET tagline_en=$1 WHERE id=$2`, [SCHOOL_EN.tagline, schoolId])
  await query(
    `UPDATE school_settings SET
      about_text_en=$1, vision_en=$2, mission_en=$3, principal_message_en=$4,
      office_hours_en=$5
     WHERE school_id=$6`,
    [SCHOOL_EN.about, SCHOOL_EN.vision, SCHOOL_EN.mission, SCHOOL_EN.principalMessage,
     'Sun – Thu | 7:00 AM – 2:30 PM', schoolId]
  )

  for (const [prefix, titleEn, summaryEn, catEn] of NEWS_EN) {
    await query(
      `UPDATE news SET title_en=$1, summary_en=$2, category_en=$3
       WHERE school_id=$4 AND title LIKE $5 || '%'`,
      [titleEn, summaryEn, catEn, schoolId, prefix]
    )
  }

  for (const [prefix, titleEn, descEn, catEn] of GALLERY_EN) {
    await query(
      `UPDATE gallery SET title_en=$1, description_en=$2, category_en=$3
       WHERE school_id=$4 AND title LIKE $5 || '%'`,
      [titleEn, descEn, catEn, schoolId, prefix]
    )
  }

  await query(
    `UPDATE public_alerts SET message_en=$1
     WHERE school_id=$2 AND message LIKE '%نتائج الفصل%'`,
    ['📋 Semester results are now available through the parent portal', schoolId]
  )

  for (const [prefix, qEn, aEn] of FAQ_EN) {
    await query(
      `UPDATE public_faqs SET question_en=$1, answer_en=$2
       WHERE school_id=$3 AND question LIKE $4 || '%'`,
      [qEn, aEn, schoolId, prefix]
    )
  }

  const EVENT_EN: [string, string][] = [
    ['اجتماع أولياء الأمور', 'Parent Meeting — Second Semester'],
    ['يوم المهنة', 'Career Day'],
    ['امتحانات نهاية الفصل', 'End-of-Term Examinations'],
    ['رحلة تعليمية', 'Educational Trip — Muscat Museum'],
  ]
  for (const [prefix, titleEn] of EVENT_EN) {
    await query(
      `UPDATE events SET title_en=$1 WHERE school_id=$2 AND title LIKE $3 || '%'`,
      [titleEn, schoolId, prefix]
    )
  }

  const ACHIEVEMENT_EN: [string, string, string][] = [
    ['المركز الأول — مسابقة الرياضيات', 'First Place — Mathematics Competition', 'Grade 6 students won at Muscat level'],
    ['جائزة الإبداع العلمي', 'Scientific Creativity Award', 'Solar energy project by Grade 9 students'],
    ['بطولة كرة القدم', 'School Football Championship', 'Al-Noor team won the private schools cup'],
    ['مسابقة القرآن', 'Quran Competition — Second Place', 'Second place at governorate level'],
  ]
  for (const [prefix, titleEn, descEn] of ACHIEVEMENT_EN) {
    await query(
      `UPDATE achievements SET title_en=$1, description_en=$2
       WHERE school_id=$3 AND title LIKE $4 || '%'`,
      [titleEn, descEn, schoolId, prefix]
    )
  }
}

export async function ensureBilingualColumns() {
  const alters = [
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS tagline_en VARCHAR(300)`,
    `ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS about_text_en TEXT`,
    `ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS vision_en TEXT`,
    `ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS mission_en TEXT`,
    `ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS principal_message_en TEXT`,
    `ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS values_text_en TEXT`,
    `ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS objectives_en TEXT`,
    `ALTER TABLE news ADD COLUMN IF NOT EXISTS title_en VARCHAR(300)`,
    `ALTER TABLE news ADD COLUMN IF NOT EXISTS summary_en TEXT`,
    `ALTER TABLE news ADD COLUMN IF NOT EXISTS content_en TEXT`,
    `ALTER TABLE news ADD COLUMN IF NOT EXISTS category_en VARCHAR(100)`,
    `ALTER TABLE public_faqs ADD COLUMN IF NOT EXISTS question_en TEXT`,
    `ALTER TABLE public_faqs ADD COLUMN IF NOT EXISTS answer_en TEXT`,
    `ALTER TABLE public_alerts ADD COLUMN IF NOT EXISTS message_en TEXT`,
    `ALTER TABLE school_settings ADD COLUMN IF NOT EXISTS office_hours_en VARCHAR(200)`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS title_en VARCHAR(300)`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS description_en TEXT`,
    `ALTER TABLE gallery ADD COLUMN IF NOT EXISTS title_en VARCHAR(200)`,
    `ALTER TABLE gallery ADD COLUMN IF NOT EXISTS description_en TEXT`,
    `ALTER TABLE gallery ADD COLUMN IF NOT EXISTS category_en VARCHAR(100)`,
    `ALTER TABLE achievements ADD COLUMN IF NOT EXISTS title_en VARCHAR(300)`,
    `ALTER TABLE achievements ADD COLUMN IF NOT EXISTS description_en TEXT`,
    `ALTER TABLE achievements ADD COLUMN IF NOT EXISTS category_en VARCHAR(100)`,
  ]
  for (const sql of alters) await query(sql)
}
