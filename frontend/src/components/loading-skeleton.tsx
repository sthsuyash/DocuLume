export function DocumentSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-40 overflow-hidden rounded-xl bg-muted/50 shimmer"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          {/* User message skeleton */}
          <div className="flex justify-end">
            <div className="h-16 w-3/4 overflow-hidden rounded-xl bg-primary/20 shimmer" />
          </div>
          {/* Assistant message skeleton */}
          <div className="flex justify-start">
            <div className="h-24 w-3/4 overflow-hidden rounded-xl bg-muted/50 shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-32 overflow-hidden rounded-xl bg-muted/50 shimmer"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}
