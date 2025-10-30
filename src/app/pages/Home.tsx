import { useNavigate } from 'react-router-dom'
import { OrbitLogo } from '../../components/OrbitLogo'
import { StarBackground } from '../../components/StarBackground'

export function Home() {
  const navigate = useNavigate()
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <StarBackground />
        <div className="flex flex-col items-center gap-8 animate-fade-in">
          <h1 className="text-5xl gradient-text">Orbit</h1>
          <OrbitLogo size={300} />

          <div className="text-center space-y-4">
            <p className="text-white/80 max-w-sm">
              Conecte-se com amigos em tempo real. Crie eventos próximos e partilhe momentos
              inesquecíveis.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 gradient-button"
          >
            Começar
          </button>
        </div>
      </div>
    </>
  )
}
