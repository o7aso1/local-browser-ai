import { MOBILE_MODEL_ID, getModelTier } from '../lib/models'

interface Props {
  onStart: () => void
}

export function MobileStartScreen({ onStart }: Props) {
  const model = getModelTier(MOBILE_MODEL_ID)

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="surface animate-fade-up w-full max-w-lg rounded-3xl p-8 shadow-sm">
        <p className="text-sm font-medium text-[var(--accent)]">مساعدك المحلي — جوال</p>
        <h1 className="mt-3 text-2xl font-semibold leading-relaxed">
          جاهز للتحميل على جهازك
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          على iPhone/Android نستخدم أصغر نموذج ({model?.label ?? '0.5B'}) لتجنّب تعطل
          المتصفح. التحميل يبدأ <strong>بضغطتك</strong> — أغلِق التطبيقات الأخرى أولاً.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
          <li>• أغلِق التبويبات والتطبيقات الثقيلة</li>
          <li>• التحميل الأول ~600 ميغابايت (مرة واحدة)</li>
          <li>• بعدها يعمل بدون إنترنت من نفس الرابط</li>
        </ul>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white"
        >
          ابدأ تحميل النموذج
        </button>

        <p className="mt-4 text-xs leading-relaxed text-[var(--ink-muted)]">
          إذا ظهر «Out of memory» أو «Importing module failed»، اذهب إلى إعدادات Safari ←
          متقدم ← بيانات المواقع ← احذف بيانات o7aso1.github.io ثم أعد المحاولة.
        </p>
      </div>
    </div>
  )
}
