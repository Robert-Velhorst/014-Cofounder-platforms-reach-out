import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  Users,
  Target,
  MessageSquare,
  Database,
  Award,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AdminAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d"
  );

  const {
    data: analytics,
    isLoading,
    refetch,
  } = trpc.admin.getAnalytics.useQuery({
    dateRange,
  });

  // Check if user is admin
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <p className="text-muted-foreground">
            You need to be signed in to view analytics.
          </p>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            This page is only accessible to administrators.
          </p>
          <Button onClick={() => setLocation("/dashboard")}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const enrichmentCoverage =
    analytics?.enrichment?.totalProspects &&
    analytics.enrichment.totalProspects > 0
      ? Math.round(
          (analytics.enrichment.enrichedProspects /
            analytics.enrichment.totalProspects) *
            100
        )
      : 0;

  const avgEnrichmentScore = analytics?.enrichment.averageScore || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Admin Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Platform performance and enrichment metrics
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Filter */}
            <div className="flex gap-2">
              {(["7d", "30d", "90d", "all"] as const).map(range => (
                <Button
                  key={range}
                  variant={dateRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange(range)}
                >
                  {range === "all" ? "All Time" : range.toUpperCase()}
                </Button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Prospects */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {analytics?.enrichment.totalProspects.toLocaleString()}
            </h3>
            <p className="text-sm text-muted-foreground">Total Prospects</p>
          </Card>

          {/* Enrichment Coverage */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Award className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-xs font-medium text-purple-500">
                {enrichmentCoverage}%
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {analytics?.enrichment.enrichedProspects.toLocaleString()}
            </h3>
            <p className="text-sm text-muted-foreground">Enriched Prospects</p>
          </Card>

          {/* Avg Enrichment Score */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {avgEnrichmentScore.toFixed(1)}%
            </h3>
            <p className="text-sm text-muted-foreground">
              Avg Enrichment Score
            </p>
          </Card>

          {/* Total Matches */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Target className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {analytics?.campaigns.totalMatches.toLocaleString()}
            </h3>
            <p className="text-sm text-muted-foreground">Total Matches</p>
          </Card>
        </div>

        {/* Enrichment Quality Distribution */}
        <Card className="p-6 bg-card/50 backdrop-blur border-white/10 mb-8">
          <h2 className="text-xl font-bold mb-6">
            Enrichment Quality Distribution
          </h2>
          <div className="space-y-4">
            {analytics?.enrichment.qualityDistribution.map(bucket => {
              const percentage =
                analytics.enrichment.totalProspects > 0
                  ? (bucket.count / analytics.enrichment.totalProspects) * 100
                  : 0;

              return (
                <div key={bucket.range}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{bucket.range}</span>
                    <span className="text-sm text-muted-foreground">
                      {bucket.count} prospects ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Campaign Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Campaign Stats */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <h2 className="text-xl font-bold mb-6">Campaign Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Total Campaigns</span>
                </div>
                <span className="text-xl font-bold">
                  {analytics?.campaigns.totalCampaigns}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">Prospects Discovered</span>
                </div>
                <span className="text-xl font-bold">
                  {analytics?.campaigns.prospectsDiscovered.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Messages Sent</span>
                </div>
                <span className="text-xl font-bold">
                  {analytics?.campaigns.messagesSent.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">Response Rate</span>
                </div>
                <span className="text-xl font-bold">
                  {analytics?.campaigns.responseRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Platform Stats */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <h2 className="text-xl font-bold mb-6">Platform Statistics</h2>
            <div className="space-y-4">
              {analytics?.platforms.map(platform => (
                <div key={platform.name} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{platform.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {platform.count} prospects
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Enriched: </span>
                      <span className="font-medium">{platform.enriched}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Score: </span>
                      <span className="font-medium">
                        {platform.avgScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-3">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-purple-600 h-1.5 rounded-full"
                      style={{
                        width: `${platform.count > 0 ? (platform.enriched / platform.count) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Enrichment Activity */}
        <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
          <h2 className="text-xl font-bold mb-6">Recent Enrichment Activity</h2>
          <div className="space-y-3">
            {analytics?.enrichment.recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.score >= 70
                        ? "bg-green-500"
                        : activity.score >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium">{activity.prospectName}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.platform} •{" "}
                      {new Date(activity.enrichedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{activity.score}%</p>
                  <p className="text-xs text-muted-foreground">
                    Enrichment Score
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
