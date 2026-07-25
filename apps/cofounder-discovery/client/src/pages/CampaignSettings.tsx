import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  User,
  Zap,
  Settings,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sliders,
  MessageSquare,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

const AUTOMATION_MODES = [
  {
    id: "fully_automatic",
    label: "Fully Automatic",
    icon: Bot,
    description:
      "The AI discovers prospects, selects the top matches daily, and sends personalized outreach messages — all without any manual review. Best for users who trust the AI and want maximum efficiency.",
    pros: [
      "Hands-free operation",
      "Maximum outreach volume",
      "24/7 automated discovery",
    ],
    cons: ["No review before sending", "Less control over messaging"],
    color: "text-violet-500",
    bg: "bg-violet-500/10 border-violet-500/30",
    badgeColor: "bg-violet-500/20 text-violet-400",
  },
  {
    id: "semi_automatic",
    label: "Semi-Automatic",
    icon: Shield,
    description:
      "The AI discovers and scores prospects, then queues the top matches for your approval. You review each match and decide who to contact. Messages are sent automatically after approval.",
    pros: [
      "Review before sending",
      "AI does the heavy lifting",
      "Control over who gets contacted",
    ],
    cons: ["Requires daily review", "Slightly slower outreach"],
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30",
    badgeColor: "bg-blue-500/20 text-blue-400",
    recommended: true,
  },
  {
    id: "manual",
    label: "Manual",
    icon: User,
    description:
      "The AI discovers and scores prospects, but you manually browse the matches and decide who to contact and when. Full control over every step of the process.",
    pros: [
      "Complete control",
      "Review all AI scoring",
      "Write custom messages",
    ],
    cons: ["Most time-intensive", "Lower outreach volume"],
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    badgeColor: "bg-emerald-500/20 text-emerald-400",
  },
];

export default function CampaignSettings() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const campaignId = parseInt(params.id || "0");

  const utils = trpc.useUtils();

  const { data: campaign, isLoading } = trpc.campaigns.getById.useQuery(
    { id: campaignId },
    { enabled: campaignId > 0 }
  );

  const updateMutation = trpc.campaigns.updateAutomation.useMutation({
    onSuccess: () => {
      toast.success("Campaign settings updated");
      utils.campaigns.getById.invalidate({ id: campaignId });
    },
    onError: err => toast.error(err.message),
  });

  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [autoMessage, setAutoMessage] = useState<boolean | null>(null);

  const currentMode =
    selectedMode ?? campaign?.automationMode ?? "semi_automatic";
  const currentLimit = dailyLimit ?? campaign?.dailyMatchLimit ?? 5;
  const currentAutoMessage =
    autoMessage ?? campaign?.autoMessageEnabled ?? false;

  const handleSave = () => {
    updateMutation.mutate({
      id: campaignId,
      automationMode: currentMode as
        | "fully_automatic"
        | "semi_automatic"
        | "manual",
      dailyMatchLimit: currentLimit,
      autoMessageEnabled: currentAutoMessage,
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!campaign && campaignId > 0) {
    return (
      <div className="container max-w-3xl mx-auto py-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Campaign not found</h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/campaigns")}
        >
          Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/campaigns")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Campaign Automation Settings
          </h1>
          {campaign && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {campaign.name}
            </p>
          )}
        </div>
      </div>

      {/* Automation Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation Mode
          </CardTitle>
          <CardDescription>
            Choose how much control you want over the AI matching and outreach
            process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {AUTOMATION_MODES.map(mode => {
            const Icon = mode.icon;
            const isSelected = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `${mode.bg} border-current`
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 ${isSelected ? mode.color : "text-muted-foreground"}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-semibold ${isSelected ? mode.color : ""}`}
                      >
                        {mode.label}
                      </span>
                      {mode.recommended && (
                        <Badge className="text-xs bg-primary/20 text-primary border-0">
                          Recommended
                        </Badge>
                      )}
                      {isSelected && (
                        <CheckCircle
                          className={`w-4 h-4 ml-auto ${mode.color}`}
                        />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mode.description}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        {mode.pros.map(p => (
                          <p
                            key={p}
                            className="text-xs text-emerald-500 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> {p}
                          </p>
                        ))}
                      </div>
                      <div>
                        {mode.cons.map(c => (
                          <p
                            key={c}
                            className="text-xs text-muted-foreground flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3" /> {c}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Daily Match Limit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Daily Match Limit
          </CardTitle>
          <CardDescription>
            How many prospects should the AI contact per day? (3-5 recommended
            to avoid spam filters)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4, 5, 7, 10].map(n => (
              <button
                key={n}
                onClick={() => setDailyLimit(n)}
                className={`w-10 h-10 rounded-lg border-2 font-semibold text-sm transition-all ${
                  currentLimit === n
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-muted-foreground/50 text-muted-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Currently set to{" "}
            <span className="font-semibold text-foreground">
              {currentLimit}
            </span>{" "}
            matches per day. The AI will always prioritize the highest
            compatibility scores first.
          </p>
        </CardContent>
      </Card>

      {/* Auto Message Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Auto-Send Messages
          </CardTitle>
          <CardDescription>
            When a match is approved, automatically send the AI-generated
            outreach message
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoMessage(true)}
              className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                currentAutoMessage
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50"
              }`}
            >
              <Zap className="w-4 h-4 inline mr-1" />
              Auto-send on approval
            </button>
            <button
              onClick={() => setAutoMessage(false)}
              className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                !currentAutoMessage
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50"
              }`}
            >
              <User className="w-4 h-4 inline mr-1" />
              Manual send after approval
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Changes take effect on the next daily matching run
        </p>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="min-w-32"
        >
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
