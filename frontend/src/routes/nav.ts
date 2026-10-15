import type { Role } from '../api/types'

export type NavItem = {
  to: string
  label: string
  roles: Role[]
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Home', roles: ['ADMIN', 'ENSEIGNANT', 'ETUDIANT'] },
  { to: '/students', label: 'Students', roles: ['ADMIN', 'ENSEIGNANT'] },
  { to: '/courses', label: 'Courses', roles: ['ADMIN', 'ENSEIGNANT', 'ETUDIANT'] },
  { to: '/timetable', label: 'Timetable', roles: ['ADMIN', 'ENSEIGNANT', 'ETUDIANT'] },
  { to: '/grades', label: 'Grades', roles: ['ADMIN', 'ENSEIGNANT', 'ETUDIANT'] },
  { to: '/billing', label: 'Fees', roles: ['ADMIN', 'ETUDIANT'] },
]

export function navFor(role: Role) {
  return NAV.filter((item) => item.roles.includes(role))
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrator',
  ENSEIGNANT: 'Teacher',
  ETUDIANT: 'Student',
}
