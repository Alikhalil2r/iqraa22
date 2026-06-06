import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { useParentChild } from '../../context/ParentChildContext'
import { Bus, Phone, MapPin, Clock, User } from 'lucide-react'

export default function ParentBus() {
  const { childParams, selectedChildId } = useParentChild()
  const { data, isLoading } = useQuery({
    queryKey: ['parent-bus', selectedChildId],
    queryFn: () => parentApi.bus(childParams).then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
    </div>
  )

  const bus = data?.bus
  const pickup = data?.pickup

  if (!bus) return (
    <div className="space-y-5">
      <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
        <Bus size={22} style={{ color: 'var(--color-primary)' }} />
        الحافلة المدرسية
      </h1>
      <div className="card text-center py-16">
        <Bus size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-bold">{data?.message || 'الطالب غير مسجل في حافلة مدرسية'}</p>
        <p className="text-sm text-gray-400 mt-2">تواصل مع الإدارة لتسجيل طفلك في خدمة النقل</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Bus size={22} style={{ color: 'var(--color-primary)' }} />
          الحافلة المدرسية
        </h1>
        <p className="text-sm text-gray-500 mt-1">معلومات الحافلة والمسار — {data?.childName}</p>
      </div>

      <div className="rounded-3xl text-white p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Bus size={32} />
          </div>
          <div>
            <p className="text-white/70 text-xs">رقم الحافلة</p>
            <p className="text-3xl font-black">{bus.bus_number}</p>
            {bus.plate_number && <p className="text-white/60 text-sm mt-1">{bus.plate_number}</p>}
          </div>
          <div className="mr-auto text-left">
            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${bus.is_active ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30'}`}>
              {bus.is_active ? 'نشطة' : 'غير نشطة'}
            </span>
          </div>
        </div>
        {bus.route_name && (
          <div className="mt-4 bg-white/10 rounded-xl p-3">
            <p className="text-white/60 text-[10px] flex items-center gap-1"><MapPin size={12} /> المسار</p>
            <p className="font-black">{bus.route_name}</p>
            {bus.route_description && <p className="text-white/70 text-xs mt-1">{bus.route_description}</p>}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-black text-gray-700 mb-3 flex items-center gap-2"><Clock size={16} /> المواعيد</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">الصباح (الذهاب)</span>
              <span className="font-black">{bus.morning_time?.slice(0, 5) || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">الظهر (العودة)</span>
              <span className="font-black">{bus.afternoon_time?.slice(0, 5) || '—'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-black text-gray-700 mb-3 flex items-center gap-2"><User size={16} /> طاقم الحافلة</h3>
          <div className="space-y-3">
            {bus.driver_name && (
              <div>
                <p className="text-xs text-gray-400">السائق</p>
                <p className="font-bold text-sm">{bus.driver_name}</p>
                {bus.driver_phone && (
                  <a href={`tel:${bus.driver_phone}`} className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                    <Phone size={11} /> {bus.driver_phone}
                  </a>
                )}
              </div>
            )}
            {bus.supervisor_name && (
              <div>
                <p className="text-xs text-gray-400">المشرف</p>
                <p className="font-bold text-sm">{bus.supervisor_name}</p>
                {bus.supervisor_phone && (
                  <a href={`tel:${bus.supervisor_phone}`} className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                    <Phone size={11} /> {bus.supervisor_phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {pickup && (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-3 flex items-center gap-2"><MapPin size={16} /> نقاط الصعود والنزول</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {(pickup.pickup_location || pickup.pickup_time) && (
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-[10px] font-black text-green-700 mb-1">صعود</p>
                {pickup.pickup_location && <p className="font-bold text-sm">{pickup.pickup_location}</p>}
                {pickup.pickup_time && <p className="text-xs text-gray-500 mt-1">{pickup.pickup_time?.slice(0, 5)}</p>}
              </div>
            )}
            {(pickup.dropoff_location || pickup.dropoff_time) && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-[10px] font-black text-blue-700 mb-1">نزول</p>
                {pickup.dropoff_location && <p className="font-bold text-sm">{pickup.dropoff_location}</p>}
                {pickup.dropoff_time && <p className="text-xs text-gray-500 mt-1">{pickup.dropoff_time?.slice(0, 5)}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
