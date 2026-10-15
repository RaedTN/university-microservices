import { useQuery, useQueries } from '@tanstack/react-query'
import hall from '../assets/campus-hall.jpg'
import quad from '../assets/campus-quad.jpg'
import { apiGet } from '../api/client'
import type { BillingSummary, Course, EmailGrades, Student, StudentPage, TimetableSlot, UpToDate } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Empty } from '../components/Empty'
import { Loading } from '../components/Loading'
import { Table, type Column } from '../components/Table'

export function DashboardPage() {
  const { session } = useAuth()
  if (!session) return null
  if (session.role === 'ETUDIANT') return <StudentHome email={session.email} />
  return <StaffHome role={session.role} />
}

function StaffHome({ role }: { role: 'ADMIN' | 'ENSEIGNANT' }) {
  const students = useQuery({ queryKey: ['students'], queryFn: () => apiGet<StudentPage>('/students?limit=100') })
  const courses = useQuery({ queryKey: ['courses'], queryFn: () => apiGet<Course[]>('/rest/courses') })
  const slots = useQuery({ queryKey: ['timetable'], queryFn: () => apiGet<TimetableSlot[]>('/rest/timetable') })
  const rows = students.data?.data ?? []
  const fees = useQueries({
    queries: rows.map((student) => ({
      queryKey: ['up-to-date', student.email],
      queryFn: () => apiGet<UpToDate>(`/rest/billing/up-to-date?studentId=${encodeURIComponent(student.email)}`),
      enabled: role === 'ADMIN',
    })),
  })

  if (students.isLoading || courses.isLoading || slots.isLoading) return <Loading />
  if (students.isError || courses.isError || slots.isError) {
    const message = students.error?.message || courses.error?.message || slots.error?.message
    return <Empty title="The register did not answer" detail={message} />
  }

  const courseRows = courses.data ?? []
  const slotRows = slots.data ?? []
  const paid = fees.filter((query) => query.data?.IsUpToDateResult === 'true').length
  const feesReady = role !== 'ADMIN' || fees.every((query) => query.isSuccess || query.isError)

  const total = students.data?.total ?? 0

  return (
    <div className="rise">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)] lg:items-end">
        <h1 className="max-w-[10ch] text-[clamp(2.75rem,5.5vw,5rem)]">
          <span className="reveal-line">
            <span>{role === 'ADMIN' ? 'The register' : 'The week'}</span>
          </span>
        </h1>
        <p className="max-w-[40ch] text-muted">
          {count(total, 'student')} {total === 1 ? 'is' : 'are'} on file, with {count(courseRows.length, 'course')} and{' '}
          {count(slotRows.length, 'timetable slot')}.
          {role === 'ADMIN' && feesReady ? ` ${paid} of ${rows.length} fee accounts are paid in full.` : ''}
        </p>
      </header>
      <dl className="mt-12 flex flex-wrap justify-between gap-8">
        <Fact value={total} label="Students on file" />
        <Fact value={courseRows.length} label="Published courses" />
        <Fact value={slotRows.length} label="Timetable slots" />
        {role === 'ADMIN' && feesReady ? <Fact value={`${paid}/${rows.length}`} label="Fees paid in full" /> : null}
      </dl>
      <div className="mt-12 h-44 overflow-hidden md:h-56">
        <img src={quad} alt="Kilgo Quad at Duke University" className="drift h-full w-full object-cover" />
      </div>
      <div className="mt-16 grid items-start gap-14 xl:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.75fr)]">
        <section>
          <h2 className="text-3xl">Students</h2>
          <div className="mt-5">
            {rows.length === 0 ? (
              <Empty title="No students yet" detail="The student service returned an empty register." />
            ) : (
              <Table
                caption="Students on the register"
                rows={rows}
                getKey={(row) => row._id}
                columns={studentColumns(role, rows, fees)}
              />
            )}
          </div>
        </section>
        <section>
          <h2 className="text-3xl">Courses</h2>
          {courseRows.length === 0 ? (
            <p className="mt-4 text-muted">No courses have been published.</p>
          ) : (
            <ul className="mt-5 grid gap-5">
              {courseRows.map((course) => (
                <li key={course.id ?? course.code}>
                  <p className="text-xl">{course.name}</p>
                  <p className="text-muted">
                    {course.code} · {course.professor} · {course.room} · {course.schedule}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <h2 className="mt-12 text-3xl">Timetable</h2>
          {slotRows.length === 0 ? (
            <p className="mt-4 text-muted">No slots have been published.</p>
          ) : (
            <ul className="mt-5 grid gap-4">
              {slotRows.map((slot) => (
                <li key={slot.id}>
                  <p className="tnum text-xl">
                    {slot.day} {slot.startTime}–{slot.endTime}
                  </p>
                  <p className="text-muted">
                    Room {slot.room} · {courseName(courseRows, slot.courseId)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Fact({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="tnum font-display text-[clamp(2.5rem,4vw,3.5rem)] leading-none">{value}</dd>
      <p aria-hidden="true" className="mt-2 text-base text-muted">
        {label}
      </p>
    </div>
  )
}

function studentColumns(
  role: 'ADMIN' | 'ENSEIGNANT',
  rows: Student[],
  fees: { data?: UpToDate; isLoading: boolean; isError: boolean }[],
): Column<Student>[] {
  const columns: Column<Student>[] = [
    { key: 'number', header: 'Number', cell: (row) => row.studentNumber },
    { key: 'name', header: 'Name', cell: (row) => `${row.firstName} ${row.lastName}` },
    { key: 'email', header: 'Email', cell: (row) => row.email },
  ]
  if (role === 'ADMIN') {
    columns.push({
      key: 'fees',
      header: 'Fees',
      cell: (row) => {
        const query = fees[rows.findIndex((student) => student._id === row._id)]
        if (!query || query.isLoading) return 'Checking'
        if (query.isError) return 'Unavailable'
        return query.data?.IsUpToDateResult === 'true' ? 'Paid' : 'Open'
      },
    })
  }
  return columns
}

function StudentHome({ email }: { email: string }) {
  const record = useQuery({ queryKey: ['students', 'own'], queryFn: () => apiGet<StudentPage>('/students?limit=100') })
  const grades = useQuery({
    queryKey: ['grades', email],
    queryFn: () => apiGet<EmailGrades>(`/grades/by-email?email=${encodeURIComponent(email)}`),
  })
  const billing = useQuery({
    queryKey: ['billing', email],
    queryFn: () => apiGet<BillingSummary>(`/rest/billing/statement?studentId=${encodeURIComponent(email)}`),
  })

  if (record.isLoading || grades.isLoading || billing.isLoading) return <Loading />
  if (record.isError || grades.isError || billing.isError) {
    const message = record.error?.message || grades.error?.message || billing.error?.message
    return <Empty title="Your record did not load" detail={message} />
  }

  const student = record.data?.data?.[0]
  if (!student) {
    return <Empty title="No student file" detail="This account has no student record yet." />
  }

  const notes = grades.data?.notes ?? []
  const average = grades.data?.moyenne

  const summary = billing.data

  return (
    <div className="rise">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)] lg:items-end">
        <h1 className="max-w-[12ch] text-[clamp(2.75rem,5.5vw,5rem)]">
          <span className="reveal-line">
            <span>
              {student.firstName} {student.lastName}
            </span>
          </span>
        </h1>
        <p className="max-w-[40ch] text-muted">
          Student {student.studentNumber}. {averageSentence(average)} {feeSentence(summary)}
        </p>
      </header>
      <dl className="mt-12 flex flex-wrap justify-between gap-8">
        <Fact value={average === null || average === undefined ? '—' : formatGrade(average)} label="Average on 20" />
        <Fact value={notes.length} label="Grades recorded" />
        <Fact value={summary?.Status ? statusWord(summary.Status) : '—'} label="Fee account" />
        <Fact value={summary?.RemainingAmount ?? '—'} label="Remaining to pay" />
      </dl>
      <div className="mt-12 h-44 overflow-hidden md:h-56">
        <img
          src={hall}
          alt="Students in the engineering hall at the University of Tokyo"
          className="drift h-full w-full object-cover"
        />
      </div>
      <section className="mt-16">
        <h2 className="text-3xl">Grades</h2>
        <div className="mt-5 max-w-3xl">
          {notes.length === 0 ? (
            <Empty title="No grades yet" detail="Nothing has been recorded for this email." />
          ) : (
            <Table
              caption="Grades"
              rows={notes}
              getKey={(row) => String(row.id)}
              columns={[
                { key: 'course', header: 'Course', cell: (row) => String(row.course_id) },
                {
                  key: 'grade',
                  header: 'Grade',
                  cell: (row) => <span className="tnum">{formatGrade(row.grade)}</span>,
                },
              ]}
            />
          )}
        </div>
      </section>
    </div>
  )
}

function statusWord(status: string) {
  if (status === 'PAID') return 'Paid'
  if (status === 'PARTIAL') return 'Partial'
  return 'Unpaid'
}

function courseName(courses: Course[], courseId?: string) {
  return courses.find((course) => course.id === courseId)?.name ?? 'Course not listed'
}

function averageSentence(average: number | null | undefined) {
  if (average === null || average === undefined) return 'No grades have been recorded.'
  return `The average is ${formatGrade(average)} on the scale of 20.`
}

function feeSentence(summary: BillingSummary | undefined) {
  if (!summary || summary.error) return 'Fees could not be read.'
  if (!summary.Status) return 'No fee account is on file.'
  const track = [summary.Specialty, summary.Level].filter(Boolean).join(' ')
  if (summary.Status === 'PAID') return `${track} fees are paid, ${summary.PaidAmount} of ${summary.TotalAmount}.`
  if (summary.Status === 'PARTIAL') return `${summary.RemainingAmount} remains of ${summary.TotalAmount} for ${track}.`
  return `${track} fees are unpaid. ${summary.TotalAmount} is due.`
}

function count(value: number, singular: string) {
  return `${value} ${value === 1 ? singular : `${singular}s`}`
}

function formatGrade(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}
