import { useQuery } from '@tanstack/react-query'
import { ApiError, apiGet } from './client'
import type { BillingSummary, Course, EmailGrades, StudentPage, TimetableSlot } from './types'

export const STUDENT_LIMIT = 200

export function useStudents(enabled = true) {
  return useQuery({
    queryKey: ['students'],
    queryFn: () => apiGet<StudentPage>(`/students?limit=${STUDENT_LIMIT}`),
    enabled,
  })
}

export function useCourses(enabled = true) {
  return useQuery({ queryKey: ['courses'], queryFn: () => apiGet<Course[]>('/rest/courses'), enabled })
}

export function useTimetable(enabled = true) {
  return useQuery({ queryKey: ['timetable'], queryFn: () => apiGet<TimetableSlot[]>('/rest/timetable'), enabled })
}

export function useGradesFor(email: string | undefined) {
  return useQuery({
    queryKey: ['grades', email],
    queryFn: () => apiGet<EmailGrades>(`/grades/by-email?email=${encodeURIComponent(email as string)}`),
    enabled: Boolean(email),
  })
}

export function useStatement(email: string | undefined) {
  return useQuery({
    queryKey: ['billing', email],
    queryFn: () => apiGet<BillingSummary>(`/rest/billing/statement?studentId=${encodeURIComponent(email as string)}`),
    enabled: Boolean(email),
  })
}

const TRANSLATIONS: [RegExp, string][] = [
  [/studentNumber existe d/i, 'That student number is already on the register.'],
  [/email existe d/i, 'That email is already on the register.'],
  [/existe d[ée]j/i, 'That record already exists.'],
  [/already exists/i, 'That code is taken, or the room is already booked for that schedule.'],
  [/le num[ée]ro [ée]tudiant est requis/i, 'The student number is required.'],
  [/le pr[ée]nom est requis/i, 'The first name is required.'],
  [/le nom est requis/i, 'The last name is required.'],
  [/l'email est requis/i, 'The email is required.'],
  [/la date de naissance est requise/i, 'The date of birth is required.'],
  [/veuillez entrer un email valide/i, 'That email address is not valid.'],
  [/[ée]tudiant non trouv/i, 'That student is no longer on the register.'],
  [/ressource non trouv/i, 'That record no longer exists.'],
  [/cours non trouv/i, 'That course no longer exists.'],
  [/cr[ée]neau non trouv/i, 'That timetable slot no longer exists.'],
  [/unavailable/i, 'That service is not answering. It may be restarting.'],
]

/** Downstream services answer in French, SOAP or raw faults. Say it once, in English. */
export function messageFor(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback
  if (error.status === 403) return 'Your role does not allow that.'
  if (error.status === 404) return 'That record no longer exists.'
  const match = TRANSLATIONS.find(([pattern]) => pattern.test(error.message))
  if (match) return match[1]
  if (error.status >= 500) return 'The service behind this page did not answer.'
  return error.message
}
