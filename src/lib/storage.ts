import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AppSettings, Conversation, Persona } from '../types'
import { DEFAULT_MODEL_ID } from './models'

interface AppDB extends DBSchema {
  conversations: {
    key: string
    value: Conversation
    indexes: { 'by-updated': number }
  }
  personas: {
    key: string
    value: Persona
  }
  settings: {
    key: string
    value: AppSettings
  }
}

const DB_NAME = 'local-browser-ai'
const DB_VERSION = 1
const SETTINGS_KEY = 'main'

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const conversations = db.createObjectStore('conversations', {
          keyPath: 'id',
        })
        conversations.createIndex('by-updated', 'updatedAt')
        db.createObjectStore('personas', { keyPath: 'id' })
        db.createObjectStore('settings')
      },
    })
  }
  return dbPromise
}

export function createId(prefix = 'id'): string {
  return `${prefix}_${crypto.randomUUID()}`
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb()
  const existing = await db.get('settings', SETTINGS_KEY)
  if (existing) return existing
  const defaults: AppSettings = {
    selectedModelId: DEFAULT_MODEL_ID,
    activeConversationId: null,
    activePersonaId: null,
  }
  await db.put('settings', defaults, SETTINGS_KEY)
  return defaults
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb()
  await db.put('settings', settings, SETTINGS_KEY)
}

export async function listConversations(): Promise<Conversation[]> {
  const db = await getDb()
  const all = await db.getAllFromIndex('conversations', 'by-updated')
  return all.reverse()
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = await getDb()
  return db.get('conversations', id)
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const db = await getDb()
  await db.put('conversations', conversation)
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('conversations', id)
}

export async function renameConversation(id: string, title: string): Promise<void> {
  const db = await getDb()
  const existing = await db.get('conversations', id)
  if (!existing) return
  await db.put('conversations', {
    ...existing,
    title: title.trim() || existing.title,
    updatedAt: Date.now(),
  })
}

export async function listPersonas(): Promise<Persona[]> {
  const db = await getDb()
  const all = await db.getAll('personas')
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function savePersona(persona: Persona): Promise<void> {
  const db = await getDb()
  await db.put('personas', persona)
}

export async function deletePersona(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('personas', id)
}

export async function replaceAllData(payload: {
  conversations: Conversation[]
  personas: Persona[]
  settings: AppSettings
}): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['conversations', 'personas', 'settings'], 'readwrite')
  await tx.objectStore('conversations').clear()
  await tx.objectStore('personas').clear()
  for (const c of payload.conversations) {
    await tx.objectStore('conversations').put(c)
  }
  for (const p of payload.personas) {
    await tx.objectStore('personas').put(p)
  }
  await tx.objectStore('settings').put(payload.settings, SETTINGS_KEY)
  await tx.done
}

export async function clearAppData(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['conversations', 'personas', 'settings'], 'readwrite')
  await Promise.all([
    tx.objectStore('conversations').clear(),
    tx.objectStore('personas').clear(),
    tx.objectStore('settings').clear(),
  ])
  await tx.done
}

export async function estimateStoreBytes(
  storeName: 'conversations' | 'personas' | 'settings',
): Promise<number> {
  const db = await getDb()
  const values = await db.getAll(storeName)
  return new Blob([JSON.stringify(values)]).size
}

export async function getStorageEstimate(): Promise<{
  usage: number
  quota: number
  chatBytes: number
  personaBytes: number
  settingsBytes: number
}> {
  const [estimate, chatBytes, personaBytes, settingsBytes] = await Promise.all([
    navigator.storage?.estimate?.() ?? Promise.resolve({ usage: 0, quota: 0 }),
    estimateStoreBytes('conversations'),
    estimateStoreBytes('personas'),
    estimateStoreBytes('settings'),
  ])
  return {
    usage: estimate.usage ?? 0,
    quota: estimate.quota ?? 0,
    chatBytes,
    personaBytes,
    settingsBytes,
  }
}

/** Best-effort wipe of Cache API entries (app shell + WebLLM model weights). */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) return
  const keys = await caches.keys()
  await Promise.all(keys.map((key) => caches.delete(key)))
}

export async function estimateCacheBytes(): Promise<number> {
  if (!('caches' in window)) return 0
  const keys = await caches.keys()
  let total = 0
  for (const key of keys) {
    const cache = await caches.open(key)
    const requests = await cache.keys()
    for (const req of requests) {
      const res = await cache.match(req)
      if (!res) continue
      const clone = res.clone()
      const buf = await clone.arrayBuffer()
      total += buf.byteLength
    }
  }
  return total
}
