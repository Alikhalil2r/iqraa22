# نظام إدارة المدرسة — School Management SaaS

## نظرة عامة
منصة SaaS احترافية متكاملة لإدارة المدارس، قابلة للبيع لعدة مدارس (multi-tenant).

## المكدس التقني
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS v3 + React Query v5
- **Backend**: Express.js + TypeScript + pg (PostgreSQL) + compression (gzip)
- **Database**: PostgreSQL (Replit managed)
- **Auth**: JWT (jsonwebtoken)
- **Validation**: zod (client-side schema validation)
- **Language**: Arabic RTL first, خطوط Cairo & Tajawal

## هيكل المشروع
```
client/         — Vite React app (port 5000)
server/         — Express.js API (port 3001)
node_modules/   — Shared packages
```

## بيانات الدخول التجريبية
| الدور | المستخدم | كلمة المرور |
|-------|----------|-------------|
| مدير | admin | admin2026 |
| ولي أمر | parent1 | parent123 |
| معلم | teacher1 | teacher123 |

## المسارات (Routes)
| المسار | الوصف |
|--------|-------|
| `/` | الصفحة الرئيسية (Ken Burns hero slider، إحصائيات، أخبار، فيديوهات، شهادات) |
| `/about` | عن المدرسة (رؤية، رسالة، طاقم إداري وتدريسي، معرض مرافق) |
| `/news` | الأخبار والأحداث (بحث + تصنيف) |
| `/contact` | تواصل معنا (وسائل التواصل الاجتماعي + نموذج) |
| `/hall-of-fame` | جدار الشرف (منصة المراكز الأولى + تصفية) |
| `/alumni` | خريجونا فخرنا (قصص النجاح + نموذج تسجيل) |
| `/achievements` | المشاركات والإنجازات (تصنيف + إحصائيات) |
| `/gallery` | معرض الصور (masonry + lightbox) |
| `/articles` | إبداعات الطلاب والفرق (3 تبويبات: مقالات طلاب، معلمين، فرق مدرسية) |
| `/learning-support` | وحدة دعم التعلم (4 تبويبات: نبذة، مختصون، مقالات، معرض) |
| `/calendar` | التقويم الدراسي (تقويم شهري + قائمة أحداث مع عدّ تنازلي) |
| `/videos` | المكتبة المرئية (YouTube embedded player) |
| `/jobs` | التوظيف (وظائف شاغرة + نموذج تقديم كامل + CAPTCHA رياضي) |
| `/login` | دخول المشرفين والمعلمين |
| `/parent-login` | دخول أولياء الأمور |
| `/admin` | لوحة التحكم الرئيسية (محمية — admin + teacher) |
| `/admin/teacher` | لوحة المعلم — RingGauge + أداء المواد + جدول اليوم |
| `/admin/id-cards` | بطاقات هوية الطلاب — طباعة فردية وجماعية مع QR |
| `/parent` | بوابة أولياء الأمور (محمية) |

## API Endpoints
```
POST /api/auth/login              — تسجيل الدخول
GET  /api/dashboard/stats         — إحصائيات الداشبورد
GET  /api/dashboard/activity      — آخر الأنشطة
GET  /api/students                — قائمة الطلاب
GET  /api/employees               — قائمة الموظفين
GET  /api/attendance              — سجل الحضور
GET  /api/attendance/stats        — إحصائيات الحضور
GET  /api/grades                  — النتائج
GET  /api/grades/subjects         — قائمة المواد
GET  /api/grades/report/:id       — تقرير طالب
GET  /api/buses                   — الحافلات
GET  /api/messages                — الرسائل
GET  /api/messages/unread-count   — عدد الرسائل غير المقروءة
GET  /api/news                    — الأخبار
GET  /api/events                  — الفعاليات
GET  /api/fees                    — الرسوم المالية
GET  /api/fees/stats              — إحصائيات الرسوم (مستقل)
GET  /api/schedule                — الجداول الدراسية
GET  /api/settings                — إعدادات المدرسة
GET  /api/settings/theme          — ثيم المدرسة
GET  /api/reports/*               — التقارير
GET  /api/teacher/dashboard       — داشبورد المعلم
GET  /api/teacher/my-classes      — فصولي (جدول)
GET  /api/teacher/subject-performance — أداء المواد
GET  /api/parent/*                — بوابة أولياء الأمور
GET  /api/public/*                — endpoints عامة (بدون auth)
GET  /api/library/books           — كتالوج المكتبة (بحث + فلترة)
POST /api/library/books           — إضافة كتاب
PUT  /api/library/books/:id       — تعديل كتاب
DELETE /api/library/books/:id     — حذف كتاب
GET  /api/library/borrows         — قائمة الإعارات
POST /api/library/borrows         — إعارة كتاب (يُنقص copies_available)
PUT  /api/library/borrows/:id/return — إرجاع كتاب (يزيد copies_available + غرامة)
GET  /api/leaves/types            — أنواع الإجازات (6 مضمّنة افتراضياً)
GET  /api/leaves                  — طلبات الإجازات
POST /api/leaves                  — طلب إجازة جديدة
PUT  /api/leaves/:id/approve      — الموافقة على إجازة
PUT  /api/leaves/:id/reject       — رفض إجازة + سبب
GET  /api/leaves/balance/:empId   — رصيد الإجازات لموظف
GET  /api/homework                — قائمة الواجبات (مع إحصائيات التسليم)
POST /api/homework                — تعيين واجب (يُنشئ تسليمات pending تلقائياً لطلاب الفصل)
GET  /api/homework/:id/submissions — تسليمات واجب محدد
PUT  /api/homework/submissions/:id/grade — تقييم تسليم
GET  /api/conduct                 — سجلات السلوك (حوادث + مكافآت + top students)
POST /api/conduct                 — تسجيل سلوك جديد
GET  /api/conduct/student/:id     — ملخص سلوك طالب محدد
```

## دعم ثنائي اللغة (عربي / إنجليزي) — الجلسة الحالية
- ✅ `client/src/i18n/translations.ts` — 200+ مفتاح ترجمة (nav.* | dash.* | auth.* | common.* | status.* | parent.* | notif.* | session.* | site.*)
- ✅ `client/src/context/LanguageContext.tsx` — LanguageProvider مع `t()`, `toggleLang()`, `isRTL`, localStorage persistence, يضبط `document.documentElement.dir` + `lang`
- ✅ `client/src/main.tsx` — مُلفَّف بـ `<LanguageProvider>`
- ✅ AdminLayout — القائمة الجانبية + breadcrumbs + زر ع|EN في الـ header
- ✅ ParentLayout — قائمة التنقل + Mobile Bottom Nav + زر ع|EN + حالة الحضور اليوم
- ✅ Dashboard — التحية + KPI cards + الرسوم البيانية + الرسائل التحذيرية + التحليل الذكي + آخر الأنشطة
- ✅ LoginPage (admin) — نموذج الدخول + نص الصفحة + زر ع|EN في الـ card
- ✅ ParentLoginPage — نموذج الدخول + بطاقات الميزات + زر ع|EN في الـ card
- **التبديل:** `document.dir = 'ltr'/'rtl'` تلقائياً عند التغيير — محفوظ في localStorage

## الميزات المكتملة — أحدث جلسة (4 وحدات تعزيز: SuperAdmin + PDF + RBAC + Email)
- ✅ **SuperAdmin Portal** (`/admin/super`) — لوحة إدارة المدارس: شارات الخطة (basic/pro/enterprise)، تبديل الحالة، تغيير الخطة، بيانات دخول تلقائية عند إنشاء مدرسة
- ✅ **PDF Reports** (`/admin/pdf-reports`) — 4 قوالب طباعة: شهادة نتائج طالب، كشف حضور، قائمة فصل، قائمة موظفين — window.print() + @media print CSS
- ✅ **RBAC دور-صلاحية** — 7 أدوار جديدة: super_admin, accountant, librarian, hr_manager, guard + قيود قائمة جانبية حسب الدور في AdminLayout
- ✅ **Email Notifications** — خدمة nodemailer في `server/src/services/email.ts`: sendAbsenceAlert, sendGradeNotification, sendFeeReminder, testEmailConfig مع قوالب HTML عربية
- ✅ **Schema migrations** — schools: status/plan/plan_expires_at/notes/max_students/max_employees; school_settings: smtp_*/email_*/notify_*
- ✅ **ROLE_PERMISSIONS map** في AuthContext + middleware backend — hasPermission() للتحقق الدقيق
- ✅ **UsersAdmin** محدَّث — 7 أدوار في dropdown مع ألوان مميّزة لكل دور
- ✅ **RequireAuth** محدَّث — يقبل جميع أدوار الإدارة (accountant/librarian/hr_manager/guard/super_admin)

## الميزات المكتملة — الجلسة السابقة (4 وحدات ضخمة جديدة)
- ✅ **نظام المكتبة** (`/admin/library`) — كتالوج كتب، إعارة، إرجاع، غرامات، تنبيه كتب متأخرة، إحصائيات
- ✅ **إدارة إجازات الموظفين** (`/admin/leaves`) — طلبات إجازة، موافقة/رفض، رصيد، أنواع (6 أنواع) مع seed تلقائي
- ✅ **الواجبات المنزلية** (`/admin/homework`) — تعيين، تتبع تسليم، تقييم، ProgressRing، عرض مقارنة التسليمات
- ✅ **سجل السلوك** (`/admin/conduct`) — تسجيل حوادث/مكافآت/تحذيرات، نقاط، أفضل الطلاب، تنبيه إبلاغ الأهل
- ✅ **8 جداول قاعدة بيانات جديدة** — library_books، library_borrows، leave_types، employee_leaves، homework، homework_submissions، conduct_records (كلها IF NOT EXISTS + indexes)
- ✅ **4 backend routes جديدة** — `/api/library/*`، `/api/leaves/*`، `/api/homework/*`، `/api/conduct/*` مسجّلة في index.ts
- ✅ **4 API namespaces في client.ts** — libraryApi، leavesApi، homeworkApi، conductApi
- ✅ **مجموعة nav جديدة** "الأكاديمي والسلوكي" في AdminLayout sidebar
- ✅ **translations كاملة** للوحدات الجديدة (عربي + إنجليزي)

## الميزات المكتملة — الجلسة السابقة
- ✅ **Teacher Dashboard** (`/admin/teacher`) — لوحة معلم متكاملة: RingGauge charts، أداء الفصول، بارشارت المواد، جدول اليوم، Top Students
- ✅ **Student ID Cards** (`/admin/id-cards`) — بطاقات هوية قابلة للطباعة (فردية وجماعية) مع QR code simulation، فلترة بالفصل، print CSS
- ✅ **Performance Widget** — ودجت أداء المؤسسة في الداشبورد: متوسط الدرجات، معدل النجاح، تحصيل الرسوم، شريط مواد المقارنة
- ✅ **Enhanced Notification Panel** — لوحة إشعارات محسّنة: شريط حضور اليوم، تذكيرات رسوم متأخرة، فعاليات قادمة، رسائل + غياب
- ✅ **`/api/fees/stats`** — endpoint مستقل لإحصائيات الرسوم (total، collected، pending، overdue)
- ✅ **`/api/teacher/*`** — routes جديدة: dashboard، my-classes، subject-performance
- ✅ **Quick Actions 8-grid** — أيقونات الوصول السريع في الداشبورد توسّعت لـ 8 إجراءات شاملة Teacher Dashboard و ID Cards
- ✅ **Mobile Bottom Navigation** في بوابة أولياء الأمور — شريط تنقل ثابت أسفل الشاشة على الجوال
- ✅ **Session Expiry Warning** — بانر تحذيري عند اقتراب انتهاء JWT مع زر تسجيل خروج
- ✅ **Notification Bell Dropdown** — جرس الإشعارات في AdminLayout مع لوحة منسدلة احترافية
- ✅ **Keyboard Shortcuts Help Modal** — الضغط على '?' يعرض نافذة الاختصارات
- ✅ **Grade Radar Chart** — في بروفايل الطالب: مخطط رادار للمواد
- ✅ **Attendance Heatmap** — تقويم ملوّن بـ 10 أسابيع
- ✅ **Smart Insights Widget** — تحليل ذكي في Dashboard

## الميزات المكتملة
- ✅ Multi-tenant (كل مدرسة لها بياناتها المعزولة)
- ✅ لوحة إدارة كاملة مُحسَّنة بالكامل:
  - Dashboard: KPI cards + line charts + رسوم بيانية
  - Students: بروفايل كامل (3 تبويبات: معلومات، درجات، حضور) + zod validation
  - Employees: بروفايل + KPI + إحصائيات
  - Attendance: تسجيل يومي + stats bar + progress bar
  - Grades: تحليل توزيعي + أداء المواد + KPI
  - Messages: compose + inbox كامل
  - News: منشور/مسودة + مميز + stats
  - Events: تقويم فعاليات
  - Buses: إدارة حافلات + طلاب
  - Users: KPI bar + role colors + modal محسّن
  - Reports: تقارير متقدمة
  - ThemeSettings: ثيم ديناميكي
  - SchoolSettings: إعدادات المدرسة
- ✅ بوابة أولياء الأمور:
  - ParentDashboard: hero banner + KPI cards + MiniDonut + GradeBar + events + notifications + quick-links
  - نتائج، حضور، رسائل، جداول
- ✅ موقع عام للمدرسة — 13 صفحة كاملة مع RTL عربي
- ✅ Dark Mode كامل (CSS variables + localStorage persistence + system preference detection)
  - زر تبديل Dark/Light في AdminLayout و ParentLayout
  - انتقالات سلسة لجميع العناصر (0.22s transition)
- ✅ مصادقة JWT مع أدوار (admin, teacher, parent)
- ✅ Arabic RTL كامل
- ✅ ثيم ديناميكي لكل مدرسة (ألوان من قاعدة البيانات)
- ✅ Lazy loading (code splitting) لكل الصفحات
- ✅ Skeleton loaders بدلاً من spinners
- ✅ ConfirmDialog للحذف في كل الصفحات
- ✅ CSV export في DataTable والتقارير
- ✅ Global search (Ctrl+K) في لوحة التحكم
- ✅ Keyboard shortcuts (Alt+1-7) للتنقل السريع
- ✅ Error boundary للتعامل مع أخطاء React (يلتف حول كامل التطبيق)
- ✅ صفحة 404 احترافية
- ✅ Breadcrumbs في الهيدر
- ✅ Zod validation في نماذج الطلاب (قابل للتوسيع)
- ✅ Server-side gzip compression (compression middleware)
- ✅ React Query محسّن: staleTime=60s, gcTime=10min, refetchOnWindowFocus=false
- ✅ Debounced search في DataTable (280ms debounce + clear button)
- ✅ Micro-interactions CSS: ripple effect, stagger animation, glassmorphism, hover-lift
- ✅ Toast notifications محسّنة (Arabic-friendly styling)

## إعداد Tailwind CSS v3
- استخدام `@tailwindcss/vite` plugin في vite.config.ts
- `@import "tailwindcss"` في index.css (v3 approach)
- لا حاجة لـ postcss tailwind plugin

## الميزات المكتملة — أحدث جلسة (Audit عالمي المستوى — 15 تحسين)

### الأمان (Security)
- ✅ **Rate Limiting للمنصة العامة** — `platformPublicLimiter` (30 req/15min) على `/api/platform/request`
- ✅ **Rate Limiting للرسائل** — `ticketMsgLimiter` (10 msg/5min) على رسائل التذاكر
- ✅ **Input Sanitization** — `sanitize()` و `sanitizeEmail()` تُعقّم جميع المدخلات العامة (تزيل HTML/XSS/control chars)
- ✅ **Email Validation** — تحقق من صحة البريد بـ regex قبل قبول الطلب

### الأداء (Performance)
- ✅ **14 فهرس قاعدة بيانات** جديد على جداول: ticket_messages, ticket_history, service_requests (status/email/ticket/updated_at), business_clients (email/created_at), blog_posts (status+published_at/category), users (email)
- ✅ **Monthly Analytics** بـ `generate_series` لضمان 6 أشهر متواصلة حتى بدون بيانات
- ✅ **Parallel queries** — 6 queries تُنفَّذ بـ `Promise.all()` في analytics endpoint

### SEO
- ✅ **index.html** محدّث كلياً: title + description + keywords + author + OG (FB/WA/LI) + Twitter Card + JSON-LD Schema.org Organization
- ✅ **meta robots** = `index, follow` (كان noindex من قبل)
- ✅ **og:image + twitter:image** مُضافَتان

### UX / لوحة التحكم
- ✅ **Badge طلبات جديدة** — الـ sidebar يُظهر badge بنفسجي متحرك على "طلبات الخدمة" عند وجود طلبات جديدة
- ✅ **Endpoint `/admin/new-count`** — lightweight endpoint لعدد الطلبات الجديدة (بدون تحميل كل البيانات)
- ✅ **PlatformWidget** — ودجت جديد في Dashboard: طلبات جديدة + مشاريع نشطة + عملاء + إيرادات + روابط سريعة
- ✅ **Analytics 6 KPIs** — توسّع من 4 إلى 6: أُضيف متوسط وقت الاستجابة + معدل التحويل
- ✅ **مخطط الإيرادات الشهرية** — BarChart جديد (ميزانية vs محصّل) في صفحة التحليلات
- ✅ **BlogAdmin filter tabs** — تبويبات تصفية (الكل/منشور/مسودة/مؤرشف) مع عدّاد لكل حالة

### الميزات المكتملة — الجلسة السابقة (منصة التذاكر الكاملة)
- ✅ **مدونة تقنية عامة** (`/blog`) + **صفحة مقالة كاملة** (`/blog/:slug`)
- ✅ **6 مقالات عربية احترافية** في قاعدة البيانات مع صور Unsplash
- ✅ **تحليلات المنصة** (`/admin/platform-analytics`) — Recharts charts كاملة
- ✅ **إدارة المحتوى** (`/admin/platform-content`) — 6 تبويبات CRUD كاملة
- ✅ **تفاصيل المشروع** (`/admin/projects/:id`) — Timeline + messages + inline edit
- ✅ **إدارة المدونة** (`/admin/blog`) — Drawer + HTML editor + CRUD
- ✅ **نظام التذاكر العام** (`/track`, `/track/:ticket`) — stepper + محادثة + تقييم
- ✅ **ticket_messages + ticket_history** — جدولان جديدان مع indexes
- ✅ **Badge "تتبع طلبك"** في navbar + footer مع نقطة خضراء

## الميزات المكتملة — الجلسة السابقة (منصة شركة التقنية الكاملة)
- ✅ **Landing Page احترافية** (`/`) — صفحة رئيسية كاملة لشركة تقنية: Hero + Stats + Services + WhyUs + Portfolio + Process + Pricing + Testimonials + FAQ + CTA + Footer
- ✅ **نظام طلبات الخدمة** (`/request`) — نموذج 4 خطوات: نوع الخدمة → تفاصيل → ميزانية → بيانات التواصل → إنشاء Ticket تلقائي
- ✅ **إدارة الطلبات** (`/admin/requests`) — Drawer للتفاصيل + تحديث الحالة + الأولوية + ملاحظات داخلية + فلاتر + بحث
- ✅ **CRM العملاء** (`/admin/clients`) — بطاقات العملاء مع إحصائيات الطلبات والمشاريع والإيرادات
- ✅ **إدارة المشاريع** (`/admin/projects`) — بطاقات المشاريع مع progress bar تفاعلي + تغيير الحالة + إنشاء مشروع جديد
- ✅ **Platform Backend Routes** — `/api/platform/*` (services, portfolio, testimonials, faq, pricing, blog, settings, request, admin/*)
- ✅ **Platform DB Schema** — 11 جداول: platform_services, portfolio_items, testimonials, faq_items, pricing_plans, business_clients, service_requests, projects, project_messages, blog_posts, company_settings
- ✅ **Seed Data كامل** — 6 خدمات + 4 شهادات + 8 أسئلة + 3 خطط + 6 portfolio + 11 company settings + 6 blog posts
- ✅ **adminApi helper** — في client.ts: get/post/put/patch/delete مع auth تلقائي
- ✅ **مجموعة nav** "منصة الأعمال" في AdminLayout: طلبات + عملاء + مشاريع + تحليلات + محتوى + مدونة
- ✅ **App.tsx routing** — `/` + `/request` + `/blog` + `/blog/:slug` standalone + `/admin/*` جميع الصفحات الجديدة

## الميزات المكتملة — الجلسة السابقة (6 محاور Enterprise)
- ✅ **إصلاح React Router** — `future={{ v7_startTransition, v7_relativeSplatPath }}` في BrowserRouter
- ✅ **PWA + Push Notifications** — `client/public/manifest.webmanifest` + `client/public/sw.js` (SW registration في main.tsx)، push handler، `<link rel="manifest">` في index.html
- ✅ **Excel Export** — `exportToExcel()` مع `xlsx` (dynamic import) في ExportButton.tsx — تصدير CSV / Excel / JSON
- ✅ **AI Smart Analytics** (`/admin/ai-insights`) — 8 SQL queries parallel: توزيع الدرجات، طلاب في خطر، اتجاه الحضور، تحصيل الرسوم، أداء المواد، نمط الغياب، أداء الفصول، السلوك — توصيات ذكية تلقائية (critical/warning/positive/info)
- ✅ **Enterprise Security — Audit Log** (`/admin/audit-log`) — جدول `audit_logs` + route `/api/audit/*` + صفحة عرض مع فلاتر وpagination + تصدير CSV + إحصائيات
- ✅ **Enterprise Security — 2FA** (`/admin/2fa`) — TOTP مع speakeasy + QR code مع qrcode — setup/verify/disable — جدول `user_sessions` + حقول `totp_secret/totp_enabled` في users
- ✅ **Billing Enhancement** — route `/api/billing/*` — invoices CRUD + usage stats + auto-invoice-number — جدول `invoices`
- ✅ **5 routes جديدة في server** — `/api/audit`, `/api/2fa`, `/api/ai-insights`, `/api/billing` مُسجَّلة في index.ts
- ✅ **3 صفحات frontend جديدة** — AIInsights.tsx, AuditLog.tsx, TwoFactorSetup.tsx
- ✅ **AdminLayout sidebar** — مجموعة "الذكاء الاصطناعي" + روابط AI Insights / Audit Log / 2FA
- ✅ **ترجمات جديدة** — nav.aiInsights, nav.auditLog, nav.twoFactor, nav.group.analytics (عربي + إنجليزي)
- ✅ **Schema migrations** — audit_logs, user_sessions, invoices + ALTER users (totp_secret, totp_enabled, last_login_at, last_login_ip, login_count)
- ✅ **logAudit() helper** — exported من audit.ts لاستخدامه في أي route (2fa + billing يستخدمانه)

## قاعدة البيانات — الجداول
- schools, users, students, employees
- classes, subjects, attendance, grades
- buses, bus_students, messages
- news, events, settings, gallery, broadcasts
- exams, fees, schedule, notifications, staff_public, achievements
- **library_books, library_borrows** — نظام المكتبة
- **leave_types, employee_leaves** — إجازات الموظفين
- **homework, homework_submissions** — الواجبات المنزلية
- **conduct_records** — سجل السلوك
- **audit_logs** — سجل النشاط الكامل (Enterprise Audit)
- **user_sessions** — جلسات المستخدمين
- **invoices** — فواتير الاشتراك
- **platform_services, portfolio_items, testimonials, faq_items, pricing_plans** — محتوى المنصة
- **business_clients, service_requests, projects, project_messages** — CRM + إدارة مشاريع
- **blog_posts, company_settings** — مدونة + إعدادات الشركة
- **ticket_messages, ticket_history** — نظام التذاكر ثنائي الاتجاه + سجل التغييرات

## فهارس قاعدة البيانات (112 فهرس)
- **Platform**: idx_tmsg_request_time, idx_thist_request_time, idx_sreq_status_created, idx_sreq_email, idx_sreq_ticket, idx_sreq_updated, idx_bclients_email, idx_bclients_created, idx_blog_pub, idx_blog_category, idx_users_email
- **School**: idx_attendance_*, idx_grades_*, idx_fees_*, idx_employees_*, إلخ

## المكونات الجديدة
- `PlatformWidget` — ودجت منصة الأعمال في Dashboard (طلبات/مشاريع/عملاء/إيرادات)

## Workflows
- `Backend Server`: `cd server && npm start` (port 3001)
- `Start application`: `cd client && npm run dev` (port 5000)

## المكونات المشتركة (client/src/components/)
- `SessionWarning` — بانر تحذير انتهاء JWT (يظهر قبل 10 دقائق، أحمر قبل 3 دقائق)
- `ShortcutsModal` — نافذة اختصارات لوحة المفاتيح (تُفتح بـ '?')
- `NotificationPanel` — لوحة إشعارات منسدلة من زر الجرس في AdminLayout
- `AttendanceHeatmap` — (داخل Students.tsx) تقويم ملوّن بـ 10 أسابيع للحضور والغياب

## المكونات المشتركة (client/src/components/) — القديمة
- `DataTable` — جدول بيانات مع بحث مع debounce، ترتيب، تصفح، تصدير CSV، ConfirmDialog للحذف
- `Modal` — نافذة منبثقة مع دعم Escape key
- `Skeleton` — مكونات skeleton loaders (StatCard, Table, Dashboard, Card)
- `ConfirmDialog` — نافذة تأكيد احترافية للحذف
- `ErrorBoundary` — class component للتعامل مع أخطاء React (يلتف حول كامل App)
- `ExportButton` — تصدير CSV / Excel (xlsx) / JSON مع dropdown
- `GlobalSearch` — Command palette (Ctrl+K)
- `FormField`, `Input`, `Select`, `Textarea` — مكونات نماذج موحّدة

## Hooks (client/src/hooks/)
- `useDebounce` — debounces a value with configurable delay (default 300ms)
- `useDarkMode` — toggles dark mode, persists in localStorage, respects system preference

## ملاحظات مهمة
- `lucide-react` لا تدعم Facebook/Instagram/Twitter/YouTube — استخدم SVG مضمّن
- أخطاء TypeScript في lucide-react (`TS2786`) موجودة مسبقاً — تتعلق بـ React types version mismatch ولا تؤثر على runtime
- CSS Dark Mode يعمل عبر `[data-theme="dark"]` على `document.documentElement`
- Server compression يعمل بعد `helmet` مباشرة في server/src/index.ts
- `adminApi` في client.ts يُعيد `r.data` مباشرة (axios unwrapped) — لا تُضيف `.data` مرة ثانية
- Rate limiters: globalLimiter (300/15min) + authLimiter (10/15min) + writeLimiter (30/min) + platformPublicLimiter (30/15min) + ticketMsgLimiter (10/5min)
- Input sanitization functions في platform.ts: `sanitize(v, maxLen)` + `sanitizeEmail(v)` — يجب استخدامهما في جميع public endpoints
