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
| `/` | الموقع العام للمدرسة |
| `/news` | أخبار المدرسة |
| `/about` | عن المدرسة |
| `/contact` | تواصل معنا |
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
- ✅ لوحة إدارة كاملة (طلاب، موظفين، حضور، درجات، حافلات، رسائل، أخبار، فعاليات، إعدادات، ثيم)
- ✅ بوابة أولياء الأمور (نتائج، حضور، رسائل، جداول)
- ✅ موقع عام للمدرسة (ديناميكي من قاعدة البيانات)
- ✅ مصادقة JWT مع أدوار (admin, teacher, parent)
- ✅ Arabic RTL كامل
- ✅ ثيم ديناميكي لكل مدرسة (ألوان من قاعدة البيانات)
- ✅ Lazy loading (code splitting) لكل الصفحات
- ✅ Skeleton loaders بدلاً من spinners
- ✅ ConfirmDialog للحذف بدلاً من browser confirm()
- ✅ CSV export في DataTable والتقارير
- ✅ Global search (Ctrl+K) في لوحة التحكم
- ✅ Keyboard shortcuts (Alt+1-7) للتنقل السريع
- ✅ Error boundary للتعامل مع الأخطاء
- ✅ صفحة 404 احترافية
- ✅ PWA support (vite-plugin-pwa)
- ✅ Breadcrumbs في الهيدر
- ✅ صفحة تسجيل دخول محسّنة بدون بيانات ظاهرة
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
