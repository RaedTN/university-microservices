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
  phone?: string
  address?: string
}

export type StudentInput = {
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  phone?: string
  address?: string
}

export type StudentPage = {
  success: boolean
  total: number
  count: number
  page: number
  pages: number
  data: Student[]
}

export type StudentReply = {
  success: boolean
  message?: string
  data: Student
}

/** The course service is SOAP, so every field arrives as a string. */
export type Course = {
  id?: string
  code?: string
  name?: string
  description?: string
  credits?: string
  professor?: string
  semester?: string
  maxStudents?: string
  enrolledStudents?: string
  room?: string
  schedule?: string
}

export type CourseInput = {
  code: string
  name: string
  description: string
  credits: string
  professor: string
  semester: string
  maxStudents: string
  room: string
  schedule: string
}

export type TimetableSlot = {
  id?: string
  courseId?: string
  day?: string
  startTime?: string
  endTime?: string
  room?: string
}

export type SlotInput = {
  courseId: string
  day: string
  startTime: string
  endTime: string
  room: string
}

/** `deleteCourse` and `deleteTimetableSlot` answer with the SOAP boolean. */
export type SoapBoolean = {
  return?: string
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
  UpToDate?: string
  PaymentId?: string
  Date?: string
  Amount?: string
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
