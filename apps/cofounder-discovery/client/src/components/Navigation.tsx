import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Target,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  HelpCircle,
  Bookmark,
  Clock,
  Link2,
  PieChart,
  TrendingUp,
  Bell,
  DollarSign,
  Kanban,
  Activity,
  CheckSquare,
  Globe,
} from "lucide-react";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  // Get approval queue count
  const { data: queueCount } = trpc.automation.getApprovalQueueCount.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/matches", icon: Users, label: "Matches" },
    { path: "/approval-queue", icon: CheckSquare, label: "Approval Queue" },
    {
      path: "/platform-connections",
      icon: Globe,
      label: "Platform Connections",
    },
    { path: "/pipeline", icon: Kanban, label: "Pipeline" },
    { path: "/ai-monitoring", icon: Activity, label: "AI Monitor" },
    { path: "/messages", icon: MessageSquare, label: "Messages" },
    { path: "/campaigns", icon: Target, label: "Campaigns" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/usage", icon: DollarSign, label: "Usage & Billing" },
    { path: "/settings", icon: Settings, label: "Settings" },
    { path: "/settings/notifications", icon: Bell, label: "Notifications" },
    { path: "/saved-searches", icon: Bookmark, label: "Saved Searches" },
    { path: "/scheduler", icon: Clock, label: "Scheduler" },
    { path: "/success-metrics", icon: TrendingUp, label: "Success Metrics" },
    { path: "/enrichment", icon: Sparkles, label: "Enrichment" },
    { path: "/connected-accounts", icon: Link2, label: "Connected Accounts" },
    { path: "/help", icon: HelpCircle, label: "Help" },
  ];

  // Add admin analytics for admin users
  if (user?.role === "admin") {
    navItems.push({
      path: "/admin/analytics",
      icon: PieChart,
      label: "Admin Analytics",
    });
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-card/30 backdrop-blur border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setLocation("/")}
        >
          <Sparkles className="w-6 h-6 text-orange-500" />
          <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            CoFounder Discovery
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white"
                  : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.path === "/approval-queue" &&
                queueCount &&
                queueCount.count > 0 && (
                  <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {queueCount.count}
                  </span>
                )}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {user.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{user.name || "User"}</div>
              <div className="text-xs text-muted-foreground truncate">
                {user.email}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}
