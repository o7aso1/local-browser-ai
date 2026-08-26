export function UnsupportedScreen() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="surface animate-fade-up w-full max-w-lg rounded-3xl p-8 shadow-sm">
        <p className="text-sm font-medium text-[var(--accent)]">مساعدك المحلي</p>
        <h1 className="mt-3 text-2xl font-semibold leading-relaxed">
          هذا الجهاز أو المتصفح لا يدعم التشغيل المحلي
        </h1>
        <p className="mt-4 leading-relaxed text-[var(--ink-muted)]">
          التطبيق يعتمد على WebGPU لتشغيل النموذج داخل المتصفح دون إرسال بياناتك لأي خادم.
          متصفحك الحالي لا يوفّر WebGPU، لذلك لا يمكن تشغيل الاستدلال هنا.
        </p>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm leading-relaxed">
          <p className="font-medium">جرّب أحد هذه المتصفحات:</p>
          <ul className="mt-2 list-disc space-y-1 pr-5 text-[var(--ink-muted)]">
            <li>
              <a
                className="text-[var(--accent)] underline-offset-2 hover:underline"
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noreferrer"
              >
                Google Chrome
              </a>{' '}
              (أحدث إصدار)
            </li>
            <li>
              <a
                className="text-[var(--accent)] underline-offset-2 hover:underline"
                href="https://www.microsoft.com/edge"
                target="_blank"
                rel="noreferrer"
              >
                Microsoft Edge
              </a>{' '}
              (أحدث إصدار)
            </li>
            <li>
              <a
                className="text-[var(--accent)] underline-offset-2 hover:underline"
                href="https://www.mozilla.org/firefox/"
                target="_blank"
                rel="noreferrer"
              >
                Firefox
              </a>{' '}
              مع تفعيل WebGPU من الإعدادات التجريبية إن لزم
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
