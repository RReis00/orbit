import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/events/new')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4">
          <img src="/orbit-icone1.png" alt="Orbit logo" width={150} />
          <h1 className="text-3xl  gradient-text">Bem-vindo de volta</h1>
          <p className="text-white text-center">Entre e continue a explorar!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-full pl-12 pr-4 py-4 text-gray-400 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-full pl-12 pr-4 py-4 text-gray-400 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>

          <button type="submit" className="w-full py-4 gradient-button">
            Entrar
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-400">
            Não tem conta?{' '}
            <button className="relative gradient-text bg-clip-text transition-all after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-gradient-to-tr after:from-[#7c3aed] after:via-[#3b82f6] after:to-[#ec4899] after:rounded-full after:opacity-0 hover:after:opacity-100">
              Criar conta
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
