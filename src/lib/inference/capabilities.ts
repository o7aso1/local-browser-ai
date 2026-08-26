import { isMobileDevice } from '../device'
import {
  FAST_MODEL_ID,
  LITE_MODEL_ID,
  MOBILE_MODEL_ID,
  STRONG_MODEL_ID,
} from '../models'

export type EngineBackend = 'webllm' | 'transformers'

export interface BootPlan {
  backend: EngineBackend
  modelId: string
  label: string
  reason: string
}

const TRANSFORMERS_MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct'

export function getTransformersModelId(): string {
  return TRANSFORMERS_MODEL
}

export async function probeWebGPU(): Promise<boolean> {
  try {
    if (!('gpu' in navigator)) return false
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
    if (!gpu) return false
    const adapter = await withAbort(gpu.requestAdapter(), 8000)
    return adapter != null
  } catch {
    return false
  }
}

async function withAbort<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ])
  } catch {
    return null
  }
}

/** Pick backend + model — mobile always Transformers (WebGPU→WASM), desktop WebLLM with fallback. */
export function planBoot(selectedModelId: string): BootPlan {
  if (isMobileDevice()) {
    return {
      backend: 'transformers',
      modelId: TRANSFORMERS_MODEL,
      label: 'جوال — Transformers (0.5B)',
      reason: 'محرك موثوق للجوال: WebGPU إن وُجد، وإلا WASM بدون تعطل.',
    }
  }

  const safe =
    selectedModelId === MOBILE_MODEL_ID ||
    selectedModelId === LITE_MODEL_ID ||
    selectedModelId === FAST_MODEL_ID ||
    selectedModelId === STRONG_MODEL_ID
      ? selectedModelId
      : LITE_MODEL_ID

  return {
    backend: 'webllm',
    modelId: safe,
    label: `WebLLM — ${safe.includes('0.5B') ? '0.5B' : safe.includes('1.5B') ? '1.5B' : safe.includes('3B') ? '3B' : '7B'}`,
    reason: 'محرك سريع للكمبيوتر عبر WebGPU.',
  }
}

export function planFallback(plan: BootPlan): BootPlan | null {
  if (plan.backend === 'webllm') {
    return {
      backend: 'transformers',
      modelId: TRANSFORMERS_MODEL,
      label: 'احتياطي — Transformers (0.5B)',
      reason: 'تبديل تلقائي بعد فشل WebLLM.',
    }
  }
  return null
}

export async function canRunLocally(): Promise<{ ok: boolean; reason?: string }> {
  // Transformers.js can run on WASM even without WebGPU
  if (typeof WebAssembly !== 'undefined') {
    return { ok: true }
  }
  return {
    ok: false,
    reason: 'متصفحك لا يدعم WebAssembly — لا يمكن تشغيل نموذج محلي.',
  }
}
