import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, AlertTriangle } from "lucide-react";
import { settingsApi } from "../api/settings";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

interface SystemSettings {
  siteName: string;
  supportEmail: string;
  maxUsersPerPlan: {
    free: number;
    pro: number;
    team: number;
    enterprise: number;
  };
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: settingsApi.getSettings,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const tabs = [
    { id: "general", name: "General" },
    { id: "ai", name: "AI Configuration" },
    { id: "limits", name: "User Limits" },
    { id: "maintenance", name: "Maintenance" },
  ];

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
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure system settings and platform behavior
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Site Name
                </label>
                <input
                  type="text"
                  value={formData.siteName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, siteName: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Support Email
                </label>
                <input
                  type="email"
                  value={formData.supportEmail || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, supportEmail: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.registrationEnabled || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationEnabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable new user registration
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.emailNotificationsEnabled || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emailNotificationsEnabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable email notifications
                </label>
              </div>
            </div>
          )}

          {/* AI Configuration */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  AI Model
                </label>
                <select
                  value={formData.aiModel || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, aiModel: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Temperature (0.0 - 1.0)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.aiTemperature || 0.7}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aiTemperature: parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Lower values make the AI more focused, higher values more
                  creative
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={formData.aiMaxTokens || 1000}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aiMaxTokens: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          )}

          {/* User Limits */}
          {activeTab === "limits" && formData.maxUsersPerPlan && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Free Plan Limit
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsersPerPlan.free || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsersPerPlan: {
                          ...formData.maxUsersPerPlan!,
                          free: parseInt(e.target.value),
                        },
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pro Plan Limit
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsersPerPlan.pro || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsersPerPlan: {
                          ...formData.maxUsersPerPlan!,
                          pro: parseInt(e.target.value),
                        },
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Team Plan Limit
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsersPerPlan.team || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsersPerPlan: {
                          ...formData.maxUsersPerPlan!,
                          team: parseInt(e.target.value),
                        },
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Enterprise Plan Limit
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsersPerPlan.enterprise || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsersPerPlan: {
                          ...formData.maxUsersPerPlan!,
                          enterprise: parseInt(e.target.value),
                        },
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Maintenance */}
          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={formData.maintenanceMode || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceMode: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-700">
                    Maintenance Mode
                  </label>
                  <p className="text-sm text-gray-500">
                    When enabled, only admins can access the platform
                  </p>
                </div>
              </div>
              {formData.maintenanceMode && (
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Maintenance Mode Active
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          The platform is currently in maintenance mode. Regular
                          users cannot access the system.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateSettingsMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
