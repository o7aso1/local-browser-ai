import { useCallback, useEffect, useState } from 'react'
import type { Conversation, Persona, AppSettings, AppView } from '../types'
import {
  createId,
  deleteConversation,
  deletePersona,
  getSettings,
  listConversations,
  listPersonas,
  renameConversation,
  saveConversation,
  savePersona,
  saveSettings,
} from '../lib/storage'

export function useAppData() {
  const [ready, setReady] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [view, setView] = useState<AppView>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const refresh = useCallback(async () => {
    const [c, p, s] = await Promise.all([
      listConversations(),
      listPersonas(),
      getSettings(),
    ])
    setConversations(c)
    setPersonas(p)
    setSettings(s)
    setReady(true)
    return { conversations: c, personas: p, settings: s }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const current = settings ?? (await getSettings())
    const next = { ...current, ...partial }
    await saveSettings(next)
    setSettings(next)
    return next
  }, [settings])

  const activeConversation =
    conversations.find((c) => c.id === settings?.activeConversationId) ?? null

  const activePersona =
    personas.find((p) => p.id === settings?.activePersonaId) ?? null

  const createConversation = useCallback(async () => {
    const now = Date.now()
    const conversation: Conversation = {
      id: createId('chat'),
      title: 'محادثة جديدة',
      personaId: settings?.activePersonaId ?? null,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    await saveConversation(conversation)
    await updateSettings({ activeConversationId: conversation.id })
    setConversations((prev) => [conversation, ...prev])
    setView('chat')
    setSidebarOpen(false)
    return conversation
  }, [settings?.activePersonaId, updateSettings])

  const selectConversation = useCallback(
    async (id: string) => {
      await updateSettings({ activeConversationId: id })
      setView('chat')
      setSidebarOpen(false)
    },
    [updateSettings],
  )

  const removeConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id)
      const nextList = conversations.filter((c) => c.id !== id)
      setConversations(nextList)
      if (settings?.activeConversationId === id) {
        await updateSettings({
          activeConversationId: nextList[0]?.id ?? null,
        })
      }
    },
    [conversations, settings?.activeConversationId, updateSettings],
  )

  const rename = useCallback(async (id: string, title: string) => {
    await renameConversation(id, title)
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: title.trim() || c.title, updatedAt: Date.now() } : c,
      ),
    )
  }, [])

  const upsertConversation = useCallback(async (conversation: Conversation) => {
    await saveConversation(conversation)
    setConversations((prev) => {
      const without = prev.filter((c) => c.id !== conversation.id)
      return [conversation, ...without].sort((a, b) => b.updatedAt - a.updatedAt)
    })
  }, [])

  const upsertPersona = useCallback(async (persona: Persona) => {
    await savePersona(persona)
    setPersonas((prev) => {
      const without = prev.filter((p) => p.id !== persona.id)
      return [persona, ...without].sort((a, b) => b.updatedAt - a.updatedAt)
    })
  }, [])

  const removePersona = useCallback(
    async (id: string) => {
      await deletePersona(id)
      setPersonas((prev) => prev.filter((p) => p.id !== id))
      if (settings?.activePersonaId === id) {
        await updateSettings({ activePersonaId: null })
      }
    },
    [settings?.activePersonaId, updateSettings],
  )

  return {
    ready,
    conversations,
    personas,
    settings,
    view,
    setView,
    sidebarOpen,
    setSidebarOpen,
    refresh,
    updateSettings,
    activeConversation,
    activePersona,
    createConversation,
    selectConversation,
    removeConversation,
    rename,
    upsertConversation,
    upsertPersona,
    removePersona,
  }
}
