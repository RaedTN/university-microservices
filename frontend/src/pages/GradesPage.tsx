import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client'
import { courseById, courseLabel, formatGrade, fullName, gradeStudentId, teacherOwns } from '../api/domain'
import { messageFor, useCourses, useGradesFor, useStudents } from '../api/queries'
import type { EmailGrades, GradeNote, Student } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Empty } from '../components/Empty'
import { ErrorState } from '../components/ErrorState'
import { SelectField } from '../components/Field'
import { Loading } from '../components/Loading'
import { Fact, Facts, PageHeader } from '../components/Page'
import { Table, type Column } from '../components/Table'
import { useToast } from '../components/Toast'

export function GradesPage() {
  const { session } = useAuth()
  if (!session) return null
  if (session.role === 'ETUDIANT') return <OwnGrades email={session.email} />
  return <GradeSheet role={session.role} email={session.email} />
}

function OwnGrades({ email }: { email: string }) {
  const grades = useGradesFor(email)
  const courses = useCourses()

  if (grades.isLoading || courses.isLoading) return <Loading label="Reading your grades" />

  if (grades.isError) {
    return (
      <div className="rise">
        <PageHeader title="Grades" standfirst="Everything filed against your email, on the scale of twenty." />
        <div className="mt-12">
          <ErrorState
            title="Your grades did not load"
            detail={messageFor(grades.error, 'The grade service did not answer.')}
            onRetry={() => grades.refetch()}
            retrying={grades.isFetching}
          />
        </div>
      </div>
    )
  }

  const notes = grades.data?.notes ?? []
  const average = grades.data?.moyenne
  const courseList = courses.data ?? []
  const best = notes.reduce<GradeNote | null>((top, note) => (!top || note.grade > top.grade ? note : top), null)

  return (
    <div className="rise">
      <PageHeader
        title="Grades"
        standfirst={
          notes.length === 0
            ? 'Nothing has been recorded against your email yet.'
            : `Every grade filed against your email, on the scale of twenty. Your average across ${notes.length === 1 ? 'the one course' : `all ${notes.length} courses`} is ${average === null || average === undefined ? 'not yet set' : formatGrade(average)}.`
        }
      />

      <Facts>
        <Fact value={average === null || average === undefined ? '—' : formatGrade(average)} label="Average on 20" />
        <Fact value={notes.length} label="Grades recorded" />
        <Fact value={best ? formatGrade(best.grade) : '—'} label="Best result" />
      </Facts>

      <div className="mt-14 max-w-3xl">
        {notes.length === 0 ? (
          <Empty
            title="No grades yet"
            detail="A grade appears here as soon as a teacher files one against your email."
          />
        ) : (
          <Table
            caption="Your grades"
            rows={notes}
            getKey={(row) => String(row.id)}
            columns={[
              {
                key: 'course',
                header: 'Course',
                cell: (row) => courseLabel(courseById(courseList, String(row.course_id)), String(row.course_id)),
              },
              {
                key: 'grade',
                header: 'Out of 20',
                cell: (row) => <span className="tnum text-xl">{formatGrade(row.grade)}</span>,
              },
            ]}
          />
        )}
      </div>
    </div>
  )
}

function GradeSheet({ role, email }: { role: 'ADMIN' | 'ENSEIGNANT'; email: string }) {
  const queryClient = useQueryClient()
  const { push } = useToast()
  const courses = useCourses()
  const students = useStudents()
  const [courseId, setCourseId] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [removing, setRemoving] = useState<{ note: GradeNote; student: Student } | null>(null)

  const teaching = useMemo(() => {
    const all = courses.data ?? []
    return role === 'ENSEIGNANT' ? all.filter((course) => teacherOwns(course, email)) : all
  }, [courses.data, email, role])

  const roll = useMemo(() => students.data?.data ?? [], [students.data])
  const chosen = courseId ? courseById(teaching, courseId) : undefined

  const sheets = useQueries({
    queries: roll.map((student) => ({
      queryKey: ['grades', student.email],
      queryFn: () => apiGet<EmailGrades>(`/grades/by-email?email=${encodeURIComponent(student.email)}`),
      enabled: Boolean(chosen),
    })),
  })

  const save = useMutation({
    mutationFn: async ({ student, note, value }: { student: Student; note?: GradeNote; value: number }) => {
      if (note) return apiPut<GradeNote>(`/grades/${note.id}`, { grade: value })
      return apiPost<GradeNote>('/grades', {
        student_id: gradeStudentId(student),
        course_id: Number(courseId),
        grade: value,
        student_email: student.email,
      })
    },
    onSuccess: async (_result, { student }) => {
      setDrafts((current) => {
        const next = { ...current }
        delete next[student.email]
        return next
      })
      push(`${fullName(student)}'s grade was recorded.`, 'success')
      await queryClient.invalidateQueries({ queryKey: ['grades', student.email] })
    },
    onError: (error) => push(messageFor(error, 'That grade could not be recorded.'), 'error'),
  })

  const remove = useMutation({
    mutationFn: ({ note }: { note: GradeNote; student: Student }) => apiDelete<unknown>(`/grades/${note.id}`),
    onSuccess: async (_result, { student }) => {
      setRemoving(null)
      push(`${fullName(student)}'s grade was withdrawn.`, 'success')
      await queryClient.invalidateQueries({ queryKey: ['grades', student.email] })
    },
    onError: (error) => push(messageFor(error, 'That grade could not be withdrawn.'), 'error'),
  })

  if (courses.isLoading || students.isLoading) return <Loading label="Opening the grade sheet" />

  if (courses.isError || students.isError) {
    const failing = courses.isError ? courses : students
    return (
      <div className="rise">
        <PageHeader title="Grades" standfirst="Record a result for every student taking a course." />
        <div className="mt-12">
          <ErrorState
            title="The grade sheet did not open"
            detail={messageFor(failing.error, 'A service behind this page did not answer.')}
            onRetry={() => failing.refetch()}
            retrying={failing.isFetching}
          />
        </div>
      </div>
    )
  }

  const settled = sheets.every((query) => query.isSuccess || query.isError)
  const broken = sheets.filter((query) => query.isError).length
  const entered = chosen ? roll.filter((_student, index) => noteFor(sheets[index]?.data, courseId)).length : 0
  const average = chosen ? averageOf(sheets, courseId) : null

  return (
    <div className="rise">
      <PageHeader
        title="Grades"
        standfirst={
          role === 'ENSEIGNANT'
            ? 'Choose one of your courses and record a result for every student on the register.'
            : 'Choose a course and record a result for every student on the register.'
        }
      />

      <Facts>
        <Fact value={teaching.length} label={role === 'ENSEIGNANT' ? 'Courses you teach' : 'Courses published'} />
        <Fact value={roll.length} label="Students on the register" />
        {chosen ? <Fact value={settled ? entered : '—'} label="Graded in this course" /> : null}
        {chosen ? (
          <Fact value={settled && average !== null ? formatGrade(average) : '—'} label="Course average" />
        ) : null}
      </Facts>

      <div className="mt-12 max-w-md">
        <SelectField
          label="Course"
          name="course"
          value={courseId}
          onChange={(value) => {
            setCourseId(value)
            setDrafts({})
          }}
          placeholder="Choose a course"
          options={teaching.map((course) => ({ value: String(course.id), label: courseLabel(course) }))}
          disabled={teaching.length === 0}
        />
      </div>

      <div className="mt-10">
        {teaching.length === 0 ? (
          <Empty
            title={role === 'ENSEIGNANT' ? 'No course names you' : 'No courses published'}
            detail={
              role === 'ENSEIGNANT'
                ? 'Ask an administrator to put your sign-in email in the professor field of a course.'
                : 'Publish a course before recording grades against it.'
            }
          />
        ) : roll.length === 0 ? (
          <Empty title="Nobody is on the register" detail="Add students before recording grades." />
        ) : !chosen ? (
          <Empty title="Pick a course" detail="The grade sheet opens once you choose which course to mark." />
        ) : !settled ? (
          <Loading label="Reading the grades already filed" />
        ) : (
          <>
            {broken > 0 ? (
              <p role="alert" className="mb-6 bg-surface px-5 py-3 text-danger">
                {broken === 1
                  ? 'One student record could not be read, so their row is blank.'
                  : `${broken} student records could not be read, so their rows are blank.`}
              </p>
            ) : null}
            <Table
              caption={`Grades for ${courseLabel(chosen)}`}
              rows={roll}
              getKey={(row) => row._id}
              columns={sheetColumns({
                courseId,
                sheets,
                roll,
                drafts,
                setDrafts,
                save,
                onRemove: (note, student) => setRemoving({ note, student }),
              })}
            />
          </>
        )}
      </div>

      {removing ? (
        <ConfirmDialog
          title="Withdraw this grade?"
          description={`${fullName(removing.student)}'s ${formatGrade(removing.note.grade)} in ${courseLabel(chosen)} will be deleted and their average recalculated.`}
          confirmLabel="Withdraw the grade"
          pending={remove.isPending}
          error={remove.isError ? messageFor(remove.error, 'That grade could not be withdrawn.') : undefined}
          onConfirm={() => remove.mutate(removing)}
          onCancel={() => {
            remove.reset()
            setRemoving(null)
          }}
        />
      ) : null}
    </div>
  )
}

type Sheet = { data?: EmailGrades; isError: boolean }

function noteFor(data: EmailGrades | undefined, courseId: string) {
  return data?.notes?.find((note) => String(note.course_id) === String(courseId))
}

function averageOf(sheets: Sheet[], courseId: string) {
  const values = sheets.map((sheet) => noteFor(sheet.data, courseId)?.grade).filter((value): value is number => value !== undefined)
  if (values.length === 0) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
}

function sheetColumns({
  courseId,
  sheets,
  roll,
  drafts,
  setDrafts,
  save,
  onRemove,
}: {
  courseId: string
  sheets: Sheet[]
  roll: Student[]
  drafts: Record<string, string>
  setDrafts: (update: (current: Record<string, string>) => Record<string, string>) => void
  save: {
    mutate: (input: { student: Student; note?: GradeNote; value: number }) => void
    isPending: boolean
    variables?: { student: Student }
  }
  onRemove: (note: GradeNote, student: Student) => void
}): Column<Student>[] {
  return [
    { key: 'name', header: 'Student', cell: (row) => fullName(row) },
    { key: 'number', header: 'Number', cell: (row) => <span className="tnum">{row.studentNumber}</span> },
    {
      key: 'grade',
      header: 'Out of 20',
      cell: (row) => {
        const sheet = sheets[roll.indexOf(row)]
        const note = noteFor(sheet?.data, courseId)
        const draft = drafts[row.email] ?? (note ? String(note.grade) : '')
        const problem = gradeProblem(draft)
        return (
          <div className="min-w-[13rem]">
            <label htmlFor={`grade-${row._id}`} className="sr-only">
              Grade for {fullName(row)}
            </label>
            <input
              id={`grade-${row._id}`}
              type="number"
              inputMode="decimal"
              min="0"
              max="20"
              step="0.25"
              value={draft}
              placeholder={sheet?.isError ? 'Unavailable' : 'Not marked'}
              aria-invalid={problem ? true : undefined}
              aria-describedby={problem ? `grade-${row._id}-error` : undefined}
              onChange={(event) => setDrafts((current) => ({ ...current, [row.email]: event.target.value }))}
              className={`tnum w-full rounded-full bg-surface px-5 py-2.5 text-ink placeholder:text-muted ${
                problem ? 'shadow-[inset_0_0_0_2px_var(--danger)]' : ''
              }`}
            />
            {problem ? (
              <p id={`grade-${row._id}-error`} className="mt-2 text-base text-danger">
                {problem}
              </p>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Record',
      cell: (row) => {
        const sheet = sheets[roll.indexOf(row)]
        const note = noteFor(sheet?.data, courseId)
        const draft = drafts[row.email]
        const dirty = draft !== undefined && draft !== (note ? String(note.grade) : '')
        const problem = draft === undefined ? undefined : gradeProblem(draft)
        const pending = save.isPending && save.variables?.student.email === row.email
        return (
          <div className="flex flex-wrap items-center gap-4">
            <Button
              tone="quiet"
              className="px-4 py-2"
              disabled={!dirty || Boolean(problem) || pending}
              onClick={() => save.mutate({ student: row, note, value: Number(draft) })}
            >
              {pending ? 'Saving' : note ? 'Update' : 'Record'}
              <span className="sr-only"> the grade for {fullName(row)}</span>
            </Button>
            {note ? (
              <button type="button" className="text-danger underline underline-offset-4" onClick={() => onRemove(note, row)}>
                Withdraw<span className="sr-only"> {fullName(row)}&apos;s grade</span>
              </button>
            ) : null}
          </div>
        )
      },
    },
  ]
}

function gradeProblem(value: string) {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 'Use a number.'
  if (parsed < 0 || parsed > 20) return 'The scale runs from 0 to 20.'
  return undefined
}
