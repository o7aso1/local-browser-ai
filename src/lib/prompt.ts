import type { ChatMessage, Persona } from '../types'

const SYSTEM_PROMPT = `أنت مساعد ذكي ومفيد. أجب بلغة المستخدم (عربية أو غيرها) بوضوح ودقة.

قواعد مهمة:
1. اربط كل رد بسياق المحادثة السابقة. لا تبدأ بتحية عامة إذا كان السؤال متابعة.
2. إذا كانت رسالة المستخدم قصيرة أو غامضة (مثل: «أقوى»، «أكثر»، «عدّله») فافهمها من آخر طلب وآخر رد.
3. «أقوى» بعد طلب كود تعني نسخة أقوى/أفضل من نفس الكود.
4. عند كتابة كود استخدم \`\`\`language blocks.
5. كن مباشراً دون تكرار تحيات.`

const FOLLOW_UP_RE =
  /^(اقوى|أقوى|أكثر|اكثر|أفضل|احسن|أحسن|حسّ?نه|حسنه|عدّ?له|عدله|وضّ?ح|وضح|كمل|زود|قلل|ليش|لماذا|وش|ايش|كيف|نعم|لا|ممتاز|تمام)$/iu

function enrichHistoryForApi(history: ChatMessage[]): ChatMessage[] {
  if (history.length < 2) return history
  const last = history.at(-1)
  if (!last || last.role !== 'user') return history
  const text = last.content.trim()
  if (text.length > 24 && !FOLLOW_UP_RE.test(text)) return history

  const prior = history.slice(0, -1)
  const lastUser = [...prior].reverse().find((m) => m.role === 'user')
  const lastAssistant = [...prior].reverse().find((m) => m.role === 'assistant')
  if (!lastUser && !lastAssistant) return history

  let intent = 'رسالة متابعة — اربط ردك بالسياق السابق.'
  if (/^(اقوى|أقوى|أفضل|احسن|أحسن)$/iu.test(text)) {
    intent = 'المستخدم يريد نسخة أقوى/أفضل مما سبق.'
  }

  const ctx = [
    lastUser ? `سؤال: «${lastUser.content.slice(0, 180)}»` : null,
    lastAssistant ? `رد: «${lastAssistant.content.slice(0, 280)}»` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return [...prior, { ...last, content: `${text}\n\n[${intent} ${ctx}]` }]
}

export function buildChatMessages(
  history: ChatMessage[],
  persona: Persona | null,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  let system = SYSTEM_PROMPT
  if (persona?.systemPrompt.trim()) {
    system += `\n\nتعليمات شخصية:\n${persona.systemPrompt.trim()}`
  }
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: system },
  ]
  for (const msg of enrichHistoryForApi(history)) {
    messages.push({ role: msg.role, content: msg.content })
  }
  return messages
}
