import { Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  roles?: UserRole[]
  children: ReactElement
}

export default function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    if (user.role === 'CUSTOMER') return <Navigate to="/customer/book" replace />
    if (user.role === 'DRIVER') return <Navigate to="/driver" replace />
    if (user.role === 'TRANSPORT_COMPANY') return <Navigate to="/company" replace />
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/login" replace />
  }

  return children
}
