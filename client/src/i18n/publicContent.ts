import type { Lang } from './translations'

export const OFFICE_HOURS: Record<Lang, string> = {
  ar: 'الأحد – الخميس | 7:00 ص – 2:30 م',
  en: 'Sun – Thu | 7:00 AM – 2:30 PM',
}

export const CONTACT_SUBJECTS: Record<Lang, string[]> = {
  ar: ['استفسار عن التسجيل', 'متابعة أكاديمية', 'مقترح أو شكوى', 'الخدمات المدرسية', 'خدمة الحافلات', 'أخرى'],
  en: ['Admission inquiry', 'Academic follow-up', 'Suggestion or complaint', 'School services', 'Bus service', 'Other'],
}

export const STAFF_CATEGORIES: Record<Lang, Record<string, string>> = {
  ar: { all: '👥 الجميع', 'إدارة': '🏫 الإداري', 'أكاديمي': '📚 الأكاديمي', 'فني': '🔧 الفني' },
  en: { all: '👥 All', 'إدارة': '🏫 Admin', 'أكاديمي': '📚 Academic', 'فني': '🔧 Support' },
}

export const ABOUT_VALUES: Record<Lang, { title: string; desc: string; color: string }[]> = {
  ar: [
    { title: 'التميز الأكاديمي', desc: 'نسعى لتحقيق أعلى مستويات الجودة التعليمية من خلال مناهج متطورة وكوادر متخصصة.', color: '#6366f1' },
    { title: 'القيم الإسلامية', desc: 'نبني شخصية الطالب على أسس راسخة من قيم الإسلام والهوية الوطنية العُمانية الأصيلة.', color: '#10b981' },
    { title: 'الابتكار والإبداع', desc: 'نشجع التفكير النقدي وريادة الأعمال وروح المبادرة في بيئة تعليمية محفزة.', color: '#f59e0b' },
    { title: 'الانفتاح العالمي', desc: 'نُعدّ طلابنا للتنافس عالمياً من خلال تعليم اللغات وتبني المعايير الدولية.', color: '#0ea5e9' },
    { title: 'الشراكة المجتمعية', desc: 'نبني جسور التواصل مع الأسرة والمجتمع المحلي لتحقيق رؤية تعليمية متكاملة.', color: '#8b5cf6' },
    { title: 'التطوير المستمر', desc: 'نؤمن بالتحسين المستدام لأساليب التدريس والبيئة المدرسية لضمان أفضل تجربة.', color: '#f97316' },
  ],
  en: [
    { title: 'Academic Excellence', desc: 'We pursue the highest standards through advanced curricula and qualified educators.', color: '#6366f1' },
    { title: 'Islamic Values', desc: 'We nurture character rooted in faith and authentic Omani national identity.', color: '#10b981' },
    { title: 'Innovation & Creativity', desc: 'We foster critical thinking, entrepreneurship, and initiative in an inspiring environment.', color: '#f59e0b' },
    { title: 'Global Outlook', desc: 'We prepare students to compete internationally through languages and global standards.', color: '#0ea5e9' },
    { title: 'Community Partnership', desc: 'We build bridges with families and the local community for holistic education.', color: '#8b5cf6' },
    { title: 'Continuous Improvement', desc: 'We believe in sustainable improvement of teaching methods and school life.', color: '#f97316' },
  ],
}

export const ABOUT_TIMELINE: Record<Lang, { year: string; title: string; desc: string }[]> = {
  ar: [
    { year: '2012', title: 'التأسيس', desc: 'افتتاح المدرسة بـ 200 طالب وكادر تعليمي متميز' },
    { year: '2015', title: 'التوسع الأول', desc: 'إضافة المرحلة الثانوية وافتتاح مختبر العلوم الحديث' },
    { year: '2018', title: 'شهادة الجودة', desc: 'الحصول على اعتماد وزارة التربية والتعليم للجودة' },
    { year: '2021', title: 'التحول الرقمي', desc: 'إطلاق البوابة الإلكترونية لأولياء الأمور والطلاب' },
    { year: '2024', title: 'التوسع الكبير', desc: 'افتتاح المبنى الجديد وزيادة الطاقة الاستيعابية' },
    { year: '2026', title: 'عقد من التميز', desc: 'الاحتفال بأكثر من عشر سنوات من العطاء التعليمي المتميز' },
  ],
  en: [
    { year: '2012', title: 'Foundation', desc: 'School opened with 200 students and an outstanding faculty' },
    { year: '2015', title: 'First Expansion', desc: 'Secondary stage added and modern science lab opened' },
    { year: '2018', title: 'Quality Certification', desc: 'Accredited by the Ministry of Education for quality standards' },
    { year: '2021', title: 'Digital Transformation', desc: 'Parent and student portal launched' },
    { year: '2024', title: 'Major Expansion', desc: 'New building opened with increased capacity' },
    { year: '2026', title: 'A Decade of Excellence', desc: 'Celebrating over ten years of educational achievement' },
  ],
}

export function publicContent<T>(lang: Lang, map: Record<Lang, T>): T {
  return map[lang] ?? map.ar
}
