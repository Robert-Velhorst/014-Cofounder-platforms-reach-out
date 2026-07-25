import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card
            key={i}
            className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
