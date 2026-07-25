import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  Briefcase,
  Target,
  MessageSquare,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function ApprovalQueue() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [previewMatchId, setPreviewMatchId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: pending, isLoading } =
    trpc.outreach.getPendingApprovals.useQuery({
      limit: 50,
    });

  const { data: previewData, isLoading: previewLoading } =
    trpc.outreach.previewMessage.useQuery(
      { matchId: previewMatchId! },
      { enabled: previewMatchId !== null }
    );

  const approveMutation = trpc.outreach.approveMatch.useMutation({
    onSuccess: data => {
      toast.success(
        data.messageQueued
          ? "Match approved & outreach queued"
          : "Match approved"
      );
      utils.outreach.getPendingApprovals.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const rejectMutation = trpc.outreach.rejectMatch.useMutation({
    onSuccess: () => {
      toast.success("Match rejected");
      utils.outreach.getPendingApprovals.invalidate();
    },
  });

  const bulkApproveMutation = trpc.outreach.bulkApprove.useMutation({
    onSuccess: data => {
      toast.success(
        `Approved ${data.approved} matches${data.queued > 0 ? `, ${data.queued} messages queued` : ""}`
      );
      setSelectedIds([]);
      utils.outreach.getPendingApprovals.invalidate();
    },
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (!pending) return;
    setSelectedIds(
      selectedIds.length === pending.length ? [] : pending.map(m => m.matchId)
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 80) return "text-blue-500";
    if (score >= 70) return "text-yellow-500";
    return "text-orange-500";
  };

  const getPlatformLabel = (platform: string | null) => {
    const labels: Record<string, string> = {
      founder_cloud: "Founder Cloud",
      co_founders_lab: "Co-Founders Lab",
      y_combinator: "Y Combinator",
      linkedin: "LinkedIn",
    };
    return platform ? labels[platform] || platform : "Unknown";
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  const matches = pending || [];

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Approval Queue</h1>
          <p className="text-muted-foreground">
            Review AI-discovered matches before outreach is sent
          </p>
        </div>
        {matches.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedIds.length === matches.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            {selectedIds.length > 0 && (
              <Button
                size="sm"
                onClick={() =>
                  bulkApproveMutation.mutate({
                    matchIds: selectedIds,
                    sendMessages: true,
                  })
                }
                disabled={bulkApproveMutation.isPending}
              >
                <Zap className="w-4 h-4 mr-1" />
                Approve {selectedIds.length} & Send
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {matches.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">
                {matches.length}
              </span>{" "}
              awaiting review
            </span>
            <span className="text-muted-foreground">
              Avg score:{" "}
              <span className="font-semibold text-foreground">
                {Math.round(
                  matches.reduce((s, m) => s + (m.compatibilityScore || 0), 0) /
                    matches.length
                )}
                %
              </span>
            </span>
            {matches.filter(m => (m.compatibilityScore || 0) >= 90).length >
              0 && (
              <span className="text-emerald-500 font-medium">
                <Sparkles className="w-3 h-3 inline mr-1" />
                {
                  matches.filter(m => (m.compatibilityScore || 0) >= 90).length
                }{" "}
                excellent (90%+)
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <Card className="p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            No matches pending approval
          </h3>
          <p className="text-muted-foreground">
            The AI will automatically discover new matches based on your
            campaign settings and add them here for review.
          </p>
        </Card>
      )}

      {/* Match cards */}
      <div className="space-y-4">
        {matches.map(match => (
          <Card
            key={match.matchId}
            className={`p-6 transition-all ${
              selectedIds.includes(match.matchId) ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="flex gap-4">
              {/* Checkbox */}
              <button
                onClick={() => toggleSelect(match.matchId)}
                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedIds.includes(match.matchId)
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30 hover:border-muted-foreground"
                }`}
              >
                {selectedIds.includes(match.matchId) && (
                  <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-semibold">
                        {match.prospectName || "Unknown"}
                      </h3>
                      {match.prospectTitle && (
                        <span className="text-muted-foreground">
                          {match.prospectTitle}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {match.prospectPlatform && (
                        <Badge variant="outline" className="text-xs">
                          {getPlatformLabel(match.prospectPlatform)}
                        </Badge>
                      )}
                      {match.campaignName && (
                        <Badge variant="secondary" className="text-xs">
                          {match.campaignName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(match.compatibilityScore || 0)}`}
                    >
                      {match.compatibilityScore || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">compatible</p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {match.prospectLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {match.prospectLocation}
                    </span>
                  )}
                  {match.prospectSkills &&
                    Array.isArray(match.prospectSkills) && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {(match.prospectSkills as string[])
                          .slice(0, 3)
                          .join(", ")}
                        {(match.prospectSkills as string[]).length > 3 &&
                          " ..."}
                      </span>
                    )}
                </div>

                {match.prospectBio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {match.prospectBio}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                  <Button
                    size="sm"
                    onClick={() =>
                      approveMutation.mutate({
                        matchId: match.matchId,
                        sendNow: true,
                      })
                    }
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve & Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      approveMutation.mutate({
                        matchId: match.matchId,
                        sendNow: false,
                      })
                    }
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve Only
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPreviewMatchId(match.matchId);
                      setExpandedId(
                        expandedId === match.matchId ? null : match.matchId
                      );
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Preview Message
                    {expandedId === match.matchId ? (
                      <ChevronUp className="w-3 h-3 ml-1" />
                    ) : (
                      <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      rejectMutation.mutate({ matchId: match.matchId })
                    }
                    disabled={rejectMutation.isPending}
                    className="text-destructive hover:text-destructive ml-auto"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>

                {/* Message preview */}
                {expandedId === match.matchId && (
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    {previewLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating AI message...
                      </div>
                    ) : previewData ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            AI-Generated Message Preview
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {previewData.message}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <AlertCircle className="w-3 h-3" />
                          Will be sent via{" "}
                          {getPlatformLabel(match.prospectPlatform)} on your
                          behalf
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Unable to generate preview
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
