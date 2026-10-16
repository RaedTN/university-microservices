import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { apiDelete, apiPost, apiPut } from '../api/client'
import { fullName } from '../api/domain'
import { messageFor, useStudents } from '../api/queries'
import type { Student, StudentInput } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Empty } from '../components/Empty'
import { ErrorState } from '../components/ErrorState'
import { Field } from '../components/Field'
import { Loading } from '../components/Loading'
import { Modal } from '../components/Modal'
import { Fact, Facts, PageHeader } from '../components/Page'
import { Table, type Column } from '../components/Table'
import { useToast } from '../components/Toast'

const EMAIL = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/

type Draft = StudentInput
type Errors = Partial<Record<keyof Draft, string>>

const BLANK: Draft = {
  studentNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  phone: '',
  address: '',
}

export function StudentsPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { push } = useToast()
  const students = useStudents()
  const [term, setTerm] = useState('')
  const [editing, setEditing] = useState<Student | null | 'new'>(null)
  const [removing, setRemoving] = useState<Student | null>(null)

  const admin = session?.role === 'ADMIN'
  const rows = useMemo(() => students.data?.data ?? [], [students.data])

  const matches = useMemo(() => {
    const needle = term.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((student) =>
      [student.studentNumber, fullName(student), student.email].join(' ').toLowerCase().includes(needle),
    )
  }, [rows, term])

  const remove = useMutation({
    mutationFn: (student: Student) => apiDelete<unknown>(`/students/${student._id}`),
    onSuccess: async (_result, student) => {
      setRemoving(null)
      push(`${fullName(student)} was removed from the register.`, 'success')
      await queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (error) => push(messageFor(error, 'That student could not be removed.'), 'error'),
  })

  if (students.isLoading) return <Loading label="Opening the register" />

  if (students.isError) {
    return (
      <div className="rise">
        <PageHeader title="Students" standfirst="The register is the list of everyone enrolled at the university." />
        <div className="mt-12">
          <ErrorState
            title="The register did not open"
            detail={messageFor(students.error, 'The student service did not answer.')}
            onRetry={() => students.refetch()}
            retrying={students.isFetching}
          />
        </div>
      </div>
    )
  }

  const total = students.data?.total ?? rows.length

  return (
    <div className="rise">
      <PageHeader
        title="Students"
        standfirst={
          admin
            ? 'Every enrolled student, with the number, email and date of birth the other services key on.'
            : 'Every enrolled student. Only an administrator can change these records.'
        }
        action={
          admin ? (
            <Button onClick={() => setEditing('new')}>
              <Plus size={18} aria-hidden="true" />
              <span className="ml-2">Add a student</span>
            </Button>
          ) : null
        }
      />

      <Facts>
        <Fact value={total} label="On the register" />
        <Fact value={matches.length} label={term.trim() ? 'Matching the search' : 'Shown below'} />
      </Facts>

      <div className="mt-12 max-w-md">
        <label htmlFor="student-search" className="block">
          <span className="block text-base text-muted">Search by name, number or email</span>
          <span className="relative mt-2 block">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
              size={18}
              aria-hidden="true"
            />
            <input
              id="student-search"
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="STU9001, @university.local"
              className="w-full rounded-full bg-surface py-3 pr-4 pl-11 text-ink placeholder:text-muted"
            />
          </span>
        </label>
      </div>

      <div className="mt-10">
        {rows.length === 0 ? (
          <Empty
            title="Nobody is on the register"
            detail={
              admin
                ? 'Add the first student and the courses, grades and fee pages will have someone to point at.'
                : 'No students have been added yet.'
            }
            action={admin ? <Button onClick={() => setEditing('new')}>Add a student</Button> : undefined}
          />
        ) : matches.length === 0 ? (
          <Empty
            title="No match"
            detail={`Nothing on the register matches “${term.trim()}”.`}
            action={<Button tone="quiet" onClick={() => setTerm('')}>Clear the search</Button>}
          />
        ) : (
          <Table
            caption="Students on the register"
            rows={matches}
            getKey={(row) => row._id}
            columns={columns(admin, setEditing, setRemoving)}
          />
        )}
      </div>

      {editing ? (
        <StudentDialog
          student={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onDone={async (message) => {
            setEditing(null)
            push(message, 'success')
            await queryClient.invalidateQueries({ queryKey: ['students'] })
          }}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Remove this student?"
          description={`${fullName(removing)} (${removing.studentNumber}) will be taken off the register. Grades and fees already recorded against ${removing.email} are not deleted.`}
          confirmLabel="Remove the student"
          pending={remove.isPending}
          error={remove.isError ? messageFor(remove.error, 'That student could not be removed.') : undefined}
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

function columns(
  admin: boolean,
  onEdit: (student: Student) => void,
  onRemove: (student: Student) => void,
): Column<Student>[] {
  const list: Column<Student>[] = [
    { key: 'number', header: 'Number', cell: (row) => <span className="tnum">{row.studentNumber}</span> },
    { key: 'name', header: 'Name', cell: (row) => fullName(row) },
    { key: 'email', header: 'Email', cell: (row) => <span className="break-all">{row.email}</span> },
    { key: 'born', header: 'Born', cell: (row) => <span className="tnum">{dateText(row.dateOfBirth)}</span> },
  ]
  if (!admin) return list
  list.push({
    key: 'actions',
    header: 'Record',
    cell: (row) => (
      <span className="flex gap-4">
        <button
          type="button"
          className="text-ink underline underline-offset-4 motion-safe:transition-colors hover:text-muted"
          onClick={() => onEdit(row)}
        >
          Edit<span className="sr-only"> {fullName(row)}</span>
        </button>
        <button
          type="button"
          className="text-danger underline underline-offset-4"
          onClick={() => onRemove(row)}
        >
          Remove<span className="sr-only"> {fullName(row)}</span>
        </button>
      </span>
    ),
  })
  return list
}

function StudentDialog({
  student,
  onClose,
  onDone,
}: {
  student: Student | null
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [draft, setDraft] = useState<Draft>(() => (student ? toDraft(student) : BLANK))
  const [errors, setErrors] = useState<Errors>({})
  const [failure, setFailure] = useState('')

  const save = useMutation({
    mutationFn: (body: Draft) =>
      student ? apiPut<unknown>(`/students/${student._id}`, body) : apiPost<unknown>('/students', body),
    onSuccess: () =>
      onDone(student ? `${draft.firstName} ${draft.lastName}'s record was saved.` : `${draft.firstName} ${draft.lastName} was added to the register.`),
    onError: (error) => setFailure(messageFor(error, 'That record could not be saved.')),
  })

  function set(key: keyof Draft, value: string) {
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
      studentNumber: draft.studentNumber.trim(),
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim().toLowerCase(),
      dateOfBirth: draft.dateOfBirth,
      phone: draft.phone?.trim() || undefined,
      address: draft.address?.trim() || undefined,
    })
  }

  return (
    <Modal
      title={student ? 'Edit the record' : 'Add a student'}
      description={
        student
          ? 'The email is the key the grade and fee services use. Changing it detaches the records already filed under the old one.'
          : 'The email must match the account the student signs in with, otherwise their grades and fees stay hidden from them.'
      }
      onClose={onClose}
      wide
    >
      <form id="student-form" onSubmit={onSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Student number"
            name="studentNumber"
            value={draft.studentNumber}
            onChange={(value) => set('studentNumber', value)}
            error={errors.studentNumber}
            placeholder="STU9001"
            required
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={draft.email}
            onChange={(value) => set('email', value)}
            error={errors.email}
            placeholder="name@university.local"
            required
          />
          <Field
            label="First name"
            name="firstName"
            value={draft.firstName}
            onChange={(value) => set('firstName', value)}
            error={errors.firstName}
            required
          />
          <Field
            label="Last name"
            name="lastName"
            value={draft.lastName}
            onChange={(value) => set('lastName', value)}
            error={errors.lastName}
            required
          />
          <Field
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            value={draft.dateOfBirth}
            onChange={(value) => set('dateOfBirth', value)}
            error={errors.dateOfBirth}
            max={today()}
            required
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            value={draft.phone ?? ''}
            onChange={(value) => set('phone', value)}
            hint="Optional"
          />
        </div>
        <div className="mt-5">
          <Field
            label="Address"
            name="address"
            value={draft.address ?? ''}
            onChange={(value) => set('address', value)}
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
            {save.isPending ? 'Saving' : student ? 'Save the record' : 'Add the student'}
          </Button>
          <Button tone="quiet" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function validate(draft: Draft): Errors {
  const errors: Errors = {}
  if (!draft.studentNumber.trim()) errors.studentNumber = 'Give the student a number.'
  else if (draft.studentNumber.trim().length < 3) errors.studentNumber = 'Use at least three characters.'
  if (!draft.firstName.trim()) errors.firstName = 'The first name is required.'
  if (!draft.lastName.trim()) errors.lastName = 'The last name is required.'
  if (!draft.email.trim()) errors.email = 'The email is required.'
  else if (!EMAIL.test(draft.email.trim())) errors.email = 'That is not a valid email address.'
  if (!draft.dateOfBirth) errors.dateOfBirth = 'The date of birth is required.'
  else if (draft.dateOfBirth > today()) errors.dateOfBirth = 'That date has not happened yet.'
  else if (Number(draft.dateOfBirth.slice(0, 4)) < 1900) errors.dateOfBirth = 'That year is too far back.'
  return errors
}

function toDraft(student: Student): Draft {
  return {
    studentNumber: student.studentNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
    phone: student.phone ?? '',
    address: student.address ?? '',
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function dateText(value: string | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
