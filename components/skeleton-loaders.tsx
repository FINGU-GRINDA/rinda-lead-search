"use client";

export function LeadCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-zinc-200 dark:border-zinc-800">
      <td className="px-4 py-3">
        <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32"></div>
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-24"></div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24"></div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-28"></div>
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-32"></div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-12"></div>
      </td>
    </tr>
  );
}

export function MessageSkeleton() {
  return (
    <div className="animate-pulse flex w-full justify-start">
      <div className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function StatusCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-zinc-900/70 p-4">
      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-24 mb-2"></div>
      <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-32 mb-2"></div>
      <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
    </div>
  );
}

export function LeadTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-32"></div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-md"></div>
          <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-md"></div>
          <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-md"></div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="w-12 px-4 py-3">
                <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
              </th>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
