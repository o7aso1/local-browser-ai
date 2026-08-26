import { pipeline, TextStreamer, env } from '@huggingface/transformers'
import type { ChatMessage, Persona } from '../../types'
import { buildChatMessages } from '../prompt'
import { getTransformersModelId } from './capabilities'
import type { ProgressFn } from './timeout'

env.allowLocalModels = false
env.useBrowserCache = true

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generator: any = null
let loaded = false

export function isTransformersReady(): boolean {
  return loaded && generator != null
}

export async function bootTransformers(onProgress?: ProgressFn): Promise<void> {
  if (loaded && generator) return

  const modelId = getTransformersModelId()
  const devices: Array<'webgpu' | 'wasm'> = ['webgpu', 'wasm']
  let lastError: unknown = null

  for (const device of devices) {
    try {
      onProgress?.({
        progress: 0.15,
        text: device === 'webgpu' ? 'تحميل عبر WebGPU…' : 'تحميل عبر WASM (متوافق مع كل المتصفحات)…',
      })

      generator = await pipeline('text-generation', modelId, {
        device,
        dtype: 'q4',
        progress_callback: (p: { status?: string; loaded?: number; total?: number; file?: string }) => {
          if (p.status === 'progress' && p.total && p.loaded != null) {
            const ratio = p.loaded / p.total
            onProgress?.({
              progress: 0.2 + ratio * 0.75,
              text: `تنزيل ${p.file ?? 'النموذج'}… ${Math.round(ratio * 100)}%`,
            })
          }
        },
      })
      loaded = true
      onProgress?.({ progress: 0.98, text: 'اكتمل التحميل.' })
      return
    } catch (err) {
      lastError = err
      generator = null
    }
  }

  throw lastError instanceof Error ? lastError : new Error('تعذّر تحميل محرك Transformers.')
}

export async function unloadTransformers(): Promise<void> {
  generator = null
  loaded = false
}

export async function streamTransformersChat(options: {
  history: ChatMessage[]
  persona: Persona | null
  onToken: (token: string) => void
  signal?: AbortSignal
}): Promise<string> {
  if (!generator) throw new Error('محرك Transformers غير جاهز.')

  const messages = buildChatMessages(options.history, options.persona)
  let full = ''

  const streamer = new TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (piece: string) => {
      if (options.signal?.aborted) return
      full += piece
      options.onToken(piece)
    },
  })

  if (options.signal?.aborted) return ''

  const out = await generator(messages, {
    max_new_tokens: 512,
    temperature: 0.6,
    top_p: 0.9,
    do_sample: true,
    streamer,
  })

  if (!full && out?.[0]?.generated_text) {
    const last = out[0].generated_text.at(-1)
    if (last?.role === 'assistant' && last.content) {
      full = last.content
      options.onToken(full)
    }
  }

  return full
}
