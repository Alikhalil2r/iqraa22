import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', width, height, rounded = 'rounded-xl' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      style={{ width, height }}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card flex items-center gap-4">
      <Skeleton className="w-12 h-12 flex-shrink-0" rounded="rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-2 w-24" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="table-cell">
          <Skeleton className="h-4" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
      <td className="table-cell">
        <div className="flex gap-1">
          <Skeleton className="w-8 h-8" rounded="rounded-lg" />
          <Skeleton className="w-8 h-8" rounded="rounded-lg" />
        </div>
      </td>
    </tr>
  )
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <Skeleton className="h-6 w-36" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-44" rounded="rounded-xl" />
        <Skeleton className="h-9 w-28" rounded="rounded-xl" />
      </div>
      <table className="w-full">
        <thead className="bg-gray-50/80">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="table-header">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
            <th className="table-header"><Skeleton className="h-3 w-12" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" rounded="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" rounded="rounded-full" />
              <Skeleton className="h-5 w-16" rounded="rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-44 w-full" rounded="rounded-2xl" />
        </div>
        <div className="card">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-44 w-full" rounded="rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  )
}
