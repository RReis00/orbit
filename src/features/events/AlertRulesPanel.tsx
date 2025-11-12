import { useEffect, useState } from 'react'
import { createRule, listRules, toggleRule } from '../../mocks/api'
import type { EventMember, NotificationRule } from '../../lib/types'

export function AlertRulesPanel({ eventId, members }: { eventId: string; members: EventMember[] }) {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // form state
  const [scope, setScope] = useState<'event' | 'member'>('event')
  const [targetUserId, setTargetUserId] = useState<string | undefined>(undefined)
  const [notifyUserId, setNotifyUserId] = useState<string | undefined>(undefined)
  const [onEnter, setOnEnter] = useState(false)
  const [onExit, setOnExit] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError(null)
      try {
        const rs = await listRules(eventId)
        if (!active) return
        setRules(rs)
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Erro ao carregar regras')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [eventId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!notifyUserId) return
    const payload = {
      scope,
      targetUserId: scope === 'member' ? targetUserId : undefined,
      notifyUserId,
      onEnter,
      onExit,
      active: true,
    }
    const r = await createRule(eventId, payload as any)
    setRules((prev) => [r, ...prev])
  }

  async function handleToggle(rule: NotificationRule) {
    const updated = await toggleRule(rule.ruleId, !rule.active)
    setRules((prev) => prev.map((r) => (r.ruleId === updated.ruleId ? updated : r)))
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-white/10 p-4">
        <h4 className="font-semibold">Nova Regra</h4>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="block text-white/70">Scope</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
            >
              <option value="event">Evento (todos os membros)</option>
              <option value="member">Membro específico</option>
            </select>
          </label>

          {scope === 'member' && (
            <label className="text-sm">
              <span className="block text-white/70">Membro alvo</span>
              <select
                value={targetUserId ?? ''}
                onChange={(e) => setTargetUserId(e.target.value || undefined)}
                className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
              >
                <option value="">— escolher —</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.displayName}</option>
                ))}
              </select>
            </label>
          )}

          <label className="text-sm">
            <span className="block text-white/70">Destinatário</span>
            <select
              value={notifyUserId ?? ''}
              onChange={(e) => setNotifyUserId(e.target.value || undefined)}
              className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
            >
              <option value="">— escolher —</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.displayName}</option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onEnter} onChange={(e) => setOnEnter(e.target.checked)} />
              onEnter
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onExit} onChange={(e) => setOnExit(e.target.checked)} />
              onExit
            </label>
          </div>
        </div>

        <div className="text-right">
          <button className="rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-gray-900 disabled:bg-white/50">
            Criar regra
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-white/10 p-4">
        <h4 className="mb-2 font-semibold">Regras</h4>
        {loading ? (
          <p className="text-sm text-white/60">A carregar…</p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-white/60">Sem regras ainda.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rules.map((r) => (
              <li key={r.ruleId} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <div className="space-y-0.5">
                  <div className="font-medium">
                    {r.scope === 'event' ? 'Evento' : `Membro: ${members.find(m => m.userId === r.targetUserId)?.displayName ?? r.targetUserId?.slice(0,6)}`}
                  </div>
                  <div className="text-white/60">
                    Destinatário: {members.find(m => m.userId === r.notifyUserId)?.displayName ?? r.notifyUserId.slice(0,6)} ·
                    &nbsp;{r.onEnter ? 'onEnter' : ''}{r.onEnter && r.onExit ? ' / ' : ''}{r.onExit ? 'onExit' : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(r)}
                  className={`rounded-xl px-3 py-1 text-xs ${r.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/70'}`}
                >
                  {r.active ? 'Ativa' : 'Inativa'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
