import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

/**
 * Analytics Settings
 *
 * Configuration interface for analytics platform settings.
 *
 * Features:
 * - Data retention settings
 * - Export settings
 * - API key management
 * - Webhook configuration
 * - Alert settings
 * - Privacy controls
 * - Performance tuning
 */

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rateLimit: number;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: string;
}

interface Settings {
  dataRetention: {
    rawDataDays: number;
    aggregatedDataDays: number;
    archivedDataDays: number;
  };
  export: {
    maxRowsPerExport: number;
    allowedFormats: string[];
    includeMetadata: boolean;
  };
  alerts: {
    enabled: boolean;
    recipients: string[];
    severityThreshold: string;
  };
  privacy: {
    anonymizeData: boolean;
    excludePersonalInfo: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    queryTimeout: number;
  };
}

export const AnalyticsSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'general' | 'apiKeys' | 'webhooks' | 'alerts' | 'privacy'
  >('general');
  const [settings, setSettings] = useState<Settings>({
    dataRetention: {
      rawDataDays: 90,
      aggregatedDataDays: 365,
      archivedDataDays: 1825,
    },
    export: {
      maxRowsPerExport: 10000,
      allowedFormats: ['pdf', 'excel', 'csv', 'json'],
      includeMetadata: true,
    },
    alerts: {
      enabled: true,
      recipients: [],
      severityThreshold: 'medium',
    },
    privacy: {
      anonymizeData: false,
      excludePersonalInfo: false,
    },
    performance: {
      cacheEnabled: true,
      cacheTTL: 300,
      queryTimeout: 30,
    },
  });
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateAPIKey, setShowCreateAPIKey] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAPIKeys();
    loadWebhooks();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/api/v1/analytics/settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadAPIKeys = async () => {
    try {
      const response = await axios.get('/api/v1/analytics/api-keys');
      setApiKeys(response.data.apiKeys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const loadWebhooks = async () => {
    try {
      const response = await axios.get('/api/v1/analytics/webhooks');
      setWebhooks(response.data.webhooks);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await axios.put('/api/v1/analytics/settings', settings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAPIKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await axios.delete(`/api/v1/analytics/api-keys/${id}`);
      setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await axios.delete(`/api/v1/analytics/webhooks/${id}`);
      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook');
    }
  };

  const handleToggleWebhook = async (id: string, active: boolean) => {
    try {
      await axios.patch(`/api/v1/analytics/webhooks/${id}`, { active });
      setWebhooks(webhooks.map(w => (w.id === id ? { ...w, active } : w)));
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  return (
    <div className="analytics-settings p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics Settings</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'general', label: 'General' },
                { id: 'apiKeys', label: 'API Keys' },
                { id: 'webhooks', label: 'Webhooks' },
                { id: 'alerts', label: 'Alerts' },
                { id: 'privacy', label: 'Privacy' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 font-medium text-sm border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <GeneralSettings settings={settings} setSettings={setSettings} />
            )}
            {activeTab === 'apiKeys' && (
              <APIKeysTab
                apiKeys={apiKeys}
                onDelete={handleDeleteAPIKey}
                onCreate={() => setShowCreateAPIKey(true)}
              />
            )}
            {activeTab === 'webhooks' && (
              <WebhooksTab
                webhooks={webhooks}
                onDelete={handleDeleteWebhook}
                onToggle={handleToggleWebhook}
                onCreate={() => setShowCreateWebhook(true)}
              />
            )}
            {activeTab === 'alerts' && (
              <AlertsSettings settings={settings} setSettings={setSettings} />
            )}
            {activeTab === 'privacy' && (
              <PrivacySettings settings={settings} setSettings={setSettings} />
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showCreateAPIKey && (
        <CreateAPIKeyModal
          onClose={() => setShowCreateAPIKey(false)}
          onCreated={key => {
            setApiKeys([...apiKeys, key]);
            setShowCreateAPIKey(false);
          }}
        />
      )}

      {showCreateWebhook && (
        <CreateWebhookModal
          onClose={() => setShowCreateWebhook(false)}
          onCreated={webhook => {
            setWebhooks([...webhooks, webhook]);
            setShowCreateWebhook(false);
          }}
        />
      )}
    </div>
  );
};

const GeneralSettings: React.FC<{
  settings: Settings;
  setSettings: (settings: Settings) => void;
}> = ({ settings, setSettings }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Data Retention</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raw Data (days)
            </label>
            <input
              type="number"
              value={settings.dataRetention.rawDataDays}
              onChange={e =>
                setSettings({
                  ...settings,
                  dataRetention: {
                    ...settings.dataRetention,
                    rawDataDays: parseInt(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aggregated Data (days)
            </label>
            <input
              type="number"
              value={settings.dataRetention.aggregatedDataDays}
              onChange={e =>
                setSettings({
                  ...settings,
                  dataRetention: {
                    ...settings.dataRetention,
                    aggregatedDataDays: parseInt(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archived Data (days)
            </label>
            <input
              type="number"
              value={settings.dataRetention.archivedDataDays}
              onChange={e =>
                setSettings({
                  ...settings,
                  dataRetention: {
                    ...settings.dataRetention,
                    archivedDataDays: parseInt(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Export Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Rows Per Export
            </label>
            <input
              type="number"
              value={settings.export.maxRowsPerExport}
              onChange={e =>
                setSettings({
                  ...settings,
                  export: {
                    ...settings.export,
                    maxRowsPerExport: parseInt(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.export.includeMetadata}
                onChange={e =>
                  setSettings({
                    ...settings,
                    export: {
                      ...settings.export,
                      includeMetadata: e.target.checked,
                    },
                  })
                }
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Include metadata in exports</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Performance</h2>
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.performance.cacheEnabled}
                onChange={e =>
                  setSettings({
                    ...settings,
                    performance: {
                      ...settings.performance,
                      cacheEnabled: e.target.checked,
                    },
                  })
                }
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Enable query caching</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cache TTL (seconds)
            </label>
            <input
              type="number"
              value={settings.performance.cacheTTL}
              onChange={e =>
                setSettings({
                  ...settings,
                  performance: {
                    ...settings.performance,
                    cacheTTL: parseInt(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Timeout (seconds)
            </label>
            <input
              type="number"
              value={settings.performance.queryTimeout}
              onChange={e =>
                setSettings({
                  ...settings,
                  performance: {
                    ...settings.performance,
                    queryTimeout: parseInt(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const APIKeysTab: React.FC<{
  apiKeys: APIKey[];
  onDelete: (id: string) => void;
  onCreate: () => void;
}> = ({ apiKeys, onDelete, onCreate }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create API Key
        </button>
      </div>

      <div className="space-y-4">
        {apiKeys.map(key => (
          <div key={key.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{key.name}</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">{key.key}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                  <span>Rate Limit: {key.rateLimit}/hr</span>
                  <span>Created: {format(new Date(key.createdAt), 'MMM dd, yyyy')}</span>
                  {key.lastUsedAt && (
                    <span>Last Used: {format(new Date(key.lastUsedAt), 'MMM dd, yyyy')}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDelete(key.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {apiKeys.length === 0 && (
          <p className="text-gray-500 text-center py-8">No API keys created yet</p>
        )}
      </div>
    </div>
  );
};

const WebhooksTab: React.FC<{
  webhooks: Webhook[];
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onCreate: () => void;
}> = ({ webhooks, onDelete, onToggle, onCreate }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Webhooks</h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Webhook
        </button>
      </div>

      <div className="space-y-4">
        {webhooks.map(webhook => (
          <div key={webhook.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{webhook.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      webhook.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {webhook.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{webhook.url}</p>
                <div className="flex gap-2 mt-2">
                  {webhook.events.map(event => (
                    <span
                      key={event}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onToggle(webhook.id, !webhook.active)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {webhook.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => onDelete(webhook.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {webhooks.length === 0 && (
          <p className="text-gray-500 text-center py-8">No webhooks configured yet</p>
        )}
      </div>
    </div>
  );
};

const AlertsSettings: React.FC<{
  settings: Settings;
  setSettings: (settings: Settings) => void;
}> = ({ settings, setSettings }) => {
  const [newRecipient, setNewRecipient] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.alerts.enabled}
            onChange={e =>
              setSettings({
                ...settings,
                alerts: { ...settings.alerts, enabled: e.target.checked },
              })
            }
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">Enable alerts</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity Threshold
        </label>
        <select
          value={settings.alerts.severityThreshold}
          onChange={e =>
            setSettings({
              ...settings,
              alerts: { ...settings.alerts, severityThreshold: e.target.value },
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
        <div className="flex gap-2 mb-2">
          <input
            type="email"
            value={newRecipient}
            onChange={e => setNewRecipient(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={() => {
              if (newRecipient) {
                setSettings({
                  ...settings,
                  alerts: {
                    ...settings.alerts,
                    recipients: [...settings.alerts.recipients, newRecipient],
                  },
                });
                setNewRecipient('');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {settings.alerts.recipients.map((recipient, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-sm">{recipient}</span>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    alerts: {
                      ...settings.alerts,
                      recipients: settings.alerts.recipients.filter((_, i) => i !== index),
                    },
                  })
                }
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PrivacySettings: React.FC<{
  settings: Settings;
  setSettings: (settings: Settings) => void;
}> = ({ settings, setSettings }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.privacy.anonymizeData}
            onChange={e =>
              setSettings({
                ...settings,
                privacy: { ...settings.privacy, anonymizeData: e.target.checked },
              })
            }
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Anonymize exported data</span>
        </label>
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.privacy.excludePersonalInfo}
            onChange={e =>
              setSettings({
                ...settings,
                privacy: { ...settings.privacy, excludePersonalInfo: e.target.checked },
              })
            }
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Exclude personal information from analytics
          </span>
        </label>
      </div>
    </div>
  );
};

const CreateAPIKeyModal: React.FC<{
  onClose: () => void;
  onCreated: (key: APIKey) => void;
}> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [rateLimit, setRateLimit] = useState(1000);

  const handleCreate = async () => {
    try {
      const response = await axios.post('/api/v1/analytics/api-keys', {
        name,
        rateLimit,
      });
      onCreated(response.data.data);
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Create API Key</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="My API Key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Limit (requests/hour)
            </label>
            <input
              type="number"
              value={rateLimit}
              onChange={e => setRateLimit(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateWebhookModal: React.FC<{
  onClose: () => void;
  onCreated: (webhook: Webhook) => void;
}> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);

  const availableEvents = [
    'anomaly.detected',
    'forecast.generated',
    'report.completed',
    'alert.triggered',
  ];

  const handleCreate = async () => {
    try {
      const response = await axios.post('/api/v1/analytics/webhooks', {
        name,
        url,
        events,
      });
      onCreated(response.data.data);
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Create Webhook</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://example.com/webhook"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Events</label>
            {availableEvents.map(event => (
              <label key={event} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={events.includes(event)}
                  onChange={e => {
                    if (e.target.checked) {
                      setEvents([...events, event]);
                    } else {
                      setEvents(events.filter(ev => ev !== event));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{event}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name || !url || events.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSettings;
