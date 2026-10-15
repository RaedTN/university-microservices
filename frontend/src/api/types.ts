export type Role = 'ADMIN' | 'ENSEIGNANT' | 'ETUDIANT'

export type Session = {
  token: string
  email: string
  role: Role
}

export type Student = {
  _id: string
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  dateOfBirth?: string
}

export type StudentPage = {
  success: boolean
  total: number
  count: number
  data: Student[]
}

export type Course = {
  id?: string
  code?: string
  name?: string
  professor?: string
  room?: string
  schedule?: string
  semester?: string
  credits?: string
}

export type TimetableSlot = {
  id?: string
  courseId?: string
  day?: string
  startTime?: string
  endTime?: string
  room?: string
}

export type GradeNote = {
  id: number
  student_id: number
  course_id: number
  grade: number
  student_email?: string
}

export type EmailGrades = {
  student_email?: string
  notes?: GradeNote[]
  moyenne?: number | null
  error?: string
}

export type BillingSummary = {
  StudentId?: string
  Specialty?: string
  Level?: string
  TotalAmount?: string
  PaidAmount?: string
  RemainingAmount?: string
  Status?: string
  error?: string
}

export type UpToDate = {
  IsUpToDateResult?: string
  error?: string
}

export type LoginResponse = {
  token: string
  role: Role
}
