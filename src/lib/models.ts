import type { ModelTier } from '../types'

/** Smallest tier — ~0.5B; only model that fits most phones. */
export const MOBILE_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'

/** Lite tier — ~1.5B; low-end desktop / strong Android tablets. */
export const LITE_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC'

/** Balanced tier — ~3B; desktop with enough RAM. */
export const FAST_MODEL_ID = 'Qwen2.5-3B-Instruct-q4f16_1-MLC'

/** Stronger tier — ~7B; desktop only, high RAM. */
export const STRONG_MODEL_ID = 'Qwen2.5-7B-Instruct-q4f16_1-MLC'

export const ALL_MODEL_IDS = [
  MOBILE_MODEL_ID,
  LITE_MODEL_ID,
  FAST_MODEL_ID,
  STRONG_MODEL_ID,
] as const

export const DEFAULT_MODEL_ID = LITE_MODEL_ID

export const MODEL_TIERS: ModelTier[] = [
  {
    id: MOBILE_MODEL_ID,
    label: 'جوال — الأصغر (0.5B)',
    tradeoff: 'الوحيد المناسب لـ iPhone/Android. أخف ما يمكن — ذكاء محدود لكنه يعمل.',
    approxSize: '~600 ميغابايت تقريباً عند التحميل الأول',
    vramHint: 'مصمّم للهاتف (~950 ميغابايت ذاكرة)',
  },
  {
    id: LITE_MODEL_ID,
    label: 'خفيف — كمبيوتر / تابلت قوي',
    tradeoff: 'للكمبيوتر أو أندرويد قوي. لا يعمل على iPhone.',
    approxSize: '~1 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'يحتاج ~1.6 غيغابايت ذاكرة',
  },
  {
    id: FAST_MODEL_ID,
    label: 'متوازن — للكمبيوتر',
    tradeoff: 'أذكى ويفهم المتابعات. للكمبيوتر فقط.',
    approxSize: '~2.5 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'يحتاج ~2.5 غيغابايت ذاكرة',
  },
  {
    id: STRONG_MODEL_ID,
    label: 'أقوى — كمبيوتر قوي فقط',
    tradeoff: 'أفضل جودة. ثقيل جداً — لا يعمل على الجوال.',
    approxSize: '~4 غيغابايت تقريباً عند التحميل الأول',
    vramHint: 'يحتاج ~5 غيغابايت ذاكرة',
  },
]

export function getModelTier(id: string): ModelTier | undefined {
  return MODEL_TIERS.find((m) => m.id === id)
}

export function getModelFallbackChain(startId: string, mobile: boolean): string[] {
  if (mobile) return [MOBILE_MODEL_ID]
  const order = [startId, LITE_MODEL_ID, MOBILE_MODEL_ID]
  return [...new Set(order.filter((id) => ALL_MODEL_IDS.includes(id as (typeof ALL_MODEL_IDS)[number])))]
}
