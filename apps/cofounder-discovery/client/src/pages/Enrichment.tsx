import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Sparkles,
  TrendingUp,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function Enrichment() {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResults, setEnrichmentResults] = useState<any>(null);

  const { data: stats, refetch: refetchStats } =
    trpc.enrichment.stats.useQuery();
  const bulkEnrich = trpc.enrichment.bulkEnrich.useMutation();

  const handleBulkEnrich = async (limit: number) => {
    setIsEnriching(true);
    setEnrichmentResults(null);

    try {
      const result = await bulkEnrich.mutateAsync({ limit });
      setEnrichmentResults(result);
      refetchStats();
    } catch (error) {
      console.error("Enrichment failed:", error);
      alert("Enrichment failed. Please try again.");
    } finally {
      setIsEnriching(false);
    }
  };

  const enrichmentRate = stats?.enrichmentRate || 0;
  const qualityRate = stats?.total
    ? (stats.highQuality / stats.total) * 100
    : 0;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prospect Enrichment</h1>
        <p className="text-muted-foreground">
          Automatically enhance prospect profiles with LinkedIn, GitHub, and
          company data
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Prospects
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enriched</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.enriched || 0}</div>
            <p className="text-xs text-muted-foreground">
              {enrichmentRate.toFixed(1)}% enrichment rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Quality</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.highQuality || 0}</div>
            <p className="text-xs text-muted-foreground">
              {qualityRate.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Needs Enrichment
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.total - stats.enriched : 0}
            </div>
            <p className="text-xs text-muted-foreground">Pending enrichment</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrichment Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enrichment Progress</CardTitle>
          <CardDescription>
            Overall enrichment coverage across all prospects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total Enrichment</span>
                <span className="text-sm text-muted-foreground">
                  {enrichmentRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={enrichmentRate} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">High Quality Data</span>
                <span className="text-sm text-muted-foreground">
                  {qualityRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={qualityRate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Enrichment Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bulk Enrichment</CardTitle>
          <CardDescription>
            Enrich multiple prospects at once with data from LinkedIn, GitHub,
            and company databases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => handleBulkEnrich(10)}
              disabled={isEnriching}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isEnriching ? "Enriching..." : "Enrich 10 Prospects"}
            </Button>
            <Button
              onClick={() => handleBulkEnrich(25)}
              disabled={isEnriching}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isEnriching ? "Enriching..." : "Enrich 25 Prospects"}
            </Button>
            <Button
              onClick={() => handleBulkEnrich(50)}
              disabled={isEnriching}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isEnriching ? "Enriching..." : "Enrich 50 Prospects"}
            </Button>
          </div>

          {isEnriching && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Enriching prospects... This may take a few minutes.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrichment Results */}
      {enrichmentResults && (
        <Card>
          <CardHeader>
            <CardTitle>Enrichment Results</CardTitle>
            <CardDescription>
              Results from the most recent bulk enrichment operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {enrichmentResults.enriched} Successful
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {enrichmentResults.total - enrichmentResults.enriched} Failed
                </Badge>
              </div>

              {enrichmentResults.results.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">
                          Prospect ID
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Status
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Enrichment Score
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrichmentResults.results
                        .slice(0, 10)
                        .map((result: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="p-3 text-sm">{result.prospectId}</td>
                            <td className="p-3">
                              {result.success ? (
                                <Badge
                                  variant="default"
                                  className="flex items-center gap-1 w-fit"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Success
                                </Badge>
                              ) : (
                                <Badge
                                  variant="destructive"
                                  className="flex items-center gap-1 w-fit"
                                >
                                  <XCircle className="h-3 w-3" />
                                  Failed
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              {result.success ? `${result.score}%` : "N/A"}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {result.error || "Enriched successfully"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="mt-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">How Enrichment Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>LinkedIn Enrichment:</strong> Fetches professional
            background, current position, work experience, education, and top
            skills from LinkedIn profiles.
          </p>
          <p>
            <strong>GitHub Enrichment:</strong> Collects coding languages, top
            repositories, contribution activity, and technical expertise from
            GitHub profiles.
          </p>
          <p>
            <strong>Company Data:</strong> Gathers company information including
            industry, size, headquarters, specialties, and Crunchbase data.
          </p>
          <p>
            <strong>Enrichment Score:</strong> A 0-100 score indicating how
            complete the enriched data is. Scores above 70 are considered high
            quality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
