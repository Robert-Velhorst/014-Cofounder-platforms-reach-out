import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Link2,
  Link2Off,
  CheckCircle2,
  Linkedin,
  Github,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export default function ConnectedAccounts() {
  const { user } = useAuth();
  const [connecting, setConnecting] = useState<"linkedin" | "github" | null>(
    null
  );

  const { data: status, refetch } = trpc.connections.getStatus.useQuery();
  const { data: linkedinAuth } = trpc.connections.getLinkedInAuthUrl.useQuery();
  const { data: githubAuth } = trpc.connections.getGitHubAuthUrl.useQuery();

  const disconnectLinkedIn = trpc.connections.disconnectLinkedIn.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const disconnectGitHub = trpc.connections.disconnectGitHub.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleConnectLinkedIn = () => {
    if (linkedinAuth?.url) {
      setConnecting("linkedin");
      window.location.href = linkedinAuth.url;
    }
  };

  const handleConnectGitHub = () => {
    if (githubAuth?.url) {
      setConnecting("github");
      window.location.href = githubAuth.url;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            Connected Accounts
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect your professional accounts to auto-import your profile data
            and reduce onboarding time.
          </p>
        </div>

        <div className="space-y-6">
          {/* LinkedIn Connection */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Linkedin className="w-8 h-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">LinkedIn</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import your professional experience, skills, education, and
                    current position from LinkedIn.
                  </p>

                  {status?.linkedin.connected ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 font-medium">
                        Connected
                      </span>
                      {status.linkedin.connectedAt && (
                        <span className="text-muted-foreground">
                          •{" "}
                          {new Date(
                            status.linkedin.connectedAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link2Off className="w-4 h-4" />
                      <span>Not connected</span>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      What we'll import:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Professional headline and summary</li>
                      <li>• Work experience and positions</li>
                      <li>• Skills and endorsements</li>
                      <li>• Education history</li>
                      <li>• Current company and industry</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {status?.linkedin.connected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectLinkedIn}
                      disabled={connecting === "linkedin"}
                    >
                      {connecting === "linkedin" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Reconnecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Reconnect
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectLinkedIn.mutate()}
                      disabled={disconnectLinkedIn.isPending}
                    >
                      {disconnectLinkedIn.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Link2Off className="w-4 h-4 mr-2" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleConnectLinkedIn}
                    disabled={connecting === "linkedin" || !linkedinAuth}
                  >
                    {connecting === "linkedin" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : !linkedinAuth ? (
                      "OAuth Not Configured"
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Connect LinkedIn
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* GitHub Connection */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Github className="w-8 h-8 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">GitHub</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import your technical skills, programming languages, and
                    open source contributions from GitHub.
                  </p>

                  {status?.github.connected ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 font-medium">
                        Connected
                      </span>
                      {status.github.username && (
                        <span className="text-muted-foreground">
                          • @{status.github.username}
                        </span>
                      )}
                      {status.github.connectedAt && (
                        <span className="text-muted-foreground">
                          •{" "}
                          {new Date(
                            status.github.connectedAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link2Off className="w-4 h-4" />
                      <span>Not connected</span>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      What we'll import:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Programming languages you use</li>
                      <li>• Public repositories and projects</li>
                      <li>• Technical bio and profile</li>
                      <li>• Contribution activity</li>
                      <li>• Location and company</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {status?.github.connected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectGitHub}
                      disabled={connecting === "github"}
                    >
                      {connecting === "github" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Reconnecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Reconnect
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectGitHub.mutate()}
                      disabled={disconnectGitHub.isPending}
                    >
                      {disconnectGitHub.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Link2Off className="w-4 h-4 mr-2" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleConnectGitHub}
                    disabled={connecting === "github" || !githubAuth}
                  >
                    {connecting === "github" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : !githubAuth ? (
                      "OAuth Not Configured"
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Connect GitHub
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Privacy Notice */}
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10">
            <h3 className="font-bold mb-2">Privacy & Security</h3>
            <p className="text-sm text-muted-foreground">
              We only request read-only access to your public profile
              information. Your credentials are encrypted and stored securely.
              You can disconnect any account at any time, and we'll immediately
              delete all associated tokens.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
