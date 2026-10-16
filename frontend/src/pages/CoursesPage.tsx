import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { apiDelete, apiPost, apiPut } from '../api/client'
import { courseLabel, enrolledCourseIds, teacherOwns } from '../api/domain'
import { messageFor, useCourses, useGradesFor } from '../api/queries'
import type { Course, CourseInput, SoapBoolean } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Empty } from '../components/Empty'
import { ErrorState } from '../components/ErrorState'
import { Field, TextAreaField } from '../components/Field'
import { Loading } from '../components/Loading'
import { Modal } from '../components/Modal'
import { Fact, Facts, PageHeader } from '../components/Page'
import { useToast } from '../components/Toast'

type Errors = Partial<Record<keyof CourseInput, string>>

const BLANK: CourseInput = {
  code: '',
  name: '',
  description: '',
  credits: '',
  professor: '',
  semester: '',
  maxStudents: '',
  room: '',
  schedule: '',
}

export function CoursesPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { push } = useToast()
  const role = session?.role
  const courses = useCourses()
  const grades = useGradesFor(role === 'ETUDIANT' ? session?.email : undefined)
  const [editing, setEditing] = useState<Course | null | 'new'>(null)
  const [removing, setRemoving] = useState<Course | null>(null)

  const admin = role === 'ADMIN'
  const all = useMemo(() => courses.data ?? [], [courses.data])

  const mine = useMemo(() => {
    if (role === 'ENSEIGNANT') return all.filter((course) => teacherOwns(course, session?.email ?? ''))
    if (role === 'ETUDIANT') {
      const enrolled = enrolledCourseIds(grades.data?.notes ?? [])
      return all.filter((course) => enrolled.has(String(course.id)))
    }
    return all
  }, [all, grades.data, role, session?.email])

  const remove = useMutation({
    mutationFn: async (course: Course) => {
      const result = await apiDelete<SoapBoolean>(`/rest/courses/${course.id}`)
      if (result?.return === 'false') throw new Error('not-deleted')
      return result
    },
    onSuccess: async (_result, course) => {
      setRemoving(null)
      push(`${courseLabel(course)} was withdrawn.`, 'success')
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
      await queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (error) => push(messageFor(error, 'That course could not be withdrawn.'), 'error'),
  })

  const loading = courses.isLoading || grades.isLoading
  if (loading) return <Loading label="Reading the course list" />

  if (courses.isError) {
    return (
      <div className="rise">
        <PageHeader title="Courses" standfirst="Everything the university teaches this year." />
        <div className="mt-12">
          <ErrorState
            title="The course list did not load"
            detail={messageFor(courses.error, 'The course service did not answer.')}
            onRetry={() => courses.refetch()}
            retrying={courses.isFetching}
          />
        </div>
      </div>
    )
  }

  const credits = mine.reduce((sum, course) => sum + (Number(course.credits) || 0), 0)
  const seats = mine.reduce((sum, course) => sum + (Number(course.maxStudents) || 0), 0)

  return (
    <div className="rise">
      <PageHeader
        title="Courses"
        standfirst={standfirst(role, all.length)}
        action={
          admin ? (
            <Button onClick={() => setEditing('new')}>
              <Plus size={18} aria-hidden="true" />
              <span className="ml-2">Publish a course</span>
            </Button>
          ) : null
        }
      />

      <Facts>
        <Fact value={mine.length} label={role === 'ADMIN' ? 'Published' : 'Yours'} />
        <Fact value={credits} label="Credits in total" />
        {role === 'ADMIN' || role === 'ENSEIGNANT' ? <Fact value={seats} label="Seats offered" /> : null}
      </Facts>

      <div className="mt-14">
        {mine.length === 0 ? (
          <Empty
            title={emptyTitle(role)}
            detail={emptyDetail(role, all.length)}
            action={admin ? <Button onClick={() => setEditing('new')}>Publish the first course</Button> : undefined}
          />
        ) : (
          <ul className="grid gap-12">
            {mine.map((course) => (
              <li key={course.id ?? course.code} className="grid gap-5 lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)]">
                <div>
                  <h2 className="text-[clamp(1.75rem,3vw,2.5rem)]">{course.name || 'Untitled course'}</h2>
                  <p className="tnum mt-2 text-muted">
                    {[course.code, course.semester].filter(Boolean).join(' · ') || 'No code'}
                  </p>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-[46ch]">
                    {course.description ? <p>{course.description}</p> : null}
                    <dl className="mt-4 grid gap-1">
                      <Detail term="Taught by" value={course.professor || 'Not assigned'} />
                      <Detail term="Room and time" value={[course.room, course.schedule].filter(Boolean).join(', ') || 'Not set'} />
                      <Detail
                        term="Credits and seats"
                        value={`${course.credits || '0'} credits, ${course.enrolledStudents || '0'} of ${course.maxStudents || '0'} seats taken`}
                      />
                    </dl>
                  </div>
                  {admin ? (
                    <div className="flex shrink-0 gap-4">
                      <button
                        type="button"
                        className="text-ink underline underline-offset-4 motion-safe:transition-colors hover:text-muted"
                        onClick={() => setEditing(course)}
                      >
                        Edit<span className="sr-only"> {courseLabel(course)}</span>
                      </button>
                      <button
                        type="button"
                        className="text-danger underline underline-offset-4"
                        onClick={() => setRemoving(course)}
                      >
                        Withdraw<span className="sr-only"> {courseLabel(course)}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing ? (
        <CourseDialog
          course={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onDone={async (message) => {
            setEditing(null)
            push(message, 'success')
            await queryClient.invalidateQueries({ queryKey: ['courses'] })
          }}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Withdraw this course?"
          description={`${courseLabel(removing)} will be taken off the course list. Timetable slots pointing at it will stop naming a course, and grades already recorded stay where they are.`}
          confirmLabel="Withdraw the course"
          pending={remove.isPending}
          error={remove.isError ? messageFor(remove.error, 'That course could not be withdrawn.') : undefined}
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

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="text-muted">{term}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function standfirst(role: string | undefined, all: number) {
  if (role === 'ENSEIGNANT') {
    return `The courses that name you as their professor. ${all} are published across the university.`
  }
  if (role === 'ETUDIANT') return 'The courses you are taking, drawn from the grades filed against your email.'
  return 'Everything the university teaches, with the professor, the room and the seats on offer.'
}

function emptyTitle(role: string | undefined) {
  if (role === 'ENSEIGNANT') return 'No course names you'
  if (role === 'ETUDIANT') return 'No courses yet'
  return 'No courses published'
}

function emptyDetail(role: string | undefined, all: number) {
  if (role === 'ENSEIGNANT') {
    return `${all} courses are published, but none lists you as its professor. Ask an administrator to put your sign-in email in the professor field.`
  }
  if (role === 'ETUDIANT') {
    return 'A course appears here once a teacher files your first grade in it.'
  }
  return 'Publish a course and it will show up on the timetable, grade and fee pages.'
}

function CourseDialog({
  course,
  onClose,
  onDone,
}: {
  course: Course | null
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [draft, setDraft] = useState<CourseInput>(() => (course ? toDraft(course) : BLANK))
  const [errors, setErrors] = useState<Errors>({})
  const [failure, setFailure] = useState('')

  const save = useMutation({
    mutationFn: (body: CourseInput) =>
      course ? apiPut<Course>(`/rest/courses/${course.id}`, body) : apiPost<Course>('/rest/courses', body),
    onSuccess: () => onDone(course ? `${draft.code} was saved.` : `${draft.code} was published.`),
    onError: (error) => setFailure(messageFor(error, 'That course could not be saved.')),
  })

  function set(key: keyof CourseInput, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setFailure('')
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validate(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    save.mutate({
      code: draft.code.trim().toUpperCase(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      credits: draft.credits.trim(),
      professor: draft.professor.trim(),
      semester: draft.semester.trim(),
      maxStudents: draft.maxStudents.trim(),
      room: draft.room.trim(),
      schedule: draft.schedule.trim(),
    })
  }

  return (
    <Modal
      title={course ? 'Edit the course' : 'Publish a course'}
      description="A room cannot be booked twice for the same schedule, and a code can only be used once."
      onClose={onClose}
      wide
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Code"
            name="code"
            value={draft.code}
            onChange={(value) => set('code', value)}
            error={errors.code}
            placeholder="INF101"
            required
          />
          <Field
            label="Name"
            name="name"
            value={draft.name}
            onChange={(value) => set('name', value)}
            error={errors.name}
            placeholder="Programming"
            required
          />
          <Field
            label="Professor"
            name="professor"
            value={draft.professor}
            onChange={(value) => set('professor', value)}
            error={errors.professor}
            placeholder="teacher@university.local"
            hint="Use the teacher's sign-in email so the course reaches their pages."
            required
          />
          <Field
            label="Semester"
            name="semester"
            value={draft.semester}
            onChange={(value) => set('semester', value)}
            error={errors.semester}
            placeholder="S1"
            required
          />
          <Field
            label="Room"
            name="room"
            value={draft.room}
            onChange={(value) => set('room', value)}
            error={errors.room}
            placeholder="A1"
            required
          />
          <Field
            label="Schedule"
            name="schedule"
            value={draft.schedule}
            onChange={(value) => set('schedule', value)}
            error={errors.schedule}
            placeholder="Monday 08:00"
            required
          />
          <Field
            label="Credits"
            name="credits"
            type="number"
            min="1"
            max="30"
            value={draft.credits}
            onChange={(value) => set('credits', value)}
            error={errors.credits}
            required
          />
          <Field
            label="Seats"
            name="maxStudents"
            type="number"
            min="1"
            max="500"
            value={draft.maxStudents}
            onChange={(value) => set('maxStudents', value)}
            error={errors.maxStudents}
            required
          />
        </div>
        <div className="mt-5">
          <TextAreaField
            label="Description"
            name="description"
            value={draft.description}
            onChange={(value) => set('description', value)}
            hint="Optional"
          />
        </div>
        {failure ? (
          <p role="alert" className="mt-6 bg-surface px-5 py-3 text-danger">
            {failure}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving' : course ? 'Save the course' : 'Publish the course'}
          </Button>
          <Button tone="quiet" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function validate(draft: CourseInput): Errors {
  const errors: Errors = {}
  if (!draft.code.trim()) errors.code = 'A course needs a code.'
  else if (!/^[A-Za-z0-9-]{2,20}$/.test(draft.code.trim())) errors.code = 'Use 2 to 20 letters, digits or dashes.'
  if (!draft.name.trim()) errors.name = 'A course needs a name.'
  if (!draft.professor.trim()) errors.professor = 'Name the professor.'
  if (!draft.semester.trim()) errors.semester = 'Give the semester.'
  if (!draft.room.trim()) errors.room = 'Give the room.'
  if (!draft.schedule.trim()) errors.schedule = 'Give the schedule, so the room clash can be checked.'
  errors.credits = whole(draft.credits, 1, 30, 'credits')
  errors.maxStudents = whole(draft.maxStudents, 1, 500, 'seats')
  for (const key of Object.keys(errors) as (keyof Errors)[]) {
    if (!errors[key]) delete errors[key]
  }
  return errors
}

function whole(value: string, low: number, high: number, noun: string) {
  const trimmed = value.trim()
  if (!trimmed) return `Give the number of ${noun}.`
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed)) return 'Use a whole number.'
  if (parsed < low || parsed > high) return `Use a number between ${low} and ${high}.`
  return undefined
}

function toDraft(course: Course): CourseInput {
  return {
    code: course.code ?? '',
    name: course.name ?? '',
    description: course.description ?? '',
    credits: course.credits ?? '',
    professor: course.professor ?? '',
    semester: course.semester ?? '',
    maxStudents: course.maxStudents ?? '',
    room: course.room ?? '',
    schedule: course.schedule ?? '',
  }
}
