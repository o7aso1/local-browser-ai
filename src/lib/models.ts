import type { ModelTier } from '../types'

/** Fast tier — ~1.5B quantized; good multilingual/Arabic quality for everyday use. */
export const FAST_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC'

/** Stronger tier — ~7B quantized; better quality, needs more VRAM/time. */
export const STRONG_MODEL_ID = 'Qwen2.5-7B-Instruct-q4f16_1-MLC'

export const MODEL_TIERS: ModelTier[] = [
  {
    id: FAST_MODEL_ID,
    label: 'سريع (يناسب معظم الأجهزة)',
    tradeoff: 'أخف على الذاكرة والمعالج، الردود جيدة لمعظم الاستخدام اليومي.',
    approxSize: '~1 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'يحتاج نحو 1.6 غيغابايت من ذاكرة الرسم',
  },
  {
    id: STRONG_MODEL_ID,
    label: 'أقوى لكن أبطأ — يحتاج جهاز أقوى',
    tradeoff: 'جودة أوضح في العربية والتفكير، لكنه أبطأ ويستهلك ذاكرة أكثر.',
    approxSize: '~4 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'يحتاج نحو 5 غيغابايت من ذاكرة الرسم',
  },
]

export const DEFAULT_MODEL_ID = FAST_MODEL_ID

export function getModelTier(id: string): ModelTier | undefined {
  return MODEL_TIERS.find((m) => m.id === id)
}
