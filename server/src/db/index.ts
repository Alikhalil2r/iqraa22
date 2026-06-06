import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createLogger } from '../utils/logger'

dotenv.config()

const log = createLogger('DB')

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false
     : process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  log.error('Unexpected pool error', { error: err.message })
})

export async function query(text: string, params?: unknown[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const dur = Date.now() - start
    if (dur > 1000) log.warn('Slow query detected', { dur, sql: text.slice(0, 80) })
    return res
  } catch (err) {
    log.error('DB Query Error', { error: (err as Error).message, sql: text.slice(0, 80) })
    throw err
  }
}

async function seedPublicContentIfEmpty() {
  const school = await pool.query('SELECT id FROM schools LIMIT 1')
  const schoolId = school.rows[0]?.id
  if (!schoolId) return

  await pool.query(`
    UPDATE school_settings SET
      founded_year=COALESCE(founded_year,'2015'),
      whatsapp=COALESCE(whatsapp,'96825000000'),
      instagram=COALESCE(instagram,'https://instagram.com/alnoor.demo'),
      facebook=COALESCE(facebook,'https://facebook.com/alnoor.demo'),
      youtube=COALESCE(youtube,'https://youtube.com/@alnoor.demo'),
      students_count=COALESCE(students_count,'500'),
      teachers_count=COALESCE(teachers_count,'40'),
      classrooms_count=COALESCE(classrooms_count,'25'),
      years_experience=COALESCE(years_experience,'10'),
      office_hours=COALESCE(office_hours,'الأحد – الخميس | 7:00 ص – 2:30 م')
    WHERE school_id=$1`, [schoolId])

  const alerts = await pool.query('SELECT id FROM public_alerts WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!alerts.rows.length) {
    await pool.query(
      `INSERT INTO public_alerts (school_id, message, alert_type, is_active, sort_order) VALUES
       ($1,$2,'urgent',true,0),
       ($1,$3,'success',true,1)`,
      [schoolId,
       '📋 نتائج الفصل الدراسي متاحة الآن عبر البوابة الإلكترونية لأولياء الأمور',
       '📋 نتائج الفصل الدراسي متاحة الآن عبر البوابة الإلكترونية']
    )
  }

  const faqs = await pool.query('SELECT id FROM public_faqs WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!faqs.rows.length) {
    const items = [
      ['كيف يمكنني التواصل مع إدارة المدرسة؟', 'يمكنك التواصل عبر الهاتف أو البريد الإلكتروني خلال أوقات الدوام، أو إرسال رسالة عبر نموذج التواصل.'],
      ['ما هي أوقات دوام المدرسة؟', 'تعمل المدرسة من الأحد إلى الخميس من الساعة 7:00 صباحاً حتى 2:30 مساءً.'],
      ['كيف أتابع تقدم ابني الدراسي؟', 'يمكنك متابعة الدرجات والحضور عبر بوابة الأولياء الإلكترونية.'],
      ['ما طريقة التسجيل للعام الدراسي القادم؟', 'التسجيل متاح عبر صفحة القبول والتسجيل أو بزيارة مبنى الإدارة.'],
      ['هل تقدم المدرسة خدمة الحافلات المدرسية؟', 'نعم، نوفر خدمة نقل مدرسية. تواصل مع الإدارة للاستفسار عن المسارات.'],
    ]
    for (let i = 0; i < items.length; i++) {
      await pool.query(
        `INSERT INTO public_faqs (school_id, question, answer, sort_order) VALUES ($1,$2,$3,$4)`,
        [schoolId, items[i][0], items[i][1], i]
      )
    }
  }

  const gallery = await pool.query('SELECT id FROM gallery WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!gallery.rows.length) {
    const imgs = [
      ['حفل افتتاح العام الدراسي', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', 'فعاليات'],
      ['مختبر العلوم', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', 'أكاديمي'],
      ['المبنى الرئيسي', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80', 'مرافق'],
    ]
    for (const [title, url, cat] of imgs) {
      await pool.query(
        `INSERT INTO gallery (school_id, title, image_url, category, is_published) VALUES ($1,$2,$3,$4,true)`,
        [schoolId, title, url, cat]
      )
    }
  }

  const achievements = await pool.query('SELECT id FROM achievements WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!achievements.rows.length) {
    await pool.query(
      `INSERT INTO achievements (school_id, title, description, category, image_url, is_published) VALUES
       ($1,'المركز الأول في مسابقة العلوم','فوز فريق الطلاب بالمركز الأول على مستوى المحافظة','علوم',
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', true)`,
      [schoolId]
    )
  }

  const pubNews = await pool.query(
    `SELECT COUNT(*)::int AS c FROM news WHERE school_id=$1 AND is_published=true`, [schoolId]
  )
  if ((pubNews.rows[0]?.c ?? 0) < 2) {
    const newsItems = [
      ['انطلاق الفصل الدراسي الثاني بزخم أكاديمي', 'استقبلت المدرسة الفصل الدراسي الثاني بروح عالية وحماس كبير.', 'إداري', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80'],
      ['فوز فريق العلوم بالمركز الأول', 'حقق طلاب المدرسة المركز الأول في مسابقة العلوم والتقنية.', 'إنجازات', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80'],
      ['يوم المفتوح السنوي لأولياء الأمور', 'استقبلت المدرسة أولياء الأمور في يومها المفتوح السنوي.', 'فعاليات', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80'],
    ]
    for (const [title, summary, category, img] of newsItems) {
      await pool.query(
        `INSERT INTO news (school_id,title,summary,image_url,category,is_published,is_featured) VALUES ($1,$2,$3,$4,$5,true,true)`,
        [schoolId, title, summary, img, category]
      )
    }
  }

  const staff = await pool.query('SELECT id FROM staff_public WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!staff.rows.length) {
    const staffItems = [
      ['د. سالم بن راشد المعولي', 'مدير المدرسة', 'الإدارة', 'https://randomuser.me/api/portraits/men/75.jpg'],
      ['أ. فاطمة الزهراء البلوشية', 'نائبة المدير', 'الإدارة', 'https://randomuser.me/api/portraits/women/65.jpg'],
      ['أ. خالد بن ناصر الحارثي', 'معلم رياضيات', 'الرياضيات', 'https://randomuser.me/api/portraits/men/32.jpg'],
    ]
    for (const [name, pos, dept, photo] of staffItems) {
      await pool.query(
        `INSERT INTO staff_public (school_id,name,position,department,photo,is_featured) VALUES ($1,$2,$3,$4,$5,true)`,
        [schoolId, name, pos, dept, photo]
      )
    }
  }
}

async function seedExtendedContentIfEmpty() {
  const school = await pool.query('SELECT id FROM schools LIMIT 1')
  const schoolId = school.rows[0]?.id
  if (!schoolId) return

  const videos = await pool.query('SELECT id FROM public_videos WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!videos.rows.length) {
    const items = [
      ['فعاليات اليوم المفتوح 2025', 'https://www.youtube.com/watch?v=ScMzIvxBSi4', 'فعاليات', 'جولة شاملة في فعاليات يوم التعريف الخاص بالمدرسة', 0],
      ['مسابقة الروبوت التعليمية', 'https://www.youtube.com/watch?v=LXb3EKWsInQ', 'مسابقات', 'تغطية مشاركة فريق الروبوت في المسابقة الوطنية', 1],
      ['حفل تكريم المتفوقين', 'https://www.youtube.com/watch?v=iik25wqIuFo', 'حفلات', 'حفل تكريم الطلاب المتميزين أكاديمياً للعام الدراسي', 2],
      ['بطولة كرة القدم الداخلية', 'https://www.youtube.com/watch?v=BQ0mxQXmLsk', 'رياضة', 'أبرز لحظات بطولة كرة القدم بين فصول المدرسة', 3],
      ['المعرض العلمي السنوي', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'علمي', 'مشاريع الطلاب في المعرض العلمي السنوي 2025', 4],
      ['رحلة وادي شاب', 'https://www.youtube.com/watch?v=ZbZSe6N_BXs', 'رحلات', 'الرحلة الميدانية لطلاب الصف الثامن إلى وادي شاب', 5],
      ['عرض المسرحية السنوية', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', 'فنون', 'المسرحية السنوية لفريق التمثيل المدرسي', 6],
      ['كلمة مدير المدرسة', 'https://www.youtube.com/watch?v=iik25wqIuFo', 'رسمي', 'كلمة مدير المدرسة في بداية العام الدراسي الجديد', 7],
      ['تغطية يوم القراءة', 'https://www.youtube.com/watch?v=6g4dkBF5anU', 'فعاليات', 'تغطية أنشطة وفعاليات يوم القراءة العُماني', 8],
    ]
    for (const [title, url, cat, desc, order] of items) {
      await pool.query(
        `INSERT INTO public_videos (school_id,title,video_url,category,description,sort_order,is_published) VALUES ($1,$2,$3,$4,$5,$6,true)`,
        [schoolId, title, url, cat, desc, order]
      )
    }
  }

  const articles = await pool.query('SELECT id FROM public_articles WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!articles.rows.length) {
    const studentItems = [
      ['نورة المعمري', 'الصف العاشر', null, 'كيف يمكن للذكاء الاصطناعي أن يحدث ثورة في التعليم؟', 'في عالم يتسارع فيه التطور التقني بشكل مذهل، بات الذكاء الاصطناعي حاضراً في كل مناحي حياتنا...', 'تقنية', '2025-01-10'],
      ['سالم الكندي', 'الصف الحادي عشر', null, 'الحفاظ على اللغة العربية في عصر العولمة', 'اللغة هي هوية الإنسان وجسر التواصل بين الثقافات...', 'أدب', '2025-01-18'],
      ['مريم الراشدي', 'الصف التاسع', null, 'التوازن بين الدراسة والترفيه في حياة المراهق', 'يجد كثير من الطلاب أنفسهم أمام معادلة صعبة...', 'حياة', '2025-02-05'],
      ['خالد الحبسي', 'الصف الثاني عشر', null, 'قراءة في كتاب: طريق الخيار', 'كتاب استثنائي يستحق القراءة المتأنية والتأمل العميق...', 'مراجعات', '2025-02-12'],
    ]
    for (let i = 0; i < studentItems.length; i++) {
      const [author, grade, , title, content, category, date] = studentItems[i]
      await pool.query(
        `INSERT INTO public_articles (school_id,article_type,author_name,grade,title,content,category,publish_date,sort_order,is_published) VALUES ($1,'student',$2,$3,$4,$5,$6,$7,$8,true)`,
        [schoolId, author, grade, title, content, category, date, i]
      )
    }
    const teacherItems = [
      ['أ. سالم الحبسي', 'رياضيات', 'استراتيجيات التفكير الناقد في حل المسائل الرياضية', 'التفكير الناقد ليس مجرد مهارة، بل هو أسلوب حياة...', '2025-01-15'],
      ['أ. مريم الراشدي', 'علوم', 'التجارب العملية: جسر بين النظرية والتطبيق', 'كثيراً ما يتساءل الطلاب: أين نستخدم هذا في الحياة؟...', '2025-02-08'],
    ]
    for (let i = 0; i < teacherItems.length; i++) {
      const [author, subject, title, content, date] = teacherItems[i]
      await pool.query(
        `INSERT INTO public_articles (school_id,article_type,author_name,subject,title,content,publish_date,sort_order,is_published) VALUES ($1,'teacher',$2,$3,$4,$5,$6,$7,true)`,
        [schoolId, author, subject, title, content, date, i]
      )
    }
  }

  const teams = await pool.query('SELECT id FROM school_teams WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!teams.rows.length) {
    const teamItems = [
      ['فريق الروبوت', 'تقنية', 12, 'يمثل المدرسة في مسابقات الروبوت الوطنية والدولية', 'بطل عُمان 2024 | المركز الثالث خليجياً', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80', 'from-sky-500 to-sky-600', 0],
      ['فريق كرة القدم', 'رياضة', 18, 'الفريق الرئيسي للمدرسة في المسابقات الرياضية المحلية', 'المركز الثاني على مستوى المحافظة 2024', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80', 'from-emerald-500 to-emerald-600', 1],
      ['نادي القراءة', 'أدبي', 25, 'يهتم بتعزيز ثقافة القراءة وتبادل المراجعات الأدبية', 'نشر 50+ مراجعة كتاب هذا الفصل', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80', 'from-amber-500 to-amber-600', 2],
      ['فريق المسرح', 'فنون', 20, 'يقدم عروضاً مسرحية تربوية في المناسبات المدرسية', 'أفضل فريق مسرحي على مستوى المنطقة', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80', 'from-purple-500 to-purple-600', 3],
      ['مجلس الطلاب', 'قيادة', 15, 'يمثل صوت الطلاب ويدير الفعاليات المدرسية', 'نظّم 20 فعالية ناجحة هذا العام', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80', 'from-rose-500 to-rose-600', 4],
      ['فريق الرياضيات', 'أكاديمي', 10, 'يستعد للمشاركة في أولمبياد الرياضيات الوطني', 'المركز الأول في الأولمبياد المحلي 2024', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80', 'from-teal-500 to-teal-600', 5],
    ]
    for (const [name, cat, members, desc, ach, img, color, order] of teamItems) {
      await pool.query(
        `INSERT INTO school_teams (school_id,name,category,members_count,description,achievements,image_url,color_gradient,sort_order,is_published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
        [schoolId, name, cat, members, desc, ach, img, color, order]
      )
    }
  }

  const hall = await pool.query('SELECT id FROM hall_of_fame WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!hall.rows.length) {
    const hallItems = [
      ['محمد بن سالم العلوي', 'الثاني عشر', '2024', 'أعلى المعدلات على مستوى المحافظة', 'أكاديمي', 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80', 'حقق معدل 99.8% في الثانوية العامة', 0],
      ['فاطمة بنت خالد الحارثي', 'الثاني عشر', '2024', 'المركز الأول في أولمبياد الرياضيات', 'أكاديمي', 2, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80', 'تمثل المدرسة على المستوى الوطني', 1],
      ['سلطان بن عيسى المعمري', 'العاشر', '2024', 'بطل المملكة في كرة القدم', 'رياضي', 3, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80', 'قائد الفريق الوطني تحت 16 سنة', 2],
      ['مريم بنت سعيد البوسعيدي', 'الحادي عشر', '2024', 'فائزة بجائزة الأمير للإبداع العلمي', 'علمي', 1, 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=300&q=80', 'اختراعها في تحلية المياه بالطاقة الشمسية', 3],
      ['عبدالله بن ناصر الكندي', 'الثاني عشر', '2023', 'مؤسس نادي البرمجة المدرسي', 'ريادي', 1, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80', 'دربّ 50 طالباً على البرمجة المتقدمة', 4],
      ['نورة بنت حمد الشامسي', 'الثاني عشر', '2023', 'حافظة القرآن الكريم والمتفوقة', 'ديني', 1, 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=300&q=80', 'ختمت القرآن حفظاً وحازت أعلى درجات', 5],
    ]
    for (const [name, grade, year, ach, cat, rank, img, desc, order] of hallItems) {
      await pool.query(
        `INSERT INTO hall_of_fame (school_id,name,grade,year,achievement,category,rank,image_url,description,sort_order,is_published) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)`,
        [schoolId, name, grade, year, ach, cat, rank, img, desc, order]
      )
    }
  }

  const ls = await pool.query('SELECT school_id FROM learning_support_settings WHERE school_id=$1', [schoolId])
  if (!ls.rows.length) {
    await pool.query(
      `INSERT INTO learning_support_settings (school_id, about_text) VALUES ($1,$2)`,
      [schoolId, 'وحدة دعم التعلم تعمل على توفير الدعم الأكاديمي والنفسي والاجتماعي لجميع الطلاب، مع الاهتمام بذوي صعوبات التعلم وضمان دمجهم في البيئة التعليمية بشكل إيجابي.']
    )
    const services = [
      ['صعوبات التعلم', '📖', 'برامج متخصصة لتشخيص وعلاج صعوبات القراءة والكتابة والحساب', 0],
      ['الدعم النفسي', '💙', 'جلسات إرشادية فردية وجماعية لدعم الصحة النفسية للطلاب', 1],
      ['دعم الموهوبين', '⭐', 'برامج إثرائية للطلاب ذوي القدرات والمواهب الاستثنائية', 2],
      ['التواصل الاجتماعي', '🤝', 'تنمية مهارات التواصل والتفاعل الاجتماعي الإيجابي', 3],
    ]
    for (const [title, icon, desc, order] of services) {
      await pool.query(`INSERT INTO ls_services (school_id,title,icon,description,sort_order,is_published) VALUES ($1,$2,$3,$4,$5,true)`, [schoolId, title, icon, desc, order])
    }
    const specialists = [
      ['أ. فاطمة الكلبانية', 'أخصائية صعوبات التعلم', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80', 'ماجستير في التربية الخاصة، خبرة 10 سنوات', 0],
      ['أ. سعيد المقبالي', 'مرشد نفسي', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80', 'دكتوراه في علم النفس التربوي', 1],
      ['أ. منى البراشدية', 'أخصائية التخاطب', 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=300&q=80', 'بكالوريوس أمراض النطق والتخاطب', 2],
    ]
    for (const [name, role, img, bio, order] of specialists) {
      await pool.query(`INSERT INTO ls_specialists (school_id,name,role,image_url,bio,sort_order,is_published) VALUES ($1,$2,$3,$4,$5,$6,true)`, [schoolId, name, role, img, bio, order])
    }
    const lsArticles = [
      ['كيف تساعد طفلك على التغلب على صعوبات القراءة؟', 'صعوبات القراءة أو ما يُعرف بـ"الديسلكسيا" تؤثر على كثير من الأطفال...', '2025-01-20', 0],
      ['الذكاء العاطفي: المهارة التي يحتاجها كل طالب', 'تُعدّ مهارات الذكاء العاطفي من أهم ما يجب تنميته لدى الطلاب...', '2025-02-10', 1],
      ['دور الأسرة في دعم التعلم الإيجابي', 'الأسرة هي الشريك الأول للمدرسة في رحلة تعلم الطفل...', '2025-02-20', 2],
    ]
    for (const [title, content, date, order] of lsArticles) {
      await pool.query(`INSERT INTO ls_articles (school_id,title,content,publish_date,sort_order,is_published) VALUES ($1,$2,$3,$4,$5,true)`, [schoolId, title, content, date, order])
    }
    const gallery = [
      ['جلسة دعم التعلم', 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80', 0],
      ['نشاط تفاعلي للطلاب', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80', 1],
      ['ورشة مهارات التعلم', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80', 2],
      ['فعالية الوعي بصعوبات التعلم', 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80', 3],
      ['لقاء مع أولياء الأمور', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', 4],
      ['مكتبة دعم التعلم', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80', 5],
    ]
    for (const [title, img, order] of gallery) {
      await pool.query(`INSERT INTO ls_gallery (school_id,title,image_url,sort_order,is_published) VALUES ($1,$2,$3,$4,true)`, [schoolId, title, img, order])
    }
    log.info('Extended public content seeded')
  }
}

async function seedParentPortalIfEmpty() {
  // Link a second student to demo parent for multi-child switcher
  const parentUser = await pool.query(`SELECT id, school_id FROM users WHERE role='parent' LIMIT 1`)
  if (parentUser.rows[0]) {
    const { id: pid, school_id: sid } = parentUser.rows[0]
    const linked = await pool.query('SELECT COUNT(*)::int as c FROM students WHERE parent_id=$1', [pid])
    if (linked.rows[0].c < 2) {
      const unlinked = await pool.query(
        `SELECT id FROM students WHERE school_id=$1 AND (parent_id IS NULL OR parent_id != $2) AND status='active' LIMIT 1`,
        [sid, pid]
      )
      if (unlinked.rows[0]) {
        await pool.query('UPDATE students SET parent_id=$1 WHERE id=$2', [pid, unlinked.rows[0].id])
        log.info('Linked second student to parent for multi-child demo')
      }
    }
  }

  const parent = await pool.query(`SELECT u.id as parent_id, u.school_id, s.id as student_id, s.class_name, s.bus_id
    FROM users u JOIN students s ON s.parent_id = u.id WHERE u.role = 'parent' LIMIT 1`)
  const row = parent.rows[0]
  if (!row) return

  const { parent_id: parentId, school_id: schoolId, student_id: studentId, class_name: className, bus_id: busId } = row
  const teacher = await pool.query(`SELECT id FROM users WHERE school_id=$1 AND role='teacher' LIMIT 1`, [schoolId])
  const teacherId = teacher.rows[0]?.id

  const hw = await pool.query('SELECT id FROM homework WHERE school_id=$1 LIMIT 1', [schoolId])
  if (!hw.rows.length && teacherId) {
    const due1 = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
    const due2 = new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0]
    const items = [
      [className || 'الصف الخامس - أ', 'الرياضيات', 'حل تمارين الفصل 5', 'حل التمارين من ص 45 إلى 52', due1, 10],
      [className || 'الصف الخامس - أ', 'العلوم', 'تقرير عن النظام الشمسي', 'إعداد تقرير مكتوب مع رسومات', due2, 15],
      [className || 'الصف الخامس - أ', 'اللغة العربية', 'قراءة قصة وتحليلها', 'قراءة القصة وكتابة ملخص', due1, 10],
    ]
    for (const [cls, subj, title, desc, due, max] of items) {
      const r = await pool.query(
        `INSERT INTO homework (school_id,class_name,subject_name,title,description,due_date,max_score,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [schoolId, cls, subj, title, desc, due, max, teacherId]
      )
    }
    const parentStudents = await pool.query('SELECT id, class_name FROM students WHERE parent_id=$1', [parentId])
    const allHw = await pool.query('SELECT id, class_name FROM homework WHERE school_id=$1', [schoolId])
    for (const st of parentStudents.rows) {
      for (const h of allHw.rows) {
        if (h.class_name === st.class_name) {
          await pool.query(
            `INSERT INTO homework_submissions (homework_id,student_id,status) VALUES ($1,$2,'pending') ON CONFLICT DO NOTHING`,
            [h.id, st.id]
          )
        }
      }
    }
    // Mark one as graded
    const graded = await pool.query(`SELECT hs.id FROM homework_submissions hs JOIN homework h ON h.id=hs.homework_id WHERE hs.student_id=$1 LIMIT 1`, [studentId])
    if (graded.rows[0]) {
      await pool.query(`UPDATE homework_submissions SET status='graded', score=9, submission_date=CURRENT_DATE, feedback='عمل ممتاز!' WHERE id=$1`, [graded.rows[0].id])
    }
    log.info('Parent portal homework seeded')
  }

  const fees = await pool.query('SELECT id FROM fees WHERE student_id=$1 LIMIT 1', [studentId])
  if (!fees.rows.length) {
    await pool.query(
      `INSERT INTO fees (school_id,student_id,fee_type,description,amount,paid_amount,due_date,status,academic_year,term)
       VALUES ($1,$2,'رسوم دراسية','رسوم الفصل الدراسي الأول',350,350,CURRENT_DATE,'paid','2024-2025','الفصل الأول')`,
      [schoolId, studentId]
    )
    await pool.query(
      `INSERT INTO fees (school_id,student_id,fee_type,description,amount,paid_amount,due_date,status,academic_year,term)
       VALUES ($1,$2,'رسوم نشاط','رسوم الأنشطة اللاصفية',50,0,CURRENT_DATE + 30,'unpaid','2024-2025','الفصل الثاني')`,
      [schoolId, studentId]
    )
    log.info('Parent portal fees seeded')
  }

  const conduct = await pool.query('SELECT id FROM conduct_records WHERE student_id=$1 LIMIT 1', [studentId])
  if (!conduct.rows.length && teacherId) {
    await pool.query(
      `INSERT INTO conduct_records (school_id,student_id,record_type,category,title,description,points,parent_notified,reported_by)
       VALUES ($1,$2,'reward','أكاديمي','تفوق في مسابقة القراءة','شارك بنشاط وحصل على المركز الأول',10,true,$3)`,
      [schoolId, studentId, teacherId]
    )
    await pool.query(
      `INSERT INTO conduct_records (school_id,student_id,record_type,category,title,description,severity,points,parent_notified,reported_by)
       VALUES ($1,$2,'warning','سلوكي','تأخر عن الحصة الأولى','تأخر 10 دقائق دون عذر','low',-2,true,$3)`,
      [schoolId, studentId, teacherId]
    )
    log.info('Parent portal conduct seeded')
  }

  const notif = await pool.query('SELECT id FROM notifications WHERE user_id=$1 LIMIT 1', [parentId])
  if (!notif.rows.length) {
    await pool.query(
      `INSERT INTO notifications (school_id,user_id,title,body,type,link) VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, parentId, 'واجب جديد في الرياضيات', 'تم إضافة واجب منزلي جديد — يرجى المتابعة', 'homework', '/parent/homework']
    )
    await pool.query(
      `INSERT INTO notifications (school_id,user_id,title,body,type,link) VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, parentId, 'رسوم نشاط مستحقة', 'رسوم الأنشطة اللاصفية للفصل الثاني — 50 ر.ع', 'fee', '/parent/fees']
    )
    log.info('Parent portal notifications seeded')
  }

  if (busId) {
    const sb = await pool.query('SELECT student_id FROM student_buses WHERE student_id=$1', [studentId])
    if (!sb.rows.length) {
      await pool.query(
        `INSERT INTO student_buses (student_id,bus_id,pickup_location,pickup_time,dropoff_location,dropoff_time)
         VALUES ($1,$2,'شارع السوق — صور','07:10','أمام المدرسة','13:35') ON CONFLICT DO NOTHING`,
        [studentId, busId]
      )
    }
  }
}

async function seedDefaultJobsIfEmpty() {
  const existing = await pool.query('SELECT id FROM job_postings LIMIT 1')
  if (existing.rows.length > 0) return
  const school = await pool.query('SELECT id FROM schools LIMIT 1')
  const schoolId = school.rows[0]?.id
  if (!schoolId) return

  const jobs = [
    ['معلم رياضيات - مرحلة ثانوية', 'أكاديمي', 'دوام كامل', '2026-03-31', 'بكالوريوس رياضيات + دبلوم تربوي، خبرة 3 سنوات على الأقل', 'تدريس مادة الرياضيات للصفوف 10-12'],
    ['معلمة علوم - مرحلة إعدادية', 'أكاديمي', 'دوام كامل', '2026-04-15', 'بكالوريوس علوم، خبرة 2 سنة فأكثر', 'تدريس العلوم للصفوف 7-9'],
    ['مرشد طلابي اجتماعي', 'اجتماعي', 'دوام كامل', '2026-03-25', 'بكالوريوس علم النفس أو الخدمة الاجتماعية', 'متابعة شؤون الطلاب الاجتماعية'],
    ['منسق أنشطة لاصفية', 'النشاط', 'دوام جزئي', '2026-04-01', 'خبرة في تنظيم الفعاليات', 'تخطيط وتنفيذ الأنشطة اللاصفية'],
  ]
  for (const [title, dept, type, deadline, reqs, desc] of jobs) {
    await pool.query(
      `INSERT INTO job_postings (school_id, title, department, job_type, deadline, requirements, description, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
      [schoolId, title, dept, type, deadline, reqs, desc]
    )
  }
  log.info('Default job postings seeded')
}

export async function initDB() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    await pool.query(schema)
    const { ensureBilingualColumns } = await import('./bilingual')
    await ensureBilingualColumns()
    await seedDefaultJobsIfEmpty()
    await seedPublicContentIfEmpty()
    await seedExtendedContentIfEmpty()
    await seedParentPortalIfEmpty()
    const schoolRow = await pool.query('SELECT id FROM schools LIMIT 1')
    if (schoolRow.rows[0]?.id) {
      const { isDemoMode } = await import('../config/appMode')
      const { syncDemoBranding, ensureSchoolOperational } = await import('./demoData')
      const { seedBilingualContent } = await import('./bilingual')
      const schoolId = schoolRow.rows[0].id
      if (isDemoMode()) {
        const adminRow = await pool.query(`SELECT id FROM users WHERE school_id=$1 AND username='admin' LIMIT 1`, [schoolId])
        await syncDemoBranding(schoolId, adminRow.rows[0]?.id)
      } else {
        await ensureSchoolOperational(schoolId)
      }
      await seedBilingualContent(schoolId)
      const { ensurePublicSiteStrips } = await import('./demoData')
      await ensurePublicSiteStrips(schoolId)
    }
    log.info('Database schema initialized')
  } catch (err) {
    log.error('DB init error', { error: (err as Error).message })
    throw err
  }
}

export default pool
