import { Eye, EyeOff, Lock, Mail, Moon, Sun } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import campus from '../assets/campus.jpg'
import hall from '../assets/campus-hall.jpg'
import library from '../assets/campus-library.jpg'
import quad from '../assets/campus-quad.jpg'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { useToast } from '../components/Toast'

const SLIDES = [campus, hall, quad, library]

export function LoginPage() {
  const { session, login } = useAuth()
  const { push } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  if (session) return <Navigate to="/" replace />

  function toggleTheme() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('registre.theme', next ? 'dark' : 'light')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#07163f' : '#e9e0cd')
    setDark(next)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await login(email.trim(), password)
    } catch (caught) {
      const message = loginError(caught)
      setError(message)
      push(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <section className="relative min-h-72 overflow-hidden bg-panel text-white lg:min-h-screen">
        <div className="absolute inset-0" aria-hidden="true">
          {SLIDES.map((src) => (
            <img key={src} src={src} alt="" className="login-slide" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35" aria-hidden="true" />
        <div className="relative flex min-h-72 flex-col justify-between px-6 py-7 lg:min-h-screen lg:px-14 lg:py-14">
          <p className="font-display text-4xl text-white">UniPortal</p>
          <div className="max-w-xl">
            <h1 className="text-[clamp(3rem,6vw,5.5rem)] text-white">
              <span className="reveal-line">
                <span>Welcome</span>
              </span>
              <span className="reveal-line">
                <span>back</span>
              </span>
            </h1>
            <p className="mt-5 max-w-md text-xl text-white">
              Manage students, courses, grades and fees in one place.
            </p>
          </div>
        </div>
      </section>
      <section className="flex items-center bg-bg px-6 py-10 lg:px-14">
        <form className="w-full max-w-sm" onSubmit={onSubmit}>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-5xl">Sign in</h2>
            <button
              type="button"
              className="rounded-full bg-surface px-4 py-2 text-ink motion-safe:active:translate-y-px"
              aria-pressed={dark}
              onClick={toggleTheme}
            >
              {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              <span className="sr-only">{dark ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
          <div className="mt-8 grid gap-5">
            <label htmlFor="email" className="block">
              <span className="block text-base text-muted">Email</span>
              <span className="relative mt-2 block">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-full bg-surface py-3 pr-4 pl-11 text-ink"
                />
              </span>
            </label>
            <label htmlFor="password" className="block">
              <span className="block text-base text-muted">Password</span>
              <span className="relative mt-2 block">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'login-error' : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-full bg-surface py-3 pr-12 pl-11 text-ink"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 px-1 text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </span>
            </label>
            {error ? (
              <p id="login-error" role="alert" className="bg-surface px-5 py-3">
                {error}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="mt-8 w-full" disabled={pending || !email.trim() || !password}>
            {pending ? 'Signing in' : 'Sign in'}
          </Button>
        </form>
      </section>
    </div>
  )
}

function loginError(caught: unknown) {
  if (!(caught instanceof ApiError)) return 'UniPortal could not be opened. Try again.'
  if (/invalid credentials/i.test(caught.message)) {
    return 'Those credentials were not accepted. Check the email and password.'
  }
  return caught.message
}
