import type { Conversation } from '../types'

interface Props {
  open: boolean
  conversations: Conversation[]
  activeId: string | null
  onClose: () => void
  onNew: () => void
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onOpenPersonas: () => void
  onOpenSettings: () => void
  onOpenModels: () => void
}

export function Sidebar({
  open,
  conversations,
  activeId,
  onClose,
  onNew,
  onSelect,
  onRename,
  onDelete,
  onOpenPersonas,
  onOpenSettings,
  onOpenModels,
}: Props) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/25 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`surface fixed inset-y-0 right-0 z-40 flex w-[min(88vw,20rem)] flex-col border-l transition-transform md:static md:z-0 md:w-72 md:translate-x-0 md:rounded-3xl md:border ${
          open ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] p-4">
          <div>
            <p className="text-sm font-semibold">مساعدك المحلي</p>
            <p className="text-xs text-[var(--ink-muted)]">كل شيء يبقى على جهازك</p>
          </div>
          <button
            type="button"
            className="rounded-xl px-2 py-1 text-sm text-[var(--ink-muted)] hover:bg-black/5 md:hidden"
            onClick={onClose}
            aria-label="إغلاق القائمة"
          >
            إغلاق
          </button>
        </div>

        <div className="space-y-2 p-3">
          <button
            type="button"
            onClick={onNew}
            className="w-full rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
          >
            محادثة جديدة
          </button>
          <div className="grid grid-cols-3 gap-2">
            <NavChip label="نماذج" onClick={onOpenModels} />
            <NavChip label="شخصيات" onClick={onOpenPersonas} />
            <NavChip label="إعدادات" onClick={onOpenSettings} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <p className="px-2 pb-2 text-xs font-medium text-[var(--ink-muted)]">المحادثات</p>
          {conversations.length === 0 ? (
            <p className="px-2 text-sm text-[var(--ink-muted)]">لا توجد محادثات بعد.</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <div
                    className={`group flex items-center gap-1 rounded-2xl px-2 py-2 ${
                      c.id === activeId ? 'bg-[var(--accent-soft)]' : 'hover:bg-black/5'
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-right text-sm"
                      onClick={() => onSelect(c.id)}
                    >
                      {c.title}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-1.5 py-1 text-xs text-[var(--ink-muted)] opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      onClick={() => {
                        const next = window.prompt('اسم المحادثة الجديد', c.title)
                        if (next != null && next.trim()) onRename(c.id, next)
                      }}
                      aria-label="إعادة تسمية"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-1.5 py-1 text-xs text-[var(--danger)] opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      onClick={() => {
                        if (window.confirm('حذف هذه المحادثة؟')) onDelete(c.id)
                      }}
                      aria-label="حذف"
                    >
                      ⌫
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}

function NavChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-[var(--border)] bg-white/60 px-2 py-2 text-xs font-medium hover:bg-white"
    >
      {label}
    </button>
  )
}
