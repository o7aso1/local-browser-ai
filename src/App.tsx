import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatView } from './components/ChatView'
import { MobileStartScreen } from './components/MobileStartScreen'
import { LoadingScreen } from './components/LoadingScreen'
import { ModelsPanel } from './components/ModelsPanel'
import { PersonasPanel } from './components/PersonasPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { Sidebar } from './components/Sidebar'
import { UnsupportedScreen } from './components/UnsupportedScreen'
import { useAppData } from './hooks/useAppData'
import { getModelTier } from './lib/models'
import { createId } from './lib/storage'
import {
  formatLoadError,
  getModelBlockReason,
  getRecommendedModelId,
  isMobileDevice,
  isModelSafeForDevice,
} from './lib/device'
import { getModelFallbackChain } from './lib/models'
import {
  ensureEngine,
  isModelCached,
  purgeOtherModels,
  streamChatCompletion,
  supportsWebGPU,
} from './lib/webllm'
import type { ChatMessage, Conversation } from './types'

type Phase = 'checking' | 'unsupported' | 'awaiting_start' | 'loading' | 'ready' | 'error'

export default function App() {
  const data = useAppData()
  const [phase, setPhase] = useState<Phase>('checking')
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('جاري التحقق…')
  const [fromCache, setFromCache] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [mobileLoadApproved, setMobileLoadApproved] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bootedModelRef = useRef<string | null>(null)

  const modelId = data.settings?.selectedModelId
  const modelLabel = getModelTier(modelId ?? '')?.label ?? modelId ?? '—'

  const bootEngine = useCallback(async (id: string, tried: string[] = []) => {
    setPhase('loading')
    setLoadError(null)
    setProgress(0.02)
    setProgressText('جاري تحضير المحرك…')
    try {
      if (isMobileDevice()) {
        await purgeOtherModels(id)
      }
      const cached = await isModelCached(id)
      setFromCache(cached)
      setProgressText(cached ? 'تحميل النموذج من الذاكرة المحلية…' : 'بدء التجهيز…')
      await ensureEngine(id, ({ progress: p, text }) => {
        setProgress(p)
        setProgressText(text)
      })
      bootedModelRef.current = id
      if (data.settings?.selectedModelId !== id) {
        await data.updateSettings({ selectedModelId: id })
      }
      setPhase('ready')
    } catch (err) {
      console.error(err)
      const chain = getModelFallbackChain(id, isMobileDevice())
      const next = chain.find((m) => !tried.includes(m) && m !== id)
      if (next) {
        tried.push(id)
        bootedModelRef.current = null
        setProgressText(`تعذّر تحميل النموذج — جاري تجربة نموذج أخف…`)
        await bootEngine(next, tried)
        return
      }
      setLoadError(formatLoadError(err))
      setPhase('error')
    }
  }, [data])

  useEffect(() => {
    if (!supportsWebGPU()) {
      setPhase('unsupported')
      return
    }
    if (!data.ready || !modelId) return
    if (bootedModelRef.current === modelId) return

    const safeId = isModelSafeForDevice(modelId) ? modelId : getRecommendedModelId()
    if (safeId !== modelId) {
      void data.updateSettings({ selectedModelId: safeId })
      return
    }

    if (isMobileDevice() && !mobileLoadApproved) {
      setPhase('awaiting_start')
      return
    }

    void bootEngine(safeId)
  }, [data.ready, modelId, bootEngine, data, mobileLoadApproved])

  const ensureActiveConversation = useCallback(async (): Promise<Conversation> => {
    if (data.activeConversation) return data.activeConversation
    return data.createConversation()
  }, [data])

  const handleSend = useCallback(
    async (text: string) => {
      if (busy || phase !== 'ready') return
      const conversation = await ensureActiveConversation()
      const now = Date.now()
      const userMsg: ChatMessage = {
        id: createId('msg'),
        role: 'user',
        content: text,
        createdAt: now,
      }
      const withUser: Conversation = {
        ...conversation,
        title:
          conversation.messages.length === 0
            ? text.slice(0, 42) || 'محادثة جديدة'
            : conversation.title,
        personaId: data.settings?.activePersonaId ?? conversation.personaId,
        messages: [...conversation.messages, userMsg],
        updatedAt: now,
      }
      await data.upsertConversation(withUser)
      await data.updateSettings({ activeConversationId: withUser.id })

      setBusy(true)
      setStreamingContent('')
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const persona =
          data.personas.find(
            (p) => p.id === (data.settings?.activePersonaId ?? withUser.personaId),
          ) ?? null

        const full = await streamChatCompletion({
          history: withUser.messages,
          persona,
          signal: controller.signal,
          onToken: (token) => {
            setStreamingContent((prev) => (prev ?? '') + token)
          },
        })

        const assistantMsg: ChatMessage = {
          id: createId('msg'),
          role: 'assistant',
          content: full || '…',
          createdAt: Date.now(),
        }
        const finalConv: Conversation = {
          ...withUser,
          messages: [...withUser.messages, assistantMsg],
          updatedAt: Date.now(),
        }
        await data.upsertConversation(finalConv)
      } catch (err) {
        console.error(err)
        const assistantMsg: ChatMessage = {
          id: createId('msg'),
          role: 'assistant',
          content:
            err instanceof Error
              ? `تعذّر توليد الرد: ${err.message}`
              : 'تعذّر توليد الرد.',
          createdAt: Date.now(),
        }
        await data.upsertConversation({
          ...withUser,
          messages: [...withUser.messages, assistantMsg],
          updatedAt: Date.now(),
        })
      } finally {
        setStreamingContent(null)
        setBusy(false)
        abortRef.current = null
      }
    },
    [busy, phase, ensureActiveConversation, data],
  )

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleSwitchModel = useCallback(
    async (nextId: string) => {
      if (busy) return
      const block = getModelBlockReason(nextId)
      if (block) {
        window.alert(block)
        return
      }
      await data.updateSettings({ selectedModelId: nextId })
      data.setView('chat')
      bootedModelRef.current = null
      await bootEngine(nextId)
    },
    [busy, data, bootEngine],
  )

  const shell = useMemo(() => {
    if (phase === 'unsupported') return <UnsupportedScreen />

    if (phase === 'awaiting_start') {
      return (
        <MobileStartScreen
          onStart={() => {
            setMobileLoadApproved(true)
            setPhase('loading')
          }}
        />
      )
    }

    const loadingHint =
      phase === 'loading'
        ? fromCache
          ? `تحميل من الذاكرة المحلية… ${Math.round(progress * 100)}%`
          : `${progressText} (${Math.round(progress * 100)}%)`
        : phase === 'checking' || !data.ready
          ? 'جاري قراءة الإعدادات…'
          : null

    const engineReady = phase === 'ready'

    if (phase === 'error') {
      return (
        <div className="flex min-h-full items-center justify-center p-6">
          <div className="surface max-w-lg rounded-3xl p-8">
            <h1 className="text-xl font-semibold">تعذّر التجهيز</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
              {loadError}
            </p>
            <button
              type="button"
              className="mt-5 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm text-white"
              onClick={() => {
                if (isMobileDevice()) setMobileLoadApproved(true)
                if (modelId) void bootEngine(getRecommendedModelId())
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )
    }

    if (!data.ready) {
      return (
        <LoadingScreen
          progress={progress}
          text={progressText || 'جاري قراءة الإعدادات المحلية…'}
          modelLabel={modelLabel}
          fromCache={fromCache}
        />
      )
    }

    return (
      <div className="mx-auto flex h-full max-w-6xl gap-4 p-3 md:p-4">
        <Sidebar
          open={data.sidebarOpen}
          conversations={data.conversations}
          activeId={data.settings?.activeConversationId ?? null}
          onClose={() => data.setSidebarOpen(false)}
          onNew={() => void data.createConversation()}
          onSelect={(id) => void data.selectConversation(id)}
          onRename={(id, title) => void data.rename(id, title)}
          onDelete={(id) => void data.removeConversation(id)}
          onOpenPersonas={() => {
            data.setView('personas')
            data.setSidebarOpen(false)
          }}
          onOpenSettings={() => {
            data.setView('settings')
            data.setSidebarOpen(false)
          }}
          onOpenModels={() => {
            data.setView('models')
            data.setSidebarOpen(false)
          }}
        />

        <main className="surface flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 md:hidden">
            <button
              type="button"
              className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm"
              onClick={() => data.setSidebarOpen(true)}
            >
              القائمة
            </button>
            <p className="text-sm font-semibold">مساعدك المحلي</p>
            <span className="w-16" />
          </header>

          {data.view === 'chat' ? (
            <ChatView
              messages={data.activeConversation?.messages ?? []}
              streamingContent={streamingContent}
              busy={busy}
              persona={data.activePersona}
              modelLabel={modelLabel}
              engineReady={engineReady}
              loadingHint={loadingHint}
              onSend={(t) => void handleSend(t)}
              onStop={handleStop}
            />
          ) : null}

          {data.view === 'models' ? (
            <ModelsPanel
              selectedModelId={modelId!}
              busy={busy}
              onSelect={(id) => void handleSwitchModel(id)}
              onBack={() => data.setView('chat')}
            />
          ) : null}

          {data.view === 'personas' ? (
            <PersonasPanel
              personas={data.personas}
              activePersonaId={data.settings?.activePersonaId ?? null}
              onSave={data.upsertPersona}
              onDelete={data.removePersona}
              onSelect={async (id) => {
                await data.updateSettings({ activePersonaId: id })
              }}
              onBack={() => data.setView('chat')}
            />
          ) : null}

          {data.view === 'settings' ? (
            <SettingsPanel
              onBack={() => data.setView('chat')}
              onDataChanged={async () => {
                bootedModelRef.current = null
                await data.refresh()
              }}
            />
          ) : null}
        </main>
      </div>
    )
  }, [
    phase,
    data,
    progress,
    progressText,
    modelLabel,
    fromCache,
    loadError,
    modelId,
    bootEngine,
    streamingContent,
    busy,
    handleSend,
    handleStop,
    handleSwitchModel,
  ])

  return shell
}
