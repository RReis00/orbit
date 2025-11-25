import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { EventNew } from './pages/EventNew'
import { EventDetail } from './pages/EventDetail'
import { EventList } from './pages/EventList'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/events/new', element: <EventNew /> },
      { path: '/events/:id', element: <EventDetail /> },
      { path: 'events', element: <EventList /> },
    ],
  },
])
