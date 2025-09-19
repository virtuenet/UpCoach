<html><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    
    <style>::-webkit-scrollbar { display: none;}</style>
    <script>tailwind.config = {
  "theme": {
    "extend": {
      "colors": {
        "primary": "#4A90E2",
        "secondary": "#7ED321",
        "danger": "#FF4C4C",
        "gray": {
          "50": "#F9FAFB",
          "100": "#F3F4F6",
          "200": "#E5E7EB",
          "300": "#D1D5DB",
          "400": "#9CA3AF",
          "500": "#6B7280",
          "600": "#4B5563",
          "700": "#374151",
          "800": "#1F2937",
          "900": "#111827"
        }
      },
      "fontFamily": {
        "sans": [
          "Inter",
          "sans-serif"
        ]
      }
    }
  }
};</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;500;600;700;800;900&amp;display=swap"><style>
      body {
        font-family: 'Inter', sans-serif !important;
      }
      
      /* Preserve Font Awesome icons */
      .fa, .fas, .far, .fal, .fab {
        font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands" !important;
      }
    </style><style>
  .highlighted-section {
    outline: 2px solid #3F20FB;
    background-color: rgba(63, 32, 251, 0.1);
  }

  .edit-button {
    position: absolute;
    z-index: 1000;
  }

  ::-webkit-scrollbar {
    display: none;
  }

  html, body {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  </style></head>
<body class="bg-gray-50 font-sans">
    <div class="flex h-full">
        <!-- Sidebar -->
        <div id="sidebar" class="w-64 bg-white border-r border-gray-200 fixed h-full">
            <div class="p-4 flex items-center space-x-2 border-b border-gray-200">
                <div class="bg-primary rounded-md p-1.5 text-white">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <span class="font-semibold text-gray-800 text-lg">UpCoach</span>
            </div>
            <div class="overflow-y-auto h-[calc(100vh-64px)]">
                <div class="px-4 py-6">
                    <div class="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Main
                    </div>
                    <div class="space-y-1">
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-chart-line w-5 h-5 mr-2"></i>
                            <span>Dashboard</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-users w-5 h-5 mr-2"></i>
                            <span>Users</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-brain w-5 h-5 mr-2"></i>
                            <span>Coaching Plans</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-flag w-5 h-5 mr-2"></i>
                            <span>Flags</span>
                            <span class="ml-auto bg-danger text-white text-xs px-1.5 py-0.5 rounded-full">4</span>
                        </span>
                    </div>
                </div>
                
                <div class="px-4 py-6 border-t border-gray-200">
                    <div class="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Admin
                    </div>
                    <div class="space-y-1">
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-primary bg-blue-50 rounded-md cursor-pointer">
                            <i class="fa-solid fa-user-shield w-5 h-5 mr-2"></i>
                            <span>Roles</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-chart-pie w-5 h-5 mr-2"></i>
                            <span>Analytics</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-gear w-5 h-5 mr-2"></i>
                            <span>Settings</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="ml-64 flex-1">
            <!-- Header -->
            <header id="header" class="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-800">Roles Management</h1>
                    <p class="text-sm text-gray-500">Configure role-based access control (RBAC)</p>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                        <i class="fa-solid fa-sync mr-2"></i>
                        <span>Sync to RLS</span>
                    </button>
                    <div class="relative">
                        <button class="flex items-center text-gray-600">
                            <i class="fa-regular fa-bell text-xl"></i>
                            <span class="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
                        </button>
                    </div>
                    <div class="h-8 w-px bg-gray-200"></div>
                    <div class="flex items-center">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Admin user" class="h-8 w-8 rounded-full mr-2">
                        <div>
                            <p class="text-sm font-medium text-gray-700">Alex Morgan</p>
                            <p class="text-xs text-gray-500">CoachOps Admin</p>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Roles content -->
            <main id="roles-content" class="p-6">
                <div id="roles-header" class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-800">System Roles</h2>
                        <p class="text-sm text-gray-500">Manage access permissions and user capabilities</p>
                    </div>
                    <button class="bg-primary hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center">
                        <i class="fa-solid fa-plus mr-2"></i>
                        <span>Create New Role</span>
                    </button>
                </div>

                <!-- Roles cards -->
                <div id="roles-grid" class="grid grid-cols-3 gap-6 mb-8">
                    <!-- SuperAdmin Role -->
                    <div id="role-superadmin" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-gray-800 p-4">
                            <div class="flex justify-between items-center">
                                <h3 class="text-white font-semibold">SuperAdmin</h3>
                                <span class="bg-gray-700 text-white text-xs px-2 py-1 rounded-full">System</span>
                            </div>
                            <p class="text-gray-300 text-sm mt-1">Full system access and control</p>
                        </div>
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-4">
                                <span class="text-sm text-gray-500">Users with this role:</span>
                                <span class="text-sm font-medium">2</span>
                            </div>
                            <div class="flex -space-x-2 mb-4">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User" class="h-8 w-8 rounded-full border-2 border-white">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg" alt="User" class="h-8 w-8 rounded-full border-2 border-white">
                            </div>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-500">Users</span>
                                    <span class="text-xs font-medium text-secondary">Full Access</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5">
                                    <div class="bg-secondary h-1.5 rounded-full w-full"></div>
                                </div>
                            </div>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-500">Content</span>
                                    <span class="text-xs font-medium text-secondary">Full Access</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5">
                                    <div class="bg-secondary h-1.5 rounded-full w-full"></div>
                                </div>
                            </div>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-500">System</span>
                                    <span class="text-xs font-medium text-secondary">Full Access</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5">
                                    <div class="bg-secondary h-1.5 rounded-full w-full"></div>
                                </div>
                            </div>
                            <div class="flex justify-between">
                                <button class="text-gray-500 hover:text-gray-700 text-sm font-medium">
                                    View Details
                                </button>
                                <button class="text-gray-500 hover:text-gray-700">
                                    <i class="fa-solid fa-ellipsis-v"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- CoachOps Role -->
                    <div id="role-coachops" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-primary p-4">
                            <div class="flex justify-between items-center">
                                <h3 class="text-white font-semibold">CoachOps</h3>
                                <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Operations</span>
                            </div>
                            <p class="text-blue-100 text-sm mt-1">Coach operations and support</p>
                        </div>
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-4">
                                <span class="text-sm text-gray-500">Users with this role:</span>
                                <span class="text-sm font-medium">5</span>
                            </div>
                            <div class="flex -space-x-2 mb-4">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User" class="h-8 w-8 rounded-full border-2 border-white">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" alt="User" class="h-8 w-8 rounded-full border-2 border-white">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="User" class="h-8 w-8 rounded-full border-2 border-white">
                                <div class="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">+2</div>
                            </div>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-500">Users</span>
                                    <span class="text-xs font-medium text-primary">Read &amp; Edit</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5">
                                    <div class="bg-primary h-1.5 rounded-full w-3/4"></div>
                                </div>
                            </div>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-500">Content</span>
                                    <span class="text-xs font-medium text-primary">Read &amp; Edit</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5">
                                    <div class="bg-primary h-1.5 rounded-full w-3/4"></div>
                                </div>
                            </div>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-500">System</span>
                                    <span class="text-xs font-medium text-gray-500">Read Only</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5">
                                    <div class="bg-gray-400 h-1.5 rounded-full w-1/2"></div>
                                </div>
                            </div>
                            <div class="flex justify-between">
                                <button class="text-gray-500 hover:text-gray-700 text-sm font-medium">
                                    View Details
                                </button>
                                <button class="text-gray-500 hover:text-gray-700">
                                    <i class="fa-solid fa-ellipsis-v"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- ContentManager Role -->
                    <div id="role-contentmanager" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-secondary p-4">
                            <div class="flex justify-between items-center">
                                <h3 class="text-white font-semibold">ContentManager</h3>
                                <span class="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Content</span>
                            </div>
                            <p class="text-green-100 text-sm mt-1">Content creation and management</p>
                        </div>
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-4">
                                <span class="text-sm text-gray-500">Users with this role:</span>
                                <span class="text-sm font-medium">3</span>
                            </div>
                            <div class="flex -space-x-2 mb-4">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg" alt="User" class="h-8 w-8 rounded-full border-2 border-white">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg" alt="User" class="h-8 w-8 rounded-full border-2 border-white">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-9.jpg" alt="User" class="h-8 w-8 rounded-full border-2 border-white">
                            </div>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-500">Users</span>
                                    <span class="text-xs font-medium text-gray-500">Read Only</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5">
                                    <div class="bg-gray-400 h-1.5 rounded-full w-1/2"></div>
                                </div>
                            </div>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-500">Content</span>
                                    <span class="text-xs font-medium text-secondary">Full Access</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5">
                                    <div class="bg-secondary h-1.5 rounded-full w-full"></div>
                                </div>
                            </div>
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-medium text-gray-500">System</span>
                                    <span class="text-xs font-medium text-gray-500">No Access</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5">
                                    <div class="bg-gray-300 h-1.5 rounded-full w-1/4"></div>
                                </div>
                            </div>
                            <div class="flex justify-between">
                                <button class="text-gray-500 hover:text-gray-700 text-sm font-medium">
                                    View Details
                                </button>
                                <button class="text-gray-500 hover:text-gray-700">
                                    <i class="fa-solid fa-ellipsis-v"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Permissions Matrix -->
                <div id="permissions-matrix" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="font-semibold text-gray-800">Permissions Matrix</h3>
                            <p class="text-sm text-gray-500">Detailed access control settings by role</p>
                        </div>
                        <button class="text-primary hover:text-blue-700 flex items-center text-sm font-medium">
                            <i class="fa-solid fa-pencil mr-1"></i> Edit Permissions
                        </button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission</th>
                                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SuperAdmin</th>
                                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CoachOps</th>
                                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ContentManager</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <!-- User Management Section -->
                                <tr class="bg-gray-50">
                                    <td colspan="4" class="px-6 py-2 text-sm font-medium text-gray-700">User Management</td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">View Users</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">Create Users</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">Edit Users</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">Delete Users</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                </tr>
                                
                                <!-- Content Management Section -->
                                <tr class="bg-gray-50">
                                    <td colspan="4" class="px-6 py-2 text-sm font-medium text-gray-700">Content Management</td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">View Content</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">Create Content</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">Edit Content</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">Delete Content</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                </tr>
                                
                                <!-- System Management Section -->
                                <tr class="bg-gray-50">
                                    <td colspan="4" class="px-6 py-2 text-sm font-medium text-gray-700">System Management</td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">View Analytics</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">Manage Roles</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">System Configuration</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-3 text-sm text-gray-500">Access Logs</td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-check text-secondary"></i></td>
                                    <td class="px-6 py-3 text-center"><i class="fa-solid fa-xmark text-gray-300"></i></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- RLS Sync Section -->
                <div id="rls-sync" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="font-semibold text-gray-800">Supabase RLS Integration</h3>
                            <p class="text-sm text-gray-500">Sync role permissions with database row-level security</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="flex h-3 w-3 relative">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                            </span>
                            <span class="text-sm font-medium text-secondary">Connected</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center p-4 bg-gray-50 rounded-md mb-4">
                        <i class="fa-solid fa-info-circle text-primary mr-3"></i>
                        <p class="text-sm text-gray-600">Changes to role permissions are automatically synced with Supabase Row-Level Security (RLS) policies. Last sync: <span class="font-medium">Today at 14:32</span></p>
                    </div>
                    
                    <div class="flex space-x-4">
                        <button class="bg-primary hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center">
                            <i class="fa-solid fa-sync mr-2"></i>
                            <span>Sync Now</span>
                        </button>
                        <button class="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-md flex items-center">
                            <i class="fa-solid fa-key mr-2"></i>
                            <span>Revoke Tokens</span>
                        </button>
                        <button class="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-md flex items-center">
                            <i class="fa-solid fa-file-lines mr-2"></i>
                            <span>View Logs</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <!-- Role Assignment Modal (Hidden by default) -->
    <div id="role-assignment-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="p-5 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-800">Assign Role</h3>
                    <button class="text-gray-400 hover:text-gray-600">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="p-5">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                    <div class="relative">
                        <select class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md">
                            <option>John Smith (john@upcoach.com)</option>
                            <option>Sarah Johnson (sarah@upcoach.com)</option>
                            <option>Michael Brown (michael@upcoach.com)</option>
                        </select>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
                    <div class="grid grid-cols-3 gap-3">
                        <div class="border border-primary bg-blue-50 rounded-md p-3 flex flex-col items-center cursor-pointer">
                            <div class="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white mb-2">
                                <i class="fa-solid fa-user-shield"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-800">SuperAdmin</span>
                        </div>
                        <div class="border border-gray-200 rounded-md p-3 flex flex-col items-center cursor-pointer hover:border-primary hover:bg-blue-50">
                            <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white mb-2">
                                <i class="fa-solid fa-headset"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-800">CoachOps</span>
                        </div>
                        <div class="border border-gray-200 rounded-md p-3 flex flex-col items-center cursor-pointer hover:border-primary hover:bg-blue-50">
                            <div class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white mb-2">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-800">Content</span>
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea class="block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md" rows="2" placeholder="Add notes about this role assignment..."></textarea>
                </div>
            </div>
            <div class="bg-gray-50 px-5 py-3 flex justify-end space-x-3 rounded-b-lg">
                <button class="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium">
                    Cancel
                </button>
                <button class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Assign Role
                </button>
            </div>
        </div>
    </div>

</body></html>