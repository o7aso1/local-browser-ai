import { isMobileDevice } from '../lib/device'
import { MODEL_TIERS } from '../lib/models'

interface Props {
  selectedModelId: string
  busy: boolean
  onSelect: (modelId: string) => void
  onBack: () => void
}

export function ModelsPanel({ selectedModelId, busy, onSelect, onBack }: Props) {
  const onMobile = isMobileDevice()

  if (onMobile) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-4 md:p-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          ← العودة للمحادثة
        </button>
        <h1 className="text-2xl font-semibold">النموذج على الجوال</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          على iPhone/Android يُستخدم تلقائياً محرك <strong>Transformers 0.5B</strong> مع
          WebGPU ثم WASM — لا حاجة لاختيار نموذج يدوياً. هذا يضمن العمل على Safari وChrome
          بدون Out of memory.
        </p>
      </div>
    )
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
      <h1 className="text-2xl font-semibold">اختيار النموذج (كمبيوتر)</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
        إن فشل WebLLM، ينتقل التطبيق تلقائياً إلى Transformers 0.5B.
      </p>

      <div className="mt-6 space-y-3">
        {MODEL_TIERS.filter((m) => m.id !== 'onnx-community/Qwen2.5-0.5B-Instruct').map((model) => {
          const active = model.id === selectedModelId
          return (
            <button
              key={model.id}
              type="button"
              disabled={busy || active}
              onClick={() => onSelect(model.id)}
              className={`w-full rounded-3xl border p-5 text-right transition ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border)] bg-white/70 hover:bg-white'
              } disabled:opacity-60`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{model.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                    {model.tradeoff}
                  </p>
                </div>
                {active ? (
                  <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs text-white">
                    الحالي
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
