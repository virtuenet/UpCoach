import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Brain,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  
  MessageSquare,
  BarChart3,
  Download,
  
  Search,
} from "lucide-react";

/**
 * Coach Analytics Dashboard Component
 * Displays comprehensive analytics for coach intelligence system
 */

interface UserAnalytics {
  id: string;
  userId: string;
  periodType: string;
  engagementMetrics: {
    totalSessions: number;
    averageSessionDuration: number;
    participationScore: number;
    followThroughRate: number;
  };
  coachingMetrics: {
    goalCompletionRate: number;
    avatarEffectivenessScore: number;
    progressMetrics: {
      skillImprovement: number;
      confidenceIncrease: number;
      stressReduction: number;
      habitFormation: number;
    };
  };
  kpiMetrics: {
    userSatisfactionScore: number;
    churnRisk: number;
    retentionProbability: number;
  };
  aiInsights: {
    strengthAreas: string[];
    improvementAreas: string[];
    riskFactors: string[];
  };
}

interface CohortMetrics {
  totalUsers: number;
  averageEngagement: number;
  averageGoalCompletion: number;
  averageSatisfaction: number;
  churnRisk: number;
  topStrengthAreas: { item: string; count: number }[];
  topImprovementAreas: { item: string; count: number }[];
}

interface CoachMemory {
  id: string;
  memoryType: string;
  summary: string;
  tags: string[];
  importance: number;
  relevanceScore: number;
  conversationDate: string;
  emotionalContext: {
    mood: string;
    sentiment: number;
  };
}

const CoachAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [cohortMetrics, setCohortMetrics] = useState<CohortMetrics | null>(
    null,
  );
  const [memories, setMemories] = useState<CoachMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [selectedCohort, _setSelectedCohort] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, selectedCohort]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch cohort analytics
      const cohortResponse = await fetch(
        `/api/coach-intelligence/cohort-analytics?periodType=${selectedPeriod}`,
      );
      const cohortData = await cohortResponse.json();

      if (cohortData.success) {
        setCohortMetrics(cohortData.data.cohortMetrics);
        setAnalytics(cohortData.data.individualAnalytics);
      }

      // Fetch recent memories sample
      const memoriesResponse = await fetch(
        "/api/coach-intelligence/memories/recent?limit=50",
      );
      const memoriesData = await memoriesResponse.json();

      if (memoriesData.success) {
        setMemories(memoriesData.data.memories);
      }
    } catch (err) {
      setError("Failed to fetch analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const response = await fetch("/api/coach-intelligence/reports/cohort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: selectedPeriod,
          cohort: selectedCohort,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coach-analytics-report-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
    } catch (err) {
      console.error("Report generation error:", err);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskBadgeColor = (risk: number) => {
    if (risk < 0.3) return "bg-green-100 text-green-800";
    if (risk < 0.7) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Prepare chart data
  const engagementData = analytics.map((a) => ({
    name: `User ${a.userId.slice(-4)}`,
    sessions: a.engagementMetrics.totalSessions,
    duration: a.engagementMetrics.averageSessionDuration,
    participation: Math.round(a.engagementMetrics.participationScore * 100),
  }));

  const satisfactionData = analytics.map((a) => ({
    name: `User ${a.userId.slice(-4)}`,
    satisfaction: a.kpiMetrics.userSatisfactionScore,
    completion: Math.round(a.coachingMetrics.goalCompletionRate * 100),
  }));

  const progressData = [
    {
      name: "Skill Improvement",
      value: Math.round((cohortMetrics?.averageEngagement || 0) * 100),
    },
    {
      name: "Goal Completion",
      value: Math.round((cohortMetrics?.averageGoalCompletion || 0) * 100),
    },
    {
      name: "User Satisfaction",
      value: Math.round((cohortMetrics?.averageSatisfaction || 0) * 10),
    },
  ];

  const moodDistribution = memories.reduce(
    (acc, memory) => {
      const mood = memory.emotionalContext.mood;
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const moodChartData = Object.entries(moodDistribution).map(
    ([mood, count]) => ({
      name: mood,
      value: count,
    }),
  );

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#ff0066"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <Button onClick={fetchAnalyticsData} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Coach Intelligence Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive coaching performance and user engagement insights
          </p>
        </div>

        <div className="flex space-x-4">
          <div className="flex space-x-2">
            <Button
              variant={selectedPeriod === "weekly" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={selectedPeriod === "monthly" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={selectedPeriod === "quarterly" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("quarterly")}
            >
              Quarterly
            </Button>
          </div>

          <Button
            onClick={generateReport}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {cohortMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cohortMetrics.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                Active in selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Engagement
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(cohortMetrics.averageEngagement * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average participation score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Goal Completion
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(cohortMetrics.averageGoalCompletion * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                At Risk Users
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {cohortMetrics.churnRisk}
              </div>
              <p className="text-xs text-muted-foreground">
                High churn risk detected
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement vs Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>User Engagement Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessions" fill="#8884d8" name="Sessions" />
                <Bar
                  dataKey="participation"
                  fill="#82ca9d"
                  name="Participation %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Satisfaction vs Goal Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Satisfaction & Goal Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={satisfactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="satisfaction"
                  stroke="#8884d8"
                  name="Satisfaction"
                />
                <Line
                  type="monotone"
                  dataKey="completion"
                  stroke="#82ca9d"
                  name="Completion %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overall Progress Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Key Performance Areas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>User Mood Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={moodChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {moodChartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Insights */}
      {cohortMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Top Strength Areas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cohortMetrics.topStrengthAreas
                  .slice(0, 5)
                  .map((area, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{area.item}</span>
                      <Badge variant="outline">{area.count} users</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>Top Improvement Areas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cohortMetrics.topImprovementAreas
                  .slice(0, 5)
                  .map((area, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{area.item}</span>
                      <Badge variant="outline">{area.count} users</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual User Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Individual User Performance</span>
          </CardTitle>
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User ID</th>
                  <th className="text-left p-2">Health Score</th>
                  <th className="text-left p-2">Engagement</th>
                  <th className="text-left p-2">Goal Completion</th>
                  <th className="text-left p-2">Satisfaction</th>
                  <th className="text-left p-2">Churn Risk</th>
                  <th className="text-left p-2">Top Strengths</th>
                </tr>
              </thead>
              <tbody>
                {analytics
                  .filter((a) => !searchTerm || a.userId.includes(searchTerm))
                  .slice(0, 10)
                  .map((user) => {
                    const healthScore = Math.round(
                      ((user.engagementMetrics.participationScore +
                        user.coachingMetrics.goalCompletionRate +
                        user.kpiMetrics.userSatisfactionScore / 10) /
                        3) *
                        100,
                    );

                    return (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-sm">
                          {user.userId.slice(-8)}
                        </td>
                        <td className="p-2">
                          <span
                            className={`font-semibold ${getHealthScoreColor(healthScore)}`}
                          >
                            {healthScore}%
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={
                                user.engagementMetrics.participationScore * 100
                              }
                              className="w-16"
                            />
                            <span className="text-sm">
                              {Math.round(
                                user.engagementMetrics.participationScore * 100,
                              )}
                              %
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={
                                user.coachingMetrics.goalCompletionRate * 100
                              }
                              className="w-16"
                            />
                            <span className="text-sm">
                              {Math.round(
                                user.coachingMetrics.goalCompletionRate * 100,
                              )}
                              %
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="text-sm">
                            {user.kpiMetrics.userSatisfactionScore}/10
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge
                            className={getRiskBadgeColor(
                              user.kpiMetrics.churnRisk,
                            )}
                          >
                            {user.kpiMetrics.churnRisk < 0.3
                              ? "Low"
                              : user.kpiMetrics.churnRisk < 0.7
                                ? "Medium"
                                : "High"}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {user.aiInsights.strengthAreas
                              .slice(0, 2)
                              .map((strength, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {strength}
                                </Badge>
                              ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Memories Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Recent Memory Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memories.slice(0, 6).map((memory) => (
              <div
                key={memory.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{memory.memoryType}</Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(memory.conversationDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{memory.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">Importance:</span>
                    <Progress value={memory.importance * 10} className="w-12" />
                    <span className="text-xs">{memory.importance}/10</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      memory.emotionalContext.sentiment > 0
                        ? "text-green-600 border-green-300"
                        : memory.emotionalContext.sentiment < 0
                          ? "text-red-600 border-red-300"
                          : "text-gray-600"
                    }
                  >
                    {memory.emotionalContext.mood}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {memory.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachAnalyticsDashboard;
