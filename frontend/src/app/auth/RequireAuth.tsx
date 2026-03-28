import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') return null
  if (state.status === 'guest') return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return children
}
