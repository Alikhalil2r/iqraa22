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

## الميزات المكتملة — الجلسة الحالية (أفضل 7 إضافات)
- ✅ **Mobile Bottom Navigation** في بوابة أولياء الأمور — شريط تنقل ثابت أسفل الشاشة على الجوال بأيقونات وتسميات وبادجات للإشعارات
- ✅ **Session Expiry Warning** — بانر تحذيري عند اقتراب انتهاء JWT (10 دقائق تحذير، 3 دقائق تنبيه طارئ) مع زر تسجيل خروج
- ✅ **Notification Bell Dropdown** — جرس الإشعارات في AdminLayout يفتح لوحة منسدلة مع رسائل غير مقروءة وتنبيهات الغياب، وربط بنافذة الاختصارات
- ✅ **Keyboard Shortcuts Help Modal** — الضغط على '?' يعرض نافذة جميلة لكل الاختصارات المتاحة (Alt+1-7، Ctrl+K، Esc)
- ✅ **Grade Radar Chart** — في بروفايل الطالب > تبويب الدرجات: مخطط رادار تفاعلي يُظهر أداء المواد مقارنةً بعضها (recharts RadarChart)
- ✅ **Attendance Heatmap** — في بروفايل الطالب > تبويب الحضور: تقويم ملوّن بـ 10 أسابيع يُظهر الحضور والغياب والتأخر بالألوان
- ✅ **Smart Insights Widget** — في Dashboard: قسم "تحليل ذكي" يُنتج رسائل ذكية بناءً على البيانات (حضور ممتاز ✅ / رسوم منخفضة ⚠️ / إجمالي المسجلين)

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
