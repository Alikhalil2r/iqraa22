import React, { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Printer, FileText, Users, UserCheck, GraduationCap, ChevronLeft, Download, BookOpen, Award, DollarSign } from 'lucide-react'
import { exportToCSV } from '../../components/ExportButton'
import { printCustom } from '../../utils/printExport'
import { feeStatusLabel, formatOMR } from '../../utils/reportUtils'

const api = (path: string) =>
  axios.get(`/api${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.data)

const REPORT_TYPES = [
  { id: 'student_result', label: 'شهادة نتائج طالب', icon: Award, desc: 'كشف درجات الطالب لجميع المواد مع التحليل' },
  { id: 'attendance_sheet', label: 'كشف الحضور الشهري', icon: UserCheck, desc: 'تقرير حضور وغياب فصل دراسي لشهر محدد' },
  { id: 'class_list', label: 'قائمة الفصل', icon: Users, desc: 'قائمة بأسماء طلاب الفصل وبياناتهم الأساسية' },
  { id: 'employee_list', label: 'كشف الموظفين', icon: GraduationCap, desc: 'قائمة بجميع الموظفين النشطين وبياناتهم' },
  { id: 'fees_report', label: 'كشف الرسوم المالية', icon: DollarSign, desc: 'تقرير رسوم الطلاب — مستحق، محصل، ومتبقي' },
]

const GRADE_LABEL = (g: number) => {
  if (g >= 90) return { ar: 'ممتاز', en: 'Excellent', color: '#16a34a' }
  if (g >= 80) return { ar: 'جيد جداً', en: 'Very Good', color: '#2563eb' }
  if (g >= 70) return { ar: 'جيد', en: 'Good', color: '#d97706' }
  if (g >= 60) return { ar: 'مقبول', en: 'Pass', color: '#9333ea' }
  return { ar: 'ضعيف', en: 'Fail', color: '#dc2626' }
}

export default function PDFReports() {
  const [reportType, setReportType] = useState('student_result')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [showPreview, setShowPreview] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const { data: studentsData } = useQuery({ queryKey: ['pdf-students'], queryFn: () => api('/students?limit=500') })
  const { data: classesData }  = useQuery({ queryKey: ['pdf-classes'],  queryFn: () => api('/students/classes') })
  const { data: employeesData }= useQuery({ queryKey: ['pdf-employees'],queryFn: () => api('/employees?limit=500') })
  const { data: settingsData } = useQuery({ queryKey: ['theme'],        queryFn: () => api('/settings/theme') })

  const { data: studentGrades } = useQuery({
    queryKey: ['pdf-grades', selectedStudent],
    queryFn: () => api(`/grades/report/${selectedStudent}`),
    enabled: !!selectedStudent && reportType === 'student_result',
  })
  const { data: attendanceData } = useQuery({
    queryKey: ['pdf-attendance', selectedClass, selectedMonth],
    queryFn: () => api(`/attendance?classId=${selectedClass}&month=${selectedMonth}&limit=1000`),
    enabled: !!selectedClass && reportType === 'attendance_sheet',
  })

  const { data: feesData } = useQuery({
    queryKey: ['pdf-fees'],
    queryFn: () => api('/reports/fees-summary'),
    enabled: reportType === 'fees_report',
  })

  const students  = studentsData?.students || []
  const classes   = classesData?.classes || []
  const employees = employeesData?.employees || []
  const settings  = settingsData || {}
  const schoolName = settings.school_name || 'المدرسة'
  const primaryColor = settings.primary_color || '#1e40af'

  const selStudent = students.find((s: any) => s.id === selectedStudent)
  const studentGradeList: any[] = studentGrades?.grades || []
  const attendanceList: any[] = attendanceData?.attendance || []

  const classStudents = selectedClass
    ? students.filter((s: any) => s.class_id === selectedClass || s.class_name === selectedClass)
    : []

  const totalScore = studentGradeList.reduce((a: number, g: any) => a + Number(g.score || 0), 0)
  const maxScore   = studentGradeList.reduce((a: number, g: any) => a + Number(g.max_score || 100), 0)
  const avgPct     = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  const gradeInfo  = GRADE_LABEL(avgPct)

  const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const monthLabel = selectedMonth
    ? `${MONTHS_AR[parseInt(selectedMonth.split('-')[1])-1]} ${selectedMonth.split('-')[0]}`
    : ''

  const feesReport: any[] = feesData?.report || []
  const feesTotals = feesData?.totals || {}

  const handlePrint = () => {
    if (!printRef.current) return
    printCustom('تقرير المدرسة', printRef.current.innerHTML)
  }

  const handleExportCsv = () => {
    if (reportType === 'employee_list') {
      exportToCSV(employees.filter((e: any) => e.status === 'active'), [
        { key: 'name', label: 'الاسم' }, { key: 'position', label: 'المنصب' },
        { key: 'department', label: 'القسم' }, { key: 'phone', label: 'الهاتف' }, { key: 'email', label: 'البريد' },
      ], 'كشف_الموظفين')
    } else if (reportType === 'class_list') {
      exportToCSV(classStudents, [
        { key: 'name', label: 'الاسم' }, { key: 'student_number', label: 'الرقم' },
        { key: 'class_name', label: 'الفصل' }, { key: 'gender', label: 'الجنس' },
      ], 'قائمة_الفصل')
    } else if (reportType === 'fees_report') {
      exportToCSV(feesReport, [
        { key: 'student_name', label: 'الطالب' }, { key: 'fee_type', label: 'النوع' },
        { key: 'amount', label: 'المبلغ' }, { key: 'paid_amount', label: 'المدفوع' },
        { key: 'remaining', label: 'المتبقي' }, { key: 'status', label: 'الحالة' },
      ], 'كشف_الرسوم')
    }
  }

  return (
    <div className="space-y-6 pdf-reports-page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: primaryColor }}>
              <Printer size={15} />
            </div>
            <h1 className="text-2xl font-black text-gray-800">تقارير الطباعة</h1>
          </div>
          <p className="text-gray-500 text-sm">أنشئ وطباعة تقارير احترافية بصيغة PDF</p>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Type Selector */}
        <div className="card">
          <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={16} style={{ color: primaryColor }} /> نوع التقرير
          </h2>
          <div className="space-y-2">
            {REPORT_TYPES.map(rt => (
              <button key={rt.id} onClick={() => { setReportType(rt.id); setShowPreview(false) }}
                className={`w-full text-right px-4 py-3 rounded-xl border-2 transition-all ${
                  reportType === rt.id ? 'border-current text-white shadow-md' : 'border-gray-100 text-gray-600 hover:border-gray-200 bg-gray-50'
                }`}
                style={reportType === rt.id ? { background: primaryColor, borderColor: primaryColor } : {}}>
                <div className="flex items-center gap-3">
                  <rt.icon size={18} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-black text-sm">{rt.label}</p>
                    <p className={`text-xs mt-0.5 ${reportType === rt.id ? 'opacity-75' : 'text-gray-400'}`}>{rt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="card">
          <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <ChevronLeft size={16} style={{ color: primaryColor }} /> الإعدادات
          </h2>

          {(reportType === 'student_result') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اختر الطالب</label>
                <select value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setShowPreview(false) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  <option value="">-- اختر طالباً --</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.class_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(reportType === 'attendance_sheet' || reportType === 'class_list') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اختر الفصل</label>
                <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setShowPreview(false) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  <option value="">-- اختر الفصل --</option>
                  {classes.map((c: any) => (
                    <option key={c.id || c.name} value={c.id || c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              {reportType === 'attendance_sheet' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الشهر</label>
                  <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              )}
            </div>
          )}

          {reportType === 'employee_list' && (
            <p className="text-sm text-gray-400 py-4 text-center">سيتم تضمين جميع الموظفين النشطين في التقرير</p>
          )}

          {reportType === 'fees_report' && (
            <p className="text-sm text-gray-400 py-4 text-center">تقرير شامل لجميع رسوم الطلاب — {feesReport.length} سجل</p>
          )}

          <div className="mt-6 space-y-2">
            <button onClick={() => setShowPreview(true)}
              className="w-full py-2.5 rounded-xl font-black text-sm text-white transition-all hover:opacity-90"
              style={{ background: primaryColor }}>
              معاينة التقرير
            </button>
            {showPreview && (
              <>
                <button onClick={handlePrint}
                  className="w-full py-2.5 rounded-xl font-black text-sm bg-gray-800 text-white flex items-center justify-center gap-2 hover:bg-gray-700 transition-all">
                  <Printer size={15} /> طباعة / حفظ PDF
                </button>
                {['employee_list', 'class_list', 'fees_report'].includes(reportType) && (
                  <button onClick={handleExportCsv}
                    className="w-full py-2.5 rounded-xl font-black text-sm border border-gray-200 text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                    <Download size={15} /> تصدير CSV
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen size={16} style={{ color: primaryColor }} /> ملخص البيانات
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'إجمالي الطلاب', value: students.length, color: '#6366f1' },
              { label: 'الموظفون النشطون', value: employees.filter((e: any) => e.status === 'active').length, color: '#10b981' },
              { label: 'الفصول الدراسية', value: classes.length, color: '#f59e0b' },
              { label: 'التقارير المتاحة', value: REPORT_TYPES.length, color: '#ec4899' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl text-xs text-gray-500 bg-blue-50 text-center leading-relaxed">
            اضغط "معاينة التقرير" ثم "طباعة / حفظ PDF" لحفظ التقرير بصيغة PDF باستخدام خيار "حفظ كـ PDF" في نافذة الطباعة
          </div>
        </div>
      </div>

      {/* ════════════════ PRINT AREA ════════════════ */}
      {showPreview && (
        <div className="print-area" ref={printRef}>
          {reportType === 'student_result' && selStudent && (
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <StudentResultCard
                student={selStudent} grades={studentGradeList}
                totalScore={totalScore} maxScore={maxScore} avgPct={avgPct} gradeInfo={gradeInfo}
                schoolName={schoolName} primaryColor={primaryColor}
              />
            </div>
          )}
          {reportType === 'student_result' && !selStudent && (
            <div className="card text-center py-12 text-gray-400">
              <Award size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">اختر طالباً لعرض شهادة النتائج</p>
            </div>
          )}

          {reportType === 'attendance_sheet' && (
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <AttendanceSheet
                students={classStudents} attendance={attendanceList}
                month={monthLabel} className={classes.find((c: any) => (c.id || c.name) === selectedClass)?.name || selectedClass}
                schoolName={schoolName} primaryColor={primaryColor}
              />
            </div>
          )}

          {reportType === 'class_list' && (
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <ClassList
                students={classStudents}
                className={classes.find((c: any) => (c.id || c.name) === selectedClass)?.name || selectedClass}
                schoolName={schoolName} primaryColor={primaryColor}
              />
            </div>
          )}

          {reportType === 'employee_list' && (
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <EmployeeList
                employees={employees.filter((e: any) => e.status === 'active')}
                schoolName={schoolName} primaryColor={primaryColor}
              />
            </div>
          )}

          {reportType === 'fees_report' && (
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <FeesReport fees={feesReport} totals={feesTotals} schoolName={schoolName} primaryColor={primaryColor} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   PRINT TEMPLATES
═══════════════════════════════════════════════ */

function PrintHeader({ schoolName, primaryColor, title, subtitle }: any) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`, color: 'white', padding: '28px 40px', textAlign: 'center' }}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, fontFamily: 'Cairo, Arial' }}>{schoolName}</h1>
      <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 13 }}>نظام إدارة المدرسة</p>
      <div style={{ margin: '16px auto 0', width: 60, height: 3, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
      <h2 style={{ margin: '16px 0 4px', fontSize: 20, fontWeight: 900 }}>{title}</h2>
      {subtitle && <p style={{ margin: 0, opacity: 0.85, fontSize: 13 }}>{subtitle}</p>}
    </div>
  )
}

function PrintFooter({ primaryColor }: any) {
  return (
    <div style={{ padding: '20px 40px', borderTop: '2px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#9ca3af' }}>
      <span>تاريخ الإصدار: {new Date().toLocaleDateString('ar-OM')}</span>
      <span style={{ color: primaryColor, fontWeight: 700 }}>نظام إدارة المدرسة</span>
      <span>توقيع المدير: ________________</span>
    </div>
  )
}

function StudentResultCard({ student, grades, totalScore, maxScore, avgPct, gradeInfo, schoolName, primaryColor }: any) {
  return (
    <div style={{ fontFamily: 'Cairo, Arial, sans-serif', direction: 'rtl', background: 'white', minHeight: 600 }}>
      <PrintHeader schoolName={schoolName} primaryColor={primaryColor}
        title="شهادة النتائج الدراسية"
        subtitle={`العام الدراسي ${new Date().getFullYear() - 1}/${new Date().getFullYear()}`} />

      <div style={{ padding: '28px 40px' }}>
        {/* Student Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28, background: '#f9fafb', borderRadius: 12, padding: 20 }}>
          {[
            { label: 'اسم الطالب', value: student.name },
            { label: 'الفصل الدراسي', value: student.class_name },
            { label: 'رقم الطالب', value: student.student_id || student.id?.slice(0,8) },
            { label: 'تاريخ الميلاد', value: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('ar-OM') : '—' },
            { label: 'الجنس', value: student.gender === 'male' ? 'ذكر' : student.gender === 'female' ? 'أنثى' : '—' },
            { label: 'رقم الهوية', value: student.national_id || '—' },
          ].map(f => (
            <div key={f.label} style={{ background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: 0, fontSize: 10, color: '#9ca3af', fontWeight: 700 }}>{f.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 900, color: '#1f2937' }}>{f.value}</p>
            </div>
          ))}
        </div>

        {/* Grades Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 13 }}>
          <thead>
            <tr style={{ background: primaryColor, color: 'white' }}>
              {['المادة الدراسية','الفصل الأول','الفصل الثاني','المجموع','النسبة','التقدير'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>لا توجد درجات مسجّلة</td></tr>
            ) : grades.map((g: any, i: number) => {
              const pct = g.max_score > 0 ? Math.round((g.score / g.max_score) * 100) : 0
              const gi = GRADE_LABEL(pct)
              return (
                <tr key={g.id ?? g.subject_name ?? i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>{g.subject_name || g.subject_id}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>{g.score}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>—</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 900 }}>{g.score}/{g.max_score}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: gi.color, fontWeight: 700 }}>{pct}%</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{ background: gi.color + '18', color: gi.color, padding: '3px 10px', borderRadius: 20, fontWeight: 900, fontSize: 11 }}>{gi.ar}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'المجموع الكلي', value: `${totalScore}/${maxScore}`, color: primaryColor },
            { label: 'النسبة المئوية', value: `${avgPct}%`, color: gradeInfo.color },
            { label: 'التقدير العام', value: gradeInfo.ar, color: gradeInfo.color },
          ].map(s => (
            <div key={s.label} style={{ background: s.color + '12', border: `2px solid ${s.color}30`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontWeight: 700 }}>{s.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Signature Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20 }}>
          {['ولي الأمر','المعلم/ة المشرف','مدير المدرسة'].map(s => (
            <div key={s} style={{ textAlign: 'center', borderTop: '2px dashed #e5e7eb', paddingTop: 12 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#374151' }}>{s}</p>
              <p style={{ margin: '8px 0 0', fontSize: 10, color: '#9ca3af' }}>التوقيع: ________________</p>
            </div>
          ))}
        </div>
      </div>
      <PrintFooter primaryColor={primaryColor} />
    </div>
  )
}

function AttendanceSheet({ students, attendance, month, className, schoolName, primaryColor }: any) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  const getStatus = (studentId: string, day: number) => {
    const rec = attendance.find((a: any) => a.person_id === studentId && new Date(a.date).getDate() === day)
    if (!rec) return ''
    return rec.status === 'present' ? '✓' : rec.status === 'absent' ? '✗' : rec.status === 'late' ? 'ت' : '—'
  }
  return (
    <div style={{ fontFamily: 'Cairo, Arial, sans-serif', direction: 'rtl', background: 'white' }}>
      <PrintHeader schoolName={schoolName} primaryColor={primaryColor}
        title="كشف الحضور والغياب الشهري" subtitle={`الفصل: ${className} — ${month}`} />
      <div style={{ padding: '20px 24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: primaryColor, color: 'white' }}>
              <th style={{ padding: '8px 10px', textAlign: 'right', minWidth: 120 }}>الطالب</th>
              {days.map(d => (
                <th key={d} style={{ padding: '8px 4px', textAlign: 'center', minWidth: 20 }}>{d}</th>
              ))}
              <th style={{ padding: '8px 6px', textAlign: 'center' }}>الغياب</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={32} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>لا يوجد طلاب</td></tr>
            ) : students.map((s: any, i: number) => {
              const absences = days.filter(d => getStatus(s.id, d) === '✗').length
              return (
                <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '7px 10px', fontWeight: 700, whiteSpace: 'nowrap' }}>{s.name}</td>
                  {days.map(d => {
                    const st = getStatus(s.id, d)
                    return (
                      <td key={d} style={{ padding: '7px 4px', textAlign: 'center', color: st === '✓' ? '#16a34a' : st === '✗' ? '#dc2626' : '#9ca3af', fontWeight: 700, fontSize: 10 }}>
                        {st}
                      </td>
                    )
                  })}
                  <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: 900, color: absences > 0 ? '#dc2626' : '#16a34a' }}>{absences}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 16, fontSize: 11, color: '#6b7280', display: 'flex', gap: 24 }}>
          <span>✓ = حاضر</span><span>✗ = غائب</span><span>ت = متأخر</span>
        </div>
      </div>
      <PrintFooter primaryColor={primaryColor} />
    </div>
  )
}

function ClassList({ students, className, schoolName, primaryColor }: any) {
  return (
    <div style={{ fontFamily: 'Cairo, Arial, sans-serif', direction: 'rtl', background: 'white' }}>
      <PrintHeader schoolName={schoolName} primaryColor={primaryColor}
        title="قائمة طلاب الفصل" subtitle={`الفصل: ${className} — ${new Date().getFullYear()}`} />
      <div style={{ padding: '24px 40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: primaryColor, color: 'white' }}>
              {['#','اسم الطالب','رقم الطالب','تاريخ الميلاد','رقم الهوية','ولي الأمر','رقم التواصل'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 900 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>لا يوجد طلاب في هذا الفصل</td></tr>
            ) : students.map((s: any, i: number) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>{s.name}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{s.student_id || s.id?.slice(0,8)}</td>
                <td style={{ padding: '10px 12px' }}>{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('ar-OM') : '—'}</td>
                <td style={{ padding: '10px 12px' }}>{s.national_id || '—'}</td>
                <td style={{ padding: '10px 12px' }}>{s.parent_name || '—'}</td>
                <td style={{ padding: '10px 12px' }}>{s.parent_phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', textAlign: 'left' }}>
          إجمالي الطلاب: <strong>{students.length}</strong>
        </p>
      </div>
      <PrintFooter primaryColor={primaryColor} />
    </div>
  )
}

function EmployeeList({ employees, schoolName, primaryColor }: any) {
  return (
    <div style={{ fontFamily: 'Cairo, Arial, sans-serif', direction: 'rtl', background: 'white' }}>
      <PrintHeader schoolName={schoolName} primaryColor={primaryColor}
        title="كشف الموظفين النشطين" subtitle={`بتاريخ ${new Date().toLocaleDateString('ar-OM')}`} />
      <div style={{ padding: '24px 40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: primaryColor, color: 'white' }}>
              {['#','اسم الموظف','المسمى الوظيفي','القسم','رقم الهاتف','البريد الإلكتروني','تاريخ التعيين'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 900 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((e: any, i: number) => (
              <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>{e.name}</td>
                <td style={{ padding: '10px 12px' }}>{e.position || '—'}</td>
                <td style={{ padding: '10px 12px' }}>{e.department || '—'}</td>
                <td style={{ padding: '10px 12px', direction: 'ltr', textAlign: 'right' }}>{e.phone || '—'}</td>
                <td style={{ padding: '10px 12px', direction: 'ltr', textAlign: 'right', fontSize: 11 }}>{e.email || '—'}</td>
                <td style={{ padding: '10px 12px' }}>{e.join_date ? new Date(e.join_date).toLocaleDateString('ar-OM') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', textAlign: 'left' }}>
          إجمالي الموظفين: <strong>{employees.length}</strong>
        </p>
      </div>
      <PrintFooter primaryColor={primaryColor} />
    </div>
  )
}

function FeesReport({ fees, totals, schoolName, primaryColor }: any) {
  return (
    <div style={{ fontFamily: 'Cairo, Arial, sans-serif', direction: 'rtl', background: 'white' }}>
      <PrintHeader schoolName={schoolName} primaryColor={primaryColor}
        title="كشف الرسوم المالية" subtitle={`المحصل: ${formatOMR(totals.total_collected)} — المتبقي: ${formatOMR(totals.outstanding)}`} />
      <div style={{ padding: '24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'إجمالي المستحق', value: formatOMR(totals.total_due), color: primaryColor },
            { label: 'المحصل', value: formatOMR(totals.total_collected), color: '#16a34a' },
            { label: 'المتبقي', value: formatOMR(totals.outstanding), color: '#dc2626' },
            { label: 'سجلات معلقة', value: totals.pending_count || 0, color: '#d97706' },
          ].map(s => (
            <div key={s.label} style={{ background: s.color + '10', border: `1px solid ${s.color}30`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: primaryColor, color: 'white' }}>
              {['#', 'الطالب', 'الفصل', 'نوع الرسوم', 'المبلغ', 'المدفوع', 'المتبقي', 'الحالة'].map(h => (
                <th key={h} style={{ padding: '10px 10px', textAlign: 'right', fontSize: 11, fontWeight: 900 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fees.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>لا توجد رسوم</td></tr>
            ) : fees.map((f: any, i: number) => {
              const st = feeStatusLabel(f.status)
              return (
                <tr key={f.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '9px 10px', color: '#9ca3af' }}>{i + 1}</td>
                  <td style={{ padding: '9px 10px', fontWeight: 700 }}>{f.student_name}</td>
                  <td style={{ padding: '9px 10px' }}>{f.class_name || '—'}</td>
                  <td style={{ padding: '9px 10px' }}>{f.fee_type}</td>
                  <td style={{ padding: '9px 10px' }}>{formatOMR(f.amount)}</td>
                  <td style={{ padding: '9px 10px', color: '#16a34a', fontWeight: 700 }}>{formatOMR(f.paid_amount)}</td>
                  <td style={{ padding: '9px 10px', color: '#dc2626', fontWeight: 700 }}>{formatOMR(f.remaining)}</td>
                  <td style={{ padding: '9px 10px' }}>
                    <span style={{ background: st.color + '18', color: st.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 900 }}>{st.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <PrintFooter primaryColor={primaryColor} />
    </div>
  )
}
