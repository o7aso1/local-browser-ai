import type { AppSettings, BackupPayload, Conversation, Persona } from '../types'
import { listConversations, listPersonas, getSettings, replaceAllData } from './storage'

export async function buildBackup(): Promise<BackupPayload> {
  const [conversations, personas, settings] = await Promise.all([
    listConversations(),
    listPersonas(),
    getSettings(),
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    conversations,
    personas,
    settings,
  }
}

export function downloadBackup(payload: BackupPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `muavin-mahali-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false
  const c = value as Conversation
  return (
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    Array.isArray(c.messages)
  )
}

function isPersona(value: unknown): value is Persona {
  if (!value || typeof value !== 'object') return false
  const p = value as Persona
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.systemPrompt === 'string'
  )
}

function isSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') return false
  const s = value as AppSettings
  return typeof s.selectedModelId === 'string'
}

export async function importBackupFromFile(file: File): Promise<BackupPayload> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupPayload
  if (data.version !== 1) {
    throw new Error('إصدار النسخة الاحتياطية غير مدعوم.')
  }
  if (!Array.isArray(data.conversations) || !data.conversations.every(isConversation)) {
    throw new Error('ملف المحادثات تالف أو غير صالح.')
  }
  if (!Array.isArray(data.personas) || !data.personas.every(isPersona)) {
    throw new Error('ملف الشخصيات تالف أو غير صالح.')
  }
  if (!isSettings(data.settings)) {
    throw new Error('ملف الإعدادات تالف أو غير صالح.')
  }
  await replaceAllData({
    conversations: data.conversations,
    personas: data.personas,
    settings: data.settings,
  })
  return data
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 بايت'
  const units = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}
