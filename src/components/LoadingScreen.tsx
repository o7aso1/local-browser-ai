import { isMobileDevice } from '../lib/device'

interface Props {
  progress: number
  text: string
  modelLabel: string
  fromCache: boolean
}

export function LoadingScreen({ progress, text, modelLabel, fromCache }: Props) {
  const pct = Math.round(progress * 100)
  const onMobile = isMobileDevice()

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="surface animate-fade-up w-full max-w-lg rounded-3xl p-8 shadow-sm">
        <p className="text-sm font-medium text-[var(--accent)]">مساعدك المحلي</p>
        <h1 className="mt-3 text-2xl font-semibold leading-relaxed tracking-tight">
          جاري تجهيز مساعدك الخاص — هذا يصير مرة وحدة بس
        </h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          {fromCache
            ? 'وجدنا النموذج محفوظاً على جهازك. جاري تحميله إلى الذاكرة…'
            : onMobile
              ? 'التحميل الأول يأخذ وقتاً (مرة واحدة). نستخدم أصغر نموذج (0.5B) لأن iPhone لا يتحمل الأكبر.'
              : 'التحميل الأول يأخذ وقتاً (مرة واحدة فقط). بعدها يعمل التطبيق بسرعة حتى بدون إنترنت.'}
        </p>

        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--ink-muted)]">{modelLabel}</span>
            <span className="font-medium tabular-nums">{pct}%</span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-[rgba(15,118,110,0.12)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="تقدم تجهيز النموذج"
          >
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)] animate-pulse-soft">
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}
