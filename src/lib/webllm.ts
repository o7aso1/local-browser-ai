import type {
  MLCEngineInterface,
  InitProgressReport,
} from '@mlc-ai/web-llm'
import type { ChatMessage, Persona } from '../types'

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

const SYSTEM_PROMPT = `أنت مساعد ذكي ومفيد. أجب بلغة المستخدم (عربية أو غيرها) بوضوح ودقة.

قواعد مهمة:
1. اربط كل رد بسياق المحادثة السابقة. لا تبدأ بتحية عامة إذا كان السؤال متابعة.
2. إذا كانت رسالة المستخدم قصيرة أو غامضة (مثل: «أقوى»، «أكثر»، «عدّله»، «حسّنه»، «وضّح») فافهمها من آخر طلب وآخر رد — وليس كسؤال جديد مستقل.
3. «أقوى» أو «أفضل» بعد طلب كود تعني: نسخة أقوى/أكثر احترافية من نفس الكود أو الموضوع السابق.
4. عند كتابة كود: ضعه داخل \`\`\`language مع سطر اللغة في الأعلى، مثل:
\`\`\`python
def example():
    pass
\`\`\`
5. لا تكرر نفس الجمل الترحيبية. كن مباشراً ومفيداً.`

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
    const next = await CreateMLCEngine(
      modelId,
      {
        initProgressCallback: (report: InitProgressReport) => {
          onProgress?.({
            progress: Math.max(0, Math.min(1, report.progress)),
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

const FOLLOW_UP_RE =
  /^(اقوى|أقوى|أكثر|اكثر|أفضل|احسن|أحسن|حسّ?نه|حسنه|عدّ?له|عدله|وضّ?ح|وضح|كمل|زود|قلل|ليش|لماذا|وش|ايش|كيف|نعم|لا|ممتاز|تمام)$/iu

function enrichHistoryForApi(history: ChatMessage[]): ChatMessage[] {
  if (history.length < 2) return history

  const last = history.at(-1)
  if (!last || last.role !== 'user') return history

  const text = last.content.trim()
  const isFollowUp = text.length <= 24 || FOLLOW_UP_RE.test(text)
  if (!isFollowUp) return history

  const prior = history.slice(0, -1)
  const lastUser = [...prior].reverse().find((m) => m.role === 'user')
  const lastAssistant = [...prior].reverse().find((m) => m.role === 'assistant')
  if (!lastUser && !lastAssistant) return history

  let intent = 'هذه رسالة متابعة — اربط ردك بالسياق السابق مباشرة.'
  if (/^(اقوى|أقوى|أفضل|احسن|أحسن|حسّ?نه|حسنه)$/iu.test(text)) {
    intent =
      'المستخدم يريد نسخة أقوى/أفضل/أكثر احترافية مما ذُكر في المحادثة السابقة (مثلاً كود أقوى).'
  } else if (/^(اكثر|أكثر|زود|كمل)$/iu.test(text)) {
    intent = 'المستخدم يريد المزيد أو إكمال ما سبق.'
  } else if (/^(عدّ?له|عدله|وضّ?ح|وضح)$/iu.test(text)) {
    intent = 'المستخدم يريد تعديل أو توضيح آخر رد.'
  }

  const contextSnippet = [
    lastUser ? `سؤال سابق: «${lastUser.content.slice(0, 180)}»` : null,
    lastAssistant ? `رد سابق: «${lastAssistant.content.slice(0, 280)}»` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return [
    ...prior,
    {
      ...last,
      content: `${text}\n\n[${intent} ${contextSnippet}]`,
    },
  ]
}

function buildMessages(
  history: ChatMessage[],
  persona: Persona | null,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }> = []

  let system = SYSTEM_PROMPT
  if (persona?.systemPrompt.trim()) {
    system += `\n\nتعليمات شخصية إضافية (سلوك فقط):\n${persona.systemPrompt.trim()}`
  }
  messages.push({ role: 'system', content: system })

  const apiHistory = enrichHistoryForApi(history)
  for (const msg of apiHistory) {
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
    ...GENERATION_OPTS,
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
