import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MatchCardSkeleton() {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-16 w-full mb-4" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-10" />
      </div>
    </Card>
  );
}
