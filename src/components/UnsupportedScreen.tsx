export function UnsupportedScreen() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="surface animate-fade-up w-full max-w-lg rounded-3xl p-8 shadow-sm">
        <p className="text-sm font-medium text-[var(--accent)]">مساعدك المحلي</p>
        <h1 className="mt-3 text-2xl font-semibold leading-relaxed">
          هذا المتصفح لا يدعم التشغيل المحلي
        </h1>
        <p className="mt-4 leading-relaxed text-[var(--ink-muted)]">
          التطبيق يحتاج WebAssembly على الأقل لتشغيل نموذج داخل المتصفح. متصفحك الحالي لا
          يوفّر هذه الإمكانية.
        </p>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm leading-relaxed">
          <p className="font-medium">جرّب أحد هذه المتصفحات المحدّثة:</p>
          <ul className="mt-2 list-disc space-y-1 pr-5 text-[var(--ink-muted)]">
            <li>Google Chrome (أحدث إصدار)</li>
            <li>Microsoft Edge (أحدث إصدار)</li>
            <li>Safari على iOS 17+ أو macOS</li>
            <li>Firefox (أحدث إصدار)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
