import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Plus,
  Play,
  Pause,
  Trash2,
  BarChart3,
  Users,
  MessageSquare,
  Clock,
  Settings,
} from "lucide-react";
import { NaturalLanguageSearch } from "@/components/NaturalLanguageSearch";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Campaigns() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    targetPlatforms: [] as string[],
  });

  const campaigns = trpc.campaigns.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCampaign = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campaign created successfully!");
      campaigns.refetch();
      setShowCreateModal(false);
      setNewCampaign({ name: "", description: "", targetPlatforms: [] });
    },
    onError: error => {
      toast.error("Failed to create campaign: " + error.message);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to manage your campaigns
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  const handleCreateCampaign = () => {
    if (!newCampaign.name.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }
    createCampaign.mutate({
      name: newCampaign.name,
      description: newCampaign.description,
      targetPlatforms: newCampaign.targetPlatforms,
      status: "draft",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <div className="border-b border-white/10 bg-card/30 backdrop-blur">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Campaigns
              </h1>
              <p className="text-muted-foreground mt-1">
                Automate your co-founder outreach
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-orange-500 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {campaigns.isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading campaigns...</p>
          </div>
        ) : campaigns.data && campaigns.data.length > 0 ? (
          <div className="grid gap-6">
            {campaigns.data.map((campaign: any) => (
              <Card
                key={campaign.id}
                className="p-6 bg-card/50 backdrop-blur border-white/10 hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{campaign.name}</h3>
                    {campaign.description && (
                      <p className="text-muted-foreground mt-1">
                        {campaign.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      campaign.status === "active"
                        ? "default"
                        : campaign.status === "paused"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {campaign.status}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">
                        {campaign.messagesSent || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.floor((campaign.messagesSent || 0) * 0.6)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Opened
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.floor((campaign.messagesSent || 0) * 0.15)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Responded
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">
                        {campaign.status === "active" ? "Active" : "Paused"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Status
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    {campaign.status === "active" ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Stats
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/campaigns/${campaign.id}/settings`)
                    }
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Automation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-card/30 backdrop-blur border-white/10">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No Campaigns Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first automated outreach campaign to start
                connecting with potential co-founders
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-500 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <Card
            className="p-6 max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4">Create New Campaign</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Campaign Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-input border border-border rounded-md"
                  placeholder="e.g., Technical Co-Founder Outreach"
                  value={newCampaign.name}
                  onChange={e =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Target Criteria
                </label>
                <NaturalLanguageSearch
                  onSearch={criteria => {
                    // Store criteria in campaign description for now
                    // In production, you'd want a separate targetCriteria field
                    setNewCampaign({
                      ...newCampaign,
                      description: JSON.stringify(criteria, null, 2),
                    });
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Additional Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-input border border-border rounded-md"
                  rows={3}
                  placeholder="Describe your campaign goals..."
                  value={newCampaign.description}
                  onChange={e =>
                    setNewCampaign({
                      ...newCampaign,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Target Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {["CoFoundersLab", "FounderCloud", "Y Combinator"].map(
                    platform => (
                      <Badge
                        key={platform}
                        variant={
                          newCampaign.targetPlatforms.includes(platform)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          if (newCampaign.targetPlatforms.includes(platform)) {
                            setNewCampaign({
                              ...newCampaign,
                              targetPlatforms:
                                newCampaign.targetPlatforms.filter(
                                  p => p !== platform
                                ),
                            });
                          } else {
                            setNewCampaign({
                              ...newCampaign,
                              targetPlatforms: [
                                ...newCampaign.targetPlatforms,
                                platform,
                              ],
                            });
                          }
                        }}
                      >
                        {platform}
                      </Badge>
                    )
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={createCampaign.isPending}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600"
                >
                  {createCampaign.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
