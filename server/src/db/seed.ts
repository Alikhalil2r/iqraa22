import { query } from './index'
import bcrypt from 'bcryptjs'

export async function seedDatabase() {
  try {
    // Check if already seeded
    const existing = await query('SELECT id FROM schools LIMIT 1')
    if (existing.rows.length > 0) {
      console.log('✅ Database already seeded')
      return
    }

    console.log('🌱 Seeding database...')

    // Create school
    const schoolResult = await query(`
      INSERT INTO schools (name, name_en, tagline, address, phone, email, website)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      ['مدرسة اقرأ الخاصة', 'Iqraa Private School', 'نحو مستقبل أفضل - Excellence in Education',
       'ولاية صور، محافظة جنوب الشرقية، سلطنة عُمان', '+968 25 500 000',
       'info@iqraa-school.edu.om', 'https://iqraa-school.edu.om']
    )
    const schoolId = schoolResult.rows[0].id

    // School settings with theme
    await query(`
      INSERT INTO school_settings (school_id, primary_color, primary_dark, primary_light, accent_color, accent_dark,
        about_text, vision, mission, principal_name, principal_message, show_parent_portal, show_jobs)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [schoolId, '#065f46', '#064e3b', '#10b981', '#fbbf24', '#f59e0b',
       'مدرسة اقرأ الخاصة مؤسسة تعليمية رائدة تأسست لخدمة المجتمع وتنمية قدرات الطلاب وتطوير مهاراتهم في بيئة تعليمية متكاملة تجمع بين الأصالة والمعاصرة.',
       'أن نكون مدرسة رائدة في تقديم تعليم متميز يُعد الطالب لمواجهة تحديات المستقبل.',
       'تقديم تجربة تعليمية شاملة ومتكاملة تنمي الشخصية وتصقل المواهب.',
       'الأستاذ محمد بن سالم الحارثي',
       'يسعدني أن أرحب بكم في مدرستنا المتميزة، ونحن نسعى جاهدين لتقديم أفضل تجربة تعليمية لأبنائنا الطلاب.',
       true, true]
    )

    // Admin user
    const adminHash = await bcrypt.hash('admin2026', 12)
    const adminResult = await query(`
      INSERT INTO users (school_id, username, password_hash, name, role, email, phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [schoolId, 'admin', adminHash, 'المدير العام', 'admin', 'admin@iqraa-school.edu.om', '+968 25 500 001']
    )
    const adminId = adminResult.rows[0].id

    // Teacher user
    const teacherHash = await bcrypt.hash('teacher123', 12)
    await query(`INSERT INTO users (school_id,username,password_hash,name,role,email) VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, 'teacher1', teacherHash, 'أ. فاطمة الزهراء', 'teacher', 'fatima@iqraa-school.edu.om'])

    // Parent user
    const parentHash = await bcrypt.hash('parent123', 12)
    const parentResult = await query(`
      INSERT INTO users (school_id,username,password_hash,name,role,email,phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [schoolId, 'parent1', parentHash, 'أحمد بن سالم الرئيسي', 'parent', 'ahmed@gmail.com', '+968 91 234 567']
    )
    const parentId = parentResult.rows[0].id

    // Class
    const classResult = await query(`
      INSERT INTO classes (school_id,name,level,section,academic_year,capacity)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [schoolId, 'الصف الخامس - أ', 'الصف الخامس', 'أ', '2024-2025', 30]
    )
    const classId = classResult.rows[0].id

    await query(`INSERT INTO classes (school_id,name,level,section,academic_year) VALUES ($1,$2,$3,$4,$5)`,
      [schoolId, 'الصف الخامس - ب', 'الصف الخامس', 'ب', '2024-2025'])
    await query(`INSERT INTO classes (school_id,name,level,section,academic_year) VALUES ($1,$2,$3,$4,$5)`,
      [schoolId, 'الصف السادس - أ', 'الصف السادس', 'أ', '2024-2025'])

    // Bus
    const busResult = await query(`
      INSERT INTO buses (school_id,bus_number,plate_number,driver_name,driver_phone,supervisor_name,capacity,route_name,morning_time,afternoon_time,is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [schoolId, '001', 'أ ط م 123', 'سعيد بن خميس', '+968 95 111 222', 'مريم بنت عبدالله', 45, 'خط صور الشمالي', '07:00', '13:30', true]
    )
    const busId = busResult.rows[0].id
    await query(`INSERT INTO buses (school_id,bus_number,plate_number,driver_name,driver_phone,capacity,route_name,morning_time,afternoon_time,is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [schoolId, '002', 'أ ط م 456', 'محمد بن علي', '+968 95 333 444', 40, 'خط صور الجنوبي', '07:15', '13:45', true])

    // Students
    const studentsData = [
      ['عبدالله بن أحمد الرئيسي', 'M', '2014-05-15', classId, '2024-001', 'أحمد بن سالم الرئيسي', '+968 91 234 567', busId, parentId],
      ['سارة بنت محمد الحارثي', 'F', '2014-08-22', classId, '2024-002', 'محمد بن سالم الحارثي', '+968 92 345 678', busId, null],
      ['يوسف بن خالد المعمري', 'M', '2015-01-10', classId, '2024-003', 'خالد بن يوسف المعمري', '+968 93 456 789', null, null],
      ['نور بنت علي البلوشي', 'F', '2014-11-30', classId, '2024-004', 'علي بن عبدالله البلوشي', '+968 94 567 890', null, null],
    ]
    for (const [name, gender, dob, cid, snum, pname, pphone, bid, pid] of studentsData) {
      await query(`
        INSERT INTO students (school_id,student_number,name,gender,date_of_birth,class_id,class_name,
          academic_year,parent_name,parent_phone,bus_id,parent_id,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [schoolId, snum, name, gender, dob, cid, 'الصف الخامس - أ', '2024-2025', pname, pphone, bid, pid, 'active']
      )
    }

    // Employees
    const empsData = [
      ['فاطمة الزهراء المحرزية', 'F', 'معلمة رياضيات', 'الرياضيات', 800, '2020-09-01'],
      ['خالد بن راشد الشيدي', 'M', 'معلم علوم', 'العلوم', 750, '2019-09-01'],
      ['أمينة بنت سالم الحجري', 'F', 'معلمة عربي', 'اللغة العربية', 780, '2021-09-01'],
      ['ناصر بن عبدالله الكثيري', 'M', 'مشرف نشاط', 'النشاط المدرسي', 650, '2022-01-15'],
      ['مريم بنت حمد الغافري', 'F', 'موظفة إدارية', 'الإدارة', 600, '2018-09-01'],
      ['سعيد بن خميس الهنائي', 'M', 'سائق حافلة', 'النقل المدرسي', 400, '2020-09-01'],
    ]
    for (const [name, gender, pos, dept, salary, join] of empsData) {
      await query(`
        INSERT INTO employees (school_id,name,gender,position,department,salary,salary_currency,join_date,status,employee_type)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [schoolId, name, gender, pos, dept, salary, 'OMR', join, 'active', 'full-time']
      )
    }

    // Grades
    const studentsQ = await query('SELECT id FROM students WHERE school_id=$1', [schoolId])
    const subjects = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية']
    for (const student of studentsQ.rows) {
      for (const subject of subjects) {
        const score = Math.floor(Math.random() * 40) + 55
        const pct = score
        await query(`
          INSERT INTO grades (school_id,student_id,subject_name,class_name,academic_year,term,score,max_score,percentage,grade_letter,status,recorded_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [schoolId, student.id, subject, 'الصف الخامس - أ', '2024-2025', 'الفصل الأول',
           score, 100, pct, pct>=90?'A':pct>=80?'B':pct>=70?'C':pct>=60?'D':'F',
           pct>=50?'pass':'fail', adminId]
        )
      }
    }

    // Attendance for last 7 days
    const allPersons = [
      ...studentsQ.rows.map((r: any) => ({id: r.id, type: 'student'})),
    ]
    const empQ = await query('SELECT id FROM employees WHERE school_id=$1', [schoolId])
    for (const e of empQ.rows) allPersons.push({id: e.id, type: 'employee'})

    for (let d = 6; d >= 0; d--) {
      const date = new Date(Date.now() - d * 86400000)
      const dateStr = date.toISOString().split('T')[0]
      const dow = date.getDay()
      if (dow === 5 || dow === 6) continue // Skip Fri/Sat
      for (const person of allPersons) {
        const status = Math.random() > 0.1 ? 'present' : Math.random() > 0.5 ? 'absent' : 'late'
        await query(`
          INSERT INTO attendance (school_id,person_type,person_id,date,status,recorded_by)
          VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
          [schoolId, person.type, person.id, dateStr, status, adminId]
        )
      }
    }

    // News
    const newsItems = [
      ['افتتاح العام الدراسي الجديد 2024/2025', 'تحتفل مدرسة اقرأ الخاصة بافتتاح العام الدراسي الجديد في أجواء مفعمة بالحماس والتفاؤل.', 'أكاديمي', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800'],
      ['فوز طلابنا في مسابقة الرياضيات', 'حقق طلاب مدرستنا المركز الأول على مستوى المحافظة في مسابقة الرياضيات للمرحلة الابتدائية.', 'إنجازات', 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800'],
      ['رحلة علمية إلى متحف الطبيعة', 'نظمت المدرسة رحلة تعليمية ممتعة لطلاب الصف الخامس إلى متحف الطبيعة في مسقط.', 'فعاليات', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    ]
    for (const [title, summary, category, img] of newsItems) {
      await query(`INSERT INTO news (school_id,title,summary,image_url,category,is_published,is_featured,author_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [schoolId, title, summary, img, category, true, true, adminId])
    }

    // Events
    const eventsData = [
      ['اجتماع أولياء الأمور', 'الفصل الدراسي الأول', new Date(Date.now() + 7*86400000)],
      ['يوم المهنة', 'نشاط مدرسي', new Date(Date.now() + 14*86400000)],
      ['امتحانات منتصف الفصل', 'أكاديمي', new Date(Date.now() + 21*86400000)],
    ]
    for (const [title, type, date] of eventsData) {
      await query(`INSERT INTO events (school_id,title,event_type,start_date,end_date,is_public,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [schoolId, title, type, date, date, true, adminId])
    }

    // Staff public
    const staffItems = [
      ['د. محمد بن سالم الحارثي', 'مدير المدرسة', 'الإدارة', 'https://randomuser.me/api/portraits/men/32.jpg', true],
      ['أ. فاطمة الزهراء', 'معلمة رياضيات', 'الرياضيات', 'https://randomuser.me/api/portraits/women/44.jpg', true],
      ['أ. خالد الشيدي', 'معلم علوم', 'العلوم', 'https://randomuser.me/api/portraits/men/67.jpg', false],
    ]
    for (const [name, pos, dept, photo, featured] of staffItems) {
      await query(`INSERT INTO staff_public (school_id,name,position,department,photo,is_featured) VALUES ($1,$2,$3,$4,$5,$6)`,
        [schoolId, name, pos, dept, photo, featured])
    }

    // Message from parent to admin
    await query(`INSERT INTO messages (school_id,from_user_id,to_user_id,subject,body,priority)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, parentId, adminId, 'استفسار عن مواعيد الامتحانات',
       'السلام عليكم ورحمة الله، أود الاستفسار عن مواعيد امتحانات الفصل الأول وهل سيكون هناك جدول زمني محدد؟', 'normal']
    )

    console.log('✅ Database seeded successfully!')
    console.log('📝 Admin credentials: admin / admin2026')
    console.log('📝 Parent credentials: parent1 / parent123')
    console.log('📝 Teacher credentials: teacher1 / teacher123')
  } catch (err) {
    console.error('❌ Seed error:', err)
  }
}
