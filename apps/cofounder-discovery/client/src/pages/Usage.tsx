import { trpc } from "../lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { DollarSign, TrendingUp, Activity, Calendar } from "lucide-react";
import { TutorialTooltip } from "../components/TutorialTooltip";
import { getTutorial } from "../tutorials";

export function Usage() {
  const { data: usageSummary, isLoading } =
    trpc.billing.getCurrentUsage.useQuery();
  const { data: pricing } = trpc.billing.getPricing.useQuery();

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!usageSummary) return null;

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Calculate days remaining in billing period
  const now = new Date();
  const endDate = new Date(usageSummary.period.endDate);
  const daysRemaining = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 inline-flex items-center">
          Usage & Billing
          <TutorialTooltip
            videoUrl={getTutorial("billing")?.videoUrl || ""}
            title={getTutorial("billing")?.title || "Usage & Billing"}
            description={getTutorial("billing")?.description}
          />
        </h1>
        <p className="text-muted-foreground">
          Track your resource consumption and costs
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Month Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(usageSummary.period.totalMarkedUpCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Base cost: {formatCurrency(usageSummary.period.totalBaseCost)} ×
              2.5 markup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total API Calls
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageSummary.period.totalUsageCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all resource types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Billing Period
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysRemaining} days left</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ends {new Date(usageSummary.period.endDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Usage Breakdown by Resource Type</CardTitle>
          <CardDescription>
            Detailed breakdown of your resource consumption this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageSummary.breakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No usage recorded this billing period
            </div>
          ) : (
            <div className="space-y-4">
              {usageSummary.breakdown.map(item => {
                const pricingInfo = pricing?.find(
                  p => p.resourceType === item.resourceType
                );
                const percentage =
                  usageSummary.period.totalMarkedUpCost > 0
                    ? (item.totalMarkedUpCost /
                        usageSummary.period.totalMarkedUpCost) *
                      100
                    : 0;

                return (
                  <div key={item.resourceType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {item.resourceType
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.count} {pricingInfo?.unitName || "units"} ×{" "}
                          {formatCurrency(pricingInfo?.baseCostPerUnit || 0)} ×
                          2.5
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatCurrency(item.totalMarkedUpCost)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Reference</CardTitle>
          <CardDescription>
            Current pricing for all resource types (includes 2.5x markup)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pricing && pricing.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricing.map(item => (
                <div
                  key={item.resourceType}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {item.resourceType
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatCurrency(
                        Math.round(item.baseCostPerUnit * item.markup)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      per {item.unitName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pricing information available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
