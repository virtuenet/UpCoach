import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Save, Key, Bell, Shield, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

interface ProfileFormData {
  fullName: string;
  email: string;
  bio: string;
  expertise: string[];
}

interface NotificationSettings {
  emailNotifications: boolean;
  contentUpdates: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
}

export default function UserProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: user?.fullName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    expertise: user?.expertise || [],
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    contentUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  const [newExpertise, setNewExpertise] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      const response = await apiClient.put('/users/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      updateProfile(data.user);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertise.includes(newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()],
      }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (item: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== item),
    }));
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      fullName: formData.fullName,
      bio: formData.bio,
      expertise: formData.expertise,
    });
  };

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification preferences updated');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      coach: 'bg-blue-100 text-blue-800',
      content_creator: 'bg-green-100 text-green-800',
    };
    return styles[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-secondary-100 flex items-center justify-center">
                <span className="text-2xl font-semibold text-secondary-600">
                  {getInitials(user?.fullName || 'U')}
                </span>
              </div>
            )}
            <button
              type="button"
              className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
              title="Change avatar"
              aria-label="Change avatar"
            >
              <Camera className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{user?.fullName}</h1>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user?.role || '')}`}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{user?.email}</p>
            <p className="text-sm text-gray-400 mt-2">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'profile'
                  ? 'border-secondary-500 text-secondary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'notifications'
                  ? 'border-secondary-500 text-secondary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'security'
                  ? 'border-secondary-500 text-secondary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-secondary-600 hover:text-secondary-700 text-sm font-medium"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center gap-1 text-secondary-600 hover:text-secondary-700 text-sm font-medium disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Areas of Expertise
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.expertise.map(item => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                    >
                      {item}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeExpertise(item)}
                          className="hover:text-secondary-900"
                          title="Remove expertise"
                          aria-label={`Remove ${item}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExpertise}
                      onChange={e => setNewExpertise(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                      placeholder="Add expertise..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                    />
                    <button
                      type="button"
                      onClick={addExpertise}
                      className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email notifications for important updates' },
                  { key: 'contentUpdates', label: 'Content Updates', description: 'Get notified when content you follow is updated' },
                  { key: 'securityAlerts', label: 'Security Alerts', description: 'Receive alerts about security-related activities' },
                  { key: 'marketingEmails', label: 'Marketing Emails', description: 'Receive promotional emails and newsletters' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationChange(item.key as keyof NotificationSettings)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications[item.key as keyof NotificationSettings] ? 'bg-secondary-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={notifications[item.key as keyof NotificationSettings] ? 'true' : 'false'}
                      aria-label={item.label}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications[item.key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
              </div>

              <div className="space-y-4">
                {/* Change Password */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Password</p>
                        <p className="text-sm text-gray-500">Last changed 30 days ago</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 text-secondary-600 hover:text-secondary-700 font-medium text-sm"
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 text-sm"
                    >
                      Enable 2FA
                    </button>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900">Active Sessions</p>
                      <p className="text-sm text-gray-500">Manage your active login sessions</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded border">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Current Session</p>
                        <p className="text-xs text-gray-500">macOS - Chrome - San Francisco, CA</p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                    </div>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-red-900">Delete Account</p>
                        <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
