import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {} from "lucide-react";
import { moodApi } from "../api/mood";
import LoadingSpinner from "../components/LoadingSpinner";

interface MoodEntry {
  id: string;
  moodLevel: "very_bad" | "bad" | "neutral" | "good" | "very_good";
  notes?: string;
  activities: string[];
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

const moodEmojis = {
  very_bad: "😢",
  bad: "😟",
  neutral: "😐",
  good: "😊",
  very_good: "😄",
};

const moodColors = {
  very_bad: "bg-red-100 text-red-800",
  bad: "bg-orange-100 text-orange-800",
  neutral: "bg-gray-100 text-gray-800",
  good: "bg-blue-100 text-blue-800",
  very_good: "bg-green-100 text-green-800",
};

export default function MoodPage() {
  const [dateRange, setDateRange] = useState<string>("7");
  const [moodFilter, setMoodFilter] = useState<string>("all");

  const { data: moodData, isLoading } = useQuery({
    queryKey: ["admin-mood", dateRange, moodFilter],
    queryFn: () =>
      moodApi.getMoodEntries({
        days: parseInt(dateRange),
        mood: moodFilter === "all" ? undefined : moodFilter,
      }),
  });

  const { data: moodStats } = useQuery({
    queryKey: ["mood-stats", dateRange],
    queryFn: () => moodApi.getMoodStats({ days: parseInt(dateRange) }),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mood Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor user mood patterns and insights across the platform
        </p>
      </div>

      {/* Stats Cards */}
      {moodStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(moodStats.distribution).map(([mood, count]) => (
            <div key={mood} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 capitalize">
                    {mood.replace("_", " ")}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {count}
                  </p>
                </div>
                <div className="text-2xl">
                  {moodEmojis[mood as keyof typeof moodEmojis]}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
            <select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Moods</option>
              <option value="very_good">Very Good</option>
              <option value="good">Good</option>
              <option value="neutral">Neutral</option>
              <option value="bad">Bad</option>
              <option value="very_bad">Very Bad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mood Entries Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Mood Entries
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mood
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {moodData?.entries?.map((_entry: MoodEntry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.user.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">
                        {moodEmojis[entry.moodLevel]}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${moodColors[entry.moodLevel]}`}
                      >
                        {entry.moodLevel.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {entry.activities.map((activity, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {entry.notes || "No notes"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(entry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
