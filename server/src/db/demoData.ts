import { query } from './index'
import bcrypt from 'bcryptjs'

export const DEMO_SCHOOL = {
  name: 'مدرسة النور العالمية',
  nameEn: 'Al-Noor International School',
  tagline: 'نور العلم يضيء المستقبل',
  address: 'حي القرم، مسقط، سلطنة عُمان',
  phone: '+968 24 500 000',
  phone2: '+968 99 000 111',
  email: 'info@alnoor-school.om',
  website: 'https://www.alnoor-school.om',
  city: 'مسقط',
  region: 'محافظة مسقط',
  foundedYear: '2012',
  licenseNumber: 'OM-EDU-2012-0147',
}

export const DEMO_PASSWORD = 'demo2026'

const IMG = {
  school: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80',
  classroom: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80',
  library: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&q=80',
  sports: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80',
  art: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&q=80',
  graduation: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80',
  kids: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
  lab: 'https://images.unsplash.com/photo-1530210114552-205dc422ec9a?w=1200&q=80',
  principal: 'https://randomuser.me/api/portraits/men/75.jpg',
}

export async function applySchoolBranding(schoolId: string) {
  await query(
    `UPDATE schools SET name=$1, name_en=$2, tagline=$3, address=$4, phone=$5, email=$6, website=$7 WHERE id=$8`,
    [DEMO_SCHOOL.name, DEMO_SCHOOL.nameEn, DEMO_SCHOOL.tagline, DEMO_SCHOOL.address,
     DEMO_SCHOOL.phone, DEMO_SCHOOL.email, DEMO_SCHOOL.website, schoolId]
  )
  await query(
    `UPDATE school_settings SET
      primary_color=$1, primary_dark=$2, primary_light=$3, accent_color=$4, accent_dark=$5,
      about_text=$6, vision=$7, mission=$8,
      principal_name=$9, principal_message=$10, principal_image=$11, hero_image=$12,
      founded_year=$13, city=$14, region=$15, license_number=$16,
      students_count=$17, teachers_count=$18, classrooms_count=$19, years_experience=$20,
      office_hours=$21, values_text=$22, objectives=$23,
      instagram=$24, twitter=$25, facebook=$26, youtube=$27, whatsapp=$28
     WHERE school_id=$29`,
    [
      '#065f46', '#064e3b', '#10b981', '#fbbf24', '#f59e0b',
      'مدرسة النور العالمية مؤسسة تعليمية خاصة في مسقط تقدّم مناهج عُمانية ودولية متكاملة، مع التركيز على التميز الأكاديمي وبناء الشخصية وتنمية المهارات القرن الحادي والعشرين.',
      'أن نكون منارة تعليمية رائدة في مسقط تُخرّج جيلاً واعياً مبدعاً قادراً على المنافسة عالمياً.',
      'تقديم تعليم شامل يجمع بين القيم الوطنية والمعايير الدولية في بيئة آمنة ومحفّزة.',
      'د. سالم بن راشد المعولي',
      'مرحباً بكم في مدرسة النور العالمية — نبني مستقبل أبنائنا بالعلم والقيم والانضباط. نرحّب بزيارتكم واستفساراتكم في أي وقت.',
      IMG.principal, IMG.school,
      DEMO_SCHOOL.foundedYear, DEMO_SCHOOL.city, DEMO_SCHOOL.region, DEMO_SCHOOL.licenseNumber,
      '850+', '65+', '42', '14+',
      'الأحد – الخميس | 7:00 ص – 2:30 م',
      'التميز الأكاديمي|القيم الأصيلة|الابتكار التعليمي|الشراكة المجتمعية',
      'تطوير مهارات التفكير النقدي|تعزيز الهوية الوطنية|دمج التقنية في التعليم|دعم المواهب والإبداع',
      'https://instagram.com/alnoor.demo', 'https://twitter.com/alnoor.demo',
      'https://facebook.com/alnoor.demo', 'https://youtube.com/alnoor.demo', '96899000111',
      schoolId,
    ]
  )
}

async function count(table: string, schoolId: string): Promise<number> {
  const r = await query(`SELECT COUNT(*)::int AS c FROM ${table} WHERE school_id=$1`, [schoolId])
  return r.rows[0]?.c ?? 0
}

const PUBLISHED_TABLES = new Set([
  'news', 'gallery', 'achievements', 'public_videos', 'public_articles',
  'school_teams', 'hall_of_fame', 'public_faqs', 'ls_services', 'ls_specialists',
  'ls_articles', 'ls_gallery',
])

async function contentCount(table: string, schoolId: string): Promise<number> {
  if (PUBLISHED_TABLES.has(table)) {
    const r = await query(
      `SELECT COUNT(*)::int AS c FROM ${table} WHERE school_id=$1 AND is_published=true`,
      [schoolId]
    )
    return r.rows[0]?.c ?? 0
  }
  return count(table, schoolId)
}

/** نشر كل المحتوى العام غير المنشور (مسودات قديمة) */
export async function ensureAllPublicContentPublished(schoolId: string) {
  for (const table of PUBLISHED_TABLES) {
    await query(`UPDATE ${table} SET is_published=true WHERE school_id=$1 AND is_published=false`, [schoolId])
  }
  await query(
    `UPDATE public_faqs SET is_published=true WHERE school_id=$1 AND (is_published IS NULL OR is_published=false)`,
    [schoolId]
  )
}

/** أحداث تقويم مستقبلية للعرض التجريبي */
export async function seedDemoEvents(schoolId: string, adminId?: string) {
  const future = await query(
    `SELECT COUNT(*)::int AS c FROM events WHERE school_id=$1 AND is_public=true AND end_date >= NOW()`,
    [schoolId]
  )
  if ((future.rows[0]?.c ?? 0) >= 4) return

  const events: [string, string, number][] = [
    ['اجتماع أولياء الأمور — الفصل الثاني', 'إداري', 5],
    ['يوم المهنة المهني', 'فعالية', 12],
    ['امتحانات نهاية الفصل', 'اختبارات', 18],
    ['رحلة تعليمية — متحف مسقط', 'رحلة', 25],
    ['حفل التميز والتكريم السنوي', 'حفل', 32],
    ['بداية العطلة الربيعية', 'إجازة', 40],
  ]
  for (const [title, type, days] of events) {
    const start = new Date(Date.now() + days * 86400000)
    const end = new Date(start.getTime() + 86400000)
    await query(
      `INSERT INTO events (school_id,title,event_type,start_date,end_date,is_public,created_by)
       VALUES ($1,$2,$3,$4,$5,true,$6)`,
      [schoolId, title, type, start.toISOString(), end.toISOString(), adminId || null]
    )
  }
}

/** تمديد مواعيد الوظائف إذا انتهت كلها */
export async function ensureActiveJobPostings(schoolId: string) {
  const active = await query(
    `SELECT COUNT(*)::int AS c FROM job_postings WHERE school_id=$1 AND is_active=true AND deadline >= CURRENT_DATE`,
    [schoolId]
  )
  if ((active.rows[0]?.c ?? 0) >= 2) return

  await query(
    `UPDATE job_postings SET deadline = CURRENT_DATE + INTERVAL '90 days', is_active=true
     WHERE school_id=$1 AND (deadline < CURRENT_DATE OR is_active=false)`,
    [schoolId]
  )

  const total = await query(`SELECT COUNT(*)::int AS c FROM job_postings WHERE school_id=$1`, [schoolId])
  if ((total.rows[0]?.c ?? 0) >= 2) return

  const jobs: [string, string, string, string, string][] = [
    ['معلم رياضيات — ثانوي', 'أكاديمي', 'دوام كامل', 'بكالوريوس + خبرة 3 سنوات', 'تدريس الرياضيات للصفوف 10-12'],
    ['معلمة لغة إنجليزية', 'أكاديمي', 'دوام كامل', 'IELTS 7+ وخبرة تدريس', 'تدريس الإنجليزية للمراحل المختلفة'],
    ['مرشد طلابي', 'اجتماعي', 'دوام كامل', 'بكالوريوس نفس أو اجتماع', 'إرشاد طلابي ومتابعة سلوكية'],
  ]
  const deadline = new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0]
  for (const [title, dept, type, reqs, desc] of jobs) {
    await query(
      `INSERT INTO job_postings (school_id,title,department,job_type,deadline,requirements,description,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
      [schoolId, title, dept, type, deadline, reqs, desc]
    )
  }
}

/** ضمان امتلاء كل أقسام الموقع العام بمحتوى تجريبي */
export async function ensureDemoPresentationContent(schoolId: string, adminId?: string) {
  await seedDemoPublicContent(schoolId, adminId)
  await ensureAllPublicContentPublished(schoolId)
  await seedDemoEvents(schoolId, adminId)
  await ensureActiveJobPostings(schoolId)
}

export async function seedDemoPublicContent(schoolId: string, adminId?: string) {
  // News
  if ((await contentCount('news', schoolId)) < 3) {
    const items = [
      ['افتتاح العام الدراسي 2025/2026 في مسقط', 'استقبلت مدرسة النور العالمية طلابها في حفل افتتاح مميز بحضور أولياء الأمور.', 'أكاديمي', IMG.school],
      ['فوز فريق الروبوتيك بالمركز الأول على مستوى مسقط', 'حقق طلاب الصف الثامن المركز الأول في مسابقة الروبوتيك الوزارية.', 'إنجازات', IMG.lab],
      ['برنامج القراءة الصيفية — 50 كتاباً في شهر', 'أنجز 120 طالباً برنامج القراءة الصيفي بنسبة إتمام 95%.', 'أنشطة', IMG.library],
      ['يوم المهنة المهني — زيارة 12 جهة حكومية وخاصة', 'نظّمت المدرسة يوم مهنة لطلاب المرحلة الإعدادية بمشاركة خبراء من مسقط.', 'فعاليات', IMG.classroom],
      ['تخرج الدفعة العاشرة — 48 خريجاً بمعدل ممتاز', 'احتفلت المدرسة بتخريج دفعة جديدة من طلابها المتميزين.', 'تخرج', IMG.graduation],
      ['افتتاح مختبر العلوم الذكي', 'افتتح مختبر علوم مجهّز بأحدث التقنيات لخدمة طلاب المرحلة الثانوية.', 'مرافق', IMG.science],
    ]
    for (const [title, summary, category, img] of items) {
      await query(
        `INSERT INTO news (school_id,title,summary,image_url,category,is_published,is_featured,author_id)
         VALUES ($1,$2,$3,$4,$5,true,true,$6)`,
        [schoolId, title, summary, img, category, adminId || null]
      )
    }
  }

  // Gallery
  if ((await contentCount('gallery', schoolId)) < 5) {
    const items = [
      ['المبنى الرئيسي', 'واجهة المدرسة في حي القرم — مسقط', IMG.school, 'مباني'],
      ['فصول دراسية ذكية', 'فصول مجهّزة بشاشات تفاعلية', IMG.classroom, 'فصول'],
      ['مكتبة المدرسة', 'مكتبة شاملة بآلاف الكتب', IMG.library, 'مرافق'],
      ['مختبر العلوم', 'تجارب علمية عملية', IMG.lab, 'مختبرات'],
      ['الملعب الرياضي', 'ملعب متعدد الاستخدامات', IMG.sports, 'رياضة'],
      ['ورشة الفنون', 'أنشطة إبداعية للطلاب', IMG.art, 'أنشطة'],
      ['حفل التخرج', 'احتفال الدفعة العاشرة', IMG.graduation, 'فعاليات'],
      ['أنشطة صفية', 'تعلم تفاعلي ممتع', IMG.kids, 'تعليم'],
    ]
    for (const [title, desc, url, cat] of items) {
      await query(
        `INSERT INTO gallery (school_id,title,description,image_url,category,is_published) VALUES ($1,$2,$3,$4,$5,true)`,
        [schoolId, title, desc, url, cat]
      )
    }
  }

  // Achievements
  if ((await contentCount('achievements', schoolId)) < 3) {
    const items = [
      ['المركز الأول — مسابقة الرياضيات', 'فوز طلاب الصف السادس على مستوى مسقط', IMG.lab, 'أكاديمي', 'فريق الرياضيات', 'الصف السادس - أ'],
      ['جائزة الإبداع العلمي', 'مشروع طاقة شمسية من طلاب الصف التاسع', IMG.science, 'علوم', 'عمر بن خالد', 'الصف التاسع - ب'],
      ['بطولة كرة القدم المدرسية', 'فوز فريق النور بكأس المدارس الخاصة', IMG.sports, 'رياضة', 'فريق كرة القدم', 'المرحلة الإعدادية'],
      ['مسابقة القرآن الكريم', 'المركز الثاني على مستوى المحافظة', IMG.kids, 'ثقافي', 'محمد بن سعيد', 'الصف السابع - أ'],
    ]
    for (const [title, desc, img, cat, student, cls] of items) {
      await query(
        `INSERT INTO achievements (school_id,title,description,image_url,category,student_name,class_name,is_published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [schoolId, title, desc, img, cat, student, cls]
      )
    }
  }

  // Staff
  if ((await count('staff_public', schoolId)) < 3) {
    const items = [
      ['د. سالم بن راشد المعولي', 'مدير المدرسة', 'الإدارة', 'قائد تربوي بخبرة 20 عاماً في مسقط', IMG.principal, true],
      ['أ. فاطمة الزهراء البلوشية', 'نائبة المدير للشؤون الأكاديمية', 'الإدارة', 'خبيرة في تطوير المناهج والجودة', 'https://randomuser.me/api/portraits/women/65.jpg', true],
      ['أ. خالد بن ناصر الحارثي', 'معلم رياضيات', 'الرياضيات', 'معلم متميز — بيانات تجريبية', 'https://randomuser.me/api/portraits/men/32.jpg', true],
      ['أ. مريم بنت حمد السعدية', 'معلمة لغة عربية', 'اللغة العربية', 'متخصصة في الأدب والنحو', 'https://randomuser.me/api/portraits/women/44.jpg', false],
      ['أ. يوسف بن علي الكندي', 'معلم علوم', 'العلوم', 'مشرف مختبر العلوم الذكي', 'https://randomuser.me/api/portraits/men/67.jpg', false],
      ['أ. سارة بنت محمد الهنائية', 'معلمة إنجليزي', 'اللغة الإنجليزية', 'IELTS certified — بيانات تجريبية', 'https://randomuser.me/api/portraits/women/28.jpg', false],
    ]
    for (const [name, pos, dept, bio, photo, featured] of items) {
      await query(
        `INSERT INTO staff_public (school_id,name,position,department,bio,photo,is_featured) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [schoolId, name, pos, dept, bio, photo, featured]
      )
    }
  }

  // Alerts — تنبيه عاجل + إعلانات
  const urgentExists = await query(
    `SELECT id FROM public_alerts WHERE school_id=$1 AND is_active=true AND alert_type IN ('urgent','danger') LIMIT 1`,
    [schoolId]
  )
  if (!urgentExists.rows[0]) {
    await query(
      `INSERT INTO public_alerts (school_id,message,message_en,alert_type,is_active,sort_order) VALUES
       ($1,'📋 نتائج الفصل الدراسي متاحة الآن عبر بوابة أولياء الأمور — سجّل الدخول للاطلاع','📋 Semester results are now available via the parent portal — log in to view','urgent',true,0)`,
      [schoolId]
    )
  }
  const alertsC = await query(`SELECT COUNT(*)::int AS c FROM public_alerts WHERE school_id=$1 AND is_active=true`, [schoolId])
  if ((alertsC.rows[0]?.c ?? 0) < 2) {
    await query(
      `INSERT INTO public_alerts (school_id,message,alert_type,is_active,sort_order) VALUES
       ($1,'🎓 موقع تجريبي — جميع البيانات وهمية لأغراض العرض والتسويق على المدارس الخاصة','info',true,1),
       ($1,'التسجيل للعام الدراسي 2025/2026 مفتوح — تواصل معنا عبر صفحة القبول','success',true,2)`,
      [schoolId]
    )
  }

  // FAQs
  if ((await contentCount('public_faqs', schoolId)) < 3) {
    const faqs = [
      ['ما المناهج التي تدرّسها المدرسة؟', 'نقدّم المنهج العُماني المعتمد مع برامج دولية في اللغة الإنجليزية والعلوم والتقنية.'],
      ['ما مواعيد الدوام الرسمي؟', 'الأحد إلى الخميس من 7:00 صباحاً حتى 2:30 ظهراً.'],
      ['هل توفّرون نقل مدرسي في مسقط؟', 'نعم، لدينا أسطول حافلات يغطي أحياء القرم والخوير والموالح وغيرها.'],
      ['كيف أتابع أداء ابني؟', 'عبر بوابة أولياء الأمور الإلكترونية — تسجّل الدخول بحسابك المخصّص لمتابعة الدرجات والحضور والواجبات والرسوم.'],
      ['كيف أتواصل مع المعلم؟', 'عبر رسائل البوابة الإلكترونية أو الاتصال بقسم شؤون الطلاب خلال أوقات الدوام الرسمي.'],
    ]
    for (let i = 0; i < faqs.length; i++) {
      await query(
        `INSERT INTO public_faqs (school_id,question,answer,sort_order,is_published) VALUES ($1,$2,$3,$4,true)`,
        [schoolId, faqs[i][0], faqs[i][1], i]
      )
    }
  }

  // Videos
  if ((await contentCount('public_videos', schoolId)) < 2) {
    const vids = [
      ['جولة في مدرسة النور العالمية', 'https://www.youtube.com/embed/ScMzIvxBSi4', 'تعريفي', 'جولة مصورة في مرافق المدرسة بمسقط'],
      ['يوم مفتوح لأولياء الأمور', 'https://www.youtube.com/embed/LXb3EKWsInQ', 'فعاليات', 'لقطات من اليوم المفتوح'],
      ['إنجازات طلابنا', 'https://www.youtube.com/embed/iik25wqIuFo', 'إنجازات', 'أبرز إنجازات العام الدراسي'],
    ]
    for (let i = 0; i < vids.length; i++) {
      await query(
        `INSERT INTO public_videos (school_id,title,video_url,category,description,sort_order,is_published) VALUES ($1,$2,$3,$4,$5,$6,true)`,
        [schoolId, vids[i][0], vids[i][1], vids[i][2], vids[i][3], i]
      )
    }
  }

  // Articles
  if ((await contentCount('public_articles', schoolId)) < 3) {
    const arts = [
      ['student', 'ريم بنت سالم', 'الصف السابع - أ', 'اللغة العربية', 'حلمي أن أصبح طبيبة', 'أحلم بمساعدة الناس وإنقاذ الأرواح. مدرستي تمنحني الدعم والتشجيع دائماً.', 'إبداعات'],
      ['student', 'عبدالرحمن بن خالد', 'الصف التاسع - ب', 'العلوم', 'مشروع الطاقة المتجددة', 'صممت نموذجاً لبطارية شمسية صغيرة بإشراف معلم العلوم.', 'علوم'],
      ['teacher', 'أ. فاطمة البلوشية', null, 'الرياضيات', 'كيف نُحبّ الرياضيات؟', 'أستخدم الألعاب التعليمية والتطبيقات الرقمية لجعل الرياضيات ممتعة لطلابي.', 'تعليم'],
    ]
    for (const [type, author, grade, subject, title, content, cat] of arts) {
      await query(
        `INSERT INTO public_articles (school_id,article_type,author_name,grade,subject,title,content,category,is_published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
        [schoolId, type, author, grade, subject, title, content, cat]
      )
    }
  }

  // Teams
  if ((await contentCount('school_teams', schoolId)) < 2) {
    const teams = [
      ['فريق الروبوتيك', 'تقنية', 12, 'يبتكر حلولاً تقنية ويمثّل المدرسة في المسابقات', 'المركز الأول — مسقط 2025', IMG.lab, 'from-violet-500 to-purple-600'],
      ['فريق الكتابة الإبداعية', 'أدبي', 8, 'ينشر إبداعات طلابية في مجلة المدرسة', 'جائزة أفضل مجلة مدرسية', IMG.art, 'from-amber-500 to-orange-600'],
      ['فريق العلوم', 'علمي', 15, 'تجارب ومشاريع علمية تطبيقية', 'مشاركة وطنية في معرض العلوم', IMG.science, 'from-emerald-500 to-teal-600'],
    ]
    for (let i = 0; i < teams.length; i++) {
      const [name, cat, members, desc, ach, img, grad] = teams[i]
      await query(
        `INSERT INTO school_teams (school_id,name,category,members_count,description,achievements,image_url,color_gradient,sort_order,is_published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
        [schoolId, name, cat, members, desc, ach, img, grad, i]
      )
    }
  }

  // Hall of fame
  if ((await contentCount('hall_of_fame', schoolId)) < 3) {
    const hall = [
      ['نورة بنت أحمد الهنائية', 'الصف الثاني عشر', '2024', 'المركز الأول — الثانوية العامة', 'أكاديمي', 1, 'https://randomuser.me/api/portraits/women/21.jpg'],
      ['سعيد بن محمد الكندي', 'الصف الثاني عشر', '2023', 'بطولة الخطابة على مستوى السلطنة', 'ثقافي', 1, 'https://randomuser.me/api/portraits/men/22.jpg'],
      ['لمى بنت خالد البلوشية', 'الصف الحادي عشر', '2025', 'جائزة الإبداع في الروبوتيك', 'تقني', 2, 'https://randomuser.me/api/portraits/women/23.jpg'],
      ['ياسر بن علي المعولي', 'الصف الثاني عشر', '2022', 'منحة دراسية جامعية كاملة', 'أكاديمي', 1, 'https://randomuser.me/api/portraits/men/24.jpg'],
    ]
    for (let i = 0; i < hall.length; i++) {
      const [name, grade, year, ach, cat, rank, img] = hall[i]
      await query(
        `INSERT INTO hall_of_fame (school_id,name,grade,year,achievement,category,rank,image_url,sort_order,is_published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
        [schoolId, name, grade, year, ach, cat, rank, img, i]
      )
    }
  }

  // Alumni (approved)
  const alumniC = await query(`SELECT COUNT(*)::int AS c FROM alumni_registrations WHERE school_id=$1 AND status='approved'`, [schoolId])
  if ((alumniC.rows[0]?.c ?? 0) < 2) {
    const alumni = [
      ['عائشة بنت سالم الراشدية', 2018, 'مهندسة برمجيات — شركة عمانية', 'مسقط', 'aisha@demo.om', 'درست في النور من الروضة حتى الثانوية. المدرسة علّمتني الانضباط والطموح.', 'منحة جامعية كاملة'],
      ['حمد بن ناصر السعدي', 2016, 'طبيب — مستشفى خاص', 'مسقط', 'hamad@demo.om', 'ذكرياتي في المدرسة لا تُنسى. المعلمون كانوا داعمين لكل طموح.', 'تفوق في الثانوية العامة'],
      ['مريم بنت يوسف الكندية', 2020, 'مصممة جرافيك مستقلة', 'السيب', 'maryam@demo.om', 'بدأت شغفي بالفنون في ورش النور الإبداعية.', 'معرض فني وطني'],
    ]
    for (const [name, year, job, city, email, story, ach] of alumni) {
      await query(
        `INSERT INTO alumni_registrations (school_id,name,graduation_year,job_title,city,email,story,achievement,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'approved')`,
        [schoolId, name, year, job, city, email, story, ach]
      )
    }
  }

  // Learning support
  const lsC = await query(`SELECT 1 FROM learning_support_settings WHERE school_id=$1`, [schoolId])
  if (lsC.rows.length === 0) {
    await query(
      `INSERT INTO learning_support_settings (school_id,about_text) VALUES ($1,$2)`,
      [schoolId, 'وحدة دعم التعلم في مدرسة النور العالمية تقدّم برامج متخصصة لدعم الطلاب ذوي الاحتياجات التعليمية الخاصة، بالتعاون مع أولياء الأمور والمختصين.']
    )
  }
  if ((await contentCount('ls_services', schoolId)) < 2) {
    const svcs = [['دعم صعوبات التعلم', '📖', 'جلسات فردية وجماعية'], ['تعديل السلوك', '🎯', 'برامج إرشادية'], ['دمج ذوي الإعاقة', '🤝', 'خطط دمج فردية'], ['استشارات أسرية', '👨‍👩‍👧', 'جلسات مع أولياء الأمور']]
    for (let i = 0; i < svcs.length; i++) {
      await query(`INSERT INTO ls_services (school_id,title,icon,description,sort_order,is_published) VALUES ($1,$2,$3,$4,$5,true)`,
        [schoolId, svcs[i][0], svcs[i][1], svcs[i][2], i])
    }
  }
  if ((await contentCount('ls_specialists', schoolId)) < 2) {
    await query(`INSERT INTO ls_specialists (school_id,name,role,image_url,bio,sort_order,is_published) VALUES
      ($1,'د. هدى بنت سعيد','أخصائية نفسية تربوية','https://randomuser.me/api/portraits/women/55.jpg','خبرة 12 عاماً',0,true),
      ($1,'أ. عمر بن راشد','معلم دعم تعلم','https://randomuser.me/api/portraits/men/55.jpg','متخصص في صعوبات القراءة',1,true)`,
      [schoolId]
    )
  }
  if ((await contentCount('ls_articles', schoolId)) < 1) {
    await query(`INSERT INTO ls_articles (school_id,title,content,is_published) VALUES ($1,$2,$3,true)`,
      [schoolId, 'كيف تدعمون طفلكم في المنزل؟', 'نصائح عملية لأولياء الأمور للتعاون مع المدرسة في متابعة التعلم والسلوك الإيجابي.'])
  }
  if ((await contentCount('ls_gallery', schoolId)) < 2) {
    await query(`INSERT INTO ls_gallery (school_id,title,image_url,sort_order,is_published) VALUES
      ($1,'جلسة دعم فردية',$2,0,true),($1,'ورشة مهارات',$3,1,true)`,
      [schoolId, IMG.kids, IMG.classroom])
  }

  // Library books
  if ((await count('library_books', schoolId)) < 3) {
    const books = [
      ['موسوعة العلوم للناشئين', 'مجموعة مؤلفين', 'علوم', 5],
      ['قصص عمانية', 'سلطان بن سالم', 'أدب', 8],
      ['تعلم البرمجة', 'أحمد الكندي', 'تقنية', 3],
      ['تاريخ عُمان الحديث', 'د. محمد الهنائي', 'تاريخ', 4],
    ]
    for (const [title, author, cat, copies] of books) {
      await query(
        `INSERT INTO library_books (school_id,title,author,category,copies_total,copies_available,language,is_active)
         VALUES ($1,$2,$3,$4,$5,$5,'العربية',true)`,
        [schoolId, title, author, cat, copies]
      )
    }
  }

  // Exams
  if ((await count('exams', schoolId)) < 2) {
    const examDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    await query(
      `INSERT INTO exams (school_id,subject_name,class_name,exam_date,start_time,end_time,room,exam_type,term)
       VALUES ($1,'الرياضيات','الصف الخامس - أ',$2,'08:00','10:00','قاعة 12','written','الفصل الثاني'),
              ($1,'العلوم','الصف الخامس - أ',$2,'10:30','12:00','مختبر العلوم','written','الفصل الثاني')`,
      [schoolId, examDate]
    )
  }
}

/** ربط حسابات التجريب: معلم ↔ فصل/مواد/جدول، محاسب، موظف */
export async function wireDemoRoleLinks(schoolId: string) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12)

  // حساب المحاسب
  const accExists = await query(`SELECT id FROM users WHERE school_id=$1 AND username='accountant1'`, [schoolId])
  if (!accExists.rows[0]) {
    await query(
      `INSERT INTO users (school_id,username,password_hash,name,role,email,phone)
       VALUES ($1,'accountant1',$2,'سعيد بن راشد الكندي','accountant','finance@alnoor-school.om',$3)`,
      [schoolId, hash, DEMO_SCHOOL.phone]
    )
  }

  const teacher = (await query(`SELECT id, name FROM users WHERE school_id=$1 AND username='teacher1'`, [schoolId])).rows[0]
  const classRow = (await query(`SELECT id, name FROM classes WHERE school_id=$1 AND name LIKE '%الخامس%أ%' LIMIT 1`, [schoolId])).rows[0]
  if (!teacher || !classRow) return

  await query(`UPDATE classes SET teacher_id=$1 WHERE id=$2`, [teacher.id, classRow.id])

  const subjects = ['الرياضيات', 'العلوم']
  for (const sub of subjects) {
    const ex = await query(
      `SELECT id FROM subjects WHERE school_id=$1 AND name=$2 AND class_id=$3`,
      [schoolId, sub, classRow.id]
    )
    if (ex.rows[0]) {
      await query(`UPDATE subjects SET teacher_id=$1 WHERE id=$2`, [teacher.id, ex.rows[0].id])
    } else {
      await query(
        `INSERT INTO subjects (school_id,name,class_id,teacher_id) VALUES ($1,$2,$3,$4)`,
        [schoolId, sub, classRow.id, teacher.id]
      )
    }
  }

  const schedCount = await query(`SELECT COUNT(*) FROM schedule WHERE school_id=$1 AND teacher_id=$2`, [schoolId, teacher.id])
  if (parseInt(schedCount.rows[0].count) === 0) {
    const slots = [
      [0, '07:30', '08:15', 'الرياضيات', 'قاعة 12'],
      [2, '09:00', '09:45', 'الرياضيات', 'قاعة 12'],
      [4, '10:30', '11:15', 'العلوم', 'مختبر 1'],
    ] as const
    for (const [dow, start, end, sub, room] of slots) {
      await query(
        `INSERT INTO schedule (school_id,class_id,subject_name,teacher_id,teacher_name,day_of_week,start_time,end_time,room)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [schoolId, classRow.id, sub, teacher.id, teacher.name, dow, start, end, room]
      )
    }
  } else {
    await query(
      `UPDATE schedule SET teacher_id=$1, teacher_name=$2 WHERE school_id=$3 AND teacher_id IS NULL`,
      [teacher.id, teacher.name, schoolId]
    )
  }

  await query(
    `UPDATE employees SET user_id=$1 WHERE id = (
       SELECT id FROM employees WHERE school_id=$2 AND position ILIKE '%رياضيات%' AND user_id IS NULL LIMIT 1
     )`,
    [teacher.id, schoolId]
  )
}

const SALES_ALERT = '📋 نتائج الفصل الدراسي متاحة الآن عبر البوابة الإلكترونية لأولياء الأمور'

/** ضمان روابط السوشيال في إعدادات المدرسة */
export async function ensureDefaultSocialLinks(schoolId: string) {
  await query(
    `UPDATE school_settings SET
      instagram = COALESCE(NULLIF(TRIM(instagram), ''), $2),
      twitter   = COALESCE(NULLIF(TRIM(twitter), ''), $3),
      facebook  = COALESCE(NULLIF(TRIM(facebook), ''), $4),
      youtube   = COALESCE(NULLIF(TRIM(youtube), ''), $5),
      whatsapp  = COALESCE(NULLIF(TRIM(whatsapp), ''), $6)
     WHERE school_id = $1`,
    [
      schoolId,
      'https://instagram.com/alnoor.demo',
      'https://twitter.com/alnoor.demo',
      'https://facebook.com/alnoor.demo',
      'https://youtube.com/@alnoor.demo',
      '96899000111',
    ]
  )
}

/** ضمان ظهور شرائط «عاجل» والأخبار في الموقع العام */
export async function ensurePublicSiteStrips(schoolId: string, adminId?: string) {
  await ensureDefaultSocialLinks(schoolId)
  const urgent = await query(
    `SELECT id FROM public_alerts WHERE school_id=$1 AND is_active=true AND alert_type IN ('urgent','danger') LIMIT 1`,
    [schoolId]
  )
  if (!urgent.rows[0]) {
    await query(
      `INSERT INTO public_alerts (school_id,message,message_en,alert_type,is_active,sort_order) VALUES
       ($1,'📋 نتائج الفصل الدراسي متاحة الآن عبر بوابة أولياء الأمور','📋 Semester results are now available via the parent portal','urgent',true,0)`,
      [schoolId]
    )
  }

  const pubNews = await query(
    `SELECT COUNT(*)::int AS c FROM news WHERE school_id=$1 AND is_published=true`,
    [schoolId]
  )
  if ((pubNews.rows[0]?.c ?? 0) < 3) {
    await ensureDemoPresentationContent(schoolId, adminId)
    await query(
      `UPDATE news SET is_published=true, is_featured=true
       WHERE school_id=$1 AND is_published=false
         AND id IN (SELECT id FROM news WHERE school_id=$1 ORDER BY created_at DESC LIMIT 8)`,
      [schoolId]
    )
  }

  const activeAlerts = await query(
    `SELECT COUNT(*)::int AS c FROM public_alerts WHERE school_id=$1 AND is_active=true`,
    [schoolId]
  )
  if ((activeAlerts.rows[0]?.c ?? 0) < 1) {
    await query(
      `INSERT INTO public_alerts (school_id,message,alert_type,is_active,sort_order) VALUES
       ($1,'مرحباً بكم في الموقع الرسمي للمدرسة — آخر المستجدات تظهر هنا','info',true,0)`,
      [schoolId]
    )
  }
}

/** ضمان حسابات التجريب وكلمة المرور demo2026 (تطوير / DEMO_MODE) */
export async function ensureDemoCredentials(schoolId: string) {
  const { isDemoMode } = await import('../config/appMode')
  const syncPasswords =
    isDemoMode() ||
    process.env.NODE_ENV === 'development' ||
    process.env.SYNC_DEMO_PASSWORDS === 'true'
  if (!syncPasswords) return

  const hash = await bcrypt.hash(DEMO_PASSWORD, 12)
  const demoUsers: [string, string, string][] = [
    ['admin', 'مدير تجريبي', 'admin'],
    ['teacher1', 'معلم تجريبي — فاطمة', 'teacher'],
    ['parent1', 'ولي أمر تجريبي — أحمد', 'parent'],
    ['accountant1', 'سعيد بن راشد الكندي', 'accountant'],
  ]

  for (const [username, name, role] of demoUsers) {
    const ex = await query(
      `SELECT id FROM users WHERE school_id=$1 AND username=$2`,
      [schoolId, username]
    )
    if (!ex.rows[0]) {
      await query(
        `INSERT INTO users (school_id,username,password_hash,name,role,is_active)
         VALUES ($1,$2,$3,$4,$5,true)`,
        [schoolId, username, hash, name, role]
      )
    }
  }

  await query(
    `UPDATE users SET password_hash=$1, is_active=true
     WHERE school_id=$2 AND username IN ('admin','teacher1','teacher2','parent1','accountant1')`,
    [hash, schoolId]
  )
}

/** ربط تشغيلي — يضمن امتلاء الموقع العام */
export async function ensureSchoolOperational(schoolId: string) {
  await wireDemoRoleLinks(schoolId)
  const adminRow = await query(`SELECT id FROM users WHERE school_id=$1 AND role='admin' LIMIT 1`, [schoolId])
  const adminId = adminRow.rows[0]?.id
  await ensureDemoCredentials(schoolId)
  await ensureDemoPresentationContent(schoolId, adminId)
  await ensurePublicSiteStrips(schoolId, adminId)
}

export async function syncDemoBranding(schoolId: string, adminId?: string) {
  const { isDemoMode } = await import('../config/appMode')
  if (!isDemoMode()) {
    await ensureSchoolOperational(schoolId)
    return
  }
  await applySchoolBranding(schoolId)
  await query(
    `UPDATE public_alerts SET message=$1, alert_type='info', is_active=true
     WHERE school_id=$2 AND alert_type='info'
       AND id = (SELECT id FROM public_alerts WHERE school_id=$2 AND alert_type='info' ORDER BY sort_order LIMIT 1)`,
    ['🎓 موقع تجريبي — مدرسة النور العالمية · مسقط · لأغراض التطوير والاختبار الداخلي', schoolId]
  )
  await ensureDemoPresentationContent(schoolId, adminId)
  await ensurePublicSiteStrips(schoolId, adminId)
  await ensureDemoCredentials(schoolId)
  await query(`UPDATE users SET name='مدير تجريبي' WHERE school_id=$1 AND username='admin'`, [schoolId])
  await query(`UPDATE users SET name='معلم تجريبي — فاطمة' WHERE school_id=$1 AND username='teacher1'`, [schoolId])
  await query(`UPDATE users SET name='ولي أمر تجريبي — أحمد' WHERE school_id=$1 AND username='parent1'`, [schoolId])
  await wireDemoRoleLinks(schoolId)
  const { seedBilingualContent } = await import('./bilingual')
  await seedBilingualContent(schoolId)
}

/** تطبيق محتوى العرض التسويقي — يُستدعى من db:seed فقط */
export async function applySalesPresentation(schoolId: string, adminId?: string) {
  await applySchoolBranding(schoolId)
  await query(
    `UPDATE public_alerts SET message=$1, alert_type='success', is_active=true
     WHERE school_id=$2 AND alert_type='success'
       AND id = (SELECT id FROM public_alerts WHERE school_id=$2 AND alert_type='success' ORDER BY sort_order LIMIT 1)`,
    [SALES_ALERT, schoolId]
  )
  await ensureDemoPresentationContent(schoolId, adminId)
  await ensurePublicSiteStrips(schoolId, adminId)
  await query(`UPDATE users SET name='عبدالله بن سعيد البلوشي' WHERE school_id=$1 AND username='admin'`, [schoolId])
  await query(`UPDATE users SET name='فاطمة بنت محمد الحارثية' WHERE school_id=$1 AND username='teacher1'`, [schoolId])
  await query(`UPDATE users SET name='أحمد بن خالد المعمري' WHERE school_id=$1 AND username='parent1'`, [schoolId])
  await query(`UPDATE users SET name='سعيد بن راشد الكندي' WHERE school_id=$1 AND username='accountant1'`, [schoolId])
  await wireDemoRoleLinks(schoolId)
  const { seedBilingualContent } = await import('./bilingual')
  await seedBilingualContent(schoolId)
}
