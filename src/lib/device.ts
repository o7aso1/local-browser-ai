import {
  FAST_MODEL_ID,
  LITE_MODEL_ID,
  STRONG_MODEL_ID,
} from './models'

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    isIOS() ||
    /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.matchMedia('(max-width: 768px)').matches)
  )
}

export function getDeviceMemoryGb(): number | null {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return typeof mem === 'number' ? mem : null
}

/** Phones/tablets — only the lite model is safe (Safari crashes on 3B/7B). */
export function getRecommendedModelId(): string {
  if (isMobileDevice()) return LITE_MODEL_ID
  const mem = getDeviceMemoryGb()
  if (mem != null && mem <= 4) return LITE_MODEL_ID
  if (mem != null && mem <= 8) return FAST_MODEL_ID
  return FAST_MODEL_ID
}

export function isModelSafeForDevice(modelId: string): boolean {
  if (modelId === LITE_MODEL_ID) return true
  if (isMobileDevice()) return false
  if (modelId === STRONG_MODEL_ID) {
    const mem = getDeviceMemoryGb()
    if (mem != null && mem < 8) return false
  }
  return true
}

export function getOfflineAppUrl(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

export function isLocalDev(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.')
}

export function getModelBlockReason(modelId: string): string | null {
  if (isModelSafeForDevice(modelId)) return null
  if (isMobileDevice()) {
    return 'هذا النموذج ثقيل على الجوال وقد يتسبب بتعطل Safari. استخدم «خفيف جداً» على الهاتف.'
  }
  if (modelId === STRONG_MODEL_ID) {
    return 'جهازك لا يملك ذاكرة كافية لهذا النموذج. جرّب «متوازن» أو «خفيف».'
  }
  return 'هذا النموذج غير مناسب لجهازك الحالي.'
}

export function migrateModelId(id: string): string {
  if (!isModelSafeForDevice(id)) return getRecommendedModelId()
  return id
}

export function getDefaultModelId(): string {
  return getRecommendedModelId()
}
