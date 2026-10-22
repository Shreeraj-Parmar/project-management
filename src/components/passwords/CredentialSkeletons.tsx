import { Skeleton } from "@/components/ui/Skeleton";

/** Same grid and card proportions as the real thing, so nothing jumps when the data arrives. */
export const GRID_CLASS = "grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3";

export function CredentialSkeletons({ count = 6 }: { count?: number }) {
  return (
    <ul role="status" aria-label="Loading credentials" className={GRID_CLASS}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="t-card t-card--static flex flex-col p-4">
          <div className="flex items-start gap-3">
            <Skeleton width={40} height={40} className="!rounded-card" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <Skeleton height={16} width={i % 3 === 0 ? "70%" : i % 3 === 1 ? "55%" : "82%"} />
              <Skeleton height={16} width={64} />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton height={32} width="100%" />
            <Skeleton height={32} width="100%" />
          </div>
          <Skeleton height={24} width="48%" className="mt-3" />
          <Skeleton height={12} width={88} className="mt-4" />
        </li>
      ))}
    </ul>
  );
}
