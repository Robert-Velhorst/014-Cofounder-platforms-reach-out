import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  Sparkles,
  Users,
  Zap,
  Target,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-lg bg-background/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              CoFounder Discovery
            </h1>
          </div>
          <div>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Find Your Perfect{" "}
            <span className="bg-gradient-to-r from-orange-500 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Co-Founder
            </span>
            <br />
            in 30 Seconds
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered matching that connects you with compatible co-founders
            across multiple platforms. Stop searching, start building.
          </p>
          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/onboarding">
                <Button size="lg" className="text-lg px-8">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Discovery
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="text-lg px-8" asChild>
                <a href={getLoginUrl()}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                </a>
              </Button>
            )}
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">
          Why Founders Love Us
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 bg-card/50 backdrop-blur border-white/10 hover:border-orange-500/50 transition-all">
            <Zap className="w-12 h-12 text-orange-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Lightning Fast</h4>
            <p className="text-muted-foreground">
              From profile to matches in 30 seconds. No more endless scrolling
              through profiles.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-white/10 hover:border-purple-500/50 transition-all">
            <Target className="w-12 h-12 text-purple-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2">AI-Powered Matching</h4>
            <p className="text-muted-foreground">
              Advanced algorithms analyze 6 dimensions of compatibility for
              perfect matches.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-white/10 hover:border-pink-500/50 transition-all">
            <Users className="w-12 h-12 text-pink-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Multi-Platform</h4>
            <p className="text-muted-foreground">
              Search across CoFoundersLab, FounderCloud, Y Combinator, and more.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-white/10 hover:border-orange-500/50 transition-all">
            <MessageSquare className="w-12 h-12 text-orange-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Smart Messaging</h4>
            <p className="text-muted-foreground">
              AI-generated personalized messages that get 3x more responses.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-white/10 hover:border-purple-500/50 transition-all">
            <BarChart3 className="w-12 h-12 text-purple-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Analytics Dashboard</h4>
            <p className="text-muted-foreground">
              Track your outreach, responses, and success metrics in real-time.
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-white/10 hover:border-pink-500/50 transition-all">
            <Sparkles className="w-12 h-12 text-pink-500 mb-4" />
            <h4 className="text-xl font-semibold mb-2">94.7% Autonomy</h4>
            <p className="text-muted-foreground">
              Set it and forget it. Our AI handles discovery, matching, and
              outreach.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="p-12 bg-gradient-to-br from-orange-500/10 via-purple-600/10 to-pink-500/10 border-white/10 text-center">
          <h3 className="text-4xl font-bold mb-4">
            Ready to Find Your Co-Founder?
          </h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who found their perfect match. Start
            your journey today.
          </p>
          {isAuthenticated ? (
            <Link href="/onboarding">
              <Button size="lg" className="text-lg px-12">
                Start Discovery Now
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="text-lg px-12" asChild>
              <a href={getLoginUrl()}>Start Discovery Now</a>
            </Button>
          )}
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>
            © 2024 CoFounder Discovery. Making finding the right co-founder a
            breeze.
          </p>
        </div>
      </footer>
    </div>
  );
}
