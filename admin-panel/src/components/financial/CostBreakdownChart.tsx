import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CostBreakdownChartProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export function CostBreakdownChart({ dateRange }: CostBreakdownChartProps) {
  const [loading, setLoading] = useState(true);
  const [costData, setCostData] = useState<any>(null);
  const [optimizations, setOptimizations] = useState<any>(null);

  useEffect(() => {
    loadCostData();
  }, [dateRange]);

  const loadCostData = async () => {
    try {
      setLoading(true);
      const [costs, opt] = await Promise.all([
        financialApi.getCostsByCategory(
          format(dateRange.from, "yyyy-MM-dd"),
          format(dateRange.to, "yyyy-MM-dd"),
        ),
        financialApi.getCostOptimizationSuggestions(),
      ]);
      setCostData(costs);
      setOptimizations(opt);
    } catch (error) {
      console.error("Failed to load cost data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!costData || costData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        No data available
      </div>
    );
  }

  // Transform data for charts
  const pieData = costData.map((item: any) => ({
    name: item.category
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: parseFloat(item.total),
  }));

  const totalCosts = pieData.reduce(
    (sum: number, item: any) => sum + item.value,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Cost Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium mb-4">Cost Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-4">Category Breakdown</h4>
          <div className="space-y-3">
            {pieData.map((item: any, index: number) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {formatCurrency(item.value)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({((item.value / totalCosts) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Costs</span>
                <span className="text-lg font-bold">
                  {formatCurrency(totalCosts)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Optimization Suggestions */}
      {optimizations?.suggestions?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-4">
            Cost Optimization Opportunities
            {optimizations.potentialSavings > 0 && (
              <span className="ml-2 text-green-600">
                (Potential savings:{" "}
                {formatCurrency(optimizations.potentialSavings)})
              </span>
            )}
          </h4>
          <div className="space-y-3">
            {optimizations.suggestions.map((suggestion: any, index: number) => (
              <div
                key={index}
                className="p-3 bg-amber-50 rounded-lg border border-amber-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      {suggestion.title}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                  {suggestion.savings && (
                    <span className="text-sm font-bold text-amber-900">
                      Save {formatCurrency(suggestion.savings)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
