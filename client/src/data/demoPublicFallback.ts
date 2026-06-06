/** محتوى تجريبي يظهر عند غياب بيانات API — فقط عند VITE_DEMO_MODE=true */

import { isDemoMode } from '../config/appMode'

export function withDemoFallback<T>(apiItems: T[] | undefined | null, fallback: T[]): T[] {
  if (apiItems?.length) return apiItems
  return isDemoMode() ? fallback : []
}

export const DEMO_NEWS = [
  { id: 'demo-1', title: 'انطلاق الفصل الدراسي الثاني بزخم أكاديمي', summary: 'استقبلت المدرسة الفصل الدراسي الثاني بروح عالية وحماس كبير من الطلاب والمعلمين.', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', category: 'إداري', publish_date: '2026-01-15', is_featured: true },
  { id: 'demo-2', title: 'المدرسة تحصد المركز الأول في مسابقة العلوم', summary: 'فريق طلاب المدرسة حقق المركز الأول على مستوى المحافظة في مسابقة العلوم والتقنية.', image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', category: 'إنجازات', publish_date: '2026-01-20', is_featured: true },
  { id: 'demo-3', title: 'ختام مخيم القراءة الإثرائي', summary: 'أُقيم حفل ختام مخيم القراءة بحضور أولياء الأمور وتكريم المشاركين المتميزين.', image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', category: 'أنشطة', publish_date: '2026-01-25', is_featured: false },
  { id: 'demo-4', title: 'زيارة ميدانية لمشروع الطاقة الشمسية', summary: 'رحلة تعليمية لطلاب الصفوف العليا لمشروع الطاقة الشمسية الوطني.', image_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', category: 'رحلات', publish_date: '2026-02-05', is_featured: false },
  { id: 'demo-5', title: 'بطولة كرة القدم — المركز الثاني', summary: 'شارك فريقنا في البطولة الرياضية المدرسية وأحرز المركز الثاني.', image_url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80', category: 'رياضي', publish_date: '2026-02-12', is_featured: false },
  { id: 'demo-6', title: 'حفل تكريم المعلمين', summary: 'حفل بهيج بمناسبة اليوم العالمي للمعلم تقديراً لجهودهم المتميزة.', image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', category: 'مناسبات', publish_date: '2026-02-18', is_featured: false },
]

export const DEMO_GALLERY = [
  { id: 'demo-g1', image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', title: 'حفل افتتاح العام الدراسي', category: 'فعاليات' },
  { id: 'demo-g2', image_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80', title: 'أنشطة التعلم التفاعلي', category: 'أكاديمي' },
  { id: 'demo-g3', image_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80', title: 'بطولة كرة القدم الداخلية', category: 'رياضة' },
  { id: 'demo-g4', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', title: 'مختبر العلوم والأبحاث', category: 'أكاديمي' },
  { id: 'demo-g5', image_url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&q=80', title: 'يوم المهنة والتوجيه', category: 'فعاليات' },
  { id: 'demo-g6', image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80', title: 'المبنى الرئيسي', category: 'مرافق' },
  { id: 'demo-g7', image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', title: 'المعرض العلمي السنوي', category: 'علوم' },
  { id: 'demo-g8', image_url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80', title: 'مسابقة الروبوت التعليمية', category: 'علوم' },
]

export const DEMO_ACHIEVEMENTS = [
  { id: 'demo-a1', title: 'المركز الأول — مسابقة الرياضيات', description: 'فوز طلاب الصف السادس على مستوى مسقط', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', category: 'أكاديمي', achievement_date: '2026-01-10', student_name: 'فريق الرياضيات', class_name: 'الصف السادس - أ' },
  { id: 'demo-a2', title: 'جائزة الإبداع العلمي', description: 'مشروع طاقة شمسية من طلاب الصف التاسع', image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80', category: 'علوم', achievement_date: '2026-02-01', student_name: 'عمر بن خالد', class_name: 'الصف التاسع - ب' },
  { id: 'demo-a3', title: 'بطولة كرة القدم المدرسية', description: 'فوز فريق النور بكأس المدارس الخاصة', image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80', category: 'رياضة', achievement_date: '2026-02-15', student_name: 'فريق كرة القدم', class_name: 'المرحلة الإعدادية' },
  { id: 'demo-a4', title: 'مسابقة القرآن الكريم', description: 'المركز الثاني على مستوى المحافظة', image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', category: 'ثقافي', achievement_date: '2026-03-01', student_name: 'محمد بن سعيد', class_name: 'الصف السابع - أ' },
]

export const DEMO_VIDEOS = [
  { id: 'demo-v1', title: 'جولة في مدرسة النور العالمية', video_url: 'https://www.youtube.com/embed/ScMzIvxBSi4', category: 'تعريفي', description: 'جولة مصورة في مرافق المدرسة' },
  { id: 'demo-v2', title: 'يوم مفتوح لأولياء الأمور', video_url: 'https://www.youtube.com/embed/LXb3EKWsInQ', category: 'فعاليات', description: 'لقطات من اليوم المفتوح' },
  { id: 'demo-v3', title: 'إنجازات طلابنا', video_url: 'https://www.youtube.com/embed/iik25wqIuFo', category: 'إنجازات', description: 'أبرز إنجازات العام الدراسي' },
]

export const DEMO_EVENTS = [
  { id: 'demo-e1', title: 'اجتماع أولياء الأمور', event_type: 'إداري', start_date: new Date(Date.now() + 7 * 86400000).toISOString(), end_date: new Date(Date.now() + 8 * 86400000).toISOString() },
  { id: 'demo-e2', title: 'يوم المهنة المهني', event_type: 'فعالية', start_date: new Date(Date.now() + 14 * 86400000).toISOString(), end_date: new Date(Date.now() + 15 * 86400000).toISOString() },
  { id: 'demo-e3', title: 'امتحانات نهاية الفصل', event_type: 'اختبارات', start_date: new Date(Date.now() + 21 * 86400000).toISOString(), end_date: new Date(Date.now() + 22 * 86400000).toISOString() },
  { id: 'demo-e4', title: 'رحلة متحف مسقط', event_type: 'رحلة', start_date: new Date(Date.now() + 28 * 86400000).toISOString(), end_date: new Date(Date.now() + 29 * 86400000).toISOString() },
]

export const DEMO_STUDENT_ARTICLES = [
  { id: 'demo-s1', author_name: 'ريم بنت سالم', grade: 'الصف السابع - أ', title: 'حلمي أن أصبح طبيبة', content: 'أحلم بمساعدة الناس وإنقاذ الأرواح. مدرستي تمنحني الدعم والتشجيع دائماً.', category: 'إبداعات', publish_date: '2026-01-10' },
  { id: 'demo-s2', author_name: 'عبدالرحمن بن خالد', grade: 'الصف التاسع - ب', title: 'مشروع الطاقة المتجددة', content: 'صممت نموذجاً لبطارية شمسية صغيرة بإشراف معلم العلوم.', category: 'علوم', publish_date: '2026-02-01' },
]

export const DEMO_TEACHER_ARTICLES = [
  { id: 'demo-t1', author_name: 'أ. فاطمة البلوشية', subject: 'الرياضيات', title: 'كيف نُحبّ الرياضيات؟', content: 'أستخدم الألعاب التعليمية والتطبيقات الرقمية لجعل الرياضيات ممتعة لطلابي.', publish_date: '2026-01-15' },
]

export const DEMO_TEAMS = [
  { id: 'demo-team1', name: 'فريق الروبوتيك', category: 'تقنية', members_count: 12, description: 'يمثل المدرسة في مسابقات الروبوت', achievements: 'المركز الأول — مسقط 2025', image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80', color_gradient: 'from-violet-500 to-purple-600' },
  { id: 'demo-team2', name: 'فريق كرة القدم', category: 'رياضة', members_count: 18, description: 'الفريق الرئيسي للمدرسة', achievements: 'المركز الثاني 2025', image_url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80', color_gradient: 'from-emerald-500 to-emerald-600' },
  { id: 'demo-team3', name: 'نادي القراءة', category: 'أدبي', members_count: 25, description: 'تعزيز ثقافة القراءة', achievements: '50+ مراجعة كتاب', image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80', color_gradient: 'from-amber-500 to-amber-600' },
]

export const DEMO_HALL_OF_FAME = [
  { id: 'demo-h1', name: 'نورة بنت أحمد الهنائية', grade: 'الصف الثاني عشر', year: '2025', achievement: 'المركز الأول — الثانوية العامة', category: 'أكاديمي', rank: 1, image_url: 'https://randomuser.me/api/portraits/women/21.jpg', description: 'معدل 99.2%' },
  { id: 'demo-h2', name: 'سعيد بن محمد الكندي', grade: 'الصف الثاني عشر', year: '2024', achievement: 'بطولة الخطابة الوطنية', category: 'ثقافي', rank: 1, image_url: 'https://randomuser.me/api/portraits/men/22.jpg', description: 'تمثيل المدرسة على مستوى السلطنة' },
  { id: 'demo-h3', name: 'لمى بنت خالد البلوشية', grade: 'الصف الحادي عشر', year: '2025', achievement: 'جائزة الإبداع في الروبوتيك', category: 'تقني', rank: 2, image_url: 'https://randomuser.me/api/portraits/women/23.jpg', description: 'مشروع روبوت ذكي' },
]

export const DEMO_STAFF = [
  { id: 'demo-st1', name: 'د. سالم بن راشد المعولي', position: 'مدير المدرسة', department: 'الإدارة', photo: 'https://randomuser.me/api/portraits/men/75.jpg', bio: 'قائد تربوي بخبرة 20 عاماً' },
  { id: 'demo-st2', name: 'أ. فاطمة الزهراء البلوشية', position: 'نائبة المدير', department: 'الإدارة', photo: 'https://randomuser.me/api/portraits/women/65.jpg', bio: 'خبيرة في تطوير المناهج' },
  { id: 'demo-st3', name: 'أ. خالد بن ناصر الحارثي', position: 'معلم رياضيات', department: 'الرياضيات', photo: 'https://randomuser.me/api/portraits/men/32.jpg', bio: 'معلم متميز' },
  { id: 'demo-st4', name: 'أ. مريم بنت حمد السعدية', position: 'معلمة لغة عربية', department: 'اللغة العربية', photo: 'https://randomuser.me/api/portraits/women/44.jpg', bio: 'متخصصة في الأدب والنحو' },
  { id: 'demo-st5', name: 'أ. يوسف بن علي الكندي', position: 'معلم علوم', department: 'العلوم', photo: 'https://randomuser.me/api/portraits/men/67.jpg', bio: 'مشرف مختبر العلوم' },
  { id: 'demo-st6', name: 'أ. سارة بنت محمد الهنائية', position: 'معلمة إنجليزي', department: 'الإنجليزية', photo: 'https://randomuser.me/api/portraits/women/28.jpg', bio: 'IELTS certified' },
]

export const DEMO_ALUMNI = [
  { id: 'demo-al1', name: 'عائشة بنت سالم الراشدية', graduation_year: 2018, job_title: 'مهندسة برمجيات', city: 'مسقط', story: 'درست في النور من الروضة حتى الثانوية. المدرسة علّمتني الانضباط والطموح.', achievement: 'منحة جامعية كاملة' },
  { id: 'demo-al2', name: 'حمد بن ناصر السعدي', graduation_year: 2016, job_title: 'طبيب', city: 'مسقط', story: 'ذكرياتي في المدرسة لا تُنسى. المعلمون كانوا داعمين لكل طموح.', achievement: 'تفوق في الثانوية العامة' },
]

export const DEMO_JOBS = [
  { id: 'demo-j1', title: 'معلم رياضيات — ثانوي', department: 'أكاديمي', job_type: 'دوام كامل', deadline: '2026-09-30', requirements: 'بكالوريوس + خبرة 3 سنوات', description: 'تدريس الرياضيات للصفوف 10-12' },
  { id: 'demo-j2', title: 'معلمة لغة إنجليزية', department: 'أكاديمي', job_type: 'دوام كامل', deadline: '2026-08-15', requirements: 'IELTS 7+', description: 'تدريس الإنجليزية' },
  { id: 'demo-j3', title: 'مرشد طلابي', department: 'اجتماعي', job_type: 'دوام كامل', deadline: '2026-07-01', requirements: 'بكالوريوس نفس أو اجتماع', description: 'إرشاد طلابي' },
]

export const DEMO_LEARNING_SUPPORT = {
  about: 'وحدة دعم التعلم في مدرسة النور العالمية تقدّم برامج متخصصة لدعم الطلاب ذوي الاحتياجات التعليمية الخاصة، بالتعاون مع أولياء الأمور والمختصين.',
  services: [
    { id: 'demo-ls1', title: 'دعم صعوبات التعلم', icon: '📖', description: 'جلسات فردية وجماعية' },
    { id: 'demo-ls2', title: 'تعديل السلوك', icon: '🎯', description: 'برامج إرشادية' },
    { id: 'demo-ls3', title: 'دمج ذوي الإعاقة', icon: '🤝', description: 'خطط دمج فردية' },
  ],
  specialists: [
    { id: 'demo-sp1', name: 'د. هدى بنت سعيد', role: 'أخصائية نفسية تربوية', image_url: 'https://randomuser.me/api/portraits/women/55.jpg', bio: 'خبرة 12 عاماً' },
    { id: 'demo-sp2', name: 'أ. عمر بن راشد', role: 'معلم دعم تعلم', image_url: 'https://randomuser.me/api/portraits/men/55.jpg', bio: 'متخصص في صعوبات القراءة' },
  ],
  articles: [
    { id: 'demo-la1', title: 'كيف تدعمون طفلكم في المنزل؟', content: 'نصائح عملية لأولياء الأمور للتعاون مع المدرسة.', publish_date: '2026-01-20' },
  ],
  gallery: [
    { id: 'demo-lg1', title: 'جلسة دعم فردية', image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80' },
    { id: 'demo-lg2', title: 'ورشة مهارات', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80' },
  ],
}
