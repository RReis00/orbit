import { useNavigate } from 'react-router-dom'

export function Home() {
  const navigate = useNavigate()
  return (
    <>
      <div>Home</div>
      <button
        onClick={() => navigate('/events/new')}
        className="rounded-2xl bg-white px-4 py-2 font-medium text-gray-900 hover:bg-white/90"
      >Entrar</button>
    </>
  )
}
