import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';

// Types
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  actions: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  userCount: number;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
  lastActive: Date;
  status: 'active' | 'inactive' | 'pending';
}

interface PermissionModule {
  id: string;
  name: string;
  icon: React.FC;
  permissions: Permission[];
}

// Icons
const Icons = {
  Shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Document: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Settings: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Analytics: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Media: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Edit: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Check: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: (props: React.SVGProps<SVGSVGElement>) => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// Sample data
const sampleRoles: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    color: 'red',
    userCount: 2,
    permissions: ['all'],
    isSystem: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Admin',
    description: 'Administrative access with most permissions',
    color: 'orange',
    userCount: 5,
    permissions: ['users.view', 'users.edit', 'content.all', 'analytics.view'],
    isSystem: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-15'),
  },
  {
    id: '3',
    name: 'Editor',
    description: 'Content creation and editing permissions',
    color: 'blue',
    userCount: 12,
    permissions: ['content.create', 'content.edit', 'content.publish', 'media.all'],
    isSystem: false,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-11-20'),
  },
  {
    id: '4',
    name: 'Viewer',
    description: 'Read-only access to content and analytics',
    color: 'green',
    userCount: 45,
    permissions: ['content.view', 'analytics.view'],
    isSystem: false,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-10-05'),
  },
];

const permissionModules: PermissionModule[] = [
  {
    id: 'users',
    name: 'User Management',
    icon: Icons.Users,
    permissions: [
      { id: 'users.view', name: 'View Users', description: 'View user list and details', module: 'users', actions: ['read'] },
      { id: 'users.create', name: 'Create Users', description: 'Create new user accounts', module: 'users', actions: ['create'] },
      { id: 'users.edit', name: 'Edit Users', description: 'Modify user information', module: 'users', actions: ['update'] },
      { id: 'users.delete', name: 'Delete Users', description: 'Remove user accounts', module: 'users', actions: ['delete'] },
      { id: 'users.roles', name: 'Manage Roles', description: 'Assign and modify user roles', module: 'users', actions: ['update'] },
    ],
  },
  {
    id: 'content',
    name: 'Content Management',
    icon: Icons.Document,
    permissions: [
      { id: 'content.view', name: 'View Content', description: 'View all content items', module: 'content', actions: ['read'] },
      { id: 'content.create', name: 'Create Content', description: 'Create new content', module: 'content', actions: ['create'] },
      { id: 'content.edit', name: 'Edit Content', description: 'Modify existing content', module: 'content', actions: ['update'] },
      { id: 'content.delete', name: 'Delete Content', description: 'Remove content items', module: 'content', actions: ['delete'] },
      { id: 'content.publish', name: 'Publish Content', description: 'Publish content to live site', module: 'content', actions: ['publish'] },
    ],
  },
  {
    id: 'media',
    name: 'Media Library',
    icon: Icons.Media,
    permissions: [
      { id: 'media.view', name: 'View Media', description: 'View media library', module: 'media', actions: ['read'] },
      { id: 'media.upload', name: 'Upload Media', description: 'Upload new media files', module: 'media', actions: ['create'] },
      { id: 'media.edit', name: 'Edit Media', description: 'Edit media metadata', module: 'media', actions: ['update'] },
      { id: 'media.delete', name: 'Delete Media', description: 'Remove media files', module: 'media', actions: ['delete'] },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: Icons.Analytics,
    permissions: [
      { id: 'analytics.view', name: 'View Analytics', description: 'View analytics dashboards', module: 'analytics', actions: ['read'] },
      { id: 'analytics.export', name: 'Export Reports', description: 'Export analytics data', module: 'analytics', actions: ['export'] },
      { id: 'analytics.configure', name: 'Configure Analytics', description: 'Configure analytics settings', module: 'analytics', actions: ['update'] },
    ],
  },
  {
    id: 'settings',
    name: 'System Settings',
    icon: Icons.Settings,
    permissions: [
      { id: 'settings.view', name: 'View Settings', description: 'View system settings', module: 'settings', actions: ['read'] },
      { id: 'settings.edit', name: 'Edit Settings', description: 'Modify system settings', module: 'settings', actions: ['update'] },
      { id: 'settings.backup', name: 'System Backup', description: 'Create and restore backups', module: 'settings', actions: ['backup'] },
    ],
  },
];

export interface RolePermissionManagerProps {
  onRoleUpdate?: (role: Role) => void;
  onUserRoleChange?: (userId: string, roleId: string) => void;
}

export const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({
  onRoleUpdate,
  onUserRoleChange,
}) => {
  const [roles, setRoles] = useState<Role[]>(sampleRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0]);
  const [viewMode, setViewMode] = useState<'roles' | 'permissions' | 'users'>('roles');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Calculate permission matrix
  const permissionMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, boolean>> = {};

    roles.forEach(role => {
      matrix[role.id] = {};
      permissionModules.forEach(module => {
        module.permissions.forEach(permission => {
          matrix[role.id][permission.id] =
            role.permissions.includes('all') ||
            role.permissions.includes(permission.id) ||
            role.permissions.includes(`${module.id}.all`);
        });
      });
    });

    return matrix;
  }, [roles]);

  // Toggle permission for a role
  const togglePermission = (roleId: string, permissionId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role || role.isSystem) return;

    const updatedRoles = roles.map(r => {
      if (r.id === roleId) {
        const hasPermission = r.permissions.includes(permissionId);
        const permissions = hasPermission
          ? r.permissions.filter(p => p !== permissionId)
          : [...r.permissions, permissionId];

        const updatedRole = { ...r, permissions, updatedAt: new Date() };
        onRoleUpdate?.(updatedRole);
        return updatedRole;
      }
      return r;
    });

    setRoles(updatedRoles);
  };

  // Get role color classes
  const getRoleColorClasses = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
      orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
      blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Render roles view
  const renderRolesView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Roles List */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Roles</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Icons.Plus />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {roles.map(role => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={clsx(
                  'p-4 rounded-lg border-2 cursor-pointer transition-all',
                  selectedRole?.id === role.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </h4>
                      {role.isSystem && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {role.description}
                    </p>
                    <div className="flex items-center mt-2 space-x-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        <Icons.Users className="inline w-3 h-3 mr-1" />
                        {role.userCount} users
                      </span>
                      <span className={clsx(
                        'px-2 py-0.5 text-xs rounded-full border',
                        getRoleColorClasses(role.color)
                      )}>
                        {role.color}
                      </span>
                    </div>
                  </div>
                  {!role.isSystem && (
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRole(role);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle delete
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Permission Details */}
      <div className="lg:col-span-2">
        {selectedRole && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedRole.name} Permissions
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedRole.description}
                  </p>
                </div>
                {selectedRole.isSystem && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 text-xs rounded-full">
                    System role - permissions cannot be modified
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              {permissionModules.map(module => (
                <div key={module.id} className="mb-6">
                  <div className="flex items-center mb-3">
                    <module.icon />
                    <h4 className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                      {module.name}
                    </h4>
                  </div>

                  <div className="space-y-2 ml-7">
                    {module.permissions.map(permission => {
                      const isEnabled = permissionMatrix[selectedRole.id]?.[permission.id] || false;
                      const isReadOnly = selectedRole.isSystem;

                      return (
                        <label
                          key={permission.id}
                          className={clsx(
                            'flex items-start p-3 rounded-lg border transition-colors',
                            !isReadOnly && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700',
                            isEnabled
                              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => !isReadOnly && togglePermission(selectedRole.id, permission.id)}
                            disabled={isReadOnly}
                            className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {permission.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {permission.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render permission matrix view
  const renderPermissionMatrix = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700">
                Permission
              </th>
              {roles.map(role => (
                <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <span>{role.name}</span>
                    <span className={clsx(
                      'mt-1 px-2 py-0.5 text-xs rounded-full border',
                      getRoleColorClasses(role.color)
                    )}>
                      {role.userCount} users
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {permissionModules.map(module => (
              <React.Fragment key={module.id}>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td colSpan={roles.length + 1} className="px-6 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <module.icon />
                      <span className="ml-2">{module.name}</span>
                    </div>
                  </td>
                </tr>
                {module.permissions.map(permission => (
                  <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800">
                      <div>
                        <div className="font-medium">{permission.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </div>
                      </div>
                    </td>
                    {roles.map(role => {
                      const hasPermission = permissionMatrix[role.id]?.[permission.id] || false;

                      return (
                        <td key={role.id} className="px-6 py-3 text-center">
                          {hasPermission ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full">
                              <Icons.Check className="text-green-600 dark:text-green-400" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full">
                              <Icons.X className="text-gray-400 dark:text-gray-500" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Role & Permission Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure roles and their associated permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Export Configuration
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 inline-flex">
        <button
          onClick={() => setViewMode('roles')}
          className={clsx(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            viewMode === 'roles'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          Roles & Permissions
        </button>
        <button
          onClick={() => setViewMode('permissions')}
          className={clsx(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            viewMode === 'permissions'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          Permission Matrix
        </button>
        <button
          onClick={() => setViewMode('users')}
          className={clsx(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            viewMode === 'users'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          User Assignments
        </button>
      </div>

      {/* Content */}
      {viewMode === 'roles' && renderRolesView()}
      {viewMode === 'permissions' && renderPermissionMatrix()}
      {viewMode === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          User assignment view coming soon...
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Icons.Shield />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Roles</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{roles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Icons.Users />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {roles.reduce((sum, role) => sum + role.userCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Icons.Document />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Permissions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {permissionModules.reduce((sum, module) => sum + module.permissions.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Icons.Settings />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Modules</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {permissionModules.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionManager;