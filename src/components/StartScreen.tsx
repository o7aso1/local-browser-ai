import { isMobileDevice } from '../lib/device'

interface Props {
  onStart: () => void
}

export function StartScreen({ onStart }: Props) {
  const onMobile = isMobileDevice()
  const label = onMobile
    ? 'Transformers 0.5B (WebGPU → WASM)'
    : 'WebLLM (WebGPU) مع احتياطي Transformers'

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="surface animate-fade-up w-full max-w-lg rounded-3xl p-8 shadow-sm">
        <p className="text-sm font-medium text-[var(--accent)]">مساعدك المحلي</p>
        <h1 className="mt-3 text-2xl font-semibold leading-relaxed">
          اضغط للبدء — بدون تعليق
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          {onMobile
            ? 'على الجوال نستخدم محرك Transformers: يجرّب WebGPU أولاً، وإن فشل ينتقل تلقائياً إلى WASM — يعمل على Safari وChrome.'
            : 'على الكمبيوتر نستخدم WebLLM السريع. إن فشل، ننتقل تلقائياً إلى Transformers.'}
        </p>

        <div className="mt-4 rounded-2xl bg-black/5 px-4 py-3 text-sm">
          <span className="text-[var(--ink-muted)]">المحرك: </span>
          <span className="font-medium">{label}</span>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
          <li>• أغلِق التطبيقات الثقيلة قبل التحميل</li>
          <li>• التحميل الأول يأخذ وقتاً (مرة واحدة)</li>
          <li>• بعدها يعمل بدون إنترنت من نفس الرابط</li>
        </ul>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white"
        >
          ابدأ التحميل
        </button>
      </div>
    </div>
  )
}
