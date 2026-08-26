import { useEffect, useRef, useState } from 'react'
import {
  buildBackup,
  downloadBackup,
  formatBytes,
  importBackupFromFile,
} from '../lib/backup'
import {
  clearAllCaches,
  clearAppData,
  estimateCacheBytes,
  getStorageEstimate,
} from '../lib/storage'
import { unloadEngine } from '../lib/webllm'

interface Props {
  onBack: () => void
  onDataChanged: () => Promise<unknown>
}

export function SettingsPanel({ onBack, onDataChanged }: Props) {
  const [chatBytes, setChatBytes] = useState(0)
  const [personaBytes, setPersonaBytes] = useState(0)
  const [cacheBytes, setCacheBytes] = useState(0)
  const [totalUsage, setTotalUsage] = useState(0)
  const [quota, setQuota] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function refreshStats() {
    const [estimate, cache] = await Promise.all([
      getStorageEstimate(),
      estimateCacheBytes(),
    ])
    setChatBytes(estimate.chatBytes)
    setPersonaBytes(estimate.personaBytes)
    setTotalUsage(estimate.usage)
    setQuota(estimate.quota)
    setCacheBytes(cache)
  }

  useEffect(() => {
    void refreshStats()
  }, [])

  async function handleExport() {
    setBusy(true)
    setMessage(null)
    try {
      const payload = await buildBackup()
      downloadBackup(payload)
      setMessage('تم تنزيل ملف النسخة الاحتياطية.')
    } catch {
      setMessage('تعذّر التصدير.')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file: File) {
    setBusy(true)
    setMessage(null)
    try {
      await importBackupFromFile(file)
      await onDataChanged()
      await refreshStats()
      setMessage('تم استيراد النسخة الاحتياطية بنجاح.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'تعذّر الاستيراد.')
    } finally {
      setBusy(false)
    }
  }

  async function handleWipe() {
    const ok = window.confirm(
      'سيتم مسح المحادثات والشخصيات والإعدادات وذاكرة التخزين المؤقت للنماذج من هذا المتصفح. المتابعة؟',
    )
    if (!ok) return
    const again = window.confirm('تأكيد أخير: مسح الكل بلا رجعة على هذا الجهاز؟')
    if (!again) return

    setBusy(true)
    setMessage(null)
    try {
      await unloadEngine()
      await clearAppData()
      await clearAllCaches()
      await onDataChanged()
      await refreshStats()
      setMessage('تم مسح البيانات المحلية.')
    } catch {
      setMessage('حدث خطأ أثناء المسح.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-4 md:p-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
      >
        ← العودة للمحادثة
      </button>
      <h1 className="text-2xl font-semibold">التخزين والنسخ الاحتياطي</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
        كل الأرقام أدناه تخص هذا المتصفح على هذا الجهاز فقط. لا توجد نسخة على خادم.
      </p>

      <div className="surface mt-6 space-y-3 rounded-3xl p-5 text-sm">
        <Stat label="حجم المحادثات" value={formatBytes(chatBytes)} />
        <Stat label="حجم الشخصيات" value={formatBytes(personaBytes)} />
        <Stat
          label="ذاكرة التخزين المؤقت (النماذج وملفات التطبيق)"
          value={formatBytes(cacheBytes)}
        />
        <Stat
          label="إجمالي ما يقدّره المتصفح"
          value={`${formatBytes(totalUsage)}${quota ? ` من ${formatBytes(quota)}` : ''}`}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleExport()}
          className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          تصدير نسخة احتياطية
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          استيراد نسخة احتياطية
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImport(file)
            e.target.value = ''
          }}
        />
      </div>

      <div className="mt-8 rounded-3xl border border-red-200 bg-red-50/70 p-5">
        <h2 className="font-semibold text-[var(--danger)]">مسح الكل</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          يحذف المحادثات والشخصيات والإعدادات وذاكرة النموذج المخزّنة محلياً. ستحتاج لإعادة تجهيز
          النموذج عند الاستخدام التالي.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleWipe()}
          className="mt-4 rounded-2xl bg-[var(--danger)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          مسح الكل
        </button>
      </div>

      {message ? (
        <p className="mt-4 text-sm text-[var(--ink-muted)]" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
      <span className="text-[var(--ink-muted)]">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}
