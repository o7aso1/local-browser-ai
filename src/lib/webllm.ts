import type {
  MLCEngineInterface,
  InitProgressReport,
} from '@mlc-ai/web-llm'
import type { ChatMessage, Persona } from '../types'
import { buildChatMessages } from './prompt'
import { isMobileDevice } from './device'
import { ALL_MODEL_IDS } from './models'

export type ProgressCallback = (report: {
  progress: number
  text: string
}) => void

const CHAT_OPTS = {
  temperature: 0.6,
  top_p: 0.9,
  repetition_penalty: 1.05,
}

const GENERATION_OPTS = {
  temperature: 0.6,
  top_p: 0.9,
  max_tokens: 1024,
}

const MOBILE_GENERATION_OPTS = {
  temperature: 0.6,
  top_p: 0.9,
  max_tokens: 512,
}

let engine: MLCEngineInterface | null = null
let loadedModelId: string | null = null
let loadPromise: Promise<MLCEngineInterface> | null = null

async function webllm() {
  return import('@mlc-ai/web-llm')
}

export function supportsWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export function getLoadedModelId(): string | null {
  return loadedModelId
}

export function localizeProgressText(text: string): string {
  if (!text || text === 'جاري التحميل…') return text
  if (text.includes('Fetching param cache')) {
    const m = text.match(/(\d+)% completed.*?(\d+) secs elapsed/)
    if (m) return `جاري تنزيل أوزان النموذج… ${m[1]}% (مر ${m[2]} ثانية)`
    return 'جاري تنزيل أوزان النموذج إلى جهازك…'
  }
  if (text.includes('Loading model from cache')) return 'تحميل النموذج من الذاكرة المحلية…'
  if (text.includes('Finish loading')) return 'اكتمل التحميل — جاري التشغيل…'
  if (text.includes('Start to fetch')) return 'بدء جلب ملفات النموذج…'
  if (text.includes('Fetching')) return 'جاري جلب ملفات النموذج…'
  return text
}

export async function purgeOtherModels(keepModelId: string): Promise<void> {
  const { deleteModelInCache } = await webllm()
  for (const id of ALL_MODEL_IDS) {
    if (id === keepModelId) continue
    try {
      await deleteModelInCache(id)
    } catch {
      // ignore
    }
  }
}

export async function isModelCached(modelId: string): Promise<boolean> {
  try {
    const { hasModelInCache } = await webllm()
    return await hasModelInCache(modelId)
  } catch {
    return false
  }
}

export async function ensureEngine(
  modelId: string,
  onProgress?: ProgressCallback,
): Promise<MLCEngineInterface> {
  if (engine && loadedModelId === modelId) {
    return engine
  }

  if (loadPromise && loadedModelId === modelId) {
    return loadPromise
  }

  if (engine && loadedModelId !== modelId) {
    try {
      await engine.unload()
    } catch {
      // ignore
    }
    engine = null
    loadedModelId = null
  }

  loadPromise = (async () => {
    onProgress?.({ progress: 0.12, text: 'جاري تحميل مكتبة WebLLM…' })
    const { CreateMLCEngine } = await webllm()

    onProgress?.({ progress: 0.15, text: 'بدء تحميل النموذج…' })

    const next = await CreateMLCEngine(
      modelId,
      {
        initProgressCallback: (report: InitProgressReport) => {
          onProgress?.({
            progress: Math.max(0.18, Math.min(1, report.progress)),
            text: localizeProgressText(report.text || 'جاري التحميل…'),
          })
        },
      },
      CHAT_OPTS,
    )

    engine = next
    loadedModelId = modelId
    return next
  })()

  try {
    return await loadPromise
  } finally {
    loadPromise = null
  }
}

export async function unloadEngine(): Promise<void> {
  if (engine) {
    try {
      await engine.unload()
    } catch {
      // ignore
    }
  }
  engine = null
  loadedModelId = null
}

export async function deleteCachedModel(modelId: string): Promise<void> {
  if (loadedModelId === modelId) {
    await unloadEngine()
  }
  const { deleteModelInCache } = await webllm()
  await deleteModelInCache(modelId)
}

export async function streamChatCompletion(options: {
  history: ChatMessage[]
  persona: Persona | null
  onToken: (token: string) => void
  signal?: AbortSignal
}): Promise<string> {
  if (!engine) {
    throw new Error('المحرك غير جاهز بعد.')
  }

  const messages = buildChatMessages(options.history, options.persona)
  const genOpts = isMobileDevice() ? MOBILE_GENERATION_OPTS : GENERATION_OPTS
  const chunks = await engine.chat.completions.create({
    messages,
    stream: true,
    stream_options: { include_usage: false },
    ...genOpts,
  })

  let full = ''
  for await (const chunk of chunks) {
    if (options.signal?.aborted) {
      try {
        await engine.interruptGenerate()
      } catch {
        // ignore
      }
      break
    }
    const delta = chunk.choices[0]?.delta?.content ?? ''
    if (delta) {
      full += delta
      options.onToken(delta)
    }
  }
  return full
}
