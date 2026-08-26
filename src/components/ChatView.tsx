import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Persona } from '../types'
import { MessageContent } from './MessageContent'

interface Props {
  messages: ChatMessage[]
  streamingContent: string | null
  busy: boolean
  persona: Persona | null
  modelLabel: string
  engineReady: boolean
  loadingHint?: string | null
  onSend: (text: string) => void
  onStop: () => void
}

export function ChatView({
  messages,
  streamingContent,
  busy,
  persona,
  modelLabel,
  engineReady,
  loadingHint,
  onSend,
  onStop,
}: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    onSend(text)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-b border-[var(--border)] px-4 py-3 md:px-6">
        <p className="text-sm text-[var(--ink-muted)]">
          النموذج: <span className="text-[var(--ink)]">{modelLabel}</span>
          {persona ? (
            <>
              {' · '}
              الشخصية:{' '}
              <span className="text-[var(--ink)]">
                {persona.icon} {persona.name}
              </span>
            </>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          الاستدلال يعمل على جهازك فقط. تخصيص الشخصية يغيّر أسلوب الرد عبر تعليمات النظام، وليس إعادة
          تدريب للنموذج.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6">
        {!engineReady && loadingHint ? (
          <div className="surface animate-fade-up mx-auto max-w-md rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)]/40 p-4 text-sm leading-relaxed">
            <p className="font-medium text-[var(--accent)]">جاري تجهيز النموذج…</p>
            <p className="mt-1 text-[var(--ink-muted)]">{loadingHint}</p>
          </div>
        ) : null}

        {messages.length === 0 && !streamingContent && engineReady ? (
          <div className="animate-fade-up mx-auto mt-10 max-w-md text-center">
            <h2 className="text-xl font-semibold">ابدأ محادثة بهدوء</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              اكتب سؤالك بالعربية أو أي لغة. الردود تُولَّد محلياً وتُحفظ تلقائياً على هذا الجهاز.
            </p>
          </div>
        ) : null}

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}

        {streamingContent != null ? (
          <Bubble role="assistant" content={streamingContent || '…'} streaming />
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--border)] p-3 md:p-4">
        <div className="surface mx-auto flex max-w-3xl items-end gap-2 rounded-3xl p-2">
          <textarea
            ref={textareaRef}
            value={input}
            rows={1}
            disabled={busy || !engineReady}
            placeholder="اكتب رسالتك…"
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 outline-none placeholder:text-[var(--ink-muted)]"
            onChange={(e) => {
              setInput(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 160)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
          />
          {busy ? (
            <button
              type="button"
              onClick={onStop}
              className="rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:bg-black/5"
            >
              إيقاف
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim() || !engineReady}
              className="rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              إرسال
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Bubble({
  role,
  content,
  streaming,
}: {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[min(100%,42rem)] rounded-3xl px-4 py-3 shadow-sm ${
          isUser
            ? 'rounded-br-lg bg-[var(--user-bubble)] text-white'
            : 'rounded-bl-lg border border-[var(--border)] bg-[var(--assistant-bubble)]'
        } ${streaming ? 'animate-pulse-soft' : 'animate-fade-up'}`}
      >
        <MessageContent
          content={content}
          variant={isUser ? 'user' : 'assistant'}
          streaming={streaming}
        />
      </div>
    </div>
  )
}
