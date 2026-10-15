import type { ReactNode } from 'react'

export type Column<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
}

type TableProps<T> = {
  columns: Column<T>[]
  rows: T[]
  getKey: (row: T) => string
  caption: string
}

export function Table<T>({ columns, rows, getKey, caption }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-4 py-2 text-base font-normal text-muted">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getKey(row)} className={index % 2 === 1 ? 'bg-surface' : ''}>
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3.5 align-top">
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
