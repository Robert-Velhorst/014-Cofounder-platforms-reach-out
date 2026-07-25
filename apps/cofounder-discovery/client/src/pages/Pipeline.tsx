import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Snowflake,
  Send,
  MessageCircle,
  Calendar,
  Handshake,
  ThumbsDown,
  Plus,
  Loader2,
} from "lucide-react";

type Stage =
  | "cold"
  | "contacted"
  | "responded"
  | "meeting"
  | "partnership"
  | "not_interested";

const stageConfig: Record<Stage, { label: string; icon: any; color: string }> =
  {
    cold: { label: "Cold", icon: Snowflake, color: "bg-slate-500" },
    contacted: { label: "Contacted", icon: Send, color: "bg-blue-500" },
    responded: {
      label: "Responded",
      icon: MessageCircle,
      color: "bg-purple-500",
    },
    meeting: { label: "Meeting", icon: Calendar, color: "bg-orange-500" },
    partnership: {
      label: "Partnership",
      icon: Handshake,
      color: "bg-green-500",
    },
    not_interested: {
      label: "Not Interested",
      icon: ThumbsDown,
      color: "bg-red-500",
    },
  };

export default function Pipeline() {
  const { user } = useAuth();
  const { data: pipelineData, isLoading } = trpc.pipeline.getAll.useQuery();
  const moveStage = trpc.pipeline.moveStage.useMutation();
  const utils = trpc.useUtils();

  const [draggedMatch, setDraggedMatch] = useState<number | null>(null);

  const handleDragStart = (matchId: number) => {
    setDraggedMatch(matchId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: Stage) => {
    if (!draggedMatch) return;

    try {
      await moveStage.mutateAsync({
        matchId: draggedMatch,
        toStage: stage,
        automated: false,
      });

      utils.pipeline.getAll.invalidate();
      setDraggedMatch(null);
    } catch (error) {
      console.error("Failed to move stage:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const stages: Stage[] = [
    "cold",
    "contacted",
    "responded",
    "meeting",
    "partnership",
    "not_interested",
  ];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pipeline</h1>
        <p className="text-muted-foreground">
          Track prospects through the AI-driven co-founder discovery process
        </p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stages.map(stage => {
          const config = stageConfig[stage];
          const Icon = config.icon;
          const matchesInStage =
            pipelineData?.filter(item => item.stage === stage) || [];

          return (
            <div
              key={stage}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
            >
              {/* Column Header */}
              <div className={`${config.color} text-white p-4 rounded-t-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{config.label}</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {matchesInStage.length}
                  </Badge>
                </div>
              </div>

              {/* Column Content */}
              <div className="bg-muted/30 p-2 rounded-b-lg min-h-[500px] space-y-2">
                {matchesInStage.map(item => (
                  <Card
                    key={item.matchId}
                    draggable
                    onDragStart={() => handleDragStart(item.matchId)}
                    className="p-3 cursor-move hover:shadow-lg transition-shadow bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">
                        {item.prospectName}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {item.compatibilityScore}%
                      </Badge>
                    </div>

                    {item.prospectTitle && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.prospectTitle}
                      </p>
                    )}

                    {item.lastActivity && (
                      <p className="text-xs text-muted-foreground">
                        Last activity:{" "}
                        {new Date(item.lastActivity).toLocaleDateString()}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        📝 {item.notes}
                      </p>
                    )}
                  </Card>
                ))}

                {matchesInStage.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    No prospects in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">
            {pipelineData?.filter(item => item.stage === "partnership")
              .length || 0}
          </div>
          <div className="text-sm text-muted-foreground">
            Partnerships Formed
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-500">
            {pipelineData?.filter(item => item.stage === "meeting").length || 0}
          </div>
          <div className="text-sm text-muted-foreground">
            Meetings Scheduled
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-500">
            {pipelineData?.filter(item => item.stage === "responded").length ||
              0}
          </div>
          <div className="text-sm text-muted-foreground">
            Active Conversations
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-500">
            {pipelineData?.filter(item => item.stage === "contacted").length ||
              0}
          </div>
          <div className="text-sm text-muted-foreground">Awaiting Response</div>
        </Card>
      </div>
    </div>
  );
}
