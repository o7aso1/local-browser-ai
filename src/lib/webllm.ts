import type {
  MLCEngineInterface,
  InitProgressReport,
} from '@mlc-ai/web-llm'
import type { ChatMessage, Persona } from '../types'

export type ProgressCallback = (report: {
  progress: number
  text: string
}) => void

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
      // ignore unload errors when switching
    }
    engine = null
    loadedModelId = null
  }

  loadPromise = (async () => {
    const { CreateMLCEngine } = await webllm()
    const next = await CreateMLCEngine(modelId, {
      initProgressCallback: (report: InitProgressReport) => {
        onProgress?.({
          progress: Math.max(0, Math.min(1, report.progress)),
          text: report.text || 'جاري التحميل…',
        })
      },
    })
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

function buildMessages(
  history: ChatMessage[],
  persona: Persona | null,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }> = []

  const baseSystem =
    'أنت مساعد مفيد ودقيق. أجب بلغة المستخدم. كن صادقاً وواضحاً دون مبالغة.'

  if (persona?.systemPrompt.trim()) {
    messages.push({
      role: 'system',
      content: `${baseSystem}\n\nتعليمات أسلوب هذا المساعد المخصص (تخصيص سلوك فقط، وليست إعادة تدريب للنموذج):\n${persona.systemPrompt.trim()}`,
    })
  } else {
    messages.push({ role: 'system', content: baseSystem })
  }

  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content })
  }
  return messages
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

  const messages = buildMessages(options.history, options.persona)
  const chunks = await engine.chat.completions.create({
    messages,
    stream: true,
    stream_options: { include_usage: false },
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
