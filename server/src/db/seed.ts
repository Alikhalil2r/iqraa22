import { query } from './index'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { isDemoMode } from '../config/appMode'
import { DEMO_SCHOOL, DEMO_PASSWORD, syncDemoBranding, applySalesPresentation, seedDemoPublicContent, wireDemoRoleLinks } from './demoData'

export async function seedDatabase() {
  try {
    const existing = await query('SELECT id FROM schools LIMIT 1')
    if (existing.rows.length > 0) {
      const schoolId = existing.rows[0].id
      const adminRow = await query(`SELECT id FROM users WHERE school_id=$1 AND username='admin' LIMIT 1`, [schoolId])
      if (isDemoMode()) {
        await syncDemoBranding(schoolId, adminRow.rows[0]?.id)
        console.log('✅ Demo branding synced (DEMO_MODE=true)')
        console.log(`📝 Credentials: admin / ${DEMO_PASSWORD}`)
      } else {
        await applySalesPresentation(schoolId, adminRow.rows[0]?.id)
        console.log('✅ Sales presentation content applied — run with DEMO_MODE=true for dev reset')
      }
      return
    }

    console.log('🌱 Seeding demo database — مدرسة النور العالمية...')

    const schoolResult = await query(`
      INSERT INTO schools (name, name_en, tagline, address, phone, email, website)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [DEMO_SCHOOL.name, DEMO_SCHOOL.nameEn, DEMO_SCHOOL.tagline, DEMO_SCHOOL.address,
       DEMO_SCHOOL.phone, DEMO_SCHOOL.email, DEMO_SCHOOL.website]
    )
    const schoolId = schoolResult.rows[0].id

    await query(`
      INSERT INTO school_settings (school_id, primary_color, primary_dark, primary_light, accent_color, accent_dark,
        about_text, vision, mission, principal_name, principal_message, show_parent_portal, show_jobs,
        city, region, founded_year, students_count, teachers_count, classrooms_count, years_experience, office_hours)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [schoolId, '#065f46', '#064e3b', '#10b981', '#fbbf24', '#f59e0b',
       'مدرسة النور العالمية مؤسسة تعليمية خاصة في مسقط تقدّم مناهج عُمانية ودولية متكاملة، مع التركيز على التميز الأكاديمي وبناء الشخصية.',
       'أن نكون منارة تعليمية رائدة في مسقط.',
       'تعليم شامل يجمع القيم الوطنية والمعايير الدولية.',
       'د. سالم بن راشد المعولي',
       'مرحباً بكم في مدرسة النور العالمية — نبني مستقبل أبنائنا بالعلم والقيم.',
       true, true,
       DEMO_SCHOOL.city, DEMO_SCHOOL.region, DEMO_SCHOOL.foundedYear,
       '850+', '65+', '42', '14+', 'الأحد – الخميس | 7:00 ص – 2:30 م']
    )

    const hash = await bcrypt.hash(DEMO_PASSWORD, 12)

    const adminResult = await query(`
      INSERT INTO users (school_id, username, password_hash, name, role, email, phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [schoolId, 'admin', hash, 'عبدالله بن سعيد البلوشي', 'admin', 'admin@alnoor-school.om', DEMO_SCHOOL.phone]
    )
    const adminId = adminResult.rows[0].id

    await query(`INSERT INTO users (school_id,username,password_hash,name,role,email) VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, 'teacher1', hash, 'فاطمة بنت محمد الحارثية', 'teacher', 'teacher@alnoor-school.om'])
    await query(`INSERT INTO users (school_id,username,password_hash,name,role,email) VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, 'teacher2', hash, 'خالد بن سعيد الراشدي', 'teacher', 'khalid@alnoor-school.om'])
    await query(`INSERT INTO users (school_id,username,password_hash,name,role,email,phone) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [schoolId, 'accountant1', hash, 'سعيد بن راشد الكندي', 'accountant', 'finance@alnoor-school.om', DEMO_SCHOOL.phone])

    const parentResult = await query(`
      INSERT INTO users (school_id,username,password_hash,name,role,email,phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [schoolId, 'parent1', hash, 'أحمد بن خالد المعمري', 'parent', 'parent@alnoor-school.om', '+968 91 000 001']
    )
    const parentId = parentResult.rows[0].id

    const classResult = await query(`
      INSERT INTO classes (school_id,name,level,section,academic_year,capacity) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [schoolId, 'الصف الخامس - أ', 'الصف الخامس', 'أ', '2025-2026', 30]
    )
    const classId = classResult.rows[0].id
    await query(`INSERT INTO classes (school_id,name,level,section,academic_year) VALUES ($1,$2,$3,$4,$5)`,
      [schoolId, 'الصف الخامس - ب', 'الصف الخامس', 'ب', '2025-2026'])
    await query(`INSERT INTO classes (school_id,name,level,section,academic_year) VALUES ($1,$2,$3,$4,$5)`,
      [schoolId, 'الصف السادس - أ', 'الصف السادس', 'أ', '2025-2026'])
    await query(`INSERT INTO classes (school_id,name,level,section,academic_year) VALUES ($1,$2,$3,$4,$5)`,
      [schoolId, 'الصف السابع - أ', 'الصف السابع', 'أ', '2025-2026'])

    const busResult = await query(`
      INSERT INTO buses (school_id,bus_number,plate_number,driver_name,driver_phone,supervisor_name,capacity,route_name,morning_time,afternoon_time,is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [schoolId, '101', 'أ ط م 901', 'سعيد بن خميس', '+968 95 111 222', 'مريم بنت عبدالله', 45, 'خط القرم — مسقط', '07:00', '13:30', true]
    )
    const busId = busResult.rows[0].id
    await query(`INSERT INTO buses (school_id,bus_number,plate_number,driver_name,driver_phone,capacity,route_name,morning_time,afternoon_time,is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [schoolId, '102', 'أ ط م 902', 'محمد بن علي', '+968 95 333 444', 40, 'خط الخوير — مسقط', '07:15', '13:45', true])

    const studentsData = [
      ['عبدالله بن أحمد المعولي', 'M', '2014-05-15', classId, 'DEMO-001', 'ولي أمر تجريبي — أحمد', '+968 91 000 001', busId, parentId],
      ['سارة بنت محمد البلوشية', 'F', '2014-08-22', classId, 'DEMO-002', 'محمد بن سالم البلوشي', '+968 92 000 002', busId, null],
      ['يوسف بن خالد الكندي', 'M', '2015-01-10', classId, 'DEMO-003', 'خالد بن يوسف الكندي', '+968 93 000 003', null, null],
      ['نور بنت علي الهنائية', 'F', '2014-11-30', classId, 'DEMO-004', 'علي بن عبدالله الهنائي', '+968 94 000 004', null, null],
      ['ريم بنت سالم الراشدية', 'F', '2013-06-20', classId, 'DEMO-005', 'سالم بن راشد الراشدي', '+968 95 000 005', busId, null],
      ['عمر بن ناصر السعدي', 'M', '2014-03-08', classId, 'DEMO-006', 'ناصر بن حمد السعدي', '+968 96 000 006', null, null],
    ]
    for (const [name, gender, dob, cid, snum, pname, pphone, bid, pid] of studentsData) {
      await query(`
        INSERT INTO students (school_id,student_number,name,gender,date_of_birth,class_id,class_name,
          academic_year,parent_name,parent_phone,bus_id,parent_id,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [schoolId, snum, name, gender, dob, cid, 'الصف الخامس - أ', '2025-2026', pname, pphone, bid, pid, 'active']
      )
    }

    const empsData = [
      ['فاطمة الزهراء البلوشية', 'F', 'معلمة رياضيات', 'الرياضيات', 850, '2020-09-01'],
      ['خالد بن راشد الحارثي', 'M', 'معلم علوم', 'العلوم', 800, '2019-09-01'],
      ['أمينة بنت سالم السعدية', 'F', 'معلمة عربي', 'اللغة العربية', 780, '2021-09-01'],
      ['ناصر بن عبدالله الكندي', 'M', 'مشرف نشاط', 'النشاط المدرسي', 650, '2022-01-15'],
      ['مريم بنت حمد الغافري', 'F', 'موظفة إدارية', 'الإدارة', 600, '2018-09-01'],
      ['سعيد بن خميس الهنائي', 'M', 'سائق حافلة', 'النقل المدرسي', 400, '2020-09-01'],
      ['يوسف بن علي المعولي', 'M', 'معلم إنجليزي', 'اللغة الإنجليزية', 790, '2019-09-01'],
      ['هند بنت محمد الراشدية', 'F', 'معلمة حاسوب', 'التقنية', 770, '2021-09-01'],
    ]
    for (const [name, gender, pos, dept, salary, join] of empsData) {
      await query(`
        INSERT INTO employees (school_id,name,gender,position,department,salary,salary_currency,join_date,status,employee_type)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [schoolId, name, gender, pos, dept, salary, 'OMR', join, 'active', 'full-time']
      )
    }

    const studentsQ = await query('SELECT id FROM students WHERE school_id=$1', [schoolId])
    const subjects = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'التربية الإسلامية']
    for (const student of studentsQ.rows) {
      for (const subject of subjects) {
        const score = Math.floor(Math.random() * 35) + 60
        await query(`
          INSERT INTO grades (school_id,student_id,subject_name,class_name,academic_year,term,score,max_score,percentage,grade_letter,status,recorded_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [schoolId, student.id, subject, 'الصف الخامس - أ', '2025-2026', 'الفصل الأول',
           score, 100, score, score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
           score >= 50 ? 'pass' : 'fail', adminId]
        )
      }
    }

    for (let d = 6; d >= 0; d--) {
      const date = new Date(Date.now() - d * 86400000)
      const dateStr = date.toISOString().split('T')[0]
      if (date.getDay() === 5 || date.getDay() === 6) continue
      for (const student of studentsQ.rows) {
        const status = Math.random() > 0.12 ? 'present' : Math.random() > 0.5 ? 'absent' : 'late'
        await query(`INSERT INTO attendance (school_id,person_type,person_id,date,status,recorded_by) VALUES ($1,'student',$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
          [schoolId, student.id, dateStr, status, adminId])
      }
    }

    const eventsData = [
      ['اجتماع أولياء الأمور — الفصل الثاني', 'اجتماع', new Date(Date.now() + 7 * 86400000)],
      ['يوم المهنة المهني', 'نشاط', new Date(Date.now() + 14 * 86400000)],
      ['امتحانات نهاية الفصل', 'أكاديمي', new Date(Date.now() + 21 * 86400000)],
      ['رحلة تعليمية — متحف مسقط', 'رحلة', new Date(Date.now() + 28 * 86400000)],
    ]
    for (const [title, type, date] of eventsData) {
      await query(`INSERT INTO events (school_id,title,event_type,start_date,end_date,is_public,created_by) VALUES ($1,$2,$3,$4,$5,true,$6)`,
        [schoolId, title, type, date, date, adminId])
    }

    const jobsData = [
      ['معلم رياضيات — ثانوي', 'أكاديمي', 'دوام كامل', '2026-09-30', 'بكالوريوس + خبرة 3 سنوات', 'تدريس الرياضيات — بيانات تجريبية'],
      ['معلمة لغة إنجليزية', 'أكاديمي', 'دوام كامل', '2026-08-15', 'IELTS 7+ وخبرة تدريس', 'تدريس الإنجليزية للمراحل المختلفة'],
      ['مرشد طلابي', 'اجتماعي', 'دوام كامل', '2026-07-01', 'بكالوريوس نفس أو اجتماع', 'إرشاد طلابي في مسقط'],
    ]
    for (const [title, dept, type, deadline, reqs, desc] of jobsData) {
      await query(`INSERT INTO job_postings (school_id,title,department,job_type,deadline,requirements,description,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [schoolId, title, dept, type, deadline, reqs, desc])
    }

    await query(`INSERT INTO messages (school_id,from_user_id,to_user_id,subject,body,priority) VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, parentId, adminId, 'استفسار تجريبي — مواعيد الامتحانات',
       'السلام عليكم، هذا استفسار تجريبي من ولي أمر لعرض نظام الرسائل.', 'normal'])

    const linkedStudent = (await query(`SELECT id FROM students WHERE parent_id=$1 LIMIT 1`, [parentId])).rows[0]
    const teacherUser = (await query(`SELECT id FROM users WHERE school_id=$1 AND username='teacher1' LIMIT 1`, [schoolId])).rows[0]
    if (linkedStudent && teacherUser) {
      const due = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      const hw = await query(
        `INSERT INTO homework (school_id,class_name,subject_name,title,description,due_date,max_score,created_by)
         VALUES ($1,'الصف الخامس - أ','الرياضيات','واجب تجريبي — الوحدة 4','حل التمارين 1-8', $2, 10, $3) RETURNING id`,
        [schoolId, due, teacherUser.id]
      )
      await query(`INSERT INTO homework_submissions (homework_id,student_id,status,score,submission_date) VALUES ($1,$2,'graded',9,CURRENT_DATE)`,
        [hw.rows[0].id, linkedStudent.id])
      await query(
        `INSERT INTO fees (school_id,student_id,fee_type,description,amount,paid_amount,due_date,status,academic_year)
         VALUES ($1,$2,'رسوم دراسية','رسوم الفصل الأول — تجريبي',400,400,CURRENT_DATE,'paid','2025-2026'),
                ($1,$2,'رسوم نشاط','رسوم الأنشطة — تجريبي',60,0,CURRENT_DATE + 30,'unpaid','2025-2026')`,
        [schoolId, linkedStudent.id]
      )
      await query(
        `INSERT INTO conduct_records (school_id,student_id,record_type,title,description,points,parent_notified,reported_by)
         VALUES ($1,$2,'reward','تفوق تجريبي','مشاركة متميزة في الفصل',10,true,$3)`,
        [schoolId, linkedStudent.id, teacherUser.id]
      )
      await query(
        `INSERT INTO notifications (school_id,user_id,title,body,type,link) VALUES
         ($1,$2,'واجب جديد','واجب رياضيات — بيانات تجريبية','homework','/parent/homework'),
         ($1,$2,'رسوم مستحقة','رسوم الأنشطة 60 ر.ع — تجريبي','fee','/parent/fees')`,
        [schoolId, parentId]
      )
      await query(
        `INSERT INTO student_buses (student_id,bus_id,pickup_location,pickup_time,dropoff_location,dropoff_time)
         VALUES ($1,$2,'حي القرم — مسقط','07:10','مدرسة النور العالمية','13:35') ON CONFLICT DO NOTHING`,
        [linkedStudent.id, busId]
      )
    }

    await syncDemoBranding(schoolId, adminId)
    await wireDemoRoleLinks(schoolId)

    const { ensureSuperAdminFromEnv } = await import('./superAdmin')
    await ensureSuperAdminFromEnv()

    console.log('✅ Demo database seeded — مدرسة النور العالمية')
    console.log(`📝 Admin: admin / ${DEMO_PASSWORD}`)
    console.log(`📝 Parent: parent1 / ${DEMO_PASSWORD}`)
    console.log(`📝 Teacher: teacher1 / ${DEMO_PASSWORD}`)
    console.log(`📝 Accountant: accountant1 / ${DEMO_PASSWORD}`)
  } catch (err) {
    console.error('❌ Seed error:', err)
  }
}

// تشغيل مباشر: npm run db:seed
dotenv.config()
const isCli = process.argv[1]?.replace(/\\/g, '/').includes('seed.ts')
if (isCli) {
  import('./index').then(({ initDB }) =>
    initDB().then(seedDatabase).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
  )
}

