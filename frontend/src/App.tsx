import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import type { Role } from './api/types'
import { useAuth } from './auth/AuthContext'
import { AppShell } from './layout/AppShell'
import { BillingPage } from './pages/BillingPage'
import { CoursesPage } from './pages/CoursesPage'
import { DashboardPage } from './pages/DashboardPage'
import { GradesPage } from './pages/GradesPage'
import { LoginPage } from './pages/LoginPage'
import { StudentsPage } from './pages/StudentsPage'
import { TimetablePage } from './pages/TimetablePage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireSession />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route element={<RequireRole roles={['ADMIN', 'ENSEIGNANT']} />}>
            <Route path="students" element={<StudentsPage />} />
          </Route>
          <Route path="courses" element={<CoursesPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route element={<RequireRole roles={['ADMIN', 'ETUDIANT']} />}>
            <Route path="billing" element={<BillingPage />} />
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
