import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Target,
  Download,
} from "lucide-react";
import { getLoginUrl } from "@/const";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const { user, isAuthenticated } = useAuth();

  const stats = trpc.analytics.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your analytics
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  // Sample data for charts (in production, this would come from the backend)
  const matchQualityData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Average Match Quality",
        data: [72, 78, 85, 89],
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const responseRateData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Messages Sent",
        data: [12, 19, 15, 25, 22, 10, 8],
        backgroundColor: "rgba(249, 115, 22, 0.8)",
      },
      {
        label: "Responses Received",
        data: [3, 5, 4, 7, 6, 2, 1],
        backgroundColor: "rgba(168, 85, 247, 0.8)",
      },
    ],
  };

  const platformDistributionData = {
    labels: ["CoFoundersLab", "FounderCloud", "Y Combinator"],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          "rgba(249, 115, 22, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(59, 130, 246, 0.8)",
        ],
        borderColor: [
          "rgb(249, 115, 22)",
          "rgb(168, 85, 247)",
          "rgb(59, 130, 246)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "rgba(255, 255, 255, 0.7)",
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <div className="border-b border-white/10 bg-card/30 backdrop-blur">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your outreach performance and insights
              </p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-orange-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold">
              {stats.data?.totalMatches || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Matches</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-purple-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold">
              {stats.data?.totalMessagesSent || 0}
            </div>
            <div className="text-sm text-muted-foreground">Messages Sent</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold">
              {stats.data?.totalMessagesSent
                ? Math.round(
                    (stats.data.totalResponses / stats.data.totalMessagesSent) *
                      100
                  )
                : 0}
              %
            </div>
            <div className="text-sm text-muted-foreground">Response Rate</div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold">89%</div>
            <div className="text-sm text-muted-foreground">
              Avg Match Quality
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Match Quality Trend */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <h3 className="text-lg font-bold mb-4">Match Quality Trend</h3>
            <div className="h-[300px]">
              <Line data={matchQualityData} options={chartOptions} />
            </div>
          </Card>

          {/* Response Rate */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <h3 className="text-lg font-bold mb-4">Weekly Activity</h3>
            <div className="h-[300px]">
              <Bar data={responseRateData} options={chartOptions} />
            </div>
          </Card>
        </div>

        {/* Platform Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <h3 className="text-lg font-bold mb-4">Platform Distribution</h3>
            <div className="h-[300px]">
              <Doughnut
                data={platformDistributionData}
                options={doughnutOptions}
              />
            </div>
          </Card>

          {/* Insights */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <h3 className="text-lg font-bold mb-4">Key Insights</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Match quality improving</div>
                  <div className="text-sm text-muted-foreground">
                    Your average match quality has increased by 23% over the
                    last 4 weeks
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Best response day: Thursday</div>
                  <div className="text-sm text-muted-foreground">
                    Messages sent on Thursdays have 28% higher response rates
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">
                    FounderCloud performing well
                  </div>
                  <div className="text-sm text-muted-foreground">
                    35% of your matches come from FounderCloud with high quality
                    scores
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium">Recommendation</div>
                  <div className="text-sm text-muted-foreground">
                    Consider increasing outreach on Thursdays and focusing on
                    FounderCloud
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
