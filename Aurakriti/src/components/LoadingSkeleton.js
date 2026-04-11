'use client';

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex gap-4">
            {/* Image skeleton */}
            <div className="h-32 w-32 flex-shrink-0 rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-3/4 animate-pulse" />
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-1/2 animate-pulse" />
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-2/3 animate-pulse mt-4" />
            </div>

            {/* Actions skeleton */}
            <div className="flex flex-col gap-3 sm:items-end">
              <div className="h-11 w-32 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse" />
              <div className="h-10 w-28 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
