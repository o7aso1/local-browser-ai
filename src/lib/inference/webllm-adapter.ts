import type { ChatMessage, Persona } from '../../types'
import { buildChatMessages } from '../prompt'
import {
  ensureEngine as bootWebLLM,
  streamChatCompletion as streamWebLLM,
  unloadEngine,
} from '../webllm'
import type { ProgressFn } from './timeout'

export async function bootWebLLMEngine(
  modelId: string,
  onProgress?: ProgressFn,
): Promise<void> {
  await bootWebLLM(modelId, onProgress)
}

export async function streamWebLLMChat(options: {
  history: ChatMessage[]
  persona: Persona | null
  onToken: (token: string) => void
  signal?: AbortSignal
}): Promise<string> {
  return streamWebLLM(options)
}

export { unloadEngine, buildChatMessages }
