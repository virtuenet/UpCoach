import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { financialApi } from "../../services/financialApi";

export function MRRChart() {
  const [loading, setLoading] = useState(true);
  const [mrrData, setMrrData] = useState<any>(null);

  useEffect(() => {
    loadMRRData();
  }, []);

  const loadMRRData = async () => {
    try {
      setLoading(true);
      const data = await financialApi.getMRRMetrics();
      setMrrData(data);
    } catch (error) {
      console.error("Failed to load MRR data:", error);
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
      <div className="h-[300px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!mrrData) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        No data available
      </div>
    );
  }

  const movementData = [
    { name: "Starting MRR", value: mrrData.previous, fill: "#3b82f6" },
    { name: "New", value: mrrData.breakdown?.new || 0, fill: "#10b981" },
    {
      name: "Expansion",
      value: mrrData.breakdown?.expansion || 0,
      fill: "#22c55e",
    },
    {
      name: "Contraction",
      value: -(mrrData.breakdown?.contraction || 0),
      fill: "#f59e0b",
    },
    { name: "Churn", value: -(mrrData.breakdown?.churn || 0), fill: "#ef4444" },
    { name: "Current MRR", value: mrrData.current, fill: "#3b82f6" },
  ];

  return (
    <div className="space-y-6">
      {/* MRR Movement Waterfall */}
      <div>
        <h4 className="text-sm font-medium mb-4">MRR Movement</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={movementData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(Math.abs(value))}
              labelStyle={{ color: "#000" }}
            />
            <Bar dataKey="value">
              {movementData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Current MRR</p>
          <p className="text-2xl font-bold">
            {formatCurrency(mrrData.current)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Growth</p>
          <p
            className={`text-2xl font-bold ${mrrData.growth >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {mrrData.growth >= 0 ? "+" : ""}
            {mrrData.growth.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Net New</p>
          <p
            className={`text-2xl font-bold ${mrrData.growthAmount >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(Math.abs(mrrData.growthAmount))}
          </p>
        </div>
      </div>
    </div>
  );
}
