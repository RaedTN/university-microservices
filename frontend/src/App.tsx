import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import type { Role } from './api/types'
import { useAuth } from './auth/AuthContext'
import { AppShell } from './layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PendingPage } from './pages/PendingPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireSession />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route element={<RequireRole roles={['ADMIN', 'ENSEIGNANT']} />}>
            <Route path="students" element={<PendingPage />} />
          </Route>
          <Route path="courses" element={<PendingPage />} />
          <Route path="timetable" element={<PendingPage />} />
          <Route path="grades" element={<PendingPage />} />
          <Route element={<RequireRole roles={['ADMIN', 'ETUDIANT']} />}>
            <Route path="billing" element={<PendingPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RequireSession() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireRole({ roles }: { roles: Role[] }) {
  const { session } = useAuth()
  if (!session || !roles.includes(session.role)) return <Navigate to="/" replace />
  return <Outlet />
}
