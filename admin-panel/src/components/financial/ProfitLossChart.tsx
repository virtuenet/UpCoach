import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ProfitLossChartProps {
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function ProfitLossChart({ dateRange }: ProfitLossChartProps) {
  const [loading, setLoading] = useState(true);
  const [pnlData, setPnlData] = useState<ProfitLossStatement | null>(null);

  useEffect(() => {
    loadPnLData();
  }, [dateRange]);

  const loadPnLData = async () => {
    try {
      setLoading(true);
      const data = await financialApi.getProfitLossStatement(
        format(dateRange.from, "yyyy-MM-dd"),
        format(dateRange.to, "yyyy-MM-dd"),
      );
      setPnlData(data);
    } catch (error) {
      console.error("Failed to load P&L data:", error);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!pnlData) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        No data available
      </div>
    );
  }

  const chartData = [
    { name: "Revenue", gross: pnlData.revenue.gross, net: pnlData.revenue.net },
    {
      name: "Costs",
      direct: pnlData.costs.directCosts,
      operating: pnlData.costs.operatingExpenses,
    },
    { name: "Profit", gross: pnlData.profit.gross, net: pnlData.profit.net },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Net Revenue</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(pnlData.revenue.net)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            After {formatCurrency(pnlData.revenue.refunds)} refunds
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Total Costs</p>
          <p className="text-2xl font-bold text-red-700">
            {formatCurrency(pnlData.costs.total)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {formatPercentage(
              (pnlData.costs.total / pnlData.revenue.net) * 100,
            )}{" "}
            of revenue
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Net Profit</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(pnlData.profit.net)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {formatPercentage(pnlData.profit.netMargin)} margin
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Gross Margin</p>
          <p className="text-2xl font-bold text-purple-700">
            {formatPercentage(pnlData.profit.grossMargin)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {formatCurrency(pnlData.profit.gross)} gross profit
          </p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div>
        <h4 className="text-sm font-medium mb-4">Cost Breakdown by Category</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(pnlData.costs.byCategory).map(
            ([category, amount]) => (
              <div
                key={category}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <span className="text-sm font-medium capitalize">
                  {category.replace(/_/g, " ")}
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {formatCurrency(amount)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({formatPercentage((amount / pnlData.costs.total) * 100)})
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* P&L Waterfall Chart */}
      <div>
        <h4 className="text-sm font-medium mb-4">Profit & Loss Waterfall</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="gross" fill="#10b981" name="Gross" />
            <Bar dataKey="net" fill="#3b82f6" name="Net" />
            <Bar dataKey="direct" fill="#f59e0b" name="Direct Costs" />
            <Bar dataKey="operating" fill="#ef4444" name="Operating Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
