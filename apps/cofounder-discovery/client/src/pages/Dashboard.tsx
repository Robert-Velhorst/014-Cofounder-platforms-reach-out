import { useAuth } from "@/_core/hooks/useAuth";
import VerificationBanner from "@/components/VerificationBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TutorialTooltip } from "@/components/TutorialTooltip";
import { getTutorial } from "@/tutorials";
import {
  Sparkles,
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: matches } = trpc.matches.list.useQuery(undefined, {
    enabled: !!user && !!profile,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 mb-6">
            <Target className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
            Complete Your Profile
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Tell us about yourself so we can find your perfect co-founder match
          </p>
          <Link href="/onboarding">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Onboarding
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Matches",
      value: matches?.length || 0,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-500/10 to-cyan-500/10",
    },
    {
      label: "High Compatibility",
      value:
        matches?.filter((m: any) => m.compatibilityScore >= 80).length || 0,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-500/10 to-emerald-500/10",
    },
    {
      label: "Messages Sent",
      value: 0,
      icon: MessageSquare,
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-500/10 to-pink-500/10",
    },
    {
      label: "Active Campaigns",
      value: 0,
      icon: Zap,
      color: "from-orange-500 to-red-500",
      bgColor: "from-orange-500/10 to-red-500/10",
    },
  ];

  return (
    <div className="p-8">
      {/* Verification Banner */}
      <VerificationBanner />

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 inline-flex items-center">
          Dashboard
          <TutorialTooltip
            videoUrl={getTutorial("analytics")?.videoUrl || ""}
            title={getTutorial("analytics")?.title || "Dashboard Overview"}
            description={getTutorial("analytics")?.description}
          />
        </h1>
        <h2 className="text-xl">Welcome back, {user.name}! 👋</h2>
        <p className="text-gray-400">
          Here's your co-founder discovery dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 hover:scale-105"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50`}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Start Discovery */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-purple-500/10 border-orange-500/20 backdrop-blur-sm hover:border-orange-500/40 transition-all duration-300">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-purple-600">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Discover Co-Founders
                </h3>
                <p className="text-gray-400 text-sm">
                  AI-powered matching in 30 seconds
                </p>
              </div>
            </div>
            <p className="text-gray-300 mb-6">
              Our advanced algorithm analyzes 6 dimensions of compatibility to
              find your perfect match across multiple platforms.
            </p>
            <Link href="/matches">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                Start Discovery
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Profile Completion */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all duration-300">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Profile Strength
                </h3>
                <p className="text-gray-400 text-sm">100% complete</p>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Completeness</span>
                <span className="text-green-400 font-medium">100%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            <Link href="/onboarding">
              <Button
                variant="outline"
                className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                Edit Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Matches */}
      {matches && matches.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10 backdrop-blur-sm">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Recent Matches</h2>
              <Link href="/matches">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-500 hover:text-orange-400"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.slice(0, 3).map(match => (
                <Card
                  key={match.match.id}
                  className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-white/5 hover:border-white/20 transition-all duration-300 hover:scale-105"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white mb-1">
                          {match.prospect?.name || "Unknown"}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {match.prospect?.title || ""}
                        </p>
                      </div>
                      <div className="px-2 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                        <span className="text-xs font-semibold text-green-400">
                          {match.match.overallScore}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {match.prospect?.bio || ""}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{match.prospect?.location || ""}</span>
                      <span>•</span>
                      <span>{match.prospect?.platform || ""}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
