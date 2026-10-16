import type { Course, GradeNote, Student, TimetableSlot } from './types'

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

const DAY_ALIASES: Record<string, (typeof DAYS)[number]> = {
  monday: 'Monday',
  lundi: 'Monday',
  mon: 'Monday',
  tuesday: 'Tuesday',
  mardi: 'Tuesday',
  tue: 'Tuesday',
  wednesday: 'Wednesday',
  mercredi: 'Wednesday',
  wed: 'Wednesday',
  thursday: 'Thursday',
  jeudi: 'Thursday',
  thu: 'Thursday',
  friday: 'Friday',
  vendredi: 'Friday',
  fri: 'Friday',
  saturday: 'Saturday',
  samedi: 'Saturday',
  sat: 'Saturday',
}

export function dayOf(slot: TimetableSlot) {
  return DAY_ALIASES[String(slot.day ?? '').trim().toLowerCase()] ?? null
}

/** "08:30" and "8h30" both become minutes from midnight. */
export function minutesOf(time: string | undefined) {
  const match = /^(\d{1,2})\s*[:h.]?\s*(\d{2})?/.exec(String(time ?? '').trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2] ?? '0')
  if (!Number.isFinite(hours) || hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function clockOf(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function fullName(student: Student) {
  return `${student.firstName} ${student.lastName}`.trim()
}

/**
 * The grade service wants a numeric student id, but the register keys students by
 * Mongo id. Take the digits out of the student number so the id stays stable.
 */
export function gradeStudentId(student: Student) {
  const digits = student.studentNumber.replace(/\D/g, '')
  if (digits) return Number(digits.slice(-9))
  let hash = 0
  for (const character of student.email) {
    hash = (hash * 31 + character.charCodeAt(0)) % 2_000_000_000
  }
  return hash || 1
}

function normalize(value: string | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Courses carry a free-text professor, not a teacher account. Treat a course as the
 * teacher's when that field names their sign-in email or the name in front of the @.
 */
export function teacherOwns(course: Course, email: string) {
  const professor = normalize(course.professor)
  if (!professor) return false
  const account = normalize(email)
  const local = normalize(email.split('@')[0])
  return professor === account || professor === local || (local.length > 2 && professor.includes(local))
}

export function courseById(courses: Course[], id: string | undefined) {
  if (!id) return undefined
  return courses.find((course) => String(course.id) === String(id))
}

export function courseLabel(course: Course | undefined, fallbackId?: string) {
  if (!course) return fallbackId ? `Course ${fallbackId}` : 'Course not listed'
  return course.name ? `${course.code ? `${course.code} ` : ''}${course.name}` : (course.code ?? 'Untitled course')
}

/** No enrolment exists in the services, so a grade in a course is what marks attendance. */
export function enrolledCourseIds(notes: GradeNote[]) {
  return new Set(notes.map((note) => String(note.course_id)))
}

export function formatGrade(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function formatMoney(value: string | number | undefined) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return amount.toLocaleString('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

export function statusWord(status: string | undefined) {
  if (status === 'PAID') return 'Paid'
  if (status === 'PARTIAL') return 'Part paid'
  return 'Unpaid'
}

export function count(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`
}
