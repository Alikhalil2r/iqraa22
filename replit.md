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

## الميزات المكتملة — أحدث جلسة (4 وحدات ضخمة جديدة)
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
- `ExportButton` — تصدير CSV/JSON مع dropdown
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
