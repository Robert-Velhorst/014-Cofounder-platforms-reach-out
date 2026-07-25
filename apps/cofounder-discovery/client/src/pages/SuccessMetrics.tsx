import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  MessageSquare,
  Calendar,
  Handshake,
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Target,
  Percent,
} from "lucide-react";
import { Link } from "wouter";

export default function SuccessMetrics() {
  const { isAuthenticated } = useAuth();
  const { data: stats, isLoading } = trpc.successMetrics.getStats.useQuery();
  const { data: metrics } = trpc.successMetrics.list.useQuery({});

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <p className="text-muted-foreground">
            You need to be signed in to view success metrics.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-lg bg-background/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
                Success Metrics
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-green-500 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading metrics...</p>
          </div>
        ) : !stats ? (
          <Card className="p-12 text-center bg-card/50 backdrop-blur border-white/10">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No metrics yet</h2>
            <p className="text-muted-foreground mb-6">
              Start reaching out to prospects to track your success metrics.
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                  <Badge variant="secondary">
                    {stats.responseRate.toFixed(1)}%
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold">
                  {stats.messagesResponded}
                </h3>
                <p className="text-sm text-muted-foreground">Responses</p>
                <p className="text-xs text-muted-foreground mt-1">
                  from {stats.messagesSent} messages sent
                </p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 text-purple-500" />
                  <Badge variant="secondary">
                    {stats.meetingConversionRate.toFixed(1)}%
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold">
                  {stats.meetingsScheduled}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Meetings Scheduled
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.meetingsCompleted} completed
                </p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Handshake className="w-8 h-8 text-green-500" />
                  <Badge variant="secondary">
                    {stats.partnershipSuccessRate.toFixed(1)}%
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold">
                  {stats.partnershipsFormed}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Partnerships Formed
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.partnershipsFailed} didn't work out
                </p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                  <Badge variant="secondary">Overall</Badge>
                </div>
                <h3 className="text-2xl font-bold">
                  {(
                    (stats.partnershipsFormed /
                      Math.max(stats.messagesSent, 1)) *
                    100
                  ).toFixed(1)}
                  %
                </h3>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-xs text-muted-foreground mt-1">
                  messages → partnerships
                </p>
              </Card>
            </div>

            {/* Conversion Funnel */}
            <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-green-500" />
                Conversion Funnel
              </h2>

              <div className="space-y-4">
                {/* Messages Sent */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Messages Sent</span>
                    </div>
                    <span className="font-bold">{stats.messagesSent}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                {/* Responses */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">Responses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {stats.messagesResponded}
                      </span>
                      <Badge variant="secondary">
                        {stats.responseRate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full"
                      style={{ width: `${stats.responseRate}%` }}
                    />
                  </div>
                </div>

                {/* Meetings */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <span className="font-medium">Meetings Scheduled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {stats.meetingsScheduled}
                      </span>
                      <Badge variant="secondary">
                        {(
                          (stats.meetingsScheduled /
                            Math.max(stats.messagesSent, 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-orange-500 h-3 rounded-full"
                      style={{
                        width: `${(stats.meetingsScheduled / Math.max(stats.messagesSent, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Partnerships */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Handshake className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Partnerships Formed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {stats.partnershipsFormed}
                      </span>
                      <Badge variant="secondary">
                        {(
                          (stats.partnershipsFormed /
                            Math.max(stats.messagesSent, 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{
                        width: `${(stats.partnershipsFormed / Math.max(stats.messagesSent, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            {metrics && metrics.length > 0 && (
              <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
                <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
                <div className="space-y-3">
                  {metrics.slice(0, 10).map(metric => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {metric.metricType === "message_sent" && (
                          <MessageSquare className="w-5 h-5 text-blue-500" />
                        )}
                        {metric.metricType === "message_responded" && (
                          <CheckCircle2 className="w-5 h-5 text-purple-500" />
                        )}
                        {metric.metricType === "meeting_scheduled" && (
                          <Calendar className="w-5 h-5 text-orange-500" />
                        )}
                        {metric.metricType === "meeting_completed" && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {metric.metricType === "partnership_formed" && (
                          <Handshake className="w-5 h-5 text-green-500" />
                        )}
                        {metric.metricType === "partnership_failed" && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {metric.metricType
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          {metric.notes && (
                            <p className="text-sm text-muted-foreground">
                              {metric.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(metric.recordedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
