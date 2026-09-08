import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-shimmer bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%] rounded', className)} />;
}

export function TextBlockSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      <div className="pt-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-nova py-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
      <ProductGridSkeleton />
    </div>
  );
}
