import { BookOpen, CalendarDays, CreditCard, GraduationCap, Home, Menu, Moon, Sun, Users } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ROLE_LABEL, navFor } from '../routes/nav'

const ICONS: Record<string, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  '/': Home,
  '/students': Users,
  '/courses': BookOpen,
  '/timetable': CalendarDays,
  '/grades': GraduationCap,
  '/billing': CreditCard,
}

export function AppShell() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  if (!session) return null

  const items = navFor(session.role)

  function toggleTheme() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('registre.theme', next ? 'dark' : 'light')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#07163f' : '#e9e0cd')
    setDark(next)
  }

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg text-ink md:grid md:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="bg-panel text-panel-ink md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <div className="flex items-center justify-between gap-3 px-6 pt-7">
          <div>
            <p className="font-display text-4xl">UniPortal</p>
            <p className="mt-1 text-panel-muted">{ROLE_LABEL[session.role]}</p>
          </div>
          <button
            type="button"
            className="md:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
        <nav className={open ? 'mt-7 grid gap-1 pb-6' : 'mt-7 hidden gap-1 pb-6 md:grid'} aria-label="Portal">
          {items.map((item) => {
            const Icon = ICONS[item.to] ?? Home
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `mx-3 flex items-center gap-3 rounded-full px-4 py-2.5 ${
                    isActive
                      ? 'bg-[var(--panel-mark)] text-[var(--panel)]'
                      : 'text-panel-ink hover:bg-[color-mix(in_srgb,var(--panel)_82%,var(--panel-ink))]'
                  }`
                }
              >
                <Icon size={18} aria-hidden={true} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-bg px-5 py-4 md:px-12">
          <p className="min-w-0 truncate text-muted" title={session.email}>
            {session.email}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button tone="quiet" onClick={toggleTheme} aria-pressed={dark}>
              {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              <span className="ml-2">{dark ? 'Light' : 'Dark'}</span>
            </Button>
            <Button tone="quiet" onClick={onLogout}>
              Log out
            </Button>
          </div>
        </header>
        <main className="px-5 pt-4 pb-14 md:px-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
