import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatView } from './components/ChatView'
import { StartScreen } from './components/StartScreen'
import { LoadingScreen } from './components/LoadingScreen'
import { ModelsPanel } from './components/ModelsPanel'
import { PersonasPanel } from './components/PersonasPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { Sidebar } from './components/Sidebar'
import { UnsupportedScreen } from './components/UnsupportedScreen'
import { useAppData } from './hooks/useAppData'
import { formatLoadError } from './lib/device'
import { createId } from './lib/storage'
import {
  bootInference,
  getBackendLabel,
  streamInference,
  unloadAll,
} from './lib/inference'
import { canRunLocally } from './lib/inference/capabilities'
import type { ChatMessage, Conversation } from './types'

type Phase = 'checking' | 'unsupported' | 'awaiting_start' | 'loading' | 'ready' | 'error'

export default function App() {
  const data = useAppData()
  const [phase, setPhase] = useState<Phase>('checking')
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('جاري التحقق…')
  const [fromCache] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadApproved, setLoadApproved] = useState(false)
  const [engineLabel, setEngineLabel] = useState('—')
  const abortRef = useRef<AbortController | null>(null)
  const bootedRef = useRef(false)

  const modelId = data.settings?.selectedModelId ?? ''

  const boot = useCallback(async () => {
    setPhase('loading')
    setLoadError(null)
    setProgress(0.05)
    setProgressText('جاري التحضير…')
    try {
      const plan = await bootInference(modelId, ({ progress: p, text }) => {
        setProgress(p)
        setProgressText(text)
      })
      setEngineLabel(plan.label)
      bootedRef.current = true
      setPhase('ready')
    } catch (err) {
      console.error(err)
      setLoadError(formatLoadError(err))
      setPhase('error')
      bootedRef.current = false
    }
  }, [modelId])

  useEffect(() => {
    void (async () => {
      const local = await canRunLocally()
      if (!local.ok) {
        setPhase('unsupported')
        return
      }
      if (!data.ready) return
      if (bootedRef.current) return
      if (!loadApproved) {
        setPhase('awaiting_start')
        return
      }
      void boot()
    })()
  }, [data.ready, loadApproved, boot])

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

        const full = await streamInference({
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
        await data.upsertConversation({
          ...withUser,
          messages: [...withUser.messages, assistantMsg],
          updatedAt: Date.now(),
        })
      } catch (err) {
        console.error(err)
        await data.upsertConversation({
          ...withUser,
          messages: [
            ...withUser.messages,
            {
              id: createId('msg'),
              role: 'assistant',
              content:
                err instanceof Error
                  ? `تعذّر توليد الرد: ${err.message}`
                  : 'تعذّر توليد الرد.',
              createdAt: Date.now(),
            },
          ],
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
      await data.updateSettings({ selectedModelId: nextId })
      data.setView('chat')
      bootedRef.current = false
      await unloadAll()
      setLoadApproved(true)
      await boot()
    },
    [busy, data, boot],
  )

  const shell = useMemo(() => {
    if (phase === 'unsupported') return <UnsupportedScreen />

    if (phase === 'awaiting_start') {
      return (
        <StartScreen
          onStart={() => {
            setLoadApproved(true)
            setPhase('loading')
          }}
        />
      )
    }

    const loadingHint =
      phase === 'loading'
        ? `${progressText} (${Math.round(progress * 100)}%)`
        : phase === 'checking' || !data.ready
          ? 'جاري قراءة الإعدادات…'
          : null

    const engineReady = phase === 'ready'
    const modelLabel = engineReady ? getBackendLabel() || engineLabel : engineLabel

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
                bootedRef.current = false
                setLoadApproved(true)
                void boot()
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )
    }

    if (!data.ready || phase === 'loading') {
      return (
        <LoadingScreen
          progress={progress}
          text={progressText || 'جاري التحميل…'}
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
              selectedModelId={modelId}
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
                bootedRef.current = false
                await unloadAll()
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
    engineLabel,
    fromCache,
    loadError,
    modelId,
    boot,
    streamingContent,
    busy,
    handleSend,
    handleStop,
    handleSwitchModel,
  ])

  return shell
}
