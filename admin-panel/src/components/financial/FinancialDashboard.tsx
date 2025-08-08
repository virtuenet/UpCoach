import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DatePickerWithRange } from "../ui/date-picker-with-range";
import { format } from "date-fns";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";
import { financialApi, DashboardMetrics } from "../../services/financialApi";
import LoadingSpinner from "../LoadingSpinner";
import { ProfitLossChart } from "./ProfitLossChart";
import { MRRChart } from "./MRRChart";
import { SubscriptionChart } from "./SubscriptionChart";
import { CostBreakdownChart } from "./CostBreakdownChart";

export function FinancialDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await financialApi.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleGenerateSnapshot = async () => {
    try {
      await financialApi.generateSnapshot();
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to generate snapshot:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!metrics) {
    return <div>Failed to load dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track revenue, costs, and key financial metrics
          </p>
        </div>
        <div className="flex gap-2">
          <DatePickerWithRange
            className="w-[300px]"
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline" onClick={handleGenerateSnapshot}>
            <Calendar className="h-4 w-4 mr-2" />
            Generate Snapshot
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Recurring Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.revenue.mrr)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={
                  metrics.revenue.mrrGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {metrics.revenue.mrrGrowth >= 0 ? (
                  <ArrowUpIcon className="inline h-3 w-3" />
                ) : (
                  <ArrowDownIcon className="inline h-3 w-3" />
                )}
                {formatPercentage(metrics.revenue.mrrGrowth)}
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.subscriptions.active}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={
                  metrics.subscriptions.netNew >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {metrics.subscriptions.netNew >= 0 ? "+" : ""}
                {metrics.subscriptions.netNew}
              </span>{" "}
              net new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV:CAC Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.unitEconomics.ltvToCacRatio.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">
              LTV: {formatCurrency(metrics.unitEconomics.ltv)} | CAC:{" "}
              {formatCurrency(metrics.unitEconomics.cac)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.profitLoss.margin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.profitLoss.grossProfit)} profit on{" "}
              {formatCurrency(metrics.profitLoss.revenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Annual Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(metrics.revenue.arr)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on current MRR × 12
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Burn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(metrics.costs.burnRate)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics.costs.runway > 0
                ? `${metrics.costs.runway} months runway`
                : "Calculate cash balance"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.subscriptions.churnRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {metrics.subscriptions.churned} churned this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="pnl">P&L Statement</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>MRR Breakdown</CardTitle>
                <CardDescription>
                  Monthly recurring revenue trends and composition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MRRChart />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Plan</CardTitle>
                <CardDescription>
                  Revenue distribution across subscription plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">{/* Revenue by plan chart */}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                Detailed breakdown of revenue, costs, and profitability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitLossChart dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Analytics</CardTitle>
              <CardDescription>
                Track subscription growth, churn, and retention metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>
                Analyze operational costs by category and identify optimization
                opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostBreakdownChart dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Analysis</CardTitle>
              <CardDescription>
                Track customer retention and revenue by cohort
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {/* Cohort analysis table/chart */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
