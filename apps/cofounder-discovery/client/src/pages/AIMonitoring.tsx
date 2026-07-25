import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  AlertCircle,
  Filter,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function AIMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedCampaign, setSelectedCampaign] = useState<number | undefined>(
    undefined
  );
  const [selectedDateRange, setSelectedDateRange] = useState<
    "today" | "week" | "month" | "all"
  >("all");
  const [selectedActionTypes, setSelectedActionTypes] = useState<string[]>([]);

  // Fetch AI activity metrics
  const { data: activityMetrics, refetch: refetchMetrics } =
    trpc.aiMonitoring.getActivityMetrics.useQuery();
  const { data: recentActivity, refetch: refetchActivity } =
    trpc.aiMonitoring.getRecentActivity.useQuery({
      limit: 50,
      campaignId: selectedCampaign,
      dateRange: selectedDateRange,
      actionTypes:
        selectedActionTypes.length > 0 ? selectedActionTypes : undefined,
    });
  const { data: performanceMetrics, refetch: refetchPerformance } =
    trpc.aiMonitoring.getPerformanceMetrics.useQuery();

  // Fetch campaigns for filter dropdown
  const { data: campaigns } = trpc.campaigns.list.useQuery();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchMetrics();
      refetchActivity();
      refetchPerformance();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetchMetrics, refetchActivity, refetchPerformance]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "prospect_discovered":
        return <Users className="w-4 h-4" />;
      case "match_created":
        return <CheckCircle2 className="w-4 h-4" />;
      case "message_sent":
        return <MessageSquare className="w-4 h-4" />;
      case "follow_up_scheduled":
        return <Clock className="w-4 h-4" />;
      case "pipeline_moved":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "prospect_discovered":
        return "bg-blue-500/10 text-blue-500";
      case "match_created":
        return "bg-green-500/10 text-green-500";
      case "message_sent":
        return "bg-purple-500/10 text-purple-500";
      case "follow_up_scheduled":
        return "bg-orange-500/10 text-orange-500";
      case "pipeline_moved":
        return "bg-pink-500/10 text-pink-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const actionTypeOptions = [
    { value: "prospect_discovered", label: "Prospect Discovered" },
    { value: "match_created", label: "Match Created" },
    { value: "message_sent", label: "Message Sent" },
    { value: "follow_up_scheduled", label: "Follow-up Scheduled" },
    { value: "pipeline_moved", label: "Pipeline Moved" },
  ];

  const toggleActionType = (actionType: string) => {
    setSelectedActionTypes(prev =>
      prev.includes(actionType)
        ? prev.filter(t => t !== actionType)
        : [...prev, actionType]
    );
  };

  const clearFilters = () => {
    setSelectedCampaign(undefined);
    setSelectedDateRange("all");
    setSelectedActionTypes([]);
  };

  const activeFilterCount =
    (selectedCampaign ? 1 : 0) +
    (selectedDateRange !== "all" ? 1 : 0) +
    selectedActionTypes.length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              AI Campaign Monitor
            </h1>
            <p className="text-muted-foreground mt-2">
              Real-time view of your AI automation engine
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 px-1.5 py-0.5 text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                autoRefresh
                  ? "bg-green-500/10 text-green-500 border border-green-500/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {autoRefresh ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 animate-pulse" />
                  Live
                </span>
              ) : (
                "Paused"
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-6 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filter Activity</h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear all
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Campaign Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Campaign
                </label>
                <Select
                  value={selectedCampaign?.toString() || "all"}
                  onValueChange={value =>
                    setSelectedCampaign(
                      value === "all" ? undefined : parseInt(value)
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns?.map(campaign => (
                      <SelectItem
                        key={campaign.id}
                        value={campaign.id.toString()}
                      >
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Date Range
                </label>
                <Select
                  value={selectedDateRange}
                  onValueChange={(value: any) => setSelectedDateRange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Type Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Action Types
                </label>
                <div className="space-y-2">
                  {actionTypeOptions.map(option => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={option.value}
                        checked={selectedActionTypes.includes(option.value)}
                        onCheckedChange={() => toggleActionType(option.value)}
                      />
                      <label
                        htmlFor={option.value}
                        className="text-sm cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* AI Health Status */}
        <Card className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-500">
                  AI Engine Active
                </h3>
                <p className="text-sm text-muted-foreground">
                  All systems operational • Last activity:{" "}
                  {activityMetrics?.lastActivityTime
                    ? formatTimeAgo(new Date(activityMetrics.lastActivityTime))
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">
                {activityMetrics?.activeCampaigns || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Campaigns
              </div>
            </div>
          </div>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Messages Sent Today */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-500" />
              </div>
              <Badge variant="outline" className="text-xs">
                Today
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">
              {activityMetrics?.messagesToday || 0}
            </div>
            <div className="text-sm text-muted-foreground">Messages Sent</div>
            <div className="mt-2 text-xs text-green-500">
              +{activityMetrics?.messagesThisHour || 0} this hour
            </div>
          </Card>

          {/* Approvals Pending */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <Badge variant="outline" className="text-xs">
                Pending
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">
              {activityMetrics?.pendingApprovals || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Awaiting Approval
            </div>
            {activityMetrics?.pendingApprovals &&
              activityMetrics.pendingApprovals > 0 && (
                <div className="mt-2 text-xs text-orange-500">
                  Action required
                </div>
              )}
          </Card>

          {/* New Matches */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <Badge variant="outline" className="text-xs">
                This Week
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">
              {activityMetrics?.matchesThisWeek || 0}
            </div>
            <div className="text-sm text-muted-foreground">New Matches</div>
            <div className="mt-2 text-xs text-green-500">
              {activityMetrics?.avgCompatibility || 0}% avg compatibility
            </div>
          </Card>

          {/* Pipeline Velocity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-pink-500" />
              </div>
              <Badge variant="outline" className="text-xs">
                Velocity
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">
              {performanceMetrics?.pipelineVelocity || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Days to Partnership
            </div>
            <div className="mt-2 text-xs text-green-500">
              {performanceMetrics?.pipelineMovements || 0} movements this week
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Rates */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Response Rate
                  </span>
                  <span className="text-sm font-semibold">
                    {performanceMetrics?.responseRate || 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                    style={{
                      width: `${performanceMetrics?.responseRate || 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Meeting Conversion
                  </span>
                  <span className="text-sm font-semibold">
                    {performanceMetrics?.meetingRate || 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{
                      width: `${performanceMetrics?.meetingRate || 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Partnership Rate
                  </span>
                  <span className="text-sm font-semibold">
                    {performanceMetrics?.partnershipRate || 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                    style={{
                      width: `${performanceMetrics?.partnershipRate || 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Active Campaigns */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Campaigns</h3>
            <div className="space-y-3">
              {performanceMetrics?.activeCampaignsList
                ?.slice(0, 5)
                .map((campaign: any) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {campaign.prospectsContacted} prospects contacted
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {campaign.status}
                    </Badge>
                  </div>
                )) || (
                <div className="text-center text-muted-foreground py-8">
                  No active campaigns
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent AI Activity</h3>
            {recentActivity && recentActivity.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {recentActivity.length}{" "}
                {recentActivity.length === 1 ? "result" : "results"} found
              </span>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(activity.actionType)}`}
                  >
                    {getActionIcon(activity.actionType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {formatActionType(activity.actionType)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.campaignName || "System"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {activity.details || "No details available"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTimeAgo(new Date(activity.timestamp))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activities found</p>
                <p className="text-sm mt-1">
                  {activeFilterCount > 0
                    ? "Try adjusting your filters to see more results"
                    : "AI actions will appear here as they happen"}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
