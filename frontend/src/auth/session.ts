import type { Role, Session } from '../api/types'

const KEY = 'registre.session'
const ROLES: Role[] = ['ADMIN', 'ENSEIGNANT', 'ETUDIANT']

export function readSession(): Session | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as Session
    const decoded = decodeToken(session.token)
    if (!decoded || decoded.email !== session.email) return null
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null
    return { token: session.token, email: decoded.email, role: decoded.role }
  } catch {
    return null
  }
}

export function writeSession(token: string): Session {
  const decoded = decodeToken(token)
  if (!decoded) throw new Error('The server returned a token this portal cannot read.')
  const session: Session = { token, email: decoded.email, role: decoded.role }
  localStorage.setItem(KEY, JSON.stringify(session))
  return session
}

export function clearSession() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('registre-logout'))
}

export function decodeToken(token: string): { email: string; role: Role; exp?: number } | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const json = JSON.parse(decodeBase64Url(part)) as { sub?: string; role?: string; exp?: number }
    if (!json.sub || !json.role || !ROLES.includes(json.role as Role)) return null
    return { email: json.sub, role: json.role as Role, exp: json.exp }
  } catch {
    return null
  }
}

function decodeBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return atob(padded)
}
