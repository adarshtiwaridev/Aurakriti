'use client';

export default function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-56 rounded-3xl bg-slate-200" />
          <div className="mt-6 space-y-4">
            <div className="h-4 w-3/4 rounded-full bg-slate-200" />
            <div className="h-4 w-1/2 rounded-full bg-slate-200" />
            <div className="h-4 w-full rounded-full bg-slate-200" />
            <div className="h-10 w-full rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
