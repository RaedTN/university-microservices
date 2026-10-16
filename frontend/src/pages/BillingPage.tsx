import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { apiGet, apiPost } from '../api/client'
import { formatMoney, fullName, statusWord } from '../api/domain'
import { messageFor, useStatement, useStudents } from '../api/queries'
import type { BillingSummary, Student } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { Empty } from '../components/Empty'
import { ErrorState } from '../components/ErrorState'
import { Field, SelectField } from '../components/Field'
import { Loading } from '../components/Loading'
import { Modal } from '../components/Modal'
import { Fact, Facts, PageHeader } from '../components/Page'
import { Table, type Column } from '../components/Table'
import { useToast } from '../components/Toast'

const LEVELS = [
  { value: 'L1', label: 'L1 — first year' },
  { value: 'L2', label: 'L2 — second year' },
  { value: 'L3', label: 'L3 — third year' },
]

const SPECIALTIES = [
  { value: 'GL', label: 'GL — software engineering' },
  { value: 'SI', label: 'SI — information systems' },
]

const BASE: Record<string, number> = { L1: 1000, L2: 1200, L3: 1500 }
const BONUS: Record<string, number> = { GL: 200, SI: 150 }

export function BillingPage() {
  const { session } = useAuth()
  if (!session) return null
  if (session.role === 'ETUDIANT') return <OwnAccount email={session.email} />
  return <FeeLedger />
}

function OwnAccount({ email }: { email: string }) {
  const statement = useStatement(email)

  if (statement.isLoading) return <Loading label="Reading your fee account" />

  if (statement.isError) {
    return (
      <div className="rise">
        <PageHeader title="Fees" standfirst="What the year costs, what you have paid and what is left." />
        <div className="mt-12">
          <ErrorState
            title="Your fee account did not load"
            detail={messageFor(statement.error, 'The billing service did not answer.')}
            onRetry={() => statement.refetch()}
            retrying={statement.isFetching}
          />
        </div>
      </div>
    )
  }

  const summary = statement.data
  const invoiced = Number(summary?.TotalAmount ?? 0) > 0

  if (!invoiced) {
    return (
      <div className="rise">
        <PageHeader
          title="Fees"
          standfirst="What the year costs, what you have paid and what is left to settle."
        />
        <div className="mt-14">
          <Empty
            title="No invoice yet"
            detail="The administration has not raised an invoice against your account. Nothing is owed until they do."
          />
        </div>
      </div>
    )
  }

  const remaining = Number(summary?.RemainingAmount ?? 0)

  return (
    <div className="rise">
      <PageHeader
        title="Fees"
        standfirst={
          remaining <= 0
            ? `Your ${summary?.Specialty} ${summary?.Level} fees are settled in full. Nothing is outstanding.`
            : `${formatMoney(remaining)} of your ${summary?.Specialty} ${summary?.Level} fees is still outstanding.`
        }
      />

      <Facts>
        <Fact value={formatMoney(summary?.TotalAmount)} label="Invoiced for the year" />
        <Fact value={formatMoney(summary?.PaidAmount)} label="Paid so far" />
        <Fact value={formatMoney(summary?.RemainingAmount)} label="Still to pay" />
        <Fact value={statusWord(summary?.Status)} label="Account standing" />
      </Facts>

      <section className="mt-16 max-w-3xl">
        <h2 className="text-3xl">The invoice</h2>
        <dl className="mt-6 grid gap-4">
          <Line term="Programme" value={`${summary?.Specialty ?? '—'}, year ${summary?.Level ?? '—'}`} />
          <Line term="Invoiced" value={formatMoney(summary?.TotalAmount)} />
          <Line term="Received" value={formatMoney(summary?.PaidAmount)} />
          <Line term="Outstanding" value={formatMoney(summary?.RemainingAmount)} />
          {summary?.Date ? <Line term="Last payment" value={dateText(summary.Date)} /> : null}
        </dl>
        <p className="mt-8 max-w-[46ch] text-muted">
          Payments are recorded by the administration. If one is missing, ask them to enter it; the account updates
          here straight away.
        </p>
      </section>
    </div>
  )
}

function Line({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 bg-surface px-5 py-4">
      <dt className="text-muted">{term}</dt>
      <dd className="tnum text-xl">{value}</dd>
    </div>
  )
}

function FeeLedger() {
  const queryClient = useQueryClient()
  const { push } = useToast()
  const students = useStudents()
  const [invoicing, setInvoicing] = useState<{ student: Student; summary?: BillingSummary } | null>(null)
  const [paying, setPaying] = useState<{ student: Student; summary?: BillingSummary } | null>(null)

  const roll = useMemo(() => students.data?.data ?? [], [students.data])

  const accounts = useQueries({
    queries: roll.map((student) => ({
      queryKey: ['billing', student.email],
      queryFn: () => apiGet<BillingSummary>(`/rest/billing/statement?studentId=${encodeURIComponent(student.email)}`),
    })),
  })

  if (students.isLoading) return <Loading label="Opening the fee ledger" />

  if (students.isError) {
    return (
      <div className="rise">
        <PageHeader title="Fees" standfirst="What every student owes and what has been collected." />
        <div className="mt-12">
          <ErrorState
            title="The ledger did not open"
            detail={messageFor(students.error, 'The student service did not answer.')}
            onRetry={() => students.refetch()}
            retrying={students.isFetching}
          />
        </div>
      </div>
    )
  }

  const settled = accounts.every((query) => query.isSuccess || query.isError)
  const broken = accounts.filter((query) => query.isError).length
  const summaries = accounts.map((query) => query.data)
  const billed = sum(summaries, 'TotalAmount')
  const collected = sum(summaries, 'PaidAmount')
  const outstanding = sum(summaries, 'RemainingAmount')
  const clear = summaries.filter((summary) => summary?.Status === 'PAID').length

  async function refreshAccount(email: string) {
    await queryClient.invalidateQueries({ queryKey: ['billing', email] })
  }

  return (
    <div className="rise">
      <PageHeader
        title="Fees"
        standfirst="Raise an invoice against a student, record what they pay, and watch the balance close."
      />

      <Facts>
        <Fact value={settled ? formatMoney(billed) : '—'} label="Invoiced in total" />
        <Fact value={settled ? formatMoney(collected) : '—'} label="Collected" />
        <Fact value={settled ? formatMoney(outstanding) : '—'} label="Outstanding" />
        <Fact value={settled ? `${clear}/${roll.length}` : '—'} label="Accounts settled" />
      </Facts>

      <div className="mt-14">
        {roll.length === 0 ? (
          <Empty title="Nobody is on the register" detail="Add students before raising invoices." />
        ) : !settled ? (
          <Loading label="Reading the fee accounts" />
        ) : (
          <>
            {broken > 0 ? (
              <p role="alert" className="mb-6 bg-surface px-5 py-3 text-danger">
                {broken === 1
                  ? 'One fee account could not be read, so its row is blank.'
                  : `${broken} fee accounts could not be read, so their rows are blank.`}
              </p>
            ) : null}
            <Table
              caption="Fee accounts"
              rows={roll}
              getKey={(row) => row._id}
              columns={ledgerColumns({
                roll,
                accounts,
                onInvoice: (student, summary) => setInvoicing({ student, summary }),
                onPay: (student, summary) => setPaying({ student, summary }),
              })}
            />
          </>
        )}
      </div>

      {invoicing ? (
        <InvoiceDialog
          student={invoicing.student}
          summary={invoicing.summary}
          onClose={() => setInvoicing(null)}
          onDone={async (message, email) => {
            setInvoicing(null)
            push(message, 'success')
            await refreshAccount(email)
          }}
          onFail={(message) => push(message, 'error')}
        />
      ) : null}

      {paying ? (
        <PaymentDialog
          student={paying.student}
          summary={paying.summary}
          onClose={() => setPaying(null)}
          onDone={async (message, email) => {
            setPaying(null)
            push(message, 'success')
            await refreshAccount(email)
          }}
          onFail={(message) => push(message, 'error')}
        />
      ) : null}
    </div>
  )
}

type Account = { data?: BillingSummary; isError: boolean }

function ledgerColumns({
  roll,
  accounts,
  onInvoice,
  onPay,
}: {
  roll: Student[]
  accounts: Account[]
  onInvoice: (student: Student, summary?: BillingSummary) => void
  onPay: (student: Student, summary?: BillingSummary) => void
}): Column<Student>[] {
  const at = (row: Student) => accounts[roll.indexOf(row)]
  return [
    {
      key: 'student',
      header: 'Student',
      cell: (row) => (
        <>
          <span className="block">{fullName(row)}</span>
          <span className="block break-all text-base text-muted">{row.email}</span>
        </>
      ),
    },
    {
      key: 'programme',
      header: 'Programme',
      cell: (row) => {
        const summary = at(row)?.data
        if (!summary || !invoiced(summary)) return <span className="text-muted">Not invoiced</span>
        return `${summary.Specialty}, ${summary.Level}`
      },
    },
    {
      key: 'total',
      header: 'Invoiced',
      cell: (row) => <span className="tnum">{money(at(row), 'TotalAmount')}</span>,
    },
    { key: 'paid', header: 'Paid', cell: (row) => <span className="tnum">{money(at(row), 'PaidAmount')}</span> },
    {
      key: 'remaining',
      header: 'Outstanding',
      cell: (row) => <span className="tnum">{money(at(row), 'RemainingAmount')}</span>,
    },
    {
      key: 'status',
      header: 'Standing',
      cell: (row) => {
        const account = at(row)
        if (account?.isError) return <span className="text-danger">Unavailable</span>
        const summary = account?.data
        if (!summary || !invoiced(summary)) return <span className="text-muted">—</span>
        return statusWord(summary.Status)
      },
    },
    {
      key: 'actions',
      header: 'Account',
      cell: (row) => {
        const account = at(row)
        const summary = account?.data
        const hasInvoice = Boolean(summary && invoiced(summary))
        return (
          <div className="flex flex-wrap items-center gap-4">
            <Button tone="quiet" className="px-4 py-2" onClick={() => onInvoice(row, summary)}>
              {hasInvoice ? 'Re-invoice' : 'Invoice'}
              <span className="sr-only"> {fullName(row)}</span>
            </Button>
            <Button
              className="px-4 py-2"
              disabled={!hasInvoice || summary?.Status === 'PAID'}
              onClick={() => onPay(row, summary)}
            >
              Record a payment
              <span className="sr-only"> for {fullName(row)}</span>
            </Button>
          </div>
        )
      },
    },
  ]
}

function InvoiceDialog({
  student,
  summary,
  onClose,
  onDone,
  onFail,
}: {
  student: Student
  summary?: BillingSummary
  onClose: () => void
  onDone: (message: string, email: string) => void
  onFail: (message: string) => void
}) {
  const [specialty, setSpecialty] = useState(summary?.Specialty && BONUS[summary.Specialty] ? summary.Specialty : 'GL')
  const [level, setLevel] = useState(summary?.Level && BASE[summary.Level] ? summary.Level : 'L1')
  const [failure, setFailure] = useState('')

  const raise = useMutation({
    mutationFn: () => apiPost<BillingSummary>('/rest/billing/fees', { studentId: student.email, specialty, level }),
    onSuccess: (result) =>
      onDone(`${fullName(student)} was invoiced for ${formatMoney(result?.TotalAmount)}.`, student.email),
    onError: (error) => {
      const message = messageFor(error, 'That invoice could not be raised.')
      setFailure(message)
      onFail(message)
    },
  })

  const preview = (BASE[level] ?? 0) + (BONUS[specialty] ?? 0)
  const paid = Number(summary?.PaidAmount ?? 0)

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setFailure('')
    raise.mutate()
  }

  return (
    <Modal
      title={summary && invoiced(summary) ? 'Re-invoice the year' : 'Invoice the year'}
      description={`The fee follows the year and the specialty. It is raised against ${student.email}, which is the key the billing service keys on.`}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Year"
            name="level"
            value={level}
            onChange={setLevel}
            options={LEVELS}
            required
          />
          <SelectField
            label="Specialty"
            name="specialty"
            value={specialty}
            onChange={setSpecialty}
            options={SPECIALTIES}
            required
          />
        </div>

        <div className="mt-8 bg-surface px-6 py-6">
          <p className="text-muted">{`${level} tuition plus the ${specialty} supplement comes to`}</p>
          <p className="tnum mt-2 font-display text-[clamp(2.5rem,5vw,3.5rem)] leading-none">
            {formatMoney(preview)}
          </p>
          {paid > 0 ? (
            <p className="mt-3 text-muted">
              {formatMoney(paid)} already received stays on the account, leaving{' '}
              {formatMoney(Math.max(preview - paid, 0))} to settle.
            </p>
          ) : null}
        </div>

        {failure ? (
          <p role="alert" className="mt-6 bg-surface px-5 py-3 text-danger">
            {failure}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="submit" disabled={raise.isPending}>
            {raise.isPending ? 'Raising' : 'Raise the invoice'}
          </Button>
          <Button tone="quiet" onClick={onClose} disabled={raise.isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function PaymentDialog({
  student,
  summary,
  onClose,
  onDone,
  onFail,
}: {
  student: Student
  summary?: BillingSummary
  onClose: () => void
  onDone: (message: string, email: string) => void
  onFail: (message: string) => void
}) {
  const remaining = Number(summary?.RemainingAmount ?? 0)
  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : '')
  const [problem, setProblem] = useState<string | undefined>()
  const [failure, setFailure] = useState('')

  const pay = useMutation({
    mutationFn: (value: number) => apiPost<BillingSummary>('/rest/billing/payments', { studentId: student.email, amount: value }),
    onSuccess: (result) =>
      onDone(
        result?.Status === 'PAID'
          ? `${fullName(student)}'s fees are settled in full.`
          : `${formatMoney(amount)} was recorded against ${fullName(student)}.`,
        student.email,
      ),
    onError: (error) => {
      const message = messageFor(error, 'That payment could not be recorded.')
      setFailure(message)
      onFail(message)
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Number(amount)
    if (!amount.trim()) return setProblem('Give the amount received.')
    if (!Number.isFinite(value)) return setProblem('Use a number.')
    if (value <= 0) return setProblem('A payment has to be more than nothing.')
    if (value > remaining) return setProblem(`That is more than the ${formatMoney(remaining)} outstanding.`)
    setProblem(undefined)
    setFailure('')
    pay.mutate(value)
  }

  return (
    <Modal
      title="Record a payment"
      description={`${formatMoney(remaining)} of ${fullName(student)}'s ${formatMoney(summary?.TotalAmount)} invoice is outstanding.`}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate>
        <Field
          label="Amount received"
          name="amount"
          type="number"
          min="0"
          max={String(remaining)}
          step="0.01"
          value={amount}
          onChange={(value) => {
            setAmount(value)
            setProblem(undefined)
            setFailure('')
          }}
          error={problem}
          hint="Prefilled with the whole outstanding balance."
          required
        />

        {failure ? (
          <p role="alert" className="mt-6 bg-surface px-5 py-3 text-danger">
            {failure}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="submit" disabled={pay.isPending}>
            {pay.isPending ? 'Recording' : 'Record the payment'}
          </Button>
          <Button
            tone="quiet"
            disabled={pay.isPending || remaining <= 0}
            onClick={() => {
              setProblem(undefined)
              setAmount(String(remaining))
              pay.mutate(remaining)
            }}
          >
            Settle it in full
          </Button>
          <Button tone="quiet" onClick={onClose} disabled={pay.isPending}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function invoiced(summary: BillingSummary) {
  return Number(summary.TotalAmount ?? 0) > 0
}

function money(account: Account | undefined, key: 'TotalAmount' | 'PaidAmount' | 'RemainingAmount') {
  if (!account || account.isError) return '—'
  const summary = account.data
  if (!summary || !invoiced(summary)) return '—'
  return formatMoney(summary[key])
}

function sum(summaries: (BillingSummary | undefined)[], key: 'TotalAmount' | 'PaidAmount' | 'RemainingAmount') {
  return summaries.reduce((total, summary) => total + (Number(summary?.[key]) || 0), 0)
}

function dateText(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
