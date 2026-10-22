import { Skeleton } from "@/components/ui";

export function SpendingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading spending">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="t-card t-card--static p-4">
            <Skeleton width={80} height={12} />
            <Skeleton width={110} height={28} className="mt-2" />
            <Skeleton width={70} height={12} className="mt-2" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
        <Skeleton height={232} className="rounded-card" />
        <Skeleton height={232} className="rounded-card" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={40} />
        ))}
      </div>
    </div>
  );
}
