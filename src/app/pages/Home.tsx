import { useNavigate } from 'react-router-dom'
import { OrbitLogo } from '../../components/OrbitLogo'

export function Home() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen gradient-galaxy-radial flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
          Orbit
        </h1>
        <OrbitLogo size={300} />

        <div className="text-center space-y-4">
          <p className="text-white/80 max-w-sm">
            Conecte-se com amigos em tempo real. Crie eventos próximos e partilhe momentos
            inesquecíveis.
          </p>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="w-full py-4 rounded-full transition-all text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 shadow-lg transition transform hover:scale-105 active:scale-95"
        >
          Começar
        </button>
      </div>
    </div>
  )
}
