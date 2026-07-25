import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Sparkles,
  MapPin,
  Briefcase,
  Target,
  TrendingUp,
  ArrowLeft,
  ExternalLink,
  Award,
  Github,
  Linkedin,
  Building2,
  ChevronDown,
  ChevronUp,
  ThumbsDown,
  Clock,
  Filter,
  SortAsc,
} from "lucide-react";
import { TutorialTooltip } from "@/components/TutorialTooltip";
import { getTutorial } from "@/tutorials";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { EnrichmentData } from "@/components/EnrichmentData";
import { ConversationStarters } from "@/components/ConversationStarters";
import { MatchCardSkeleton } from "@/components/MatchCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Matches() {
  const { isAuthenticated } = useAuth();
  const { data: matches, isLoading } = trpc.matches.list.useQuery();
  const recordFeedback = trpc.preferences.recordFeedback.useMutation();
  const utils = trpc.useUtils();

  // Filtering and sorting state
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"compatibility" | "recent" | "location">(
    "compatibility"
  );

  // Get unique skills and industries from matches
  const { allSkills, allIndustries } = useMemo(() => {
    if (!matches) return { allSkills: [], allIndustries: [] };
    const skills = new Set<string>();
    const industries = new Set<string>();
    matches.forEach(({ prospect }) => {
      prospect?.skills?.forEach(s => skills.add(s));
      prospect?.industries?.forEach(i => industries.add(i));
    });
    return {
      allSkills: Array.from(skills).sort(),
      allIndustries: Array.from(industries).sort(),
    };
  }, [matches]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    if (!matches) return [];

    let filtered = matches.filter(({ match, prospect }) => {
      if (!prospect) return false;

      // Search query
      if (
        searchQuery &&
        !prospect.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Skill filter
      if (skillFilter && !prospect.skills?.includes(skillFilter)) {
        return false;
      }

      // Industry filter
      if (industryFilter && !prospect.industries?.includes(industryFilter)) {
        return false;
      }

      // Min score filter
      if (match.overallScore < minScore) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "compatibility":
          return b.match.overallScore - a.match.overallScore;
        case "recent":
          return (
            new Date(b.match.createdAt).getTime() -
            new Date(a.match.createdAt).getTime()
          );
        case "location":
          return (a.prospect?.location || "").localeCompare(
            b.prospect?.location || ""
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [matches, searchQuery, skillFilter, industryFilter, minScore, sortBy]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-purple-950/20">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <p className="text-muted-foreground">
            You need to be signed in to view your matches.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-lg bg-background/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent inline-flex items-center">
                Your Matches
                <TutorialTooltip
                  videoUrl={getTutorial("matching")?.videoUrl || ""}
                  title={getTutorial("matching")?.title || "How Matching Works"}
                  description={getTutorial("matching")?.description}
                />
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-8 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            {[1, 2, 3].map(i => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        ) : !matches || matches.length === 0 ? (
          <Card className="p-12 text-center bg-card/50 backdrop-blur border-white/10">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No matches yet</h2>
            <p className="text-muted-foreground mb-6">
              Click "Discover Matches" on your dashboard to find potential
              co-founders.
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {filteredMatches.length} of {matches.length} potential
                co-founder{matches.length !== 1 ? "s" : ""}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compatibility">Best Match</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="location">By Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="p-4 bg-card/50 backdrop-blur border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Search
                    </label>
                    <Input
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Skill
                    </label>
                    <Select value={skillFilter} onValueChange={setSkillFilter}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="All skills" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All skills</SelectItem>
                        {allSkills.map(skill => (
                          <SelectItem key={skill} value={skill}>
                            {skill}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Industry
                    </label>
                    <Select
                      value={industryFilter}
                      onValueChange={setIndustryFilter}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="All industries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All industries</SelectItem>
                        {allIndustries.map(industry => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Min Score: {minScore}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minScore}
                      onChange={e => setMinScore(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                {(searchQuery ||
                  skillFilter ||
                  industryFilter ||
                  minScore > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSkillFilter("");
                      setIndustryFilter("");
                      setMinScore(0);
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </Card>
            )}

            {filteredMatches.length === 0 && (
              <Card className="p-12 text-center bg-card/50 backdrop-blur border-white/10">
                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">No matches found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters to see more results.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSkillFilter("");
                    setIndustryFilter("");
                    setMinScore(0);
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            )}

            <div className="grid gap-6">
              {filteredMatches.map(({ match, prospect }) => {
                if (!prospect) return null;

                return (
                  <Card
                    key={match.id}
                    className="p-6 bg-card/50 backdrop-blur border-white/10 hover:border-orange-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold">
                            {prospect.name}
                          </h3>
                          <Badge
                            variant={
                              match.overallScore >= 80 ? "default" : "secondary"
                            }
                          >
                            {match.overallScore}% Match
                          </Badge>
                          {match.successProbability &&
                            match.successProbability >= 75 && (
                              <Badge
                                variant="outline"
                                className="border-green-500 text-green-500"
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {match.successProbability}% Success
                              </Badge>
                            )}
                          {prospect.enrichmentScore &&
                            prospect.enrichmentScore > 0 && (
                              <Badge
                                variant="outline"
                                className={`${
                                  prospect.enrichmentScore >= 70
                                    ? "border-blue-500 text-blue-500"
                                    : "border-muted-foreground text-muted-foreground"
                                }`}
                              >
                                <Award className="w-3 h-3 mr-1" />
                                {prospect.enrichmentScore}% Enriched
                              </Badge>
                            )}
                        </div>
                        {prospect.title && (
                          <p className="text-muted-foreground mb-2">
                            {prospect.title}
                          </p>
                        )}
                        {prospect.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {prospect.location}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {prospect.platform && (
                          <Badge variant="outline" className="mb-2">
                            {prospect.platform}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {prospect.bio && (
                      <p className="text-sm mb-4 line-clamp-2">
                        {prospect.bio}
                      </p>
                    )}

                    {/* Skills & Industries */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {prospect.skills && prospect.skills.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Skills
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {prospect.skills.slice(0, 5).map(skill => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {prospect.skills.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{prospect.skills.length - 5}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {prospect.industries &&
                        prospect.industries.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Industries
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {prospect.industries.slice(0, 3).map(industry => (
                                <Badge
                                  key={industry}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {industry}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Compatibility Breakdown */}
                    {match.reasoning && (
                      <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Why this match?
                        </p>
                        <p className="text-sm">{match.reasoning}</p>
                      </div>
                    )}

                    {/* Compatibility Scores */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {match.skillsScore && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Skills
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div
                                className="bg-orange-500 h-1.5 rounded-full"
                                style={{ width: `${match.skillsScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">
                              {match.skillsScore}%
                            </span>
                          </div>
                        </div>
                      )}
                      {match.visionScore && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Vision
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div
                                className="bg-purple-500 h-1.5 rounded-full"
                                style={{ width: `${match.visionScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">
                              {match.visionScore}%
                            </span>
                          </div>
                        </div>
                      )}
                      {match.workStyleScore && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Work Style
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div
                                className="bg-pink-500 h-1.5 rounded-full"
                                style={{ width: `${match.workStyleScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">
                              {match.workStyleScore}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enrichment Data - TODO: Fetch from separate table */}

                    {/* Conversation Starters */}
                    <ConversationStarters
                      prospectId={prospect.id}
                      prospectName={prospect.name || "this prospect"}
                    />

                    {/* Actions */}
                    <div className="space-y-3 mt-4">
                      <div className="flex gap-3">
                        <Button className="flex-1">
                          <Briefcase className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                        {prospect.profileUrl && (
                          <Button variant="outline" asChild>
                            <a
                              href={prospect.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Profile
                            </a>
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full"
                      >
                        <Link href={`/prospect/${prospect.id}/timeline`}>
                          <Clock className="w-4 h-4 mr-2" />
                          View Timeline
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          try {
                            await recordFeedback.mutateAsync({
                              prospectId: prospect.id,
                              feedbackType: "not_interested",
                            });
                            // Refresh matches list to remove this prospect
                            utils.matches.list.invalidate();
                          } catch (error) {
                            console.error(
                              "Failed to mark not interested:",
                              error
                            );
                          }
                        }}
                        disabled={recordFeedback.isPending}
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Not Interested
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
