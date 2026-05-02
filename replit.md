# نظام إدارة المدرسة — School Management SaaS

## نظرة عامة
منصة SaaS احترافية متكاملة لإدارة المدارس، قابلة للبيع لعدة مدارس (multi-tenant).

## المكدس التقني
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS v4 + React Query
- **Backend**: Express.js + TypeScript + pg (PostgreSQL)
- **Database**: PostgreSQL (Replit managed)
- **Auth**: JWT (jsonwebtoken)
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
| `/admin` | لوحة التحكم (محمية) |
| `/parent` | بوابة أولياء الأمور (محمية) |

## API Endpoints
```
POST /api/auth/login        — تسجيل الدخول
GET  /api/students          — قائمة الطلاب
GET  /api/employees         — قائمة الموظفين
GET  /api/attendance        — سجل الحضور
GET  /api/grades            — النتائج
GET  /api/buses             — الحافلات
GET  /api/messages          — الرسائل
GET  /api/news              — الأخبار
GET  /api/events            — الفعاليات
GET  /api/school/settings   — إعدادات المدرسة
GET  /api/school/theme      — ثيم المدرسة
GET  /api/reports/*         — التقارير
```

## الميزات المكتملة
- ✅ Multi-tenant (كل مدرسة لها بياناتها المعزولة)
- ✅ لوحة إدارة كاملة مُحسَّنة بالكامل:
  - Dashboard: KPI cards + line charts + رسوم بيانية
  - Students: بروفايل كامل (3 تبويبات: معلومات، درجات، حضور)
  - Employees: بروفايل + KPI + إحصائيات
  - Attendance: تسجيل يومي + stats bar + progress bar
  - Grades: تحليل توزيعي + أداء المواد + KPI (ConfirmDialog حذف ✅)
  - Messages: compose + inbox كامل
  - News: منشور/مسودة + مميز + stats (ConfirmDialog حذف ✅)
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
  - شريط إعلانات طوارئ قابل للإغلاق
  - شريط أخبار متحرك (news ticker)
  - شريط تنقل علوي بـ 13 رابط + تبديل الوضع الليلي
  - صفحة رئيسية: Ken Burns hero + Programs section (6 cards) + إحصائيات + شهادات + يوتيوب
  - جدار الشرف مع منصة المراكز الأولى
  - معرض صور masonry مع lightbox
  - تقويم دراسي مع عدّ تنازلي للأحداث
  - مكتبة مرئية يوتيوب مع مشغّل مدمج
  - نموذج توظيف كامل مع CAPTCHA رياضي
  - نموذج تسجيل الخريجين
  - فوتر 4-أعمدة + أيقونات وسائل التواصل SVG (فيسبوك، تويتر، إنستغرام، يوتيوب، واتساب)
- ✅ مصادقة JWT مع أدوار (admin, teacher, parent)
- ✅ Arabic RTL كامل
- ✅ ثيم ديناميكي لكل مدرسة (ألوان من قاعدة البيانات)
- ✅ Lazy loading (code splitting) لكل الصفحات
- ✅ Skeleton loaders بدلاً من spinners
- ✅ ConfirmDialog للحذف في كل الصفحات (بلا browser confirm())
- ✅ CSV export في DataTable والتقارير
- ✅ Global search (Ctrl+K) في لوحة التحكم
- ✅ Keyboard shortcuts (Alt+1-7) للتنقل السريع
- ✅ Error boundary للتعامل مع الأخطاء
- ✅ صفحة 404 احترافية
- ✅ PWA support (vite-plugin-pwa)
- ✅ Breadcrumbs في الهيدر
- ✅ تحسينات CSS (shimmer skeletons, scale-in, slide-in, focus rings)

## إعداد Tailwind CSS v4
- استخدام `@tailwindcss/vite` plugin في vite.config.ts
- `@import "tailwindcss"` في index.css
- لا حاجة لـ postcss tailwind plugin

## قاعدة البيانات — الجداول
- schools, users, students, employees
- classes, subjects, attendance, grades
- buses, bus_students, messages
- news, events, settings, gallery

## Workflows
- `Backend Server`: `cd server && npm start` (port 3001)
- `Start application`: `cd client && npm run dev` (port 5000)

## المكونات المشتركة (client/src/components/)
- `DataTable` — جدول بيانات مع بحث، ترتيب، تصفح، تصدير CSV، ConfirmDialog للحذف
- `Modal` — نافذة منبثقة مع دعم Escape key
- `Skeleton` — مكونات skeleton loaders (StatCard, Table, Dashboard)
- `ConfirmDialog` — نافذة تأكيد احترافية للحذف
- `ErrorBoundary` — class component للتعامل مع أخطاء React
- `ExportButton` — تصدير CSV/JSON مع dropdown
- `GlobalSearch` — Command palette (Ctrl+K)
- `FormField`, `Input`, `Select`, `Textarea` — مكونات نماذج موحّدة
