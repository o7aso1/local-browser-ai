import { MODEL_TIERS } from '../lib/models'
import { getModelBlockReason, isMobileDevice } from '../lib/device'

interface Props {
  selectedModelId: string
  busy: boolean
  onSelect: (modelId: string) => void
  onBack: () => void
}

export function ModelsPanel({ selectedModelId, busy, onSelect, onBack }: Props) {
  const onMobile = isMobileDevice()

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-4 md:p-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
      >
        ← العودة للمحادثة
      </button>
      <h1 className="text-2xl font-semibold">اختيار النموذج</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
        يمكنك التبديل بين النماذج في أي وقت خارج أثناء توليد رد. المحادثات المحفوظة تبقى كما هي.
      </p>

      {onMobile ? (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          أنت على جهاز جوال. يعمل فقط نموذج «جوال — الأصغر (0.5B)». النماذج الأكبر تسبب خطأ Out
          of memory على iPhone وChrome.
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {MODEL_TIERS.map((model) => {
          const active = model.id === selectedModelId
          const blockReason = getModelBlockReason(model.id)
          const disabled = busy || active || Boolean(blockReason)

          return (
            <button
              key={model.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(model.id)}
              className={`w-full rounded-3xl border p-5 text-right transition ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : blockReason
                    ? 'border-[var(--border)] bg-black/3 opacity-70'
                    : 'border-[var(--border)] bg-white/70 hover:bg-white'
              } disabled:opacity-60`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{model.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                    {model.tradeoff}
                  </p>
                  <p className="mt-2 text-xs text-[var(--ink-muted)]">
                    {model.approxSize} · {model.vramHint}
                  </p>
                  {blockReason ? (
                    <p className="mt-2 text-xs font-medium text-amber-800">{blockReason}</p>
                  ) : null}
                </div>
                {active ? (
                  <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs text-white">
                    الحالي
                  </span>
                ) : blockReason ? (
                  <span className="rounded-full border border-amber-300 px-2.5 py-1 text-xs text-amber-800">
                    غير متاح
                  </span>
                ) : (
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs">
                    اختيار
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
