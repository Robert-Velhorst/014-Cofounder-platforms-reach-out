import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface ConversationStartersProps {
  prospectId: number;
  prospectName: string;
}

export function ConversationStarters({
  prospectId,
  prospectName,
}: ConversationStartersProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateMutation = trpc.conversationStarters.generate.useMutation();
  const regenerateMutation = trpc.conversationStarters.regenerate.useMutation();

  const starters =
    generateMutation.data?.starters || regenerateMutation.data?.starters;
  const isLoading = generateMutation.isPending || regenerateMutation.isPending;

  const handleGenerate = () => {
    generateMutation.mutate({ prospectId });
    setExpanded(true);
  };

  const handleRegenerate = () => {
    if (starters) {
      regenerateMutation.mutate({
        prospectId,
        previousStarters: starters,
      });
    }
  };

  const handleCopy = (message: string, index: number) => {
    navigator.clipboard.writeText(message);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case "professional":
        return "border-blue-500 text-blue-500";
      case "friendly":
        return "border-green-500 text-green-500";
      case "enthusiastic":
        return "border-orange-500 text-orange-500";
      default:
        return "border-muted-foreground text-muted-foreground";
    }
  };

  const getFocusIcon = (focusArea: string) => {
    switch (focusArea) {
      case "skills":
        return "🛠️";
      case "industry":
        return "🏢";
      case "project":
        return "🚀";
      case "experience":
        return "💼";
      case "shared_interest":
        return "🤝";
      default:
        return "💡";
    }
  };

  return (
    <div className="mt-4">
      {!starters && !isLoading ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate AI Conversation Starters
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium hover:text-orange-500 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              AI Conversation Starters ({starters?.length || 0})
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {starters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
            )}
          </div>

          {expanded && (
            <div className="space-y-3">
              {isLoading ? (
                <Card className="p-4 bg-muted/30 border-white/10">
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    <span className="ml-3 text-sm text-muted-foreground">
                      Crafting personalized conversation starters...
                    </span>
                  </div>
                </Card>
              ) : (
                starters?.map((starter, index) => (
                  <Card
                    key={index}
                    className="p-4 bg-muted/30 border-white/10 hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getFocusIcon(starter.focusArea)}
                        </span>
                        <Badge
                          variant="outline"
                          className={getToneColor(starter.tone)}
                        >
                          {starter.tone}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {starter.focusArea.replace("_", " ")}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(starter.message, index)}
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-4 h-4 mr-1 text-green-500" />
                            <span className="text-xs text-green-500">
                              Copied!
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-sm mb-3 leading-relaxed">
                      {starter.message}
                    </p>

                    <div className="pt-3 border-t border-white/5">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Why this works:</span>{" "}
                        {starter.reasoning}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
