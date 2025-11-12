import { createContext, useContext, useMemo, useState } from 'react'

export type Toast = { id: string; title?: string; message: string }
type Ctx = { toasts: Toast[]; addToast: (t: Omit<Toast,'id'>) => void; removeToast: (id: string) => void }

const ToastsCtx = createContext<Ctx | null>(null)

export function ToastsProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast: Ctx['addToast'] = (t) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, ...t }])
    setTimeout(() => removeToast(id), 6000)
  }
  const removeToast: Ctx['removeToast'] = (id) => setToasts((prev) => prev.filter((x) => x.id !== id))
  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts])

  return (
    <ToastsCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="min-w-64 max-w-96 rounded-xl border border-white/10 bg-gray-900/90 px-4 py-3 text-sm shadow-lg">
            {t.title && <div className="mb-1 font-semibold">{t.title}</div>}
            <div className="text-white/90">{t.message}</div>
            <button onClick={() => removeToast(t.id)} className="mt-2 text-xs text-white/60 underline">Fechar</button>
          </div>
        ))}
      </div>
    </ToastsCtx.Provider>
  )
}

export function useToasts() {
  const ctx = useContext(ToastsCtx)
  if (!ctx) throw new Error('useToasts fora de <ToastsProvider>')
  return ctx
}
