import { useState } from 'react'
import type { Persona } from '../types'
import { createId } from '../lib/storage'

const ICON_OPTIONS = ['💬', '💻', '✍️', '📚', '🧭', '🧪']

interface Props {
  personas: Persona[]
  activePersonaId: string | null
  onSave: (persona: Persona) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSelect: (id: string | null) => Promise<void>
  onBack: () => void
}

export function PersonasPanel({
  personas,
  activePersonaId,
  onSave,
  onDelete,
  onSelect,
  onBack,
}: Props) {
  const [editing, setEditing] = useState<Persona | null>(null)
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [icon, setIcon] = useState(ICON_OPTIONS[0])

  function startCreate() {
    setEditing(null)
    setName('')
    setPrompt('')
    setIcon(ICON_OPTIONS[0])
  }

  function startEdit(p: Persona) {
    setEditing(p)
    setName(p.name)
    setPrompt(p.systemPrompt)
    setIcon(p.icon || ICON_OPTIONS[0])
  }

  async function handleSave() {
    if (!name.trim() || !prompt.trim()) return
    const now = Date.now()
    const persona: Persona = editing
      ? {
          ...editing,
          name: name.trim(),
          systemPrompt: prompt.trim(),
          icon,
          updatedAt: now,
        }
      : {
          id: createId('persona'),
          name: name.trim(),
          systemPrompt: prompt.trim(),
          icon,
          createdAt: now,
          updatedAt: now,
        }
    await onSave(persona)
    setEditing(null)
    setName('')
    setPrompt('')
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
      <h1 className="text-2xl font-semibold">شخصيات مخصصة</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
        الشخصية هنا عبارة عن اسم وتعليمات أسلوب (system prompt). هذا يغيّر <strong>سلوك</strong>{' '}
        المساعد فقط، ولا يُعاد تدريب النموذج ولا يُعدَّل أوزانه.
      </p>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => void onSelect(null)}
          className={`rounded-2xl border px-4 py-2 text-sm ${
            activePersonaId == null
              ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
              : 'border-[var(--border)] bg-white/70'
          }`}
        >
          بدون شخصية مخصصة
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {personas.map((p) => (
          <li
            key={p.id}
            className={`rounded-3xl border p-4 ${
              activePersonaId === p.id
                ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                : 'border-[var(--border)] bg-white/70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-right"
                onClick={() => void onSelect(p.id)}
              >
                <p className="font-semibold">
                  {p.icon} {p.name}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-muted)]">
                  {p.systemPrompt}
                </p>
              </button>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded-xl px-2 py-1 text-xs hover:bg-black/5"
                  onClick={() => startEdit(p)}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  className="rounded-xl px-2 py-1 text-xs text-[var(--danger)] hover:bg-black/5"
                  onClick={() => {
                    if (window.confirm('حذف هذه الشخصية؟')) void onDelete(p.id)
                  }}
                >
                  حذف
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="surface mt-6 rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{editing ? 'تعديل شخصية' : 'إنشاء شخصية'}</h2>
          {editing ? (
            <button type="button" className="text-sm text-[var(--ink-muted)]" onClick={startCreate}>
              إنشاء جديدة
            </button>
          ) : null}
        </div>

        <label className="mt-4 block text-sm">
          الاسم
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: مساعد برمجة"
            className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-white px-3 py-2 outline-none focus:border-[var(--accent)]"
          />
        </label>

        <div className="mt-3">
          <p className="text-sm">أيقونة اختيارية</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ICON_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIcon(opt)}
                className={`rounded-xl border px-3 py-2 ${
                  icon === opt ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-3 block text-sm">
          تعليمات السلوك
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="مثال: أنت محرر نصوص دقيق. صحّح الأخطاء باقتضاب واقترح صياغة أوضح."
            className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-white px-3 py-2 outline-none focus:border-[var(--accent)]"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!name.trim() || !prompt.trim()}
          className="mt-4 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          حفظ الشخصية
        </button>
      </div>
    </div>
  )
}
