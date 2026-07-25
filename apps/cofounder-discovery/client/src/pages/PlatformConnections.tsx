import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Users,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

type Platform = "founder_cloud" | "co_founders_lab" | "y_combinator";

const PLATFORMS = [
  {
    id: "founder_cloud" as Platform,
    name: "Founder Cloud",
    description:
      "Connect with technical and business co-founders across industries",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    loginUrl: "https://foundercloud.io",
    features: ["Profile discovery", "Direct messaging", "Connection requests"],
  },
  {
    id: "co_founders_lab" as Platform,
    name: "Co-Founders Lab",
    description: "The largest co-founder matching platform with 500K+ members",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    loginUrl: "https://www.cofounderslab.com",
    features: [
      "Advanced search filters",
      "Direct messaging",
      "Profile scraping",
    ],
  },
  {
    id: "y_combinator" as Platform,
    name: "Y Combinator",
    description: "YC co-founder matching for startup founders and applicants",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    loginUrl: "https://www.ycombinator.com/cofounder-matching",
    features: ["Co-founder matching", "Founder profiles", "Direct outreach"],
  },
];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    case "invalid":
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          Invalid
        </Badge>
      );
    case "suspended":
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Suspended
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Untested
        </Badge>
      );
  }
}

export default function PlatformConnections() {
  const [addingPlatform, setAddingPlatform] = useState<Platform | null>(null);
  const [deletingPlatform, setDeletingPlatform] = useState<Platform | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dailyLimit, setDailyLimit] = useState(5);

  const utils = trpc.useUtils();

  const { data: credentials, isLoading } =
    trpc.platformCredentials.getAll.useQuery();

  const saveMutation = trpc.platformCredentials.saveCredentials.useMutation({
    onSuccess: () => {
      utils.platformCredentials.getAll.invalidate();
      setAddingPlatform(null);
      setUsername("");
      setPassword("");
      setDailyLimit(5);
      toast.success("Credentials saved securely!");
    },
    onError: err => {
      toast.error("Failed to save credentials: " + err.message);
    },
  });

  const deleteMutation = trpc.platformCredentials.deleteCredentials.useMutation(
    {
      onSuccess: () => {
        utils.platformCredentials.getAll.invalidate();
        setDeletingPlatform(null);
        toast.success("Credentials removed");
      },
    }
  );

  const testMutation = trpc.platformCredentials.testCredentials.useMutation({
    onSuccess: () => {
      utils.platformCredentials.getAll.invalidate();
      toast.success("Test login queued. Status will update shortly.");
    },
    onError: err => {
      toast.error("Test failed: " + err.message);
    },
  });

  const updateLimitMutation = trpc.platformCredentials.updateLimit.useMutation({
    onSuccess: () => {
      utils.platformCredentials.getAll.invalidate();
      toast.success("Daily limit updated");
    },
  });

  const getCredential = (platformId: Platform) =>
    credentials?.find(c => c.platform === platformId);

  const handleSave = () => {
    if (!addingPlatform || !username || !password) return;
    saveMutation.mutate({
      platform: addingPlatform,
      username,
      password,
      dailyMessageLimit: dailyLimit,
    });
  };

  const handleOpenAdd = (platformId: Platform) => {
    const existing = getCredential(platformId);
    setUsername("");
    setPassword("");
    setDailyLimit(existing?.dailyMessageLimit ?? 5);
    setShowPassword(false);
    setAddingPlatform(platformId);
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Platform Connections</h1>
        <p className="text-muted-foreground">
          Connect your accounts on co-founder platforms to enable automated
          outreach on your behalf. Credentials are encrypted with AES-256 and
          never exposed.
        </p>
      </div>

      {/* Security Notice */}
      <Card className="p-4 border-blue-500/30 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-400">
              End-to-End Encryption
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your credentials are encrypted using AES-256-GCM before storage.
              The AI uses them to log in on your behalf, send messages, and
              discover prospects — then immediately discards the session. You
              can revoke access at any time.
            </p>
          </div>
        </div>
      </Card>

      {/* Platform Cards */}
      <div className="space-y-4">
        {PLATFORMS.map(platform => {
          const Icon = platform.icon;
          const credential = getCredential(platform.id);
          const isConnected = !!credential;

          return (
            <Card key={platform.id} className="p-6">
              <div className="flex items-start gap-4">
                {/* Platform Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Platform Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">{platform.name}</h3>
                    {isConnected && <StatusBadge status={credential.status} />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {platform.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {platform.features.map(f => (
                      <span
                        key={f}
                        className="text-xs bg-muted px-2 py-1 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Connected State Details */}
                  {isConnected && (
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Account</p>
                        <p className="text-sm font-medium">
                          {credential.maskedUsername}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Daily Limit
                        </p>
                        <p className="text-sm font-medium">
                          {credential.dailyMessageLimit} msgs/day
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Sent Today
                        </p>
                        <p className="text-sm font-medium">
                          {credential.messagesSentToday} /{" "}
                          {credential.dailyMessageLimit}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {isConnected && credential.lastError && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-400">
                        {credential.lastError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {!isConnected ? (
                    <Button onClick={() => handleOpenAdd(platform.id)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          testMutation.mutate({ platform: platform.id })
                        }
                        disabled={testMutation.isPending}
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${testMutation.isPending ? "animate-spin" : ""}`}
                        />
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAdd(platform.id)}
                      >
                        Update
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => setDeletingPlatform(platform.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add/Update Credentials Dialog */}
      <Dialog
        open={!!addingPlatform}
        onOpenChange={open => !open && setAddingPlatform(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {getCredential(addingPlatform!) ? "Update" : "Connect"}{" "}
              {PLATFORMS.find(p => p.id === addingPlatform)?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your login credentials. They will be encrypted and stored
              securely. The AI will use them to automate outreach on your
              behalf.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="username">Email or Username</Label>
              <Input
                id="username"
                type="email"
                placeholder="your@email.com"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Daily Message Limit</Label>
                <span className="text-sm font-medium text-primary">
                  {dailyLimit} messages/day
                </span>
              </div>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[dailyLimit]}
                onValueChange={([v]) => setDailyLimit(v)}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 3–5 per day to avoid spam detection. Max: 20.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingPlatform(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!username || !password || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save Securely"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingPlatform}
        onOpenChange={open => !open && setDeletingPlatform(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Credentials?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your stored credentials for{" "}
              {PLATFORMS.find(p => p.id === deletingPlatform)?.name}. Automated
              outreach for this platform will stop immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() =>
                deletingPlatform &&
                deleteMutation.mutate({ platform: deletingPlatform })
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
