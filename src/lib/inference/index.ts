import type { ChatMessage, Persona } from '../../types'
import {
  type BootPlan,
  planBoot,
  planFallback,
} from './capabilities'
import {
  bootTransformers,
  isTransformersReady,
  streamTransformersChat,
  unloadTransformers,
} from './transformers-engine'
import type { ProgressFn } from './timeout'
import {
  bootWebLLMEngine,
  streamWebLLMChat,
  unloadEngine,
} from './webllm-adapter'
import type { EngineBackend } from './capabilities'

let activePlan: BootPlan | null = null

export function getActivePlan(): BootPlan | null {
  return activePlan
}

export async function bootInference(
  selectedModelId: string,
  onProgress?: ProgressFn,
): Promise<BootPlan> {
  onProgress?.({ progress: 0.05, text: 'تحديد المحرك المناسب لجهازك…' })

  const primary = planBoot(selectedModelId)
  const attempts: BootPlan[] = [primary]
  const fb = planFallback(primary)
  if (fb) attempts.push(fb)

  let lastError: unknown = null

  for (const plan of attempts) {
    try {
      onProgress?.({ progress: 0.08, text: plan.reason })

      if (plan.backend === 'webllm') {
        await bootWebLLMEngine(plan.modelId, onProgress)
      } else {
        await bootTransformers(onProgress)
      }

      activePlan = plan
      onProgress?.({ progress: 1, text: 'جاهز.' })
      return plan
    } catch (err) {
      lastError = err
      await unloadAll()
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('تعذّر تشغيل أي محرك محلي على هذا الجهاز.')
}

export async function streamInference(options: {
  history: ChatMessage[]
  persona: Persona | null
  onToken: (token: string) => void
  signal?: AbortSignal
}): Promise<string> {
  if (!activePlan) throw new Error('المحرك غير جاهز.')

  if (activePlan.backend === 'transformers') {
    return streamTransformersChat(options)
  }
  return streamWebLLMChat(options)
}

export async function unloadAll(): Promise<void> {
  activePlan = null
  await Promise.allSettled([unloadEngine(), unloadTransformers()])
}

export function getBackendLabel(): string {
  return activePlan?.label ?? '—'
}

export function getActiveBackend(): EngineBackend | null {
  return activePlan?.backend ?? null
}

export function isEngineReady(): boolean {
  if (!activePlan) return false
  if (activePlan.backend === 'transformers') return isTransformersReady()
  return true
}
