import type { ModelTier } from '../types'

/** Balanced tier — ~3B; noticeably smarter Arabic + follow-ups vs 1.5B. */
export const FAST_MODEL_ID = 'Qwen2.5-3B-Instruct-q4f16_1-MLC'

/** Stronger tier — ~7B; best quality, needs more VRAM/time. */
export const STRONG_MODEL_ID = 'Qwen2.5-7B-Instruct-q4f16_1-MLC'

/** Legacy 1.5B kept for very low-end devices. */
export const LITE_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC'

export const MODEL_TIERS: ModelTier[] = [
  {
    id: FAST_MODEL_ID,
    label: 'متوازن (موصى به)',
    tradeoff: 'توازن جيد بين السرعة والذكاء — يفهم المتابعات مثل «أقوى» و«عدّله».',
    approxSize: '~2.5 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'يحتاج نحو 2.5 غيغابايت من ذاكرة الرسم',
  },
  {
    id: STRONG_MODEL_ID,
    label: 'أقوى — للأجهزة القوية',
    tradeoff: 'أفضل جودة وبرمجة، لكن أبطأ في التحميل والرد.',
    approxSize: '~4 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'يحتاج نحو 5 غيغابايت من ذاكرة الرسم',
  },
  {
    id: LITE_MODEL_ID,
    label: 'خفيف جداً — أجهزة ضعيفة',
    tradeoff: 'أسرع تحميلاً لكن أضعف في فهم السياق والبرمجة.',
    approxSize: '~1 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'يحتاج نحو 1.6 غيغابايت من ذاكرة الرسم',
  },
]

export const DEFAULT_MODEL_ID = FAST_MODEL_ID

export function getModelTier(id: string): ModelTier | undefined {
  return MODEL_TIERS.find((m) => m.id === id)
}

export function migrateModelId(id: string): string {
  if (id === LITE_MODEL_ID) return FAST_MODEL_ID
  return id
}
