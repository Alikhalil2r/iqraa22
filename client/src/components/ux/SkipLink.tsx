export default function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      تخطي إلى المحتوى الرئيسي
    </a>
  )
}
