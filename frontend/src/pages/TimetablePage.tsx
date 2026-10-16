import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { apiDelete, apiPost, apiPut } from '../api/client'
import {
  DAYS,
  clockOf,
  courseById,
  courseLabel,
  dayOf,
  enrolledCourseIds,
  minutesOf,
  teacherOwns,
} from '../api/domain'
import { messageFor, useCourses, useGradesFor, useTimetable } from '../api/queries'
import type { Course, SlotInput, SoapBoolean, TimetableSlot } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Empty } from '../components/Empty'
import { ErrorState } from '../components/ErrorState'
import { Field, SelectField } from '../components/Field'
import { Loading } from '../components/Loading'
import { Modal } from '../components/Modal'
import { Fact, Facts, PageHeader } from '../components/Page'
import { useToast } from '../components/Toast'

type Placed = {
  slot: TimetableSlot
  day: (typeof DAYS)[number]
  start: number
  end: number
  lane: number
  lanes: number
}

type Errors = Partial<Record<keyof SlotInput, string>>

const HOUR = 5 // rem of column height per hour
const BLANK: SlotInput = { courseId: '', day: 'Monday', startTime: '08:00', endTime: '10:00', room: '' }

export function TimetablePage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { push } = useToast()
  const role = session?.role
  const admin = role === 'ADMIN'

  const slots = useTimetable()
  const courses = useCourses()
  const grades = useGradesFor(role === 'ETUDIANT' ? session?.email : undefined)
  const [editing, setEditing] = useState<TimetableSlot | null | 'new'>(null)
  const [removing, setRemoving] = useState<TimetableSlot | null>(null)

  const courseList = useMemo(() => courses.data ?? [], [courses.data])

  const mine = useMemo(() => {
    const all = slots.data ?? []
    if (role === 'ENSEIGNANT') {
      const owned = new Set(
        courseList.filter((course) => teacherOwns(course, session?.email ?? '')).map((course) => String(course.id)),
      )
      return all.filter((slot) => owned.has(String(slot.courseId)))
    }
    if (role === 'ETUDIANT') {
      const enrolled = enrolledCourseIds(grades.data?.notes ?? [])
      return all.filter((slot) => enrolled.has(String(slot.courseId)))
    }
    return all
  }, [courseList, grades.data, role, session?.email, slots.data])

  const remove = useMutation({
    mutationFn: async (slot: TimetableSlot) => {
      const result = await apiDelete<SoapBoolean>(`/rest/timetable/${slot.id}`)
      if (result?.return === 'false') throw new Error('not-deleted')
      return result
    },
    onSuccess: async () => {
      setRemoving(null)
      push('The slot was taken off the timetable.', 'success')
      await queryClient.invalidateQueries({ queryKey: ['timetable'] })
    },
    onError: (error) => push(messageFor(error, 'That slot could not be removed.'), 'error'),
  })

  if (slots.isLoading || courses.isLoading || grades.isLoading) return <Loading label="Drawing the week" />

  if (slots.isError) {
    return (
      <div className="rise">
        <PageHeader title="Timetable" standfirst="The teaching week, hour by hour." />
        <div className="mt-12">
          <ErrorState
            title="The timetable did not load"
            detail={messageFor(slots.error, 'The course service did not answer.')}
            onRetry={() => slots.refetch()}
            retrying={slots.isFetching}
          />
        </div>
      </div>
    )
  }

  const placed = place(mine)
  const loose = mine.filter((slot) => !dayOf(slot) || minutesOf(slot.startTime) === null)
  const bounds = extent(placed)
  const shown = DAYS.filter((day) => day !== 'Saturday' || placed.some((entry) => entry.day === day))
  const hours = Math.max(1, Math.ceil((bounds.end - bounds.start) / 60))

  return (
    <div className="rise">
      <PageHeader
        title="Timetable"
        standfirst={
          admin
            ? 'Every booked hour of the teaching week. Add a slot and it appears on the pages of whoever the course belongs to.'
            : 'Your teaching week, drawn from the courses you are attached to.'
        }
        action={
          admin ? (
            <Button onClick={() => setEditing('new')} disabled={courseList.length === 0}>
              <Plus size={18} aria-hidden="true" />
              <span className="ml-2">Add a slot</span>
            </Button>
          ) : null
        }
      />

      <Facts>
        <Fact value={mine.length} label="Slots in the week" />
        <Fact value={new Set(placed.map((entry) => entry.day)).size} label="Teaching days" />
        <Fact value={`${Math.round(taught(placed) / 6) / 10}h`} label="Hours taught" />
      </Facts>

      <div className="mt-14">
        {mine.length === 0 ? (
          <Empty
            title={admin ? 'The week is empty' : 'Nothing on your week'}
            detail={
              admin
                ? courseList.length === 0
                  ? 'Publish a course first; a slot has to point at one.'
                  : 'Add the first slot and the week will draw itself.'
                : 'No timetable slot belongs to a course of yours yet.'
            }
            action={
              admin && courseList.length > 0 ? <Button onClick={() => setEditing('new')}>Add a slot</Button> : undefined
            }
          />
        ) : (
          <>
            {/* Phone: the grid is unreadable at 390px, so the week becomes a list of days. */}
            <div className="grid gap-10 md:hidden">
              {shown.map((day) => {
                const entries = placed.filter((entry) => entry.day === day).sort((a, b) => a.start - b.start)
                if (entries.length === 0) return null
                return (
                  <section key={day}>
                    <h2 className="text-3xl">{day}</h2>
                    <ul className="mt-4 grid gap-3">
                      {entries.map((entry) => (
                        <li key={entry.slot.id}>
                          <SlotBlock
                            entry={entry}
                            courses={courseList}
                            admin={admin}
                            onEdit={() => setEditing(entry.slot)}
                            stacked
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <div className="flex min-w-[46rem] gap-2">
                <div className="w-14 shrink-0" style={{ paddingTop: '2.75rem' }}>
                  <div className="relative" style={{ height: `${hours * HOUR}rem` }}>
                    {Array.from({ length: hours + 1 }, (_, index) => (
                      <p
                        key={index}
                        className="tnum absolute right-0 -translate-y-1/2 text-base text-muted"
                        style={{ top: `${index * HOUR}rem` }}
                      >
                        {clockOf(bounds.start + index * 60)}
                      </p>
                    ))}
                  </div>
                </div>
                {shown.map((day) => (
                  <div key={day} className="min-w-0 flex-1">
                    <h2 className="pb-3 text-xl">{day}</h2>
                    <div className="relative bg-surface" style={{ height: `${hours * HOUR}rem` }}>
                      {placed
                        .filter((entry) => entry.day === day)
                        .map((entry) => (
                          <div
                            key={entry.slot.id}
                            className="absolute px-1"
                            style={{
                              top: `${((entry.start - bounds.start) / 60) * HOUR}rem`,
                              height: `${((entry.end - entry.start) / 60) * HOUR}rem`,
                              left: `${(entry.lane / entry.lanes) * 100}%`,
                              width: `${(1 / entry.lanes) * 100}%`,
                            }}
                          >
                            <SlotBlock
                              entry={entry}
                              courses={courseList}
                              admin={admin}
                              onEdit={() => setEditing(entry.slot)}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {loose.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-3xl">Off the grid</h2>
            <p className="mt-3 max-w-[46ch] text-muted">
              These slots carry a day or a time the week cannot place.
            </p>
            <ul className="mt-5 grid gap-3">
              {loose.map((slot) => (
                <li key={slot.id} className="bg-surface px-5 py-4">
                  <p>{courseLabel(courseById(courseList, slot.courseId), slot.courseId)}</p>
                  <p className="tnum mt-1 text-muted">
                    {[slot.day, `${slot.startTime}–${slot.endTime}`, slot.room].filter(Boolean).join(' · ')}
                  </p>
                  {admin ? (
                    <button
                      type="button"
                      className="mt-3 text-ink underline underline-offset-4"
                      onClick={() => setEditing(slot)}
                    >
                      Edit this slot
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {editing ? (
        <SlotDialog
          slot={editing === 'new' ? null : editing}
          courses={courseList}
          onRemove={(slot) => {
            setEditing(null)
            setRemoving(slot)
          }}
          onClose={() => setEditing(null)}
          onDone={async (message) => {
            setEditing(null)
            push(message, 'success')
            await queryClient.invalidateQueries({ queryKey: ['timetable'] })
          }}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Remove this slot?"
          description={`${courseLabel(courseById(courseList, removing.courseId), removing.courseId)} on ${removing.day} at ${removing.startTime} will leave the week. The course itself stays published.`}
          confirmLabel="Remove the slot"
          pending={remove.isPending}
          error={remove.isError ? messageFor(remove.error, 'That slot could not be removed.') : undefined}
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

function SlotBlock({
  entry,
  courses,
  admin,
  onEdit,
  stacked = false,
}: {
  entry: Placed
  courses: Course[]
  admin: boolean
  onEdit: () => void
  stacked?: boolean
}) {
  const name = courseLabel(courseById(courses, entry.slot.courseId), entry.slot.courseId)
  const time = `${clockOf(entry.start)}–${clockOf(entry.end)}`
  const body = (
    <>
      <p className="tnum text-base text-panel-muted dark:text-[var(--muted)]">{time}</p>
      <p className={stacked ? 'mt-1 text-xl' : 'mt-1 leading-tight'}>{name}</p>
      {entry.slot.room ? (
        <p className="mt-1 text-base text-panel-muted dark:text-[var(--muted)]">Room {entry.slot.room}</p>
      ) : null}
    </>
  )
  const block =
    'h-full overflow-hidden bg-panel px-4 py-3 text-panel-ink dark:bg-[var(--panel-mark)] dark:text-[var(--panel)]'
  if (!admin) {
    return <div className={block}>{body}</div>
  }
  return (
    <button
      type="button"
      onClick={onEdit}
      className={`block w-full text-left motion-safe:transition-colors hover:bg-[color-mix(in_srgb,var(--panel)_84%,var(--panel-ink))] dark:hover:bg-[var(--accent-press)] ${block}`}
    >
      {body}
      <span className="sr-only">Edit this slot</span>
    </button>
  )
}

/** Lay overlapping slots side by side inside their day column. */
function place(slots: TimetableSlot[]): Placed[] {
  const parsed = slots
    .map((slot) => {
      const day = dayOf(slot)
      const start = minutesOf(slot.startTime)
      const end = minutesOf(slot.endTime)
      if (!day || start === null) return null
      return { slot, day, start, end: end !== null && end > start ? end : start + 60 }
    })
    .filter((entry): entry is Omit<Placed, 'lane' | 'lanes'> => entry !== null)

  const placed: Placed[] = []
  for (const day of DAYS) {
    const ofDay = parsed.filter((entry) => entry.day === day).sort((a, b) => a.start - b.start || a.end - b.end)
    let cluster: Placed[] = []
    let clusterEnd = -1
    const flush = () => {
      const lanes = cluster.reduce((most, entry) => Math.max(most, entry.lane + 1), 1)
      for (const entry of cluster) placed.push({ ...entry, lanes })
      cluster = []
      clusterEnd = -1
    }
    for (const entry of ofDay) {
      if (cluster.length > 0 && entry.start >= clusterEnd) flush()
      const taken = new Set(cluster.filter((other) => other.end > entry.start).map((other) => other.lane))
      let lane = 0
      while (taken.has(lane)) lane += 1
      cluster.push({ ...entry, lane, lanes: 1 })
      clusterEnd = Math.max(clusterEnd, entry.end)
    }
    if (cluster.length > 0) flush()
  }
  return placed
}

function extent(placed: Placed[]) {
  if (placed.length === 0) return { start: 8 * 60, end: 18 * 60 }
  const start = Math.min(...placed.map((entry) => entry.start))
  const end = Math.max(...placed.map((entry) => entry.end))
  return { start: Math.floor(start / 60) * 60, end: Math.ceil(end / 60) * 60 }
}

function taught(placed: Placed[]) {
  return placed.reduce((sum, entry) => sum + (entry.end - entry.start), 0)
}

function SlotDialog({
  slot,
  courses,
  onClose,
  onDone,
  onRemove,
}: {
  slot: TimetableSlot | null
  courses: Course[]
  onClose: () => void
  onDone: (message: string) => void
  onRemove: (slot: TimetableSlot) => void
}) {
  const [draft, setDraft] = useState<SlotInput>(() => (slot ? toDraft(slot) : BLANK))
  const [errors, setErrors] = useState<Errors>({})
  const [failure, setFailure] = useState('')

  const save = useMutation({
    mutationFn: (body: SlotInput) =>
      slot ? apiPut<TimetableSlot>(`/rest/timetable/${slot.id}`, body) : apiPost<TimetableSlot>('/rest/timetable', body),
    onSuccess: () => onDone(slot ? 'The slot was moved.' : 'The slot was added to the week.'),
    onError: (error) => setFailure(messageFor(error, 'That slot could not be saved.')),
  })

  function set(key: keyof SlotInput, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setFailure('')
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const found: Errors = {}
    if (!draft.courseId) found.courseId = 'Choose the course this hour belongs to.'
    if (!draft.day) found.day = 'Choose a day.'
    const start = minutesOf(draft.startTime)
    const end = minutesOf(draft.endTime)
    if (start === null) found.startTime = 'Give a start time.'
    if (end === null) found.endTime = 'Give an end time.'
    else if (start !== null && end <= start) found.endTime = 'The slot has to end after it starts.'
    if (!draft.room.trim()) found.room = 'Give the room.'
    setErrors(found)
    if (Object.keys(found).length > 0) return
    save.mutate({ ...draft, room: draft.room.trim() })
  }

  return (
    <Modal
      title={slot ? 'Edit the slot' : 'Add a slot'}
      description="Slots are drawn on the week of everyone attached to the course."
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-5">
          <SelectField
            label="Course"
            name="courseId"
            value={draft.courseId}
            onChange={(value) => set('courseId', value)}
            error={errors.courseId}
            placeholder="Choose a course"
            required
            options={courses.map((course) => ({ value: String(course.id), label: courseLabel(course) }))}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <SelectField
              label="Day"
              name="day"
              value={draft.day}
              onChange={(value) => set('day', value)}
              error={errors.day}
              required
              options={DAYS.map((day) => ({ value: day, label: day }))}
            />
            <Field
              label="Starts"
              name="startTime"
              type="time"
              value={draft.startTime}
              onChange={(value) => set('startTime', value)}
              error={errors.startTime}
              required
            />
            <Field
              label="Ends"
              name="endTime"
              type="time"
              value={draft.endTime}
              onChange={(value) => set('endTime', value)}
              error={errors.endTime}
              required
            />
          </div>
          <Field
            label="Room"
            name="room"
            value={draft.room}
            onChange={(value) => set('room', value)}
            error={errors.room}
            placeholder="A1"
            required
          />
        </div>
        {failure ? (
          <p role="alert" className="mt-6 bg-surface px-5 py-3 text-danger">
            {failure}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving' : slot ? 'Save the slot' : 'Add the slot'}
          </Button>
          <Button tone="quiet" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          {slot ? (
            <button
              type="button"
              className="ml-auto text-danger underline underline-offset-4"
              onClick={() => onRemove(slot)}
            >
              Remove this slot
            </button>
          ) : null}
        </div>
      </form>
    </Modal>
  )
}

function toDraft(slot: TimetableSlot): SlotInput {
  const start = minutesOf(slot.startTime)
  const end = minutesOf(slot.endTime)
  return {
    courseId: String(slot.courseId ?? ''),
    day: dayOf(slot) ?? 'Monday',
    startTime: start === null ? '08:00' : clockOf(start),
    endTime: end === null ? '10:00' : clockOf(end),
    room: slot.room ?? '',
  }
}
