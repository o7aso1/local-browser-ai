export type Role = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: Exclude<Role, 'system'>
  content: string
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  personaId: string | null
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface Persona {
  id: string
  name: string
  systemPrompt: string
  icon: string
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  selectedModelId: string
  activeConversationId: string | null
  activePersonaId: string | null
}

export interface BackupPayload {
  version: 1
  exportedAt: string
  conversations: Conversation[]
  personas: Persona[]
  settings: AppSettings
}

export type AppView = 'chat' | 'personas' | 'settings' | 'models'

export interface ModelTier {
  id: string
  label: string
  tradeoff: string
  approxSize: string
  vramHint: string
}
