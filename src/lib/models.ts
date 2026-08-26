import type { ModelTier } from '../types'

/** Balanced tier — ~3B; good for desktop with enough RAM. */
export const FAST_MODEL_ID = 'Qwen2.5-3B-Instruct-q4f16_1-MLC'

/** Stronger tier — ~7B; desktop only, high RAM. */
export const STRONG_MODEL_ID = 'Qwen2.5-7B-Instruct-q4f16_1-MLC'

/** Lite tier — ~1.5B; required for phones (Safari OOM on larger models). */
export const LITE_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC'

export const DEFAULT_MODEL_ID = LITE_MODEL_ID

export const MODEL_TIERS: ModelTier[] = [
  {
    id: LITE_MODEL_ID,
    label: 'خفيف — موصى به للجوال',
    tradeoff: 'الأكثر أماناً على iPhone/Android. أسرع تحميلاً، مناسب للاستخدام اليومي.',
    approxSize: '~1 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'يعمل على معظم الهواتف (~1.6 غيغابايت ذاكرة)',
  },
  {
    id: FAST_MODEL_ID,
    label: 'متوازن — للكمبيوتر',
    tradeoff: 'أذكى ويفهم المتابعات مثل «أقوى». لا يُنصح به على الجوال.',
    approxSize: '~2.5 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'للكمبيوتر — يحتاج ~2.5 غيغابايت ذاكرة',
  },
  {
    id: STRONG_MODEL_ID,
    label: 'أقوى — كمبيوتر قوي فقط',
    tradeoff: 'أفضل جودة وبرمجة. ثقيل جداً — لا يعمل على الجوال.',
    approxSize: '~4 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'للكمبيوتر القوي — ~5 غيغابايت ذاكرة',
  },
]

export function getModelTier(id: string): ModelTier | undefined {
  return MODEL_TIERS.find((m) => m.id === id)
}
