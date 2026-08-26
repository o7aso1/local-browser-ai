import {
  FAST_MODEL_ID,
  LITE_MODEL_ID,
  MOBILE_MODEL_ID,
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

/** Phones — only 0.5B fits Safari/Chrome mobile memory limits. */
export function getRecommendedModelId(): string {
  if (isMobileDevice()) return MOBILE_MODEL_ID
  const mem = getDeviceMemoryGb()
  if (mem != null && mem <= 4) return LITE_MODEL_ID
  return FAST_MODEL_ID
}

export function isModelSafeForDevice(modelId: string): boolean {
  if (isMobileDevice()) return modelId === MOBILE_MODEL_ID
  if (modelId === MOBILE_MODEL_ID) return isMobileDevice()
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
    return 'على الجوال يعمل نموذج «جوال — الأصغر (0.5B)» فقط. النماذج الأكبر تسبب «Out of memory».'
  }
  if (modelId === MOBILE_MODEL_ID) {
    return 'هذا النموذج مخصص للجوال. على الكمبيوتر اختر «خفيف» أو «متوازن».'
  }
  if (modelId === STRONG_MODEL_ID) {
    return 'جهازك لا يملك ذاكرة كافية لهذا النموذج.'
  }
  return 'هذا النموذج غير مناسب لجهازك الحالي.'
}

export function migrateModelId(id: string): string {
  if (isMobileDevice()) return MOBILE_MODEL_ID
  if (id === MOBILE_MODEL_ID) return LITE_MODEL_ID
  if (!isModelSafeForDevice(id)) return getRecommendedModelId()
  return id
}

export function getDefaultModelId(): string {
  return getRecommendedModelId()
}

export function formatLoadError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (/importing a module script failed|module script failed|import.*failed/i.test(raw)) {
    return 'فشل تحميل ملفات المحرك (غالباً نسخة قديمة في الذاكرة). احذف بيانات الموقع من Safari: الإعدادات ← Safari ← متقدم ← بيانات المواقع ← o7aso1.github.io ← حذف. ثم أعد فتح الرابط.'
  }
  if (/out of memory|oom|memory/i.test(raw)) {
    if (isMobileDevice()) {
      return 'نفدت ذاكرة الجوال (Out of memory). iPhone/Android لا يتحمل نماذج أكبر. جرّب: إغلاق التطبيقات الأخرى، ثم «مسح الكل» من الإعدادات، ثم إعادة فتح الرابط. إذا استمر الخطأ، جهازك لا يدعم تشغيل نموذج محلي.'
    }
    return 'نفدت ذاكرة الجهاز. أغلِق التبويبات الأخرى أو اختر نموذجاً أخف.'
  }
  return raw || 'تعذّر تجهيز النموذج.'
}
