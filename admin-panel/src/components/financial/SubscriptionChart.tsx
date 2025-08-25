import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { financialApi } from "../../services/financialApi";

export function SubscriptionChart() {
  const [loading, setLoading] = useState(true);
  const [churnData, setChurnData] = useState<any[]>([]);
  const [ltvData, setLtvData] = useState<any>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [churn, ltv] = await Promise.all([
        financialApi.getChurnAnalytics(12),
        financialApi.getLTVAnalytics(),
      ]);
      setChurnData(churn);
      setLtvData(ltv);
    } catch (error) {
      console.error("Failed to load subscription data:", error);
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

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Customer LTV</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(ltvData?.ltv || 0)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {ltvData?.avgLifetimeMonths || 24} months avg lifetime
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">ARPU</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(ltvData?.arpu || 0)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Average revenue per user
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Current Churn</p>
          <p className="text-2xl font-bold text-red-700">
            {churnData.length > 0
              ? `${churnData[churnData.length - 1].churnRate}%`
              : "0%"}
          </p>
          <p className="text-xs text-red-600 mt-1">Monthly churn rate</p>
        </div>
      </div>

      {/* Churn Rate Trend */}
      <div>
        <h4 className="text-sm font-medium mb-4">Monthly Churn Rate Trend</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={churnData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(month) => format(new Date(month + "-01"), "MMM")}
            />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip
              formatter={(value: number) => `${value}%`}
              labelFormatter={(label) =>
                format(new Date(label + "-01"), "MMMM yyyy")
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="churnRate"
              stroke="#ef4444"
              strokeWidth={2}
              name="Churn Rate"
              dot={{ fill: "#ef4444" }}
            />
            {/* Add benchmark line */}
            <Line
              type="monotone"
              dataKey={() => 5}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              name="Industry Avg (5%)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Retention Cohort Chart would go here */}
      <div>
        <h4 className="text-sm font-medium mb-4">Retention by Cohort</h4>
        <div className="h-[200px] bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
          Cohort retention chart coming soon
        </div>
      </div>
    </div>
  );
}
