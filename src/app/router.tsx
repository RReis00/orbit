import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { Login } from './pages/Login'
import { EventNew } from './pages/EventNew'
import { EventDetail } from './pages/EventDetail'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/', element: <Login /> }, // provisório: / abre o login mock
      { path: '/login', element: <Login /> },
      { path: '/events/new', element: <EventNew /> },
      { path: '/events/:id', element: <EventDetail /> },
    ],
  },
])
