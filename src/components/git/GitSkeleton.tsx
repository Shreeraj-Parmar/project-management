import { Skeleton } from "@/components/ui";

export function GitSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading repository">
      <Skeleton height={56} className="rounded-card" />
      <Skeleton width={260} height={32} />
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton circle width={32} height={32} />
            <div className="flex-1 space-y-1.5">
              <Skeleton height={14} width="60%" />
              <Skeleton height={12} width="30%" />
            </div>
            <Skeleton width={64} height={22} />
          </div>
        ))}
      </div>
    </div>
  );
}
