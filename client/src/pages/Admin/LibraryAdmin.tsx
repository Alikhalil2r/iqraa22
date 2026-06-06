import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { libraryApi } from '../../api/client'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import {
  BookOpen, Plus, Search, RotateCcw, Book, Users, AlertTriangle,
  CheckCircle, Clock, Pencil, Trash2, ArrowLeft, BookMarked,
  Hash, MapPin, Globe, ChevronLeft, X, Filter, Printer
} from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['عام','علوم','رياضيات','لغة عربية','لغة إنجليزية','تاريخ','جغرافيا','فلسفة','دين','قصص','أطفال','مراجع','موسوعات','رياضة','فنون','آخر'].map(v=>({value:v,label:v}))
const LANGUAGES  = ['العربية','الإنجليزية','الفرنسية','أخرى'].map(v=>({value:v,label:v}))

const emptyBook = {
  title:'', author:'', isbn:'', category:'عام', publisher:'', publishedYear:'',
  copiesTotal:'1', shelfLocation:'', description:'', coverUrl:'', language:'العربية'
}
const emptyBorrow = { bookId:'', borrowerId:'', borrowerType:'student', dueDate:'', notes:'' }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string,{label:string;cls:string}> = {
    borrowed: {label:'معار',      cls:'bg-blue-100 text-blue-700'},
    returned: {label:'مُعاد',     cls:'bg-green-100 text-green-700'},
    overdue:  {label:'متأخر',     cls:'bg-red-100 text-red-700'},
    lost:     {label:'مفقود',     cls:'bg-gray-100 text-gray-700'},
  }
  const m = map[status] || {label:status, cls:'bg-gray-100 text-gray-600'}
  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>
}

export default function LibraryAdmin() {
  const [tab, setTab] = useState<'books'|'borrows'>('books')
  const [modal, setModal] = useState<'book'|'borrow'|'return'|null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [returnTarget, setReturnTarget] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [bookForm, setBookForm] = useState(emptyBook)
  const [borrowForm, setBorrowForm] = useState(emptyBorrow)
  const [returnForm, setReturnForm] = useState({ fineAmount: '0', notes: '' })
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const qc = useQueryClient()

  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ['library-books', filterCat, search],
    queryFn: () => libraryApi.books({ category: filterCat || undefined, search: search || undefined }).then(r => r.data),
    staleTime: 30000
  })
  const { data: borrowsData, isLoading: borrowsLoading } = useQuery({
    queryKey: ['library-borrows', filterStatus],
    queryFn: () => libraryApi.borrows({ status: filterStatus || undefined }).then(r => r.data),
    staleTime: 30000
  })
  const { data: studentsData } = useQuery({
    queryKey: ['students-select'],
    queryFn: () => fetch('/api/students', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
    staleTime: 120000
  })

  const books   = booksData?.books   || []
  const borrows = borrowsData?.borrows || []
  const bStats  = booksData?.stats   || {}
  const lStats  = borrowsData?.stats || {}
  const students = studentsData?.students || []

  const createBook = useMutation({
    mutationFn: (d: any) => libraryApi.createBook(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['library-books']}); closeModal(); toast.success('تمت إضافة الكتاب') },
    onError: () => toast.error('حدث خطأ')
  })
  const updateBook = useMutation({
    mutationFn: ({id,...d}:any) => libraryApi.updateBook(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['library-books']}); closeModal(); toast.success('تم التعديل') },
    onError: () => toast.error('حدث خطأ')
  })
  const deleteBook = useMutation({
    mutationFn: (id:string) => libraryApi.deleteBook(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['library-books']}); setDeleteTarget(null); toast.success('تم الحذف') }
  })
  const createBorrow = useMutation({
    mutationFn: (d: any) => libraryApi.borrow(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['library-books']}); qc.invalidateQueries({queryKey:['library-borrows']}); closeModal(); toast.success('تمت الإعارة') },
    onError: (e:any) => toast.error(e?.response?.data?.error || 'الكتاب غير متاح')
  })
  const returnBook = useMutation({
    mutationFn: ({id,...d}:any) => libraryApi.returnBook(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['library-books']}); qc.invalidateQueries({queryKey:['library-borrows']}); setReturnTarget(null); toast.success('تم الإرجاع') },
    onError: () => toast.error('حدث خطأ')
  })

  const closeModal = () => { setModal(null); setEditing(null); setBookForm(emptyBook); setBorrowForm(emptyBorrow) }

  const openEdit = (book: any) => {
    setEditing(book)
    setBookForm({ title:book.title, author:book.author||'', isbn:book.isbn||'', category:book.category||'عام',
      publisher:book.publisher||'', publishedYear:book.published_year||'',
      copiesTotal:String(book.copies_total||1), shelfLocation:book.shelf_location||'',
      description:book.description||'', coverUrl:book.cover_url||'', language:book.language||'العربية' })
    setModal('book')
  }

  const submitBook = () => {
    const d = { ...bookForm }
    if (!d.title.trim()) return toast.error('عنوان الكتاب مطلوب')
    if (editing) updateBook.mutate({ id: editing.id, ...d })
    else createBook.mutate(d)
  }

  const submitBorrow = () => {
    if (!borrowForm.bookId || !borrowForm.borrowerId || !borrowForm.dueDate)
      return toast.error('جميع الحقول مطلوبة')
    createBorrow.mutate(borrowForm)
  }

  const submitReturn = () => {
    if (!returnTarget) return
    returnBook.mutate({ id: returnTarget.id, fineAmount: parseFloat(returnForm.fineAmount)||0, notes: returnForm.notes })
  }

  const overdueBorrows = borrows.filter((b:any) => b.is_overdue || b.status === 'overdue')

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <BookOpen size={24} className="text-emerald-600" /> نظام المكتبة
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">إدارة الكتب والإعارة والإرجاع</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('borrow')}
            className="btn-secondary flex items-center gap-2">
            <BookMarked size={16} /> إعارة كتاب
          </button>
          <button onClick={() => setModal('book')}
            className="btn-primary flex items-center gap-2">
            <Plus size={16} /> إضافة كتاب
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'إجمالي الكتب',   value: bStats.total_books  || 0, sub:`${bStats.total_copies||0} نسخة`, color:'#6366f1', icon: Book },
          { label:'نسخ متاحة',      value: bStats.available_copies || 0, sub:'للإعارة الآن', color:'#10b981', icon: CheckCircle },
          { label:'معارة حالياً',   value: lStats.active_borrows || 0, sub:`${lStats.overdue||0} متأخرة`, color:'#0ea5e9', icon: BookMarked },
          { label:'غرامات مستحقة', value: lStats.unpaid_fines  || 0, sub:'بانتظار السداد', color:'#f97316', icon: AlertTriangle },
        ].map(k => (
          <div key={k.label} className="card flex items-start gap-3 !py-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:k.color+'18'}}>
              <k.icon size={20} style={{color:k.color}}/>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">{k.label}</p>
              <p className="text-2xl font-black" style={{color:k.color}}>{k.value}</p>
              <p className="text-[10px] text-gray-400">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue Alert */}
      {overdueBorrows.length > 0 && (
        <div className="card border-r-4 border-red-500 bg-red-50 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0"/>
          <div>
            <p className="font-black text-red-700">{overdueBorrows.length} كتاب متأخر الإرجاع</p>
            <p className="text-xs text-red-500">يُرجى التواصل مع المعيرين لاسترداد الكتب</p>
          </div>
          <button onClick={() => { setTab('borrows'); setFilterStatus('borrowed') }}
            className="mr-auto text-xs text-red-600 font-bold hover:underline flex items-center gap-1">
            عرض التفاصيل <ArrowLeft size={12}/>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { id:'books',   label:'الكتب',    icon: Book },
          { id:'borrows', label:'الإعارات', icon: BookMarked },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14}/>{t.label}
          </button>
        ))}
      </div>

      {/* Books Tab */}
      {tab === 'books' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالعنوان أو المؤلف..."
                className="input pr-9 w-full"/>
            </div>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input w-40">
              <option value="">كل التصنيفات</option>
              {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {booksLoading ? <div className="h-40 flex items-center justify-center text-gray-400">جارٍ التحميل...</div> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {books.length === 0 ? (
                <div className="col-span-4 flex flex-col items-center gap-3 py-16 text-gray-400">
                  <BookOpen size={40} className="text-gray-200"/>
                  <p className="font-bold">لا توجد كتب بعد</p>
                  <button onClick={() => setModal('book')} className="btn-primary text-sm">إضافة أول كتاب</button>
                </div>
              ) : books.map((book:any) => (
                <div key={book.id} className="card hover:shadow-md transition-all group">
                  {/* Cover */}
                  <div className="h-28 rounded-xl mb-3 flex items-center justify-center overflow-hidden"
                    style={{background: '#f0fdf4'}}>
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover rounded-xl"/>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Book size={32} className="text-emerald-400"/>
                        <span className="text-[10px] text-emerald-300 font-bold">{book.category}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-gray-800 text-sm leading-tight truncate">{book.title}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{book.author || 'مجهول'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{book.category}</span>
                    <span className="text-[10px] text-gray-400 mr-auto">
                      {book.copies_available}/{book.copies_total} نسخة
                    </span>
                  </div>
                  {book.shelf_location && (
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin size={9}/>{book.shelf_location}
                    </p>
                  )}
                  <div className="flex gap-1.5 mt-3">
                    <button onClick={() => openEdit(book)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Pencil size={11}/>تعديل
                    </button>
                    <button onClick={() => { setBorrowForm({...emptyBorrow, bookId: book.id}); setModal('borrow') }}
                      disabled={book.copies_available < 1}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <BookMarked size={11}/>إعارة
                    </button>
                    <button onClick={() => setDeleteTarget(book)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Borrows Tab */}
      {tab === 'borrows' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="input w-44">
              <option value="">كل الإعارات</option>
              <option value="borrowed">معارة حالياً</option>
              <option value="returned">مُعادة</option>
              <option value="overdue">متأخرة</option>
              <option value="lost">مفقودة</option>
            </select>
          </div>
          {borrowsLoading ? <div className="h-40 flex items-center justify-center text-gray-400">جارٍ التحميل...</div> : (
            borrows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                <BookMarked size={40} className="text-gray-200"/>
                <p className="font-bold">لا توجد إعارات</p>
              </div>
            ) : (
              <div className="card overflow-hidden !p-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['الكتاب','المعير','تاريخ الإعارة','تاريخ الإرجاع المتوقع','الحالة',''].map(h=>(
                        <th key={h} className="text-right text-[11px] font-black text-gray-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {borrows.map((b:any) => (
                      <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${b.is_overdue ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-black text-gray-800">{b.book_title}</p>
                          <p className="text-[10px] text-gray-400">{b.author}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-gray-700">{b.borrower_name}</p>
                          <p className="text-[10px] text-gray-400">{b.borrower_number}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {b.borrow_date ? new Date(b.borrow_date).toLocaleDateString('ar-OM') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${b.is_overdue ? 'text-red-600' : 'text-gray-600'}`}>
                            {b.due_date ? new Date(b.due_date).toLocaleDateString('ar-OM') : '—'}
                          </span>
                          {b.is_overdue && <span className="block text-[10px] text-red-500 font-bold">متأخر!</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={b.status}/></td>
                        <td className="px-4 py-3">
                          {b.status === 'borrowed' && (
                            <button onClick={() => { setReturnTarget(b); setReturnForm({fineAmount:'0',notes:''}) }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">
                              <RotateCcw size={11}/>إرجاع
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* Book Modal */}
      <Modal open={modal==='book'} onClose={closeModal}
        title={editing ? 'تعديل كتاب' : 'إضافة كتاب جديد'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <FormField label="عنوان الكتاب *"><Input value={bookForm.title} onChange={e=>setBookForm(p=>({...p,title:e.target.value}))}/></FormField>
            </div>
            <FormField label="المؤلف"><Input value={bookForm.author} onChange={e=>setBookForm(p=>({...p,author:e.target.value}))}/></FormField>
            <FormField label="ISBN"><Input value={bookForm.isbn} onChange={e=>setBookForm(p=>({...p,isbn:e.target.value}))}/></FormField>
            <FormField label="التصنيف"><Select value={bookForm.category} onChange={e=>setBookForm(p=>({...p,category:e.target.value}))} options={CATEGORIES}/></FormField>
            <FormField label="اللغة"><Select value={bookForm.language} onChange={e=>setBookForm(p=>({...p,language:e.target.value}))} options={LANGUAGES}/></FormField>
            <FormField label="الناشر"><Input value={bookForm.publisher} onChange={e=>setBookForm(p=>({...p,publisher:e.target.value}))}/></FormField>
            <FormField label="سنة النشر"><Input type="number" value={bookForm.publishedYear} onChange={e=>setBookForm(p=>({...p,publishedYear:e.target.value}))}/></FormField>
            <FormField label="عدد النسخ"><Input type="number" value={bookForm.copiesTotal} onChange={e=>setBookForm(p=>({...p,copiesTotal:e.target.value}))}/></FormField>
            <FormField label="رقم الرف"><Input value={bookForm.shelfLocation} onChange={e=>setBookForm(p=>({...p,shelfLocation:e.target.value}))}/></FormField>
            <div className="col-span-2">
              <FormField label="رابط الغلاف"><Input value={bookForm.coverUrl} onChange={e=>setBookForm(p=>({...p,coverUrl:e.target.value}))} placeholder="https://..."/></FormField>
            </div>
            <div className="col-span-2">
              <FormField label="ملاحظات"><Textarea value={bookForm.description} onChange={e=>setBookForm(p=>({...p,description:e.target.value}))}/></FormField>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} className="btn-secondary">إلغاء</button>
            <button onClick={submitBook} disabled={createBook.isPending||updateBook.isPending} className="btn-primary">
              {editing ? 'حفظ التعديلات' : 'إضافة الكتاب'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Borrow Modal */}
      <Modal open={modal==='borrow'} onClose={closeModal} title="إعارة كتاب">
        <div className="space-y-3">
          <FormField label="الكتاب *">
            <select value={borrowForm.bookId} onChange={e=>setBorrowForm(p=>({...p,bookId:e.target.value}))} className="input w-full">
              <option value="">اختر كتاباً...</option>
              {books.filter((b:any)=>b.copies_available>0).map((b:any)=>(
                <option key={b.id} value={b.id}>{b.title} — ({b.copies_available} نسخة متاحة)</option>
              ))}
            </select>
          </FormField>
          <FormField label="الطالب *">
            <select value={borrowForm.borrowerId} onChange={e=>setBorrowForm(p=>({...p,borrowerId:e.target.value,borrowerType:'student'}))} className="input w-full">
              <option value="">اختر طالباً...</option>
              {students.map((s:any)=>(
                <option key={s.id} value={s.id}>{s.name} — {s.class_name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="تاريخ الإرجاع المتوقع *">
            <input type="date" value={borrowForm.dueDate} onChange={e=>setBorrowForm(p=>({...p,dueDate:e.target.value}))}
              className="input w-full" min={new Date().toISOString().split('T')[0]}/>
          </FormField>
          <FormField label="ملاحظات"><Textarea value={borrowForm.notes} onChange={e=>setBorrowForm(p=>({...p,notes:e.target.value}))}/></FormField>
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="btn-secondary">إلغاء</button>
            <button onClick={submitBorrow} disabled={createBorrow.isPending} className="btn-primary">تأكيد الإعارة</button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      {returnTarget && (
        <Modal open={!!returnTarget} onClose={()=>setReturnTarget(null)} title="إرجاع كتاب">
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <p className="font-black text-emerald-800">{returnTarget.book_title}</p>
              <p className="text-sm text-emerald-600">المعير: {returnTarget.borrower_name}</p>
              {returnTarget.is_overdue && (
                <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1">
                  <AlertTriangle size={12}/> متأخر عن الموعد — قد تُطبق غرامة
                </p>
              )}
            </div>
            <FormField label="مبلغ الغرامة (ر.ع.)">
              <Input type="number" value={returnForm.fineAmount} onChange={e=>setReturnForm(p=>({...p,fineAmount:e.target.value}))}/>
            </FormField>
            <FormField label="ملاحظات"><Textarea value={returnForm.notes} onChange={e=>setReturnForm(p=>({...p,notes:e.target.value}))}/></FormField>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setReturnTarget(null)} className="btn-secondary">إلغاء</button>
              <button onClick={submitReturn} disabled={returnBook.isPending} className="btn-primary flex items-center gap-2">
                <RotateCcw size={14}/> تأكيد الإرجاع
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget} title="حذف كتاب"
        message={`هل أنت متأكد من حذف "${deleteTarget?.title}"؟`}
        onConfirm={() => deleteBook.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteBook.isPending}
      />
    </div>
  )
}
