import { Clock, Headphones, ShieldCheck, MessageSquare, RefreshCw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

type Variant = 'school' | 'platform' | 'compact'

export default function ServiceQualityStrip({ variant = 'school', className = '' }: { variant?: Variant; className?: string }) {
  const { t } = useLanguage()
  const compact = variant === 'compact'

  const schoolItems = [
    { icon: Clock, label: t('site.quality.reply'), sub: t('site.quality.replySub') },
    { icon: Headphones, label: t('site.quality.support'), sub: t('site.quality.supportSub') },
    { icon: ShieldCheck, label: t('site.quality.secure'), sub: t('site.quality.secureSub') },
    { icon: MessageSquare, label: t('site.quality.track'), sub: t('site.quality.trackSub') },
  ]

  const platformItems = [
    { icon: Clock, label: t('site.quality.reply'), sub: t('site.quality.replySub') },
    { icon: Headphones, label: t('site.quality.support'), sub: t('site.quality.supportSub') },
    { icon: ShieldCheck, label: t('site.quality.warranty'), sub: t('site.quality.warrantySub') },
    { icon: RefreshCw, label: t('site.quality.ticket'), sub: t('site.quality.ticketSub') },
  ]

  const items = variant === 'platform' ? platformItems : schoolItems

  return (
    <div className={`service-quality-strip ${compact ? 'service-quality-compact' : ''} ${className}`.trim()}>
      {items.map(({ icon: Icon, label, sub }) => (
        <div key={label} className="service-quality-item">
          <div className="service-quality-icon">
            <Icon size={compact ? 16 : 18} />
          </div>
          <div>
            <p className="service-quality-label">{label}</p>
            {!compact && <p className="service-quality-sub">{sub}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
