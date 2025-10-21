import { useNavigate } from 'react-router-dom'

export function Login() {
  const navigate = useNavigate()
  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-bold">Login (mock)</h1>
      <p className="text-white/70">
        Nesta fase estamos sem backend. Clica em &quot;Entrar&quot; para seguir para a criação de
        evento.
      </p>
      <button
        onClick={() => navigate('/events/new')}
        className="rounded-2xl bg-white px-4 py-2 font-medium text-gray-900 hover:bg-white/90"
      >
        Entrar
      </button>
    </section>
  )
}
