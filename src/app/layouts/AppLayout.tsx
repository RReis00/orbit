import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

export function AppLayout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {pathname !== '/' && pathname !== '/login' && (
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link to="/" className="font-semibold tracking-wide">
              Orbit
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <NavLink
                to="/events/new"
                className={({ isActive }) =>
                  `rounded-xl px-3 py-1 ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
                }
              >
                Criar Evento
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `rounded-xl px-3 py-1 ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
                }
              >
                Login
              </NavLink>
            </nav>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 pt-4 text-xs text-white/50">
        <p>© {new Date().getFullYear()} Orbit — MVP</p>
      </footer>
    </div>
  )
}
