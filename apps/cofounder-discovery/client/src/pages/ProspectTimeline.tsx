import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  MessageSquare,
  Calendar,
  Handshake,
  Clock,
  Share2,
  Twitter,
  Linkedin,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export default function ProspectTimeline() {
  const { prospectId } = useParams();
  const { isAuthenticated } = useAuth();

  // TODO: Add getById to prospects router
  const prospect = { name: "Prospect", title: "Loading..." };
  const prospectLoading = false;

  const { data: timeline, isLoading: timelineLoading } =
    trpc.timeline.getForProspect.useQuery(
      { prospectId: Number(prospectId) },
      { enabled: isAuthenticated && !!prospectId }
    );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <p className="text-muted-foreground">
            You need to be signed in to view timelines.
          </p>
        </Card>
      </div>
    );
  }

  const shareToLinkedIn = () => {
    if (!prospect) return;
    const text = `Just connected with ${prospect.name} through CoFounder Discovery! 🚀`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "width=600,height=400");
    toast.success("Opening LinkedIn share dialog...");
  };

  const shareToTwitter = () => {
    if (!prospect) return;
    const text = `Just connected with ${prospect.name} as a potential co-founder! 🚀 #cofounder #startup`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=600,height=400");
    toast.success("Opening Twitter share dialog...");
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "message_sent":
        return <Send className="w-5 h-5 text-blue-500" />;
      case "message_received":
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case "message_opened":
        return <Eye className="w-5 h-5 text-purple-500" />;
      case "meeting_scheduled":
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case "partnership_formed":
        return <Handshake className="w-5 h-5 text-yellow-500" />;
      case "follow_up_sent":
        return <Clock className="w-5 h-5 text-cyan-500" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "message_sent":
        return "border-blue-500/50";
      case "message_received":
        return "border-green-500/50";
      case "message_opened":
        return "border-purple-500/50";
      case "meeting_scheduled":
        return "border-orange-500/50";
      case "partnership_formed":
        return "border-yellow-500/50";
      case "follow_up_sent":
        return "border-cyan-500/50";
      default:
        return "border-gray-500/50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-lg bg-background/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/matches">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Matches
                </Button>
              </Link>
              {prospect && (
                <div>
                  <h1 className="text-2xl font-bold">{prospect.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {prospect.title || "Co-founder Prospect"}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={shareToLinkedIn}>
                <Linkedin className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={shareToTwitter}>
                <Twitter className="w-4 h-4 mr-2" />
                Tweet
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {prospectLoading || timelineLoading ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading timeline...</p>
          </div>
        ) : !timeline || timeline.length === 0 ? (
          <Card className="p-12 text-center bg-card/50 backdrop-blur border-white/10">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No activity yet</h2>
            <p className="text-muted-foreground mb-6">
              Start reaching out to {prospect?.name} to see your interaction
              history here.
            </p>
            <Link href="/matches">
              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Activity Timeline
            </h2>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500/50 via-purple-500/50 to-transparent"></div>

              <div className="space-y-6">
                {timeline.map((event: any, index: number) => (
                  <div key={event.id} className="relative pl-16">
                    {/* Icon */}
                    <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background border-2 border-white/10 flex items-center justify-center">
                      {getEventIcon(event.type)}
                    </div>

                    {/* Event Card */}
                    <Card
                      className={`p-4 bg-card/50 backdrop-blur border-2 ${getEventColor(event.type)} hover:border-opacity-100 transition-all`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>

                      {event.metadata && (
                        <div className="mt-3 p-3 rounded-lg bg-background/50 border border-white/5">
                          <p className="text-sm text-muted-foreground">
                            {event.metadata}
                          </p>
                        </div>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <Card className="mt-12 p-6 bg-card/50 backdrop-blur border-white/10">
              <h3 className="font-bold mb-4">Interaction Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-500">
                    {
                      timeline.filter((e: any) => e.type === "message_sent")
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Messages Sent
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {
                      timeline.filter((e: any) => e.type === "message_received")
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Responses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-500">
                    {
                      timeline.filter(
                        (e: any) => e.type === "meeting_scheduled"
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Meetings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">
                    {
                      timeline.filter(
                        (e: any) => e.type === "partnership_formed"
                      ).length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Partnerships
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
